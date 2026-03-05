import io
import re
from lxml import etree as ET

from datetime import datetime, timezone
import pandas as pd
import traceback

from users.utils import upload_fileobj_to_s3
from tasks.tasks import generate_gemini_analysis_async
from gemini import generate_with_gemini
import string

import logging



logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(funcName)s: %(message)s')
console_handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(console_handler)

logger.propagate = False

def mask_sensitive_info(text: str):
    if not text:
        return text, {}

    patterns = {
        "api_key": r"(?:api[_\-]?key\s*[:=]\s*)[A-Za-z0-9_\-]{16,}",
        "token": r"(?:token\s*[:=]\s*)[A-Za-z0-9\-._~+/=]{16,}",
        "password": r"(?:password\s*[:=]\s*)([^\s\"']+)",
        "secret": r"(?:secret\s*[:=]\s*)([^\s\"']+)",
        "username": r"(?:username\s*[:=]\s*)([^\s\"']+)"
    }

    replacements = {}
    masked = text

    for label, pattern in patterns.items():
        matches = list(re.finditer(pattern, masked, re.IGNORECASE))
        for idx, match in enumerate(matches):
            placeholder = f"<<{label}_{idx}>>"
            real_value = match.group(0)
            replacements[placeholder] = real_value
            masked = masked.replace(real_value, placeholder)

    return masked, replacements



def is_valid_jmeter_prompt(prompt: str, uploaded_xml: str = "", data_columns: list = None):
    """
    Validates the user's prompt based on content and presence of required uploaded files.
    Returns: (is_valid: bool, error_message: str|None)
    """
    if not prompt or len(prompt.strip()) < 10:
        logger.debug("❌ Prompt too short or empty")
        return False, "Prompt is too short. Please provide more details."

    # Remove most punctuation except those relevant to HTTP/URLs, then normalize whitespace
    keep_punct = "/:-._"
    allowed_chars = string.ascii_letters + string.digits + " \t\n" + keep_punct
    prompt_clean = ''.join(c if c in allowed_chars else ' ' for c in prompt.lower())
    prompt_clean = re.sub(r'\s+', ' ', prompt_clean).strip()
    words = prompt_clean.split()

    logger.debug(f"🧹 Cleaned prompt: {prompt_clean}")
    logger.debug(f"🧩 Tokenized words: {words}")

    # Reject obvious chat / unrelated prompts
    unrelated_patterns = [
        r"\bwho\s+are\s+you\b", r"\bhello\b", r"\bweather\b", r"\btell\s+me\s+about\b",
        r"\bdefine\b", r"\bexplain\b", r"\bjoke\b", r"\btime\b"
    ]
    for pat in unrelated_patterns:
        if re.search(pat, prompt_clean):
            logger.debug(f"❌ Rejected due to unrelated pattern: {pat}")
            return False, "Prompt does not appear to describe a JMeter test."

    # Reject prompts with mostly very short words (nonsense)
    short_word_count = sum(1 for w in words if len(w) <= 2)
    if short_word_count > len(words) * 0.6:
        logger.debug(f"❌ Too many short words: {short_word_count} of {len(words)}")
        return False, "Prompt seems unclear. Please describe the test with more details."

    # Action + context keyword checks (more lenient)
    action_keywords = {
        "test", "generate", "run", "simulate", "load", "perform",
        "execute", "create", "build", "change", "modify", "update",
        "with", "for", "using", "on"  # Added more natural language words
    }
    context_keywords = {
        "http", "https", "request", "get", "post", "put", "delete", "endpoint", "url",
        "users", "user", "clients", "threads", "thread", "loop", "duration", "response",
        "latency", "jmeter", "csv", "data", "header", "json", "body", "sampler", "jmx",
        "virtual", "concurrent", "api", "server", "domain", "com", "org", "net"  # Added more context words
    }

    has_action = any(word in words for word in action_keywords)
    has_context = any(kw in prompt_clean for kw in context_keywords)
    
    # If it has URL-like pattern or domain + users, it's probably valid
    has_domain = any(word.endswith(('.com', '.org', '.net', '.io')) or '.' in word for word in words)
    has_users = any(word in ['user', 'users', 'virtual', 'client', 'clients', 'thread', 'threads'] for word in words)
    
    if has_domain and has_users:
        return True, None

    logger.debug(f"✅ has_action: {has_action}, ✅ has_context: {has_context}")

    if not has_action:
        return False, "Prompt must include an action (e.g., test, run, simulate, generate)."
    if not has_context:
        return False, "Prompt must include load testing context (e.g., URL, JMeter, number of users)."

    # === Dependency rules for uploaded files ===
    # Keywords that indicate a JMX file is required
    jmx_required_pattern = r"\b(fix this jmx|improve this jmx|update this jmx|add to existing jmx|change in uploaded jmx)\b"
    if re.search(jmx_required_pattern, prompt_clean) and not uploaded_xml.strip():
        logger.debug("❌ Mentioned JMX modification keyword but no JMX file uploaded.")
        return False, "You mentioned modifying a JMX file but did not upload one."

    # CSV/Excel mentions require data
    if ("csv" in prompt_clean or "excel" in prompt_clean) and (not data_columns or len(data_columns) == 0):
        logger.debug("❌ Mentioned CSV/Excel usage but no data file uploaded.")
        return False, "You mentioned using CSV/Excel data but did not upload a data file."

    return True, None



