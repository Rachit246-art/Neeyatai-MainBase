// ApiModal.jsx
import ReactDOM from "react-dom";
import { IoMdClose } from "react-icons/io";
import { FaKey, FaCheckCircle, FaExclamationCircle, FaTrashAlt, FaClipboardCheck, FaInfoCircle, FaRegClipboard, FaEye, FaEyeSlash } from "react-icons/fa";
import React, { useState } from "react";



const ModalWrapper = ({ open, onClose, children }) => {
    if (!open) return null;
    return ReactDOM.createPortal(
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button
                    onClick={onClose}
                    style={styles.closeButton}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#CBD5E1';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#E2E8F0';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <IoMdClose size={22} color="black" />

                </button>
                {children}
            </div>
            <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; backdrop-filter: blur(0); }
          to { opacity: 1; backdrop-filter: blur(6px); }
        }
        @keyframes popIn {
          from { transform: scale(0.9) translateY(30px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
        </div>,
        document.body
    );
};


export const TokenModal = ({ open, token, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Header icon={<FaKey />} title="API Token" bg="#6366F1" />
            <div
                style={{
                    ...styles.contentBox,
                    background: "#F1F5F9",
                    color: "#0F172A",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        gap: 10,
                    }}
                >
                    <span style={styles.tokenText}>
                        {visible ? token : "•".repeat(28)}
                    </span>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button style={styles.copyButton} onClick={handleCopy} title="Copy token">
                            {copied ? <FaClipboardCheck /> : <FaRegClipboard />}
                            <span style={{ marginLeft: 8 }}>{copied ? "Copied" : "Copy"}</span>
                        </button>

                        
                    </div>
                </div>

                <div
                    style={{
                        fontSize: 13,
                        color: "#334155",
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <FaInfoCircle style={{ color: "#F59E0B" }} />
                    <span>
                        <strong>Note:</strong> Store this token securely. For security reasons, it's best not to share it or store it in plain text.
                    </span>
                </div>
            </div>
        </ModalWrapper>
    );
};

export const ErrorModal = ({ open, message, onClose }) => (
    <ModalWrapper open={open} onClose={onClose}>
        <Header icon={<FaExclamationCircle />} title="Error" bg="#DC2626" />
        <div style={{ ...styles.contentBox, background: "#FEF2F2", color: "#7F1D1D" }}>
            <span style={styles.tokenText}>{message}</span>
        </div>
    </ModalWrapper>
);

export const SuccessModal = ({ open, message, onClose }) => (
    <ModalWrapper open={open} onClose={onClose}>
        <Header icon={<FaCheckCircle />} title="Success" bg="#22C55E" />
        <div style={{ ...styles.contentBox, background: "#F0FDF4", color: "#14532D" }}>
            <span style={styles.tokenText}>{message}</span>
        </div>
    </ModalWrapper>
);

export const ConfirmDeleteModal = ({ open, onClose, onConfirm }) => (
    <ModalWrapper open={open} onClose={onClose}>
        <Header icon={<FaTrashAlt />} title="Confirm Delete" bg="#F97316" />
        <div style={{ ...styles.contentBox, background: "#FFFBEB", color: "#7C2D12", flexDirection: "column" }}>
            <span style={styles.tokenText}>Are you sure you want to delete your API token?</span>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                <button onClick={onConfirm} style={styles.deleteBtn}>Delete</button>
            </div>
        </div>
    </ModalWrapper>
);

const Header = ({ icon, title, bg }) => (
    <div style={styles.header}>
        <div style={{ ...styles.iconWrapper, background: bg }}>{icon}</div>
        <h2 style={styles.title}>{title}</h2>
    </div>
);

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(20, 22, 34, 0.3)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
        animation: "fadeInBackdrop 0.4s ease-out"
    },
    modal: {
        width: "100%",
        maxWidth: 480,
        background: "#fff",
        borderRadius: 20,
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        animation: "popIn 0.4s ease-out",
        position: "relative"
    },
    closeButton: {
        position: "absolute",
        top: 20,
        right: 20,
        background: "#E2E8F0",
        border: "none",
        borderRadius: "50%",
        width: 40,
        height: 40,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s ease"
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 24
    },
    iconWrapper: {
        color: "#fff",
        borderRadius: "50%",
        padding: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        color: "#1E293B"
    },
    contentBox: {
        padding: "14px 16px",
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid #CBD5E1",
        minHeight: 60
    },
    tokenText: {
        fontSize: 16,
        fontFamily: "monospace",
        overflowWrap: "anywhere"
    },
    copyButton: {
        background: "#4F46E5",
        color: "#fff",
        padding: "8px 16px",
        fontSize: 14,
        borderRadius: 8,
        border: "none",
        fontWeight: 600,
        cursor: "pointer",
        marginLeft: 12,
        transition: "all 0.3s ease"
    },
    cancelBtn: {
        background: "#E5E7EB",
        padding: "8px 16px",
        borderRadius: 8,
        fontWeight: 500,
        cursor: "pointer",
        border: "none"
    },
    deleteBtn: {
        background: "#DC2626",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: 8,
        fontWeight: 500,
        border: "none",
        cursor: "pointer"
    }
};
