
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import axiosInstance from "../api/axiosInstance";
import { Download, Send, User, Bot, MessageSquare } from "lucide-react";
import { FaDownload, FaFileUpload, FaTimes, FaHistory, FaEye } from "react-icons/fa";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Plus } from "lucide-react";
import { Autocomplete, TextField } from '@mui/material';
import StatusModal from '../components/StatusModal';
import { FiDownload, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { PdfActionModal, FileViewerModal } from '../components/PdfActionModal';
import { useTestPlanStore } from '../../src/store/testPlanStore';


export const DropdownAction = ({ label, icon, onClick, color, bgHover }) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: hover ? bgHover : 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        fontSize: 15,
        color: color,
        fontWeight: 600,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.2s ease',
      }}
    >
      {icon}
      {label}
    </button>
  );
};


const CHAT_KEY = "kickload-chat-history";
const TEST_PROGRESS_KEY = "kickload-test-in-progress";

const TestPlanGeneration = () => {
  // Replace useState with Zustand store hooks
  // ✅ USE Zustand hooks
  let {
    message, setMessage,
    chat, setChat,
    jmxFilename, setJmxFilename,
    history, setHistory,
    searchQuery, setSearchQuery,
    isLoading, setIsLoading,
    downloadReady, setDownloadReady,
    showUploadMenu, setShowUploadMenu,
    uploading, setUploading,
    attachedFiles, setAttachedFiles,
    openMenuIndex, setOpenMenuIndex,
    menuPosition, setMenuPosition,
    modal, setModal,
    statusModal, setStatusModal,
    pdfActionModal, setPdfActionModal,
    jmxViewer, setJmxViewer,
    containerHeight, setContainerHeight,
    rows, setRows
  } = useTestPlanStore();

  chat = Array.isArray(chat) ? chat : [];





  // Restore DOM refs (these should NOT be in Zustand)
  const chatContainerRef = useRef(null);
  const fileInputJmxRef = useRef(null);
  const fileInputCsvRef = useRef(null);
  const fileInputExcelRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null); // Add ref for modal
  const lastUserMessageRef = useRef(null);
  const textareaRef = useRef(null);


  // Defensive fallback: always use array for chat
  const safeChat = Array.isArray(chat) ? chat : [];
  const lastUserIndex = [...safeChat].reverse().findIndex(msg => msg.type === "user");
  const lastUserMessageIdx = lastUserIndex !== -1 ? safeChat.length - 1 - lastUserIndex : -1;



  const lineHeight = 24; // px
  const baseRows = 2;
  const maxRows = 3;


  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        // Reset rows and height to baseline
        textareaRef.current.rows = baseRows;

        const scrollHeight = textareaRef.current.scrollHeight;
        const currentRows = Math.floor(scrollHeight / lineHeight);

        if (currentRows > maxRows) {
          setRows(maxRows);
          setContainerHeight(lineHeight * maxRows + 52); // 3 lines + icon/padding
          textareaRef.current.style.overflowY = 'auto';
        } else if (currentRows > baseRows) {
          setRows(maxRows); // allow 3 full rows, no scroll yet
          setContainerHeight(lineHeight * maxRows + 52);
          textareaRef.current.style.overflowY = 'hidden';
        } else {
          setRows(baseRows);
          setContainerHeight(lineHeight * baseRows + 52); // back to 2 rows
          textareaRef.current.style.overflowY = 'hidden';
        }

        // ✨ Set textarea height explicitly
        textareaRef.current.style.height = `${lineHeight * Math.min(currentRows, maxRows)}px`;
      }
    });
  };


  useEffect(() => {
    const timeout = setTimeout(() => {
      const lastUserIndex = [...chat].reverse().findIndex(msg => msg.type === "user");

      if (lastUserIndex !== -1 && lastUserMessageRef.current && chatContainerRef.current) {
        const messageElement = lastUserMessageRef.current;
        const container = chatContainerRef.current;

        container.scrollTo({
          top: messageElement.offsetTop - container.offsetTop,
          behavior: "smooth",
        });
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [chat]);






  const inferTestType = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes("load")) return "Load Test";
    if (lower.includes("api")) return "API";
    return "Other";
  };



  const handleLocalBotReply = (msg) => {
    const { setChat } = useTestPlanStore.getState(); // Access outside React component

    const lower = msg.toLowerCase();

    if (lower.includes("help")) {
      return `🧠 Here's how to use KickLoad:

Describe your test in plain English.

💬 Examples:
• Test POST http://api.example.com/login with 100 users
• Simulate 500 users sending GET https://example.com/products
• Run a load test on https://shop.example.com with 200 users hitting:
   - GET /products
   - POST /cart/add
   - PUT /checkout/confirm

🧾 Your prompt should include:
• ✅ Full URL (e.g., https://api.example.com)
• ✅ HTTP method (GET, POST, PUT, etc.)
• ✅ Endpoint (e.g., /login)
• ✅ Number of users (e.g., 100 users)

📎 Optional:
• 🔄 Upload a CSV file to test with dynamic values (e.g., usernames, emails). Your prompt should mention the column names to use (e.g., "use name and email from CSV").
• ⚠️ Make sure to match column names in your prompt with the CSV uploaded.
• 📊 If no column names are mentioned or matched, all columns in the CSV will be used automatically.
• 🛠 Upload a .jmx file to fix, extend, or enhance an existing test plan.

🛡️ Your data is safe. Credentials and sensitive test inputs are never shared.`;
    }


    if (lower.includes("upload csv")) {
      return `📂 CSV files help you inject dynamic test data — like names, emails, tokens, etc.

✅ Just upload your file and say something like:
"Use name and email from CSV to run 500 user test on POST https://api.example.com/signup"

📌 Tips:
• Column headers will be used as variable names
• You can use all columns or specify a few (e.g., "use name and email")`;
    }

    if (lower.includes("upload jmx")) {
      return `🧾 Upload a .jmx file to improve, fix, or convert it into a valid test plan.

After uploading, you can:
• Ask to fix or clean it (e.g., "Fix this JMX and make it ready to run")
• Add or change something (e.g., "Add login request" or "Change thread count to 1000")

❗ Don't describe a new test from scratch — that will reset your uploaded JMX.
Focus on what you'd like to fix, improve, or add to the existing plan.`;
    }

    if (lower === "clear" || lower === "reset") {
      // Reset chat via Zustand
      setChat([
        {
          type: "bot",
          text: `👋 Welcome to KickLoad!

I help you generate test plans for load and performance testing — just describe your test in plain English!

💡 You can also type:
• 'help' — for full instructions & test format
• 'upload csv' — to learn how CSV data works with examples
• 'upload jmx' — to reuse or fix a JMeter test plan
• 'clear' or 'reset' — to restart the chat anytime

🚀 Just type your test idea or one of the keywords above to begin.`,
        },
      ]);
      return ""; // avoid backend call
    }

    return null; // no local match, fallback to backend
  };






  const handleSend = async () => {
    if (!message.trim() && attachedFiles.length === 0) return;

    let userMessage = "";

    if (message.trim() && attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(", ");
      userMessage = `${message.trim()} with files: ${fileNames}`;
    } else if (message.trim()) {
      userMessage = message.trim();
    } else if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(", ");
      userMessage = `Uploaded files: ${fileNames}`;
    }


    // Append user message and "generating..." message together
    const newMessages = [
      { type: "user", text: userMessage },
      { type: "bot", text: "⚡ Generating your test plan... This should take about 10-15 seconds..." },
    ];
    setChat([...chat, ...newMessages]); // Directly append to Zustand `chat` state
    setMessage("");
    setContainerHeight(lineHeight * baseRows + 52);

    const localResponse = handleLocalBotReply(message.trim());
    if (localResponse !== null) {
      if (localResponse !== "") {
        const updatedChat = [...chat, ...newMessages.slice(0, 1), { type: "bot", text: localResponse }];
        setChat(updatedChat);
      }
      // If it's "", handleLocalBotReply already called `setChat()` (like in reset)
      return;
    }


    setIsLoading(true);
    setDownloadReady(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = `${lineHeight * baseRows}px`;
      textareaRef.current.style.overflowY = "hidden";
    }

    try {
      const formData = new FormData();

      if (message.trim()) {
        formData.append("prompt", message.trim());
      }

      attachedFiles.forEach((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (["csv", "xlsx", "xls"].includes(ext)) {
          formData.append("data", file);
        } else if (ext === "jmx") {
          formData.append("file", file);
        }
      });
      setAttachedFiles([]);
      const response = await axiosInstance.post("/generate-test-plan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedChat = [...chat, ...newMessages]; // Clone from earlier state
      const lastBotIdx = updatedChat.map((m) => m.type).lastIndexOf("bot");

      if (response.data.status === "success") {
        const filename = response.data.jmx_filename;
        if (lastBotIdx !== -1) {
          updatedChat[lastBotIdx] = {
            type: "bot",
            text: response.data.message || "✅ Test plan generated successfully!",
          };
        }

        setChat(updatedChat);
        setJmxFilename(filename);
        setDownloadReady(true);

        const now = formatDateSafe(new Date());
        const testType = inferTestType(filename);
        setHistory((prev) => [{ filename, date: now, testType }, ...prev]);
        fetchHistory();
        setPdfActionModal({ open: true, filename });
      } else {
        if (lastBotIdx !== -1) {
          updatedChat[lastBotIdx] = {
            type: "bot",
            text: response.data.message || "❌ Failed to process test plan.",
          };
        }
        setChat(updatedChat);
      }
    } catch (error) {
      const updatedChat = [...chat, ...newMessages];
      const lastBotIdx = updatedChat.map((m) => m.type).lastIndexOf("bot");

      if (lastBotIdx !== -1) {
        // Sanitize error message to prevent API key exposure
        let errorMsg = String(error.response?.data?.message || error.message || 'Unknown error');
        // Remove any potential API keys (Gemini format: AIza...)
        errorMsg = errorMsg.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]');
        
        // Provide helpful message for timeout errors
        if (errorMsg.includes('timeout') || errorMsg.includes('exceeded')) {
          errorMsg = 'Request took too long (>30 seconds). Please try again or simplify your prompt.';
        }
        
        updatedChat[lastBotIdx] = {
          type: "bot",
          text: `❌ Error: ${errorMsg}`,
        };
      }
      setChat(updatedChat);
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
    }
  };



  const dropdownButtonStyle = (color) => ({
    background: 'none',
    border: 'none',
    color,
    fontWeight: 600,
    fontSize: 15,
    padding: '12px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #f2f2f2',
    transition: 'all 0.15s ease-in-out',
  });

  const onHover = (e, bg) => {
    e.currentTarget.style.backgroundColor = bg;
    e.currentTarget.style.transform = 'scale(1.04)';
  };

  const onLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.transform = 'scale(1)';
  };




  const handleDownload = async (filename) => {
    try {
      const res = await axiosInstance.get(`/download/${filename}`);

      if (res.data.status === "success" && res.data.download_url) {
        const url = res.data.download_url;

        // Open in a new tab — this triggers the browser's native download behavior
        window.open(url, "_blank");

      } else {
        setStatusModal({ open: true, message: res.data.message || "Failed to get download URL.", type: 'error' });
      }
    } catch (error) {
      console.error("Download error:", error);
      setStatusModal({ open: true, message: 'Error downloading file.', type: 'error' });
    }
  };

  // Utility to safely format dates
  function formatDateSafe(dateString) {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  }

  const fetchHistory = async () => {
    try {

      const res = await axiosInstance.get("/list-files?type=jmx");

      const parsedHistory = (res.data || []).map(file => ({
        filename: file.filename,
        date: formatDateSafe(file.datetime),
        testType: inferTestType(file.filename),
      }));
      setHistory(parsedHistory);

    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  useEffect(() => {
    const hasPersistedHistory = useTestPlanStore.getState().history.length > 0;
    if (!hasPersistedHistory) {
      fetchHistory();
    }
  }, []);


  const filteredHistory = history.filter((item) =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadClick = () => {
    setShowUploadMenu((prev) => !prev);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    let allowedExtensions = [];
    let typeLabel = '';

    if (type === 'jmx') {
      allowedExtensions = ['.jmx'];
      typeLabel = 'JMX';
    } else if (type === 'csv_excel') {
      allowedExtensions = ['.csv', '.xls', '.xlsx'];
      typeLabel = 'CSV/Excel';
    }

    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setStatusModal({ open: true, message: `Only ${typeLabel} files (${allowedExtensions.join(', ')}) are allowed`, type: 'info' });
      return;
    }

    // Check total limit: only 1 of each type allowed
    if (type === 'jmx' && attachedFiles.some(f => f.name.toLowerCase().endsWith('.jmx'))) {
      setStatusModal({ open: true, message: 'Only one JMX file can be uploaded at a time.', type: 'info' });
      return;
    }
    if (type === 'csv_excel' && attachedFiles.some(f => ['.csv', '.xls', '.xlsx'].some(ext => f.name.toLowerCase().endsWith(ext)))) {
      setStatusModal({ open: true, message: 'Only one CSV/Excel file can be uploaded at a time.', type: 'info' });
      return;
    }

    // ✅ Append file through store
    setAttachedFiles(file);

    // Reset input value so same file can be reselected if removed
    e.target.value = "";
  };




  const handleRemoveFile = (name) => {
    setAttachedFiles(prev => prev.filter(file => file.name !== name));
  };


  // Handler for menu actions
  const handleMenuAction = (action, filename, idx) => {
    setOpenMenuIndex(null);

    if (action === 'edit') {
      const [base, ext] = filename.split(/\.(?=[^\.]+$)/);
      setModal({
        open: true,
        type: 'edit',
        filename,
        newName: base,
        extension: ext,
        prefix: '',
        isLockedPrefix: false
      });
    } else {
      setModal({ open: true, type: action, filename });
    }
  };

  // Modal confirm logic
  const handleModalConfirm = async () => {
    if (modal.type === 'download') {
      await handleDownload(modal.filename);
    }

    else if (modal.type === 'edit') {
      if (!modal.newName || modal.newName.trim() === '') {
        setStatusModal({
          open: true,
          message: 'Filename cannot be empty.',
          type: 'info',
        });
        return;
      }

      const currentFullName = modal.filename;
      const inputName = modal.newName.trim();

      // 🚫 Prevent users from typing extension manually
      if (/\.[^/.]+$/.test(inputName)) {
        setStatusModal({
          open: true,
          message: 'Please do not include the extension. It will be added automatically.',
          type: 'info',
        });
        return;
      }

      // ✅ Construct final name
      const newFullName = `${inputName}.${modal.extension}`;

      // ✅ Skip if unchanged
      if (newFullName === currentFullName) {
        setModal({
          open: false,
          type: '',
          filename: '',
          newName: '',
          extension: '',
          prefix: '',
          isLockedPrefix: false
        });
        return;
      }

      try {
        const res = await axiosInstance.post('/rename-file', {
          old_name: currentFullName,
          new_name: newFullName,
        });

        if (res.data.status === 'success') {
          setStatusModal({
            open: true,
            message: 'File renamed successfully.',
            type: 'success',
          });
          fetchHistory();
        } else {
          setStatusModal({
            open: true,
            message: res.data.error || 'Failed to rename file.',
            type: 'error',
          });
        }
      } catch (err) {
        setStatusModal({
          open: true,
          message: err.response?.data?.error || 'Rename failed.',
          type: 'error',
        });
      }
    }

    else if (modal.type === 'delete') {
      try {
        const res = await axiosInstance.post('/delete-file', {
          filename: modal.filename
        });

        if (res.data.status === 'success') {
          setStatusModal({
            open: true,
            message: 'File deleted successfully.',
            type: 'success',
          });
          fetchHistory();
        } else {
          setStatusModal({
            open: true,
            message: res.data.error || 'Failed to delete file.',
            type: 'error',
          });
        }
      } catch (error) {
        setStatusModal({
          open: true,
          message: error.response?.data?.error || 'Error deleting file.',
          type: 'error',
        });
      }
    }

    setModal({
      open: false,
      type: '',
      filename: '',
      newName: '',
      extension: '',
      prefix: '',
      isLockedPrefix: false
    });
  };





  const handleModalCancel = () => setModal({
    open: false,
    type: '',
    filename: '',
    newName: '',
    extension: '',
    prefix: '',
    isLockedPrefix: false
  });
  // Handler to open menu and set its position
  const handleMenuOpen = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4, // 4px gap
      left: rect.right - 140 + window.scrollX
    });
    setOpenMenuIndex(index);
  };
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle dropdown menu closing
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }

      // Handle modal closing - check if click is outside the modal
      if (modal.open && modalRef.current) {
        // Check if the click target is within the modal
        const isClickInsideModal = modalRef.current.contains(event.target);

        // If click is outside modal, close it
        if (!isClickInsideModal) {
          setModal({
            open: false,
            type: '',
            filename: '',
            newName: '',
            extension: '',
            prefix: '',
            isLockedPrefix: false
          });
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modal.open, setModal]);



  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // prevent newline
      handleSend();       // trigger send
    }
  };

  const handleViewFile = async (filename) => {
    try {
      const res = await axiosInstance.get(`/download/${filename}`);
      if (res.data.status === 'success' && res.data.download_url) {
        const fileRes = await fetch(res.data.download_url);
        const fileText = await fileRes.text();
        setJmxViewer({ open: true, content: fileText, filename }); // <- include filename
      } else {
        setJmxViewer({ open: true, content: 'Failed to get file download URL.', filename });
      }
    } catch (err) {
      setJmxViewer({ open: true, content: 'Failed to load file content.', filename });
    }
  };


  return (
    <>
      <div className="w-full max-w-full flex-1 m-0 px-[clamp(4px,2vw,24px)] pt-[clamp(16px,4vw,32px)] pb-[clamp(24px,4vw,40px)] box-border min-h-screen flex flex-col overflow-x-auto relative">

        <div className="w-full relative z-[1] mb-[clamp(0px,1vw,32px)] bg-transparent rounded-[var(--tp-radius)] text-[var(--tp-orange-dark)] px-[clamp(8px,4vw,32px)] pt-[clamp(18px,5vw,40px)] pb-[clamp(12px,3vw,32px)] box-border">

          <div className="text-[clamp(1.5rem,7vw,2.2rem)] font-extrabold tracking-[0.5px] text-[var(--tp-orange-dark)] break-words max-w-full">
            Create Test Plan
          </div>

          <div className="text-[clamp(1rem,3vw,1.2rem)] ml-1 font-bold text-[var(--tp-text)] opacity-85 break-words whitespace-normal">
            Unlocking Insights, Enhancing Precision!
          </div>

        </div>


        <div className="tp-panels route-transition" style={{ marginTop: "-15px", marginLeft: '32px', maxWidth: 'calc(100% - 32px)' }}>
          {/* ✅ Swapped: Generator Panel First */}
          <div
            className="tp-panel tp-panel-chat card-transition"
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(100vh - 140px)', // ✅ header + input buffer
              overflow: 'hidden',
            }}
          >




            <div className="tp-panel-title flex items-center mt-[-10px] gap-2">
              <MessageSquare size={18} style={{ marginRight: '8px' }} />
              KickLoad Test Generator
            </div>
            <hr className="tp-section-divider" />

            <div
              ref={chatContainerRef}
              className="tp-chat-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                scrollBehavior: 'smooth',
                minHeight: 0, // ⛔ not fixed height
                maxHeight: '100%', // ✅ limit to available parent space
              }}
            >


              {safeChat.map((msg, idx) => (
                <div
                  key={idx}
                  ref={msg.type === "user" && idx === lastUserMessageIdx ? lastUserMessageRef : null}
                  className={`tp-chat-bubble${msg.type === "user" ? " tp-chat-bubble-user" : ""}`}
                >
                  <div className="tp-chat-sender flex items-center gap-1">
                    {msg.type === "user" ? <User size={16} /> : <Bot size={16} />}
                    {msg.type === "user" ? "You" : "Assistant"}
                  </div>

                  <div className="tp-chat-bubble-content" style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.5 }}>
                    {msg.file ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'rgba(255,122,0,0.08)',
                          color: 'var(--tp-orange)',
                          borderRadius: 6,
                          padding: '4px 12px',
                          fontSize: 15,
                          fontWeight: 600,
                          border: '1px solid var(--tp-orange)',
                          marginBottom: 2,
                          gap: 8,
                        }}>
                          <FaFileUpload style={{ fontSize: 18, marginRight: 6 }} />
                          {msg.file.length > 22 ? msg.file.slice(0, 18) + '...' : msg.file}
                        </div>
                        <span style={{ color: '#888', fontSize: 13, marginLeft: 2 }}>attached</span>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}

            </div>


            <hr className="tp-section-divider" />

            {/* Show file chips above the chat input if files are attached */}
            {attachedFiles.length > 0 && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
                marginLeft: 44,
                maxWidth: 420,
                flexWrap: 'wrap',
              }}>
                {attachedFiles.map((file) => (
                  <div key={file.name} style={{
                    background: 'rgba(255,122,0,0.08)',
                    color: 'var(--tp-orange)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: '1px solid var(--tp-orange)',
                  }}>
                    <FaFileUpload style={{ fontSize: 15, marginRight: 2 }} />
                    {file.name.length > 18 ? file.name.slice(0, 15) + '...' : file.name}
                    <FaTimes
                      style={{ cursor: 'pointer', marginLeft: 4, fontSize: 13 }}
                      onClick={() => handleRemoveFile(file.name)}
                      title="Remove file"
                    />
                  </div>
                ))}
              </div>
            )}


            <div
              style={{
                height: containerHeight,
                transition: 'height 0.2s ease',
                background: '#fff',
                border: '2.5px solid #FF6D00',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(255, 109, 0, 0.08)',
                margin: '0 0 8px 0',
                padding: '12px 12px 8px',
                boxSizing: 'border-box',
                zIndex: 300,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={rows}
                style={{
                  width: '100%',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 16.5,
                  fontFamily: 'inherit',
                  color: 'var(--tp-text)',
                  lineHeight: `${lineHeight}px`,
                  overflowY: rows === maxRows ? 'auto' : 'hidden',
                  height: `${lineHeight * rows}px`, // ✅ match rows
                }}
                placeholder="Type your prompt or upload a JMX/CSV/Excel file..."
                disabled={isLoading}
              />





              {/* ICONS take 25% */}
              <div
                style={{
                  flex: 0.25,
                  height: '30%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <button
                  type="button"
                  onClick={
                    attachedFiles.length >= 2 ? undefined : handleUploadClick
                  }
                  disabled={attachedFiles.length >= 2}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: attachedFiles.length >= 2 ? 'not-allowed' : 'pointer',
                    opacity: attachedFiles.length >= 2 ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    transition: 'background 0.2s',
                  }}
                  className="tp-icon-btn"
                  title="Upload"
                >
                  <Plus color="var(--tp-orange)" size={26} />
                </button>


                {/* Send & Download */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isLoading || (message.trim().length === 0 && attachedFiles.length === 0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      padding: 0,
                      margin: 0,
                      cursor: isLoading || (message.trim().length === 0 && attachedFiles.length === 0)
                        ? 'not-allowed'
                        : 'pointer',
                      opacity: isLoading || (message.trim().length === 0 && attachedFiles.length === 0)
                        ? 0.5
                        : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      transition: 'background 0.2s',
                    }}
                    className="tp-icon-btn"
                    title="Send"
                  >
                    <Send size={26} color="var(--tp-orange)" />
                  </button>

                </div>
              </div>





              {/* Drop-up Menu (attached to bottom left of container) */}
              {showUploadMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 58,
                    left: 12,
                    background: '#fff',
                    border: '1.5px solid var(--tp-orange)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(255,122,0,0.13)',
                    padding: '12px 18px',
                    minWidth: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    zIndex: 50000,
                    animation: 'fadeInUp 0.25s',
                  }}
                  onMouseLeave={() => setShowUploadMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => fileInputJmxRef.current && fileInputJmxRef.current.click()}
                    style={{
                      background: uploading ? '#ccc' : 'var(--tp-orange)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontWeight: 600,
                      fontSize: 15,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      boxShadow: uploading ? 'none' : '0 2px 8px rgba(255,122,0,0.13)',
                      transition: 'all 0.2s',
                      marginBottom: 6,
                      width: '100%',
                    }}
                    disabled={uploading}
                  >
                    <FaFileUpload style={{ fontSize: 18 }} />
                    Upload JMX file
                  </button>
                  <input
                    type="file"
                    accept=".jmx"
                    ref={fileInputJmxRef}
                    style={{ display: 'none' }}
                    onChange={e => handleFileChange(e, 'jmx')}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputCsvRef.current && fileInputCsvRef.current.click()}
                    style={{
                      background: uploading ? '#ccc' : 'var(--tp-orange)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontWeight: 600,
                      fontSize: 15,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      boxShadow: uploading ? 'none' : '0 2px 8px rgba(255,122,0,0.13)',
                      transition: 'all 0.2s',
                      marginBottom: 2,
                      width: '100%',
                    }}
                    disabled={uploading}
                  >
                    <FaFileUpload style={{ fontSize: 18 }} />
                    Upload CSV/Excel file
                  </button>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ref={fileInputCsvRef}
                    style={{ display: 'none' }}
                    onChange={e => handleFileChange(e, 'csv_excel')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ✅ History Panel Second (Right) */}
          <div
            className={`tp-panel tp-panel-history card-transition ${filteredHistory.length === 0 ? 'tp-history-empty' : ''}`}
          >


            <div className="tp-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaHistory size={18} color="#FF6D00" />
              History</div>

            <div className="tp-history-search">
              <TextField
                placeholder="Search tests..."
                size="small"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--tp-radius-sm)',
                    backgroundColor: 'var(--tp-white)',
                    '& fieldset': {
                      borderColor: 'var(--tp-border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--tp-orange)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--tp-orange)',
                    },
                  },
                }}
              />
            </div>

            <div
              className="tp-history-list"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: filteredHistory.length === 0 ? '120px' : '100%', // ✅ dynamic
                boxShadow: '0 2px 8px 0 rgba(255, 122, 0, 0.04)',
                position: 'absolute',
                top: '110px',
                right: '15px',
                left: '15px',
                bottom: '20px',
                zIndex: 1,
              }}
            >



              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <div
                    className="tp-history-card"
                    key={index}
                    style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', wordBreak: 'break-all', overflowWrap: 'anywhere', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className="tp-history-filename">{item.filename}</div>
                      <div className="tp-history-meta">Created: {item.date}</div>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 8, borderRadius: 6, boxShadow: 'none' }}
                      onClick={e => { e.stopPropagation(); openMenuIndex === index ? setOpenMenuIndex(null) : handleMenuOpen(e, index); }}
                      title="More options"
                    >
                      <MoreVertIcon style={{ fontSize: 24, color: '#FF6D00' }} />
                    </button>
                    {/* Portal menu for this row */}
                    {openMenuIndex === index && ReactDOM.createPortal(
                      <div
                        ref={dropdownRef}
                        style={{
                          position: 'absolute',
                          top: menuPosition.top,
                          left: menuPosition.left,
                          background: '#ffffff',
                          border: '1px solid #eee',
                          borderRadius: '12px',
                          minWidth: 180,
                          zIndex: 20000,
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          padding: '8px 0',
                          animation: 'fadeInUp 0.2s ease-out',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                        onMouseLeave={() => setOpenMenuIndex(null)}
                      >
                        <DropdownAction
                          label="View"
                          icon={<FaEye size={16} />}
                          color="#FF6D00"
                          bgHover="#FFF3E0"
                          onClick={async () => {
                            await handleViewFile(item.filename);
                            setOpenMenuIndex(null);
                          }}
                        />



                        <DropdownAction
                          label="Download"
                          icon={<FiDownload size={16} />}
                          color="#2ecc40"
                          bgHover="#e8f8f2" // Light green, matches modal
                          onClick={() => handleMenuAction('download', item.filename, index)}
                        />


                        <DropdownAction
                          label="Rename"
                          icon={<FiEdit2 size={16} />}
                          color="#0096FF"
                          bgHover="#EAF6FF"
                          onClick={() => handleMenuAction('edit', item.filename, index)}
                        />

                        <DropdownAction
                          label="Delete"
                          icon={<FiTrash2 size={16} />}
                          color="#E14434"
                          bgHover="#FFF0F0"
                          onClick={() => handleMenuAction('delete', item.filename, index)}
                        />
                      </div>,
                      document.body
                    )}

                  </div>
                ))
              ) : (
                <div className="tp-history-meta">No test plans generated yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal.open && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(20,22,34,0.55)',
          zIndex: 30000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div ref={modalRef} style={{
            width: '100%',
            maxWidth: 420,
            background: '#fff',
            borderRadius: '18px',
            color: '#222',
            padding: '2rem 1.5rem 1.5rem 1.5rem',
            boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
            borderLeft: `5px solid ${modal.type === 'download' ? '#2ecc40' :
              modal.type === 'edit' ? '#0096FF' :
                '#E14434'
              }`,
            backgroundImage: 'linear-gradient(to bottom, #ffffff, #fdf9f4)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 20,
              marginBottom: 14,
              gap: 12,
              color:
                modal.type === 'download' ? '#2ecc40' :
                  modal.type === 'edit' ? '#0096FF' :
                    '#E14434',
            }}>
              {modal.type === 'download' && <FiCheckCircle size={22} />}
              {modal.type === 'edit' && <FiEdit2 size={22} />}
              {modal.type === 'delete' && <FiTrash2 size={22} />}
              {modal.type === 'download' && 'Download this file?'}
              {modal.type === 'edit' && 'Rename this file'}
              {modal.type === 'delete' && 'Delete this file?'}
            </div>

            <div style={{
              fontSize: 15,
              color: '#555',
              marginBottom: modal.type === 'edit' ? 18 : 24,
              wordBreak: 'break-word',
            }}>
              {modal.type !== 'edit' && modal.filename}
            </div>

            {modal.type === 'edit' && (
              <div style={{ display: 'flex', marginBottom: 24, border: '1px solid #ddd', borderRadius: 10 }}>
                <input
                  type="text"
                  value={modal.newName}
                  onChange={(e) => {

                    setModal({
                      ...modal,
                      newName: e.target.value
                    });
                  }}
                  onFocus={(e) => {

                  }}
                  onBlur={(e) => {

                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 15,
                    border: 'none',
                    borderRadius: '10px 0 0 10px',
                    outline: 'none',
                    background: '#fafafa',
                  }}
                />
                <div style={{
                  padding: '10px 14px',
                  background: '#eee',
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: '0 10px 10px 0',
                  color: '#555',
                }}>
                  .{modal.extension}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={handleModalCancel}
                style={{
                  background: '#f4f4f4',
                  color: '#333',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 22px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f4f4f4'}
              >
                Cancel
              </button>

              <button
                onClick={handleModalConfirm}
                style={{
                  background:
                    modal.type === 'download' ? '#2ecc40' :
                      modal.type === 'edit' ? '#0096FF' :
                        '#E14434',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 22px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow:
                    modal.type === 'download' ? '0 4px 12px rgba(46,204,64,0.3)' :
                      modal.type === 'edit' ? '0 4px 12px rgba(0,150,255,0.3)' :
                        '0 4px 12px rgba(225,68,52,0.3)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.background =
                  modal.type === 'download' ? '#27ae60' :
                    modal.type === 'edit' ? '#007ce3' :
                      '#d63031'
                }
                onMouseLeave={e =>
                  e.currentTarget.style.background =
                  modal.type === 'download' ? '#2ecc40' :
                    modal.type === 'edit' ? '#0096FF' :
                      '#E14434'
                }
              >
                {modal.type === 'download' && <FiCheckCircle size={18} />}
                {modal.type === 'edit' && <FiEdit2 size={18} />}
                {modal.type === 'delete' && <FiTrash2 size={18} />}
                {modal.type === 'download' && 'Download'}
                {modal.type === 'edit' && 'Rename'}
                {modal.type === 'delete' && 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      <StatusModal
        open={statusModal.open}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />


      <PdfActionModal
        open={pdfActionModal.open}
        filename={pdfActionModal.filename}
        onClose={() => setPdfActionModal({ open: false, filename: '' })}
        onView={async () => {
          await handleViewFile(pdfActionModal.filename);
          setPdfActionModal({ open: false, filename: '' });
        }}
        onRename={() => {
          setModal({
            open: true,
            type: 'edit',
            filename: pdfActionModal.filename,
            newName: pdfActionModal.filename.replace(/\.jmx$/, ''),
            extension: 'jmx',
            prefix: '',
            isLockedPrefix: false,
          });
          setPdfActionModal({ open: false, filename: '' });
        }}
        onDownload={() => {
          setModal({ open: true, type: 'download', filename: pdfActionModal.filename });
          setPdfActionModal({ open: false, filename: '' });
        }}
        onDelete={() => {
          setModal({ open: true, type: 'delete', filename: pdfActionModal.filename });
          setPdfActionModal({ open: false, filename: '' });
        }}
        title="Test Plan created!"
      />

      <FileViewerModal
        open={jmxViewer.open}
        title={jmxViewer.filename || 'JMX File'}
        content={jmxViewer.content}
        onClose={() => setJmxViewer({ open: false, content: '', filename: '' })}
      />



      <style>{`

      
       
        .container {
          max-width: 1200px;
          margin: auto;
          padding: 32px 24px;
        }
        .card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(255, 153, 102, 0.2);
          transition: all 0.3s ease-in-out;
        }
        .card:hover {
          transform: scale(1.015);
          box-shadow: 0 12px 32px rgba(255, 153, 102, 0.3);
        }
        .card-title {
          font-size: 20px;
          font-weight: 700;
          color: #FF6D00;
        }
        .chat-message {
          background: #FFF5E0;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          color: #333;
        }
        
        @media screen and (max-width: 768px) {
          .flex-layout {
            flex-direction: column;
          }
          .card {
            margin-bottom: 16px;
          }
        }
        :root {
          --tp-orange: #FF7A00;
          --tp-orange-dark: #FF6D00;
          --tp-orange-hover: #e06600;
          --tp-orange-light: #FFF3E0;
          --tp-orange-bg: #FFF1E6;
          --tp-header-blob: #FFE0B2;
          --tp-white: #FFFFFF;
          --tp-gray: #F5F5F5;
          --tp-border: #E0E0E0;
          --tp-text: #333333;
          --tp-radius: 16px;
          --tp-radius-sm: 8px;
          --tp-shadow: 0px 8px 24px rgba(0,0,0,0.05);
          --tp-shadow-hover: 0px 12px 32px rgba(0,0,0,0.10);
          --tp-btn-shadow: 0px 4px 12px rgba(255, 122, 0, 0.3);
          --tp-font: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
        }
        .enhanced-bg {
          min-height: 100vh;
          background: linear-gradient(rgb(255, 233, 208), rgb(255, 243, 224));
          font-family: var(--tp-font);
          color: var(--tp-text);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .tp-main {
          height: 100vh;
          display: flex;
          flex-direction: column;
          margin: 0 auto;
          padding: 70px 16px 44px 30px;
          position: relative;
        }




        .tp-header-blob {
          position: absolute;
          top: -14px;
          left: -32px;
          width: 320px;
          height: 160px;
          z-index: 0;
          pointer-events: none;
        }
        .tp-header {
          background: none;
          border-radius: var(--tp-radius);
          color: var(--tp-orange-dark);
          padding: 8px 16px 24px 8px;
          margin-bottom: 8px;
          margin-top: 0;
          margin-left: 0;
          position: relative;
          z-index: 1;
          font-family: var(--tp-font);
          width: 100%;
          box-sizing: border-box;
        }
        
        .tp-header-desc {
          font-size: clamp(1rem, 2vw, 1.25rem);
          font-weight: 550;
          font-style: bold;
          opacity: 0.85;
          color: var(--tp-text);
          white-space: normal;
          overflow-wrap: break-word;
        }
        .tp-panels {
          flex: 1;
          display: flex;
          flex-direction: row;
          gap: 24px;
          overflow: hidden; /* prevent children from forcing resize */
        }


        .tp-panel {
          background: var(--tp-white);
          border-radius: var(--tp-radius);
          box-shadow: var(--tp-shadow);
          padding: 24px;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.7s ease;
          transition: box-shadow 0.2s, transform 0.2s;
          height: 100%;
        }
        .tp-panel:hover {
          box-shadow: var(--tp-shadow-hover);
          transform: scale(1.01);
        }
        .tp-panel-history {
          min-width: 240px;
          max-width: 300px;
          flex: 0 0 auto !important;
          display: flex;
          flex-direction: column;
          height: auto !important;
          max-height: 90% !important;
          position: relative;
          z-index: 1000; /* ✅ lowercase with hyphen */

        }

        .tp-panel-history.tp-history-empty {
          height: 200px !important;   /* Shrinks if no history */
          flex: 0 0 auto !important;
          max-height: 360px !important;
        }

         .tp-panel-chat {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            min-height: 0;
            height: 90%;
            max-height: 100%;
          }




        .tp-panel-chat,
        .tp-panel-history {
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }






        .tp-panel-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--tp-orange-dark);
          margin-bottom: 2px;
          letter-spacing: 0.2px;
        }
        .tp-divider {
          border: none;
          border-top: 1px solid var(--tp-border);
          margin: 18px 0 18px 0;
        }
        /* History Section */
        .tp-history-search {
          margin-bottom: 16px;
        }
        .tp-search-input,
        .tp-filter-select {
          width: 100%;
          border-radius: var(--tp-radius-sm);
          border: 1px solid var(--tp-border);
          padding: 12px;
          font-size: 15px;
          margin-bottom: 8px;
          background: var(--tp-white);
          transition: border 0.2s;
        }
        .tp-search-input:focus,
        .tp-filter-select:focus {
          outline: none;
          border: 2px solid var(--tp-orange);
        }
        .tp-history-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            flex: 1 1 auto;      /* ✅ Let it stretch */
            min-height: 0;       /* ✅ Prevent overflow clipping */
            box-shadow: 0 2px 8px 0 rgba(255, 122, 0, 0.04);
            position: relative;
          }

        .tp-history-list::-webkit-scrollbar {
          width: 8px;
        }
        .tp-history-list::-webkit-scrollbar-thumb {
          background: var(--tp-orange-light);
          border-radius: 8px;
        }
        .tp-history-card {
          background: var(--tp-gray);
          border-radius: 12px;
          box-shadow: none; /* or something subtle but darker */

          padding: 16px 18px;
          border: 1px solid var(--tp-border);
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          position: relative;
          animation: fadeIn 0.7s ease;
        }
        .tp-history-card:hover {
          box-shadow: var(--tp-shadow-hover);
          transform: scale(1.01);
        }
        .tp-history-filename {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 4px;
          color: var(--tp-text);
        }
        .tp-history-meta {
          font-size: 13px;
          color: #555;
          margin-bottom: 2px;

          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }


        .tp-history-type {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          color: var(--tp-orange);
          font-weight: 600;
          margin-top: 2px;
        }
        .tp-history-type-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tp-orange);
          margin-right: 6px;
        }
        /* Chat Section */
        .tp-chat-container {
          flex: 1 1 0;
          min-height: 0;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          margin-top:-10px;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }



        .tp-chat-container::-webkit-scrollbar {
          width: 8px;
        }
        .tp-chat-container::-webkit-scrollbar-thumb {
          background: var(--tp-orange-light);
          border-radius: 8px;
        }
        .tp-chat-container:after {
          content: '';
          display: block;
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 18px;
          pointer-events: none;
        }
        .tp-chat-bubble {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 80%;
          animation: fadeIn 0.7s ease;
        }
        .tp-chat-bubble-user {
          align-self: flex-end;
          align-items: flex-end;
        }
        .tp-chat-sender {
          font-size: 12px;
          color: #888;
          margin-bottom: 2px;
          font-weight: 500;
        }
        .tp-chat-bubble-content {
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
          background: var(--tp-orange-light);
          color: var(--tp-text);
          word-break: break-word;
        }
        .tp-chat-bubble-user .tp-chat-bubble-content {
          background: var(--tp-gray);
          color: var(--tp-text);
        }
        /* Chat Input */
        
        
        .tp-button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 72px;
          justify-content: center;
        }
        .tp-btn-primary {
          background: var(--tp-orange);
          color: #fff;
          border: none;
          border-radius: var(--tp-radius-sm);
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 6px;
          box-shadow: var(--tp-btn-shadow);
          min-height: 20px;
          white-space: nowrap;
        }
        .tp-btn-primary:disabled {
          background: #ccc;
          color: #fff;
          cursor: not-allowed;
        }
        .tp-btn-primary:not(:disabled):hover {
          background: var(--tp-orange-hover);
          box-shadow: 0px 8px 24px rgba(255, 122, 0, 0.4);
        }
        /* Section Divider */
        .tp-section-divider {
          border: none;
          border-top: 1px solid var(--tp-border);
          margin: 12px 0 12px 0;
        }
        /* Fade-in animation */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Responsive */
        @media (max-width: 1024px) {
          .tp-panels {
            flex-direction: column;
            gap: 16px;
          }
        }
        @media (max-width: 767px) {
          .tp-main {
            padding: 16px 4px 8px 4px;
          }
          .tp-header {
            padding: 12px 4px 8px 4px;
            font-size: 18px;
          }
          .tp-panel {
            padding: 10px;
          }
          .tp-button-group {
            flex-direction: row;
            gap: 8px;
          }
          .tp-btn-primary {
            font-size: 12px;
            padding: 10px 16px;
          }
        }
        @media (max-width: 480px) {
          .tp-main {
            padding: 8px 2px 4px 2px;
          }
          .tp-header {
            padding: 8px 2px 6px 2px;
            font-size: 15px;
          }
          .tp-panel {
            padding: 6px;
          }
          .tp-button-group {
            flex-direction: column;
            gap: 6px;
          }
          .tp-btn-primary {
            font-size: 11px;
            padding: 8px 12px;
          }
        }
        @media (max-width: 360px) {
          .tp-main {
            padding: clamp(6px, 2vw, 10px) clamp(1px, 2vw, 4px) !important;
          }
          .tp-panels {
            gap: clamp(4px, 2vw, 8px) !important;
          }
          .tp-panel {
            padding: clamp(6px, 2vw, 10px) !important;
          }
          .tp-panel-title {
            font-size: clamp(12px, 7vw, 15px) !important;
          }
          .tp-chat-bubble-content, .tp-search-input, .tp-filter-select{
            font-size: clamp(10px, 3vw, 12px) !important;
            padding: clamp(4px, 2vw, 8px) !important;
          }
        }
        .tp-icon-btn, .tp-icon-btn:focus, .tp-icon-btn:active, .tp-icon-btn:hover {
          background: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
      `}</style>
    </>
  );
};

export default TestPlanGeneration;