VALID_ELEMENT_TYPES = {
    "ThreadGroup", "LoopController", "HTTPSamplerProxy", "Arguments", "TestPlan",
    "CSVDataSet", "HeaderManager", "Header", "HTTPArgument", "Argument",
    "SummaryReport", "hashTree", "BeanShellPreProcessor", "BeanShellPostProcessor",
    "JSR223PreProcessor", "JSR223PostProcessor", "RegexExtractor", "XPathExtractor",
    "ResultCollector", "CookieManager", "CacheManager"
}


# Only block elements truly unsupported in vanilla JMeter 5.6.3
DISALLOWED_TAGS = {
    "BackendListener",  # Needs plugins
    "SaveService",      # Internal use only
    "GraphResults"      # Removed GUI element
}
# Allow BeanShell, JSR223, JDBC, ConstantThroughputTimer etc. because they are core-supported
DISALLOWED_NAMESPACES = (
    # block only known third-party plugins
    "kg.apc", "jp.", "com.atlantbh", "blazemeter."
)




def extract_jmx_key_parts(uploaded_xml: str) -> str:
    try:
        tree = ET.fromstring(uploaded_xml.encode())
    except ET.XMLSyntaxError as e:
        return f"⚠️ Invalid JMX XML: {e}"

    key_parts = []
    key_tags = [
        "ThreadGroup",
        "HTTPSamplerProxy",
        "CSVDataSet",
        "ResponseAssertion",
        "HeaderManager",
        "Arguments",
        "LoopController",
        "IfController",
        "WhileController",
        "ConstantTimer"
    ]

    for tag in key_tags:
        for elem in tree.xpath(f".//{tag}"):
            snippet = ET.tostring(elem, pretty_print=True).decode()
            key_parts.append(f"## {tag}\n{snippet.strip()}")

    return "\n\n".join(key_parts)


def fix_hash_tree_structure(xml: str) -> str:
    """
    Ensures that every non-hashTree element in the JMX is immediately followed by a <hashTree>.
    Prevents duplicate insertion by only modifying the real XML tree.
    """
    try:
        parser = ET.XMLParser(remove_blank_text=True)
        root = ET.fromstring(xml.encode("utf-8"), parser)

        def enforce_pairs(tree_elem):
            i = 0
            while i < len(tree_elem):
                if tree_elem[i].tag != "hashTree":
                    if i + 1 >= len(tree_elem) or tree_elem[i + 1].tag != "hashTree":
                        empty_tree = ET.Element("hashTree")
                        tree_elem.insert(i + 1, empty_tree)
                        logger.warning("⚠️ Inserted missing <hashTree> after <%s>", tree_elem[i].tag)
                        i += 2
                        continue
                    else:
                        enforce_pairs(tree_elem[i + 1])
                        i += 2
                else:
                    enforce_pairs(tree_elem[i])
                    i += 1

        top_ht = root.find("hashTree")
        if top_ht is not None:
            enforce_pairs(top_ht)

        return ET.tostring(root, pretty_print=True, encoding="utf-8").decode("utf-8")

    except Exception:
        logger.exception("fix_hash_tree_structure failed:")
        return xml



