import React, { useState, useRef, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Send, User, Bot, MessageSquare } from "lucide-react";
import { FaFileUpload, FaTimes } from "react-icons/fa";
import StatusModal from '../components/StatusModal';
import { PdfActionModal, FileViewerModal } from '../components/PdfActionModal';

const CHAT_KEY = "gatling-chat-history";

const GatlingTestGeneration = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      type: "bot",
      text: `👋 Welcome to Gatling Test Generator!

I help you generate Gatling Scala test scripts for load and performance testing — just describe your test in plain English!

💡 You can also type:
• 'help' — for full instructions & test format
• 'upload scala' — to learn how to upload existing Scala files
• 'clear' or 'reset' — to restart the chat anytime

🚀 Just type your test idea to begin.`,
    },
  ]);
  const [scalaFilename, setScalaFilename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, message: "", type: "info" });
  const [containerHeight, setContainerHeight] = useState(100);
  const [rows, setRows] = useState(2);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [scalaActionModal, setScalaActionModal] = useState({ open: false, filename: "" });
  const [scalaViewer, setScalaViewer] = useState({ open: false, content: "", filename: "" });

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const lastUserMessageRef = useRef(null);
  const fileInputScalaRef = useRef(null);

  const lineHeight = 24;
  const baseRows = 2;
  const maxRows = 3;

  // Auto-scroll to last user message
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.rows = baseRows;
        const scrollHeight = textareaRef.current.scrollHeight;
        const currentRows = Math.floor(scrollHeight / lineHeight);

        if (currentRows > maxRows) {
          setRows(maxRows);
          setContainerHeight(lineHeight * maxRows + 52);
          textareaRef.current.style.overflowY = 'auto';
        } else if (currentRows > baseRows) {
          setRows(maxRows);
          setContainerHeight(lineHeight * maxRows + 52);
          textareaRef.current.style.overflowY = 'hidden';
        } else {
          setRows(baseRows);
          setContainerHeight(lineHeight * baseRows + 52);
          textareaRef.current.style.overflowY = 'hidden';
        }
        textareaRef.current.style.height = `${lineHeight * Math.min(currentRows, maxRows)}px`;
      }
    });
  };

  const handleLocalBotReply = (msg) => {
    const lower = msg.toLowerCase();

    if (lower.includes("help")) {
      return `🧠 Here's how to use Gatling Test Generator:

Describe your test in plain English.

💬 Examples:
• Test POST http://api.example.com/login with 100 users
• Simulate 500 users sending GET https://example.com/products
• Run a load test on https://shop.example.com with 200 users

🧾 Your prompt should include:
• ✅ Full URL (e.g., https://api.example.com)
• ✅ HTTP method (GET, POST, PUT, etc.)
• ✅ Endpoint (e.g., /login)
• ✅ Number of users (e.g., 100 users)

📎 Optional:
• 🛠 Upload a .scala file to fix, extend, or enhance an existing Gatling test script.

🛡️ Your data is safe. Credentials and sensitive test inputs are never shared.`;
    }

    if (lower.includes("upload scala")) {
      return `🧾 Upload a .scala file to improve, fix, or convert it into a valid Gatling test script.

After uploading, you can:
• Ask to fix or clean it (e.g., "Fix this Scala script and make it ready to run")
• Add or change something (e.g., "Add login request" or "Change user count to 1000")

❗ Don't describe a new test from scratch — that will reset your uploaded file.
Focus on what you'd like to fix, improve, or add to the existing script.`;
    }

    if (lower === "clear" || lower === "reset") {
      setChat([
        {
          type: "bot",
          text: `👋 Welcome to Gatling Test Generator!

I help you generate Gatling Scala test scripts for load and performance testing — just describe your test in plain English!

💡 You can also type:
• 'help' — for full instructions & test format
• 'upload scala' — to learn how to upload existing Scala files
• 'clear' or 'reset' — to restart the chat anytime

🚀 Just type your test idea to begin.`,
        },
      ]);
      setAttachedFile(null);
      return "";
    }

    return null;
  };

  const handleSend = async () => {
    if (!message.trim() && !attachedFile) return;

    let userMessage = "";
    if (message.trim() && attachedFile) {
      userMessage = `${message.trim()} with file: ${attachedFile.name}`;
    } else if (message.trim()) {
      userMessage = message.trim();
    } else if (attachedFile) {
      userMessage = `Uploaded file: ${attachedFile.name}`;
    }

    const newMessages = [
      { type: "user", text: userMessage },
      { type: "bot", text: "⚡ Generating your Gatling test script... This should take about 10-15 seconds..." },
    ];
    setChat([...chat, ...newMessages]);
    setMessage("");
    setContainerHeight(lineHeight * baseRows + 52);

    const localResponse = handleLocalBotReply(message.trim());
    if (localResponse !== null) {
      if (localResponse !== "") {
        const updatedChat = [...chat, ...newMessages.slice(0, 1), { type: "bot", text: localResponse }];
        setChat(updatedChat);
      }
      return;
    }

    setIsLoading(true);
    setDownloadReady(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = `${lineHeight * baseRows}px`;
      textareaRef.current.style.overflowY = "hidden";
    }

    try {
      let response;
      
      if (attachedFile) {
        // Send as FormData when file is attached
        const formData = new FormData();
        if (message.trim()) {
          formData.append("prompt", message.trim());
        }
        formData.append("file", attachedFile);
        
        response = await axiosInstance.post("/generate-gatling-test", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Send as JSON when no file
        response = await axiosInstance.post("/generate-gatling-test", {
          prompt: message.trim()
        });
      }

      const updatedChat = [...chat, ...newMessages];
      const lastBotIdx = updatedChat.map((m) => m.type).lastIndexOf("bot");

      if (response.data.status === "success") {
        const filename = response.data.scala_filename;
        if (lastBotIdx !== -1) {
          updatedChat[lastBotIdx] = {
            type: "bot",
            text: response.data.message || "✅ Gatling test script generated successfully!",
          };
        }
        setChat(updatedChat);
        setScalaFilename(filename);
        setDownloadReady(true);
        setAttachedFile(null);
        setScalaActionModal({ open: true, filename });
      } else {
        if (lastBotIdx !== -1) {
          updatedChat[lastBotIdx] = {
            type: "bot",
            text: response.data.message || "❌ Failed to generate Gatling test script.",
          };
        }
        setChat(updatedChat);
      }
    } catch (error) {
      const updatedChat = [...chat, ...newMessages];
      const lastBotIdx = updatedChat.map((m) => m.type).lastIndexOf("bot");

      if (lastBotIdx !== -1) {
        let errorMsg = String(error.response?.data?.message || error.message || 'Unknown error');
        errorMsg = errorMsg.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]');
        
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
      setAttachedFile(null);
    }
  };

  const handleDownload = async () => {
    if (!scalaFilename) return;
    
    try {
      const res = await axiosInstance.get(`/download/${scalaFilename}`);
      if (res.data.status === "success" && res.data.download_url) {
        window.open(res.data.download_url, "_blank");
      } else {
        setStatusModal({ open: true, message: res.data.message || "Failed to get download URL.", type: 'error' });
      }
    } catch (error) {
      console.error("Download error:", error);
      setStatusModal({ open: true, message: 'Error downloading file.', type: 'error' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadClick = () => {
    setShowUploadMenu((prev) => !prev);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (fileExt !== '.scala') {
      setStatusModal({ open: true, message: 'Only Scala files (.scala) are allowed', type: 'info' });
      return;
    }

    if (attachedFile) {
      setStatusModal({ open: true, message: 'Only one Scala file can be uploaded at a time.', type: 'info' });
      return;
    }

    setAttachedFile(file);
    setShowUploadMenu(false);
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleViewFile = async (filename) => {
    try {
      const res = await axiosInstance.get(`/download/${filename}`);
      if (res.data.status === 'success' && res.data.download_url) {
        const fileRes = await fetch(res.data.download_url);
        const fileText = await fileRes.text();
        setScalaViewer({ open: true, content: fileText, filename });
      } else {
        setScalaViewer({ open: true, content: 'Failed to get file download URL.', filename });
      }
    } catch (err) {
      setScalaViewer({ open: true, content: 'Failed to load file content.', filename });
    }
  };

  const safeChat = Array.isArray(chat) ? chat : [];
  const lastUserIndex = [...safeChat].reverse().findIndex(msg => msg.type === "user");
  const lastUserMessageIdx = lastUserIndex !== -1 ? safeChat.length - 1 - lastUserIndex : -1;

  return (
    <>
      <StatusModal
        open={statusModal.open}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal({ open: false, message: "", type: "info" })}
      />

      <PdfActionModal
        open={scalaActionModal.open}
        filename={scalaActionModal.filename}
        title="Gatling Test Script Created!"
        onClose={() => setScalaActionModal({ open: false, filename: "" })}
        onView={async () => {
          await handleViewFile(scalaActionModal.filename);
          setScalaActionModal({ open: false, filename: "" });
        }}
        onRename={() => {
          // Rename functionality can be added later if needed
          setStatusModal({ open: true, message: "Rename feature coming soon!", type: "info" });
          setScalaActionModal({ open: false, filename: "" });
        }}
        onDownload={async () => {
          await handleDownload(scalaActionModal.filename);
          setScalaActionModal({ open: false, filename: "" });
        }}
        onDelete={() => {
          // Delete functionality can be added later if needed
          setStatusModal({ open: true, message: "Delete feature coming soon!", type: "info" });
          setScalaActionModal({ open: false, filename: "" });
        }}
      />

      <FileViewerModal
        open={scalaViewer.open}
        title={`Viewing: ${scalaViewer.filename}`}
        content={scalaViewer.content}
        onClose={() => setScalaViewer({ open: false, content: "", filename: "" })}
      />

      <div style={{
        width: '100%',
        maxWidth: '100%',
        flex: 1,
        margin: 0,
        padding: 'clamp(4px,2vw,24px) clamp(4px,2vw,24px) clamp(24px,4vw,40px)',
        boxSizing: 'border-box',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'auto',
        position: 'relative'
      }}>
        
        <div style={{
          width: '100%',
          position: 'relative',
          zIndex: 1,
          marginBottom: 'clamp(0px,1vw,32px)',
          background: 'transparent',
          borderRadius: '16px',
          color: '#FF6D00',
          padding: 'clamp(18px,5vw,40px) clamp(8px,4vw,32px) clamp(12px,3vw,32px)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            fontSize: 'clamp(1.5rem,7vw,2.2rem)',
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: '#FF6D00',
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}>
            Gatling Test Generator
          </div>
          <div style={{
            fontSize: 'clamp(1rem,3vw,1.2rem)',
            marginLeft: '4px',
            fontWeight: 700,
            color: '#333333',
            opacity: 0.85,
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}>
            Generate Gatling Scala test scripts with AI!
          </div>
        </div>

        <div style={{
          marginTop: '-15px',
          marginLeft: '32px',
          maxWidth: 'calc(100% - 32px)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'hidden',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.05)',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '-10px',
              gap: '8px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#FF6D00',
              marginBottom: '16px'
            }}>
              <MessageSquare size={18} style={{ marginRight: '8px' }} />
              Gatling Test Generator
            </div>
            <hr style={{
              border: 'none',
              borderTop: '1px solid #E0E0E0',
              margin: '16px 0'
            }} />

            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                scrollBehavior: 'smooth',
                minHeight: 0,
                maxHeight: '100%',
                background: '#FAFAFA',
                borderRadius: '12px',
                marginBottom: '16px'
              }}
            >
              {safeChat.map((msg, idx) => (
                <div
                  key={idx}
                  ref={msg.type === "user" && idx === lastUserMessageIdx ? lastUserMessageRef : null}
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.type === "user" ? '#FF6D00' : '#FFFFFF',
                    color: msg.type === "user" ? '#FFFFFF' : '#333333',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    maxWidth: msg.type === "user" ? '80%' : '100%',
                    marginLeft: msg.type === "user" ? 'auto' : '0',
                    marginRight: msg.type === "user" ? '0' : 'auto'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: 0.9
                  }}>
                    {msg.type === "user" ? <User size={16} /> : <Bot size={16} />}
                    {msg.type === "user" ? "You" : "Assistant"}
                  </div>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '15px',
                    lineHeight: 1.5
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <hr style={{
              border: 'none',
              borderTop: '1px solid #E0E0E0',
              margin: '16px 0'
            }} />

            {/* File upload chip */}
            {attachedFile && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
                marginLeft: 0,
                maxWidth: 420,
                flexWrap: 'wrap',
              }}>
                <div style={{
                  background: 'rgba(255,122,0,0.08)',
                  color: '#FF6D00',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  border: '1px solid #FF6D00',
                }}>
                  <FaFileUpload style={{ fontSize: 15, marginRight: 2 }} />
                  {attachedFile.name.length > 25 ? attachedFile.name.slice(0, 22) + '...' : attachedFile.name}
                  <FaTimes
                    style={{ cursor: 'pointer', marginLeft: 4, fontSize: 13 }}
                    onClick={handleRemoveFile}
                    title="Remove file"
                  />
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputScalaRef}
              style={{ display: 'none' }}
              accept=".scala"
              onChange={handleFileChange}
            />

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
                  color: '#333333',
                  lineHeight: `${lineHeight}px`,
                  overflowY: rows === maxRows ? 'auto' : 'hidden',
                  height: `${lineHeight * rows}px`,
                }}
                placeholder="Describe your Gatling test scenario or upload a .scala file..."
                disabled={isLoading}
              />

              <div
                style={{
                  flex: 0.25,
                  height: '30%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {/* Upload button */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={attachedFile !== null}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      padding: 0,
                      margin: 0,
                      cursor: attachedFile ? 'not-allowed' : 'pointer',
                      opacity: attachedFile ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!attachedFile) {
                        e.currentTarget.style.background = 'rgba(255, 122, 0, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <FaFileUpload size={20} color="#FF6D00" />
                  </button>

                  {/* Upload dropdown menu */}
                  {showUploadMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '50px',
                      left: 0,
                      background: '#FFFFFF',
                      borderRadius: 12,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      padding: '8px 0',
                      minWidth: 180,
                      zIndex: 1000,
                      border: '1px solid #E0E0E0'
                    }}>
                      <button
                        onClick={() => {
                          fileInputScalaRef.current?.click();
                          setShowUploadMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: 15,
                          color: '#333333',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 122, 0, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <FaFileUpload size={16} color="#FF6D00" />
                        Upload Scala file
                      </button>
                    </div>
                  )}
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={isLoading || (!message.trim() && !attachedFile)}
                  style={{
                    background: 'linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(255, 109, 0, 0.25)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    cursor: isLoading || (!message.trim() && !attachedFile) ? 'not-allowed' : 'pointer',
                    opacity: isLoading || (!message.trim() && !attachedFile) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GatlingTestGeneration;
