import React, { useState } from "react";
import { FaRegCopy, FaExclamationTriangle, FaThumbtack } from "react-icons/fa"; // React Icons

const baseUrl = "https://api.neeyatai.com";

const apiEndpoints = [
    {
        title: "Generate Test Plan",
        method: "POST",
        path: `${baseUrl}/generate-test-plan`,
        description: (
            <>
                Generates a KickLoad (<strong>.jmx</strong>) test plan using a prompt, an existing .jmx file, and/or an optional dataset (.csv or .xlsx).<br /><br />
                <span className="flex items-center">
                    <FaExclamationTriangle className="mr-1 text-yellow-500" />
                    <strong>Use multipart/form-data.</strong>
                </span>
                - If using <code>prompt</code>, set it in <strong>form-data</strong> key <code>prompt</code>.<br />
                - Upload <strong>.jmx</strong> file via <code>file</code> field.<br />
                - Upload dataset via <code>data</code> field.<br /><br />
                <span className="flex items-center">
                    <FaThumbtack className="mr-1 text-blue-500" />
                    <strong>At least one of prompt or file is required.</strong>
                </span>
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            formData: {
                prompt: "Required if file is not provided.",
                file: "Optional. JMX file upload.",
                data: "Optional. Dataset file (.csv or .xlsx).",
            },
        },
        response: {
            status: "success",
            message: "Test plan generated and uploaded.",
            jmx_filename: "test_plan_2025-08-06_14-49-39.jmx",
        },
    },
    {
        title: "Run KickLoad Test",
        method: "POST",
        path: `${baseUrl}/run-test/{jmx_filename}`,
        description: (
            <>
                Executes a KickLoad test using a previously uploaded <strong>.jmx</strong> file.<br /><br />
                You can optionally override values by passing a <strong>JSON</strong> body with parameters like <code>num_threads</code>, <code>loop_count</code>, and <code>ramp_time</code>.<br /><br />
                If no body is provided, the test will run using the settings defined inside the <strong>.jmx</strong> file.<br /><br />
                <span className="flex items-center">
                    <FaThumbtack className="mr-1 text-blue-500" />
                    <strong>File must already be uploaded via /generate-test-plan.</strong>
                </span>
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            pathParams: {
                jmx_filename: "Required. The JMX filename returned from /generate-test-plan.",
            },
            body: {
                num_threads: 50,
                loop_count: 10,
                ramp_time: 5,
            },
        },
        response: {
            status: "started",
            task_id: "<task-id>",
            message: "Test started, you can check status using the task ID.",
        },
    },
    {
        title: "Check Task Status",
        method: "GET",
        path: `${baseUrl}/task-status/{task_id}`,
        description: (
            <>
                Checks the status of a background test task and returns JTL, PDF and performance summary once complete.<br /><br />
                Use the returned <code>result_file</code> and <code>pdf_file</code> with <code>/download/&lt;filename&gt;</code> to retrieve files.
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            pathParams: {
                task_id: "Required. Task ID returned from /run-test.",
            },
        },
        response: {
            status: "success",
            result_file: "result_2025-08-06.jtl",
            pdf_file: "analysis_2025-08-06.pdf",
            summary_output: {
                averageLatency: 123,
                errorPercentage: 0.5,
                throughput: 4500,
            },
        },
    },
    {
        title: "Analyze JTL File",
        method: "POST",
        path: `${baseUrl}/analyzeJTL`,
        description: (
            <>
                Analyzes a KickLoad <strong>.jtl</strong> result file and generates a PDF report.<br />
                Use the JTL filename returned from <code>/task-status</code> or <code>/cra-line</code>.
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            body: {
                filename: "filename.jtl",
            },
        },
        response: {
            filename: "analysis.pdf",
            message: "PDF generated successfully.",
        },
    },
    {
        title: "Compare JTL Files",
        method: "POST",
        path: `${baseUrl}/compare-jtls`,
        description: (
            <>
                Compares two or more <strong>.jtl</strong> test result files using AI and returns a comparative analysis as PDF.
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            body: {
                filenames: ["file1.jtl", "file2.jtl"],
            },
        },
        response: {
            filename: "compare_result.pdf",
            status: "success",
        },
    },
    {
        title: "Download File",
        method: "GET",
        path: `${baseUrl}/download/{filename}?mode=attachment|inline`,
        description: (
            <>
                Downloads any file (JMX, JTL, PDF) by filename.<br /><br />
                <span className="flex items-center">
                    <FaThumbtack className="mr-1 text-blue-500" />
                    <strong>Use filenames returned from /task-status, /analyzeJTL, or /compare-jtls.</strong>
                </span>
                <span className="flex items-center">
                    <FaThumbtack className="mr-1 text-blue-500" />
                    <strong>Ensure correct filename with user prefix if required.</strong>
                </span><br />
                Default mode is <code>attachment</code>. Use <code>inline</code> to preview in browser.
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            pathParams: {
                filename: "Required. Exact filename to download.",
            },
            queryParams: {
                mode: "Optional. 'attachment' (default) or 'inline'",
            },
        },
        response: {
            status: "success",
            download_url: "https://s3.amazonaws.com/bucket/...signed_url...",
        },
    },
    {
        title: "Unified CRA Pipeline",
        method: "POST",
        path: `${baseUrl}/cra-line`,
        description: (
            <>
                Runs the full pipeline: generate test plan → run test → wait → analyze JTL → return all outputs.<br /><br />
                <span className="flex items-center">
                    <FaExclamationTriangle className="mr-1 text-yellow-500" />
                    <strong>Use multipart/form-data.</strong>
                </span><br />
                Fields <code>prompt</code>, <code>file</code>, and <code>data</code> are optional, but <strong>prompt</strong> or <strong>file</strong> is required.<br />
                <strong>Body options can be passed as form-data or JSON.</strong>
            </>
        ),
        request: {
            headers: { "X-API-Token": "<API_TOKEN>" },
            formData: {
                prompt: "Optional prompt",
                file: "Optional JMX file",
                data: "Optional dataset file",
                num_threads: 100,
                loop_count: 10,
                ramp_time: 5,
            },
        },
        response: {
            analysis_pdf_filename: "analysis.pdf",
            jmx_filename: "testplan.jmx",
            jtl_filename: "testresult.jtl",
            jtl_pdf_filename: "testresult.pdf",
            message: "Full test pipeline completed",
            status: "success",
        },
    },
];