def get_correction_hint(xml: str) -> str:
    try:
        root = ET.fromstring(xml)
        if root.tag != "jmeterTestPlan":
            return "Ensure the XML starts with <jmeterTestPlan> as root."

        if not root.findall(".//ThreadGroup"):
            return "Include a <ThreadGroup> inside a hashTree."
        if not root.findall(".//HTTPSamplerProxy"):
            return "Add at least one <HTTPSamplerProxy> (e.g., GET or POST request)."
        if not root.findall(".//ResultCollector"):
            return "Include a <ResultCollector> to store results in a JTL file."

        for config in root.findall(".//SampleSaveConfiguration"):
            for child in config:
                if child.tag not in {
                    "time", "latency", "timestamp", "success", "label", "code", "message",
                    "threadName", "dataType", "encoding", "assertions", "subresults", "responseData",
                    "samplerData", "xml", "fieldNames", "responseHeaders", "requestHeaders",
                    "responseDataOnError", "saveAssertionResultsFailureMessage", "assertionsResultsToSave",
                    "bytes", "sentBytes", "url", "fileName", "threadCounts", "idleTime", "connectTime"
                }:
                    return f"Remove invalid field <{child.tag}> from <SampleSaveConfiguration>."

        for elem in root.iter():
            tag = elem.tag.split('.')[-1]
            if tag in DISALLOWED_TAGS:
                return f"Disallowed element <{tag}> detected. Remove it."
            if elem.tag == "elementProp":
                etype = elem.attrib.get("elementType", "")
                if etype and etype not in VALID_ELEMENT_TYPES:
                    return f"Invalid elementType '{etype}' in <elementProp>. Use only built-in elements."

        # Ensure ResultCollector is inside the ThreadGroup's hashTree
        found_tg = False
        for hash_tree in root.findall(".//hashTree"):
            children = list(hash_tree)
            for i in range(len(children) - 1):
                if children[i].tag == "ThreadGroup":
                    found_tg = True
                    tg_hash_tree = children[i + 1]
                    if tg_hash_tree.tag != "hashTree":
                        return "Missing <hashTree> after <ThreadGroup>."
                    if not tg_hash_tree.findall(".//ResultCollector"):
                        return "The <ResultCollector> must be placed inside the <ThreadGroup>'s <hashTree>, not outside it."
        if not found_tg:
            return "ThreadGroup must be followed by a <hashTree> that contains the ResultCollector."
        
        # Check for disabled TestFragmentController
        for frag in root.findall(".//TestFragmentController"):
            if frag.get("enabled", "").lower() != "true":
                return "All <TestFragmentController> elements must have enabled=\"true\" so that any ModuleController referring to them executes correctly."


        return "Ensure every major element is followed by a <hashTree>."
    
    except ET.ParseError:
        return "The XML is malformed or incomplete. Ensure it is well-formed XML."
    except Exception:
        return "General JMX structure error. Follow the required format strictly."
 



def is_valid_jmx(xml_content: str, timeout: int = 60) -> tuple[bool, str]:
    """
    Validates JMX XML structure without requiring JMeter installation.
    For Windows development, we skip the actual JMeter execution validation.
    """
    try:
        # Basic XML parsing validation
        from lxml import etree as ET
        root = ET.fromstring(xml_content.encode("utf-8"))
        
        # Check for required elements
        if root.tag != "jmeterTestPlan":
            return False, "Root element must be <jmeterTestPlan>"
        
        if not root.findall(".//TestPlan"):
            return False, "Missing <TestPlan> element"
            
        if not root.findall(".//ThreadGroup"):
            return False, "Missing <ThreadGroup> element"
            
        if not root.findall(".//HTTPSamplerProxy"):
            return False, "Missing <HTTPSamplerProxy> element"
            
        if not root.findall(".//ResultCollector"):
            return False, "Missing <ResultCollector> element"
        
        # All basic checks passed
        return True, "XML structure validation passed"
        
    except ET.XMLSyntaxError as e:
        return False, f"XML syntax error: {str(e)}"
    except Exception as e:
        return False, f"Validation error: {str(e)}"



def extract_xml_from_markdown(text: str) -> str:
    if not text:
        return ""
    start = text.find("```xml")
    end = text.find("```", start + 6)
    if start != -1 and end != -1:
        xml = text[start + 6:end].strip()
        
        # Fix common Gemini XML generation errors
        xml = xml.replace("<label>true</time>", "<label>true</label>")
        xml = xml.replace("<time>true</label>", "<time>true</time>")
        
        return xml
    
    # Fallback: return only if it looks like XML
    stripped = text.strip()
    if stripped.startswith("<jmeterTestPlan"):
        return stripped
    return ""  # not valid



def build_unified_prompt(prompt: str, uploaded_xml: str = "", data_columns=None, data_filename=None) -> str:
    # Ultra-optimized prompt for FAST and COMPLETE response
    base = (
        "Generate COMPLETE JMeter 5.6.3 XML. MUST end with closing tags.\n"
        "Output format: ```xml\n[COMPLETE XML HERE]\n```\n"
        "MINIMAL structure:\n"
        "<?xml version=\"1.0\"?>\n"
        "<jmeterTestPlan version=\"1.2\" properties=\"5.0\" jmeter=\"5.6.3\">\n"
        "  <hashTree>\n"
        "    <TestPlan testname=\"Test\" enabled=\"true\"><hashTree>\n"
        "      <ThreadGroup testname=\"Users\" enabled=\"true\">\n"
        "        <intProp name=\"ThreadGroup.num_threads\">10</intProp>\n"
        "        <intProp name=\"ThreadGroup.ramp_time\">1</intProp>\n"
        "        <longProp name=\"ThreadGroup.duration\">60</longProp>\n"
        "        <boolProp name=\"ThreadGroup.scheduler\">true</boolProp>\n"
        "      <hashTree>\n"
        "        <HTTPSamplerProxy testname=\"Request\" enabled=\"true\">\n"
        "          <stringProp name=\"HTTPSampler.domain\">example.com</stringProp>\n"
        "          <stringProp name=\"HTTPSampler.path\">/</stringProp>\n"
        "          <stringProp name=\"HTTPSampler.method\">GET</stringProp>\n"
        "        </HTTPSamplerProxy><hashTree/>\n"
        "        <ResultCollector testname=\"Results\" enabled=\"true\">\n"
        "          <stringProp name=\"filename\">results.jtl</stringProp>\n"
        "        </ResultCollector><hashTree/>\n"
        "      </hashTree></ThreadGroup>\n"
        "    </hashTree></TestPlan>\n"
        "  </hashTree>\n"
        "</jmeterTestPlan>\n"
        "Use this structure. Adapt for: "
    )

    if uploaded_xml:
        base += f"Fix this JMX:\n{uploaded_xml[:1500]}\nRequest: {prompt[:150]}"
    else:
        base += prompt

    return base.strip()


def extract_user_count_from_jmx(xml: str) -> int:
    try:
        root = ET.fromstring(xml)
        thread_group = root.find(".//ThreadGroup")
        if thread_group is not None:
            for elem in thread_group.iter("stringProp"):
                if elem.attrib.get("name") == "ThreadGroup.num_threads":
                    return int(elem.text.strip())
    except:
        pass
    return -1


def extract_user_count_from_prompt(prompt: str) -> int:
    prompt = prompt.lower().replace(",", "")
    pattern = r"\b(\d{1,9})\s*(users?|clients|threads|concurrent users?)\b"
    match = re.search(pattern, prompt)
    return int(match.group(1)) if match else -1


def read_and_validate_data_file(file_storage):
    filename = file_storage.filename
    if filename.endswith(".csv"):
        df = pd.read_csv(file_storage)
    elif filename.endswith(".xlsx"):
        df = pd.read_excel(file_storage)
    else:
        raise ValueError("Only .csv and .xlsx files are supported.")

    if df.empty or df.columns.empty:
        raise ValueError("Uploaded file is empty or missing columns.")
    return df, filename, list(df.columns)


def find_existing_csv_dataset(root, filename):
    base_name = filename.split('/')[-1].lower()
    for csv_ds in root.findall(".//CSVDataSet"):
        file_prop = csv_ds.find("stringProp[@name='filename']")
        if file_prop is not None:
            existing_file = file_prop.text.split('/')[-1].lower() if file_prop.text else ""
            if existing_file == base_name:
                return csv_ds
    return None



def inject_csv_dataset_into_jmx(xml: str, filename: str, columns: list) -> str:
    parser = ET.XMLParser(remove_blank_text=True)
    root = ET.fromstring(xml.encode("utf-8"), parser)

    # Remove ALL existing CSVDataSet matching this filename before inserting
    base_name = filename.split('/')[-1].lower()
    for csv_ds in root.findall(".//CSVDataSet"):
        file_prop = csv_ds.find("stringProp[@name='filename']")
        if file_prop is not None:
            existing_file = file_prop.text.split('/')[-1].lower() if file_prop.text else ""
            if existing_file == base_name:
                parent = csv_ds.getparent()
                ht = csv_ds.getnext()
                if ht is not None and ht.tag == "hashTree":
                    parent.remove(ht)
                parent.remove(csv_ds)

    # Create new CSV config
    csv_node = ET.Element("CSVDataSet", {
        "guiclass": "TestBeanGUI",
        "testclass": "CSVDataSet",
        "testname": "CSV Data Set Config",
        "enabled": "true"
    })

    def set_prop(parent, name, value):
        prop = parent.find(f"stringProp[@name='{name}']")
        if prop is None:
            prop = ET.SubElement(parent, "stringProp", name=name)
        prop.text = value

    set_prop(csv_node, "filename", base_name)
    set_prop(csv_node, "fileEncoding", "UTF-8")
    set_prop(csv_node, "variableNames", ",".join(columns))
    set_prop(csv_node, "delimiter", ",")
    set_prop(csv_node, "quotedData", "false")
    set_prop(csv_node, "recycle", "true")
    set_prop(csv_node, "stopThread", "false")
    set_prop(csv_node, "shareMode", "shareMode.all")

    # Append to ThreadGroup's hashTree
    thread_group_hash_tree = root.find(".//ThreadGroup/../hashTree")
    if thread_group_hash_tree is None:
        raise ValueError("Invalid structure: No hashTree after ThreadGroup.")

    thread_group_hash_tree.append(csv_node)
    thread_group_hash_tree.append(ET.Element("hashTree"))

    return ET.tostring(root, pretty_print=True, encoding="utf-8").decode("utf-8")