export default function ApiDocsPage() {
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedType, setCopiedType] = useState(null);

    const handleCopy = (text, index, type) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setCopiedType(type);
        setTimeout(() => {
            setCopiedIndex(null);
            setCopiedType(null);
        }, 2000);
    };

    return (
        <div className="min-h-screen px-6 sm:px-12 py-6 relative overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 opacity-80"></div>
            <div className="max-w-6xl mx-auto relative z-10">
                <h1 className="text-4xl font-extrabold text-center mb-12 text-white drop-shadow">
                    KickLoad API Documentation
                </h1>

                <div className="space-y-12">
                    {apiEndpoints.map((api, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 shadow-md rounded-lg p-6 relative"
                        >
                            <h2 className="text-xl font-bold mb-2 text-blue-700">{api.title}</h2>
                            <div className="text-sm text-gray-700 mb-4">{api.description}</div>

                            <div className="mb-4 text-sm">
                                <span className="inline-block font-bold text-green-700 mr-2">
                                    {api.method}
                                </span>
                                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    {api.path}
                                </code>
                            </div>

                            {/* Request */}
                            <div className="mb-4 relative">
                                <h3 className="font-semibold text-gray-700 mb-1 flex items-center justify-between">
                                    Example Request
                                    <button
                                        onClick={() =>
                                            handleCopy(JSON.stringify(api.request, null, 2), index, "request")
                                        }
                                        title="Copy Request"
                                        style={{ all: "unset" }}
                                        className="ml-2 !text-blue-500 !hover:text-blue-700 !cursor-pointer"
                                    >
                                        <FaRegCopy size={18} />
                                    </button>
                                </h3>
                                <pre className="bg-gray-900 text-white p-4 rounded text-sm overflow-x-auto">
                                    {JSON.stringify(api.request, null, 2)}
                                </pre>
                                {copiedIndex === index && copiedType === "request" && (
                                    <span className="absolute top-1 right-10 text-green-500 text-xs font-medium">
                                        Copied!
                                    </span>
                                )}
                            </div>

                            {/* Response */}
                            <div className="relative">
                                <h3 className="font-semibold text-gray-700 mb-1 flex items-center justify-between">
                                    Example Response

                                </h3>
                                <pre className="bg-gray-800 text-white p-4 rounded text-sm overflow-x-auto">
                                    {JSON.stringify(api.response, null, 2)}
                                </pre>
                                {copiedIndex === index && copiedType === "response" && (
                                    <span className="absolute top-[2.8rem] right-10 text-green-500 text-xs font-medium">
                                        Copied!
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