def fix_misplaced_result_collector(xml: str) -> str:
    """
    Ensures all ResultCollectors live inside the ThreadGroup's hashTree.
    Moves them (not duplicates) preserving their child <hashTree>.
    """
    try:
        parser = ET.XMLParser(remove_blank_text=True)
        root = ET.fromstring(xml.encode("utf-8"), parser)

        tg = root.find(".//ThreadGroup")
        if tg is None:
            return xml

        tg_hash_tree = tg.getnext()
        if tg_hash_tree is None or tg_hash_tree.tag != "hashTree":
            return xml

        # Move any misplaced ResultCollectors
        misplaced = []
        for rc in root.findall(".//ResultCollector"):
            if rc.getparent() != tg_hash_tree:
                logger.warning("⚠️ Moving misplaced <ResultCollector> '%s' into ThreadGroup's hashTree", rc.get("testname", "Unnamed"))
                parent = rc.getparent()
                rc_hash_tree = rc.getnext() if rc.getnext() is not None and rc.getnext().tag == "hashTree" else ET.Element("hashTree")
                parent.remove(rc)
                if rc_hash_tree in parent:
                    parent.remove(rc_hash_tree)
                misplaced.append((rc, rc_hash_tree))

        for rc, rc_ht in misplaced:
            tg_hash_tree.append(rc)
            tg_hash_tree.append(rc_ht)

        return ET.tostring(root, pretty_print=True, encoding="utf-8").decode("utf-8")

    except Exception:
        logger.exception("fix_misplaced_result_collector failed:")
        return xml


def auto_fix_jmx(xml: str) -> str:
    """
    Automatically fix structural/content issues that cause validation failure.
    """
    parser = ET.XMLParser(remove_blank_text=True)
    root = ET.fromstring(xml.encode("utf-8"), parser)

    # 1. Fix ModuleController node_path names
    all_names = {el.get("testname") for el in root.iter() if el.get("testname")}
    for mc in root.findall(".//ModuleController"):
        for sp in mc.findall(".//stringProp"):
            if sp.text and sp.text not in all_names:
                # Special case: replace "Test Plan" with root TestPlan name
                if sp.text.strip().lower() == "test plan":
                    testplan = root.find(".//TestPlan")
                    if testplan is not None:
                        logger.warning(f"🛠 Fixing ModuleController path: replacing '{sp.text}' with '{testplan.get('testname')}'")
                        sp.text = testplan.get("testname")
                # Could add more matching heuristics here

    # 2. Enable all TestFragmentControllers
    for frag in root.findall(".//TestFragmentController"):
        if frag.get("enabled", "").lower() != "true":
            logger.warning(f"🛠 Enabling disabled TestFragmentController: '{frag.get('testname')}'")
            frag.set("enabled", "true")

    # 3. Remove disallowed GUI/listener/scripting elements
    disallowed_tags = {
        "ViewResultsTree", "BeanShellSampler", "BeanShellPreProcessor", "BeanShellPostProcessor",
        "JSR223PostProcessor", "JSR223Sampler"
    }
    for elem in list(root.iter()):
        tag = elem.tag.split('.')[-1]
        if tag in disallowed_tags or \
           (elem.tag == "ResultCollector" and elem.get("guiclass") == "ViewResultsFullVisualizer"):
            logger.warning(f"🛠 Removing disallowed element <{tag}> testname='{elem.get('testname')}'")
            parent = elem.getparent()
            idx = parent.index(elem)
            # Remove paired hashTree too if present
            if idx + 1 < len(parent) and parent[idx+1].tag == "hashTree":
                parent.remove(parent[idx+1])
            parent.remove(elem)

    return ET.tostring(root, pretty_print=True, encoding="utf-8").decode("utf-8")



def enforce_core_jmeter_defaults(xml: str) -> str:
    """
    Enforces presence and correctness of core JMeter defaults:
    - ThreadGroup: num_threads, ramp_time, scheduler, duration, delay, on_sample_error
    - LoopController: loops, continue_forever
    - HTTPSamplerProxy: method and path
    """

    from lxml import etree as ET

    parser = ET.XMLParser(remove_blank_text=True)
    root = ET.fromstring(xml.encode("utf-8"), parser)

    def is_int(val):
        try:
            int(val)
            return True
        except (ValueError, TypeError):
            return False

    def dedupe_and_get_value(parent, param_name, preferred_order=("intProp", "longProp", "stringProp")):
        """Ensure only one prop of given name exists and return (node,value,tag)."""
        for tag in preferred_order:
            nodes = parent.findall(f"./{tag}[@name='{param_name}']")
            if nodes:
                for other in nodes[1:]:
                    parent.remove(other)
                node = nodes[0]
                val = node.text.strip() if node.text else None
                return node, val, tag
        return None, None, None

    # --- LoopController defaults ---
    loop_controllers = list(root.findall(".//LoopController")) + [
        ep for ep in root.findall(".//elementProp[@elementType='LoopController']")
    ]
    for lc in loop_controllers:
        node, value, _ = dedupe_and_get_value(lc, "LoopController.loops")
        if node is None:
            node = ET.SubElement(lc, "intProp", name="LoopController.loops")
            node.text = "1"
        else:
            if not is_int(value) or int(value) < 1:
                node.text = "1"

        cont_forever = lc.find("./boolProp[@name='LoopController.continue_forever']")
        if cont_forever is None:
            cont_forever = ET.SubElement(lc, "boolProp", name="LoopController.continue_forever")
        cont_forever.text = "false"

    # --- ThreadGroup defaults ---
    for tg in root.findall(".//ThreadGroup"):
        node, value, _ = dedupe_and_get_value(tg, "ThreadGroup.num_threads")
        if not is_int(value) or int(value) <= 0:
            if node is None:
                node = ET.SubElement(tg, "intProp", name="ThreadGroup.num_threads")
            node.text = "1"

        ramp_node, ramp_val, _ = dedupe_and_get_value(tg, "ThreadGroup.ramp_time")
        if not is_int(ramp_val) or int(ramp_val) <= 0:
            if ramp_node is None:
                ramp_node = ET.SubElement(tg, "intProp", name="ThreadGroup.ramp_time")
            ramp_node.text = "1"

        scheduler = tg.find("./boolProp[@name='ThreadGroup.scheduler']")
        if scheduler is None:
            scheduler = ET.SubElement(tg, "boolProp", name="ThreadGroup.scheduler")
            scheduler.text = "true"
        # if scheduler exists, keep its original value (do not overwrite)

        duration = tg.find("./longProp[@name='ThreadGroup.duration']")
        if duration is None:
            for t in ["stringProp", "intProp"]:
                for n in tg.findall(f"./{t}[@name='ThreadGroup.duration']"):
                    tg.remove(n)
            duration = ET.SubElement(tg, "longProp", name="ThreadGroup.duration")
        if not is_int(duration.text) or int(duration.text) <= 0:
            duration.text = "60"

        delay = tg.find("./longProp[@name='ThreadGroup.delay']")
        if delay is None:
            for t in ["stringProp", "intProp"]:
                for n in tg.findall(f"./{t}[@name='ThreadGroup.delay']"):
                    tg.remove(n)
            delay = ET.SubElement(tg, "longProp", name="ThreadGroup.delay")
        if not is_int(delay.text):
            delay.text = "0"

        error_action = tg.find("./stringProp[@name='ThreadGroup.on_sample_error']")
        valid = {"continue", "startnextloop", "stopthread", "stoptest", "stoptestnow"}
        if error_action is None:
            error_action = ET.SubElement(tg, "stringProp", name="ThreadGroup.on_sample_error")
            error_action.text = "continue"
        else:
            txt = error_action.text.strip().lower() if error_action.text else ""
            if txt not in valid:
                error_action.text = "continue"

    # --- HTTPSampler Proxy defaults ---
    for sampler in root.findall(".//HTTPSamplerProxy"):
        method = sampler.find("./stringProp[@name='HTTPSampler.method']")
        if method is None:
            method = ET.SubElement(sampler, "stringProp", name="HTTPSampler.method")
        if not method.text or method.text.upper() not in {"GET", "POST", "PUT", "DELETE", "PATCH"}:
            method.text = "GET"

        pathprop = sampler.find("./stringProp[@name='HTTPSampler.path']")
        if pathprop is None:
            pathprop = ET.SubElement(sampler, "stringProp", name="HTTPSampler.path")
        if not pathprop.text or not pathprop.text.strip():
            pathprop.text = "/"

    return ET.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode("utf-8")



def fix_resultcollector_saveconfig(xml: str) -> str:
    parser = ET.XMLParser(remove_blank_text=True)
    root = ET.fromstring(xml.encode("utf-8"), parser)

    for rc in root.findall(".//ResultCollector"):
        # remove any bad elementProp form
        for el in rc.findall("./elementProp[@name='saveConfig']"):
            rc.remove(el)

        if rc.find("./objProp[name='saveConfig']") is None:
            obj_prop = ET.SubElement(rc, "objProp")
            name_node = ET.SubElement(obj_prop, "name")
            name_node.text = "saveConfig"
            val_node = ET.SubElement(obj_prop, "value", {"class": "SampleSaveConfiguration"})
            for field, default in [
                ("time","true"), ("latency","true"), ("timestamp","true"),
                ("success","true"), ("label","true"), ("code","true"),
                ("message","true"), ("threadName","true"), ("dataType","true"),
                ("encoding","false"), ("assertions","true"), ("subresults","true"),
                ("responseData","false"), ("samplerData","false"), ("xml","false"),
                ("fieldNames","true"), ("responseHeaders","false"),
                ("requestHeaders","false"), ("responseDataOnError","false"),
                ("saveAssertionResultsFailureMessage","true"),
                ("assertionsResultsToSave","0"), ("bytes","true"), ("sentBytes","true"),
                ("url","true"), ("fileName","true"), ("threadCounts","true"),
                ("sampleCount","true"), ("idleTime","true"), ("connectTime","true"),
            ]:
                field_el = ET.SubElement(val_node, field)
                field_el.text = default

    return ET.tostring(root, pretty_print=True, encoding="utf-8").decode("utf-8")

def normalize_http_headers(xml: str) -> str:
    """
    Cleans up common issues in HTTP HeaderManager headers:
    - Fix Accept header typo (/;q=0.8 -> */*;q=0.8)
    - Strip spaces and normalize casing if needed
    """
    parser = ET.XMLParser(remove_blank_text=True)
    root = ET.fromstring(xml.encode("utf-8"), parser)

    for ha in root.findall(".//HeaderManager"):
        for element in ha.findall(".//elementProp"):
            header_name = element.find("./stringProp[@name='Header.name']")
            header_value = element.find("./stringProp[@name='Header.value']")
            
            if header_name is not None and header_value is not None:
                name = header_name.text.strip().lower()
                val = header_value.text.strip()

                # 🔹 Fix Accept header typo
                if name == "accept":
                    if ",/;q=0.8" in val:
                        fixed_val = val.replace(",/;q=0.8", ",*/*;q=0.8")
                        logger.warning(f"🛠 Fixed Accept header: '{val}' → '{fixed_val}'")
                        header_value.text = fixed_val

                # (Optional) Normalize capitalization for canonical headers
                if name == "content-type":
                    header_name.text = "Content-Type"
                elif name == "user-agent":
                    header_name.text = "User-Agent"
                elif name == "accept":
                    header_name.text = "Accept"

    return ET.tostring(root, pretty_print=True, encoding="utf-8").decode("utf-8")


def generate_and_upload_jmx(
    prompt: str,
    email: str,
    original_filename: str = None,
    uploaded_xml: str = "",
    license_type: str = "trial",
    data_columns: list = None,
    data_filename: str = None,
    max_attempts: int = 2,  # Reduced to 2 for faster response
    first_fail_reason: str = None
):
    try: 
        masked_prompt, sensitive_map = mask_sensitive_info(prompt)

        # === Step 1: Extract original ModuleController paths from uploaded JMX ===
        original_paths = []
        if uploaded_xml:
            try:
                root_uploaded = ET.fromstring(uploaded_xml.encode("utf-8"))
                for mc in root_uploaded.findall(".//ModuleController"):
                    original_paths.append([sp.text for sp in mc.findall(".//stringProp")])
                logger.debug(f"📌 Extracted original ModuleController paths: {original_paths}")
            except Exception as e:
                logger.warning(f"Could not parse uploaded XML for original paths: {e}")
                original_paths = []

        
        user_count = -1  # ensure always initialized


        if not uploaded_xml:
            user_count = extract_user_count_from_prompt(prompt)
            if license_type == "trial" and user_count > 100:
                return {"status": "error", "message": "Trial users can only generate test plans for up to 100 users."}, 403
            if license_type == "paid" and user_count > 1_000_000:
                return {"status": "error", "message": "Maximum supported user count is 1 million."}, 403

        prompt_modifier = ""
        if first_fail_reason:
            prompt_modifier = f"\n\nThe last XML was invalid because: {first_fail_reason}. Please fix it."

        for attempt in range(max_attempts):
            # Rebuild prompt each attempt with original XML to avoid hallucination
            # ✅ Use last cleaned XML after first attempt to avoid re-bloating JMX
            if attempt == 0:
                current_xml_for_prompt = uploaded_xml
            else:
                current_xml_for_prompt = xml  # from previous attempt

            retry_prompt = build_unified_prompt(masked_prompt, current_xml_for_prompt, data_columns, data_filename)


            # Add current correction hints for iterative guiding
            retry_prompt_with_correction = retry_prompt + "\n\n" + prompt_modifier

            # Call Gemini directly for faster response (no Celery overhead)
            # For simple JMX generation, direct call is faster than async task queue
            raw_response = generate_with_gemini(retry_prompt_with_correction)
            xml = extract_xml_from_markdown(raw_response)
            logger.debug("🧪 Extracted XML:\n%s", xml[:1000])

            # Handle empty XML edge case
            if not xml:
                correction = "Gemini returned an empty or invalid XML block."
                prompt_modifier = f"\n\nThe last XML was invalid because: {correction}"
                continue

            # ✅ Early XML sanity check to avoid crashing on bad output
            try:
                ET.fromstring(xml.encode("utf-8"))
            except ET.XMLSyntaxError as e:
                correction = f"XML Syntax Error: {e}"
                prompt_modifier = f"\n\nThe last XML was invalid because: {correction}. Please fix the XML syntax carefully."
                logger.warning("Skipping to next attempt due to malformed XML: %s", e)
                continue



            logger.debug("🧠 Prompt sent:\n%s", retry_prompt_with_correction)

            logger.debug("📦 Gemini raw response:\n%s", raw_response)
            logger.debug("🧪 Extracted XML:\n%s", xml[:1000])

            if not xml or "Error: Insufficient input" in raw_response:
                correction = "The model did not return a valid XML. Ensure the prompt includes clear load testing intent with URL, user count, and method."
                prompt_modifier += f"\n\nCorrection hint: {correction}"
                continue
            
            xml = auto_fix_jmx(xml)
            xml = normalize_http_headers(xml)
            xml = fix_misplaced_result_collector(xml)
            xml = fix_hash_tree_structure(xml)

            xml = fix_resultcollector_saveconfig(xml)

            if data_columns and data_filename:
                try:
                    xml = inject_csv_dataset_into_jmx(xml, data_filename, data_columns)
                except Exception as e:
                    return {"status": "error", "message": f"CSV injection failed: {str(e)}"}, 400

            # 🔹 Ensure missing defaults are fixed before validation
            xml = enforce_core_jmeter_defaults(xml)
            # ✅ Restore original ModuleController paths if we have them
            if original_paths:
                try:
                    root_gen = ET.fromstring(xml.encode("utf-8"))
                    for idx, mc in enumerate(root_gen.findall(".//ModuleController")):
                        if idx < len(original_paths):
                            path_nodes = mc.findall(".//stringProp")
                            for sp_node, orig_text in zip(path_nodes, original_paths[idx]):
                                if sp_node.text != orig_text:
                                    logger.warning(f"🛠 Restoring ModuleController path entry from '{sp_node.text}' to '{orig_text}'")
                                    sp_node.text = orig_text
                    xml = ET.tostring(root_gen, pretty_print=True, encoding="utf-8").decode("utf-8")
                except Exception as e:
                    logger.warning(f"Failed to restore ModuleController paths: {e}")


            valid, reason = is_valid_jmx(xml)

            if valid:
                user_count = extract_user_count_from_jmx(xml)
                if license_type == "trial" and user_count > 100:
                    return {"status": "error", "message": "Trial users can only generate up to 100 users."}, 403
                if license_type == "paid" and user_count > 1_000_000:
                    return {"status": "error", "message": "Max user count is 1 million."}, 403

                timestamp = datetime.now(timezone.utc).strftime("%d-%m-%Y_%H-%M-%S")
                base = original_filename.rsplit(".", 1)[0] if original_filename else "test_plan"
                jmx_filename = f"{base}_{timestamp}.jmx"
                s3_key = f"uploads/{email}/{jmx_filename}"
                # Inject real sensitive values back into JMX
                for placeholder, real_value in sensitive_map.items():
                    xml = xml.replace(placeholder, real_value)

                upload_fileobj_to_s3(io.BytesIO(xml.encode("utf-8")), s3_key)

                return {"status": "success", "message": "Test plan generated and uploaded.", "jmx_filename": jmx_filename}, 200

            correction = reason  
            prompt_modifier = (
                f"\n\nThe last XML was invalid because: {correction}. "
                f"Please fix the existing XML, preserving all elements and structure exactly. "
                f"Do not remove or rename any elements; make only minimal necessary corrections. "
                f"Ensure the ResultCollector is inside the ThreadGroup's hashTree."
            )

            logger.debug("✅ Validation passed: %s", is_valid_jmx(xml))
            logger.debug("👤 Extracted user count: %s", user_count)





        return {"status": "error", "message": f"Failed to generate a valid test plan after {max_attempts} attempts."}, 500

    except Exception as e:
        print("❌ Exception in generate_and_upload_jmx:", traceback.format_exc())
        return {"status": "error", "message": str(e)}, 500

