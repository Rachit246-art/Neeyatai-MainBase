import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { KeyRound, Trash2, PlusCircle, FileCode2, ClipboardCopy } from "lucide-react";
import {
    TokenModal,
    ErrorModal,
    SuccessModal,
    ConfirmDeleteModal
} from "../components/ApiModal";
import { FaEye, FaEyeSlash, FaRegClipboard, FaClipboardCheck } from "react-icons/fa";



function ApiIntegration() {
    const [apiInfo, setApiInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [modal, setModal] = useState({ open: false, type: "", data: null });
    const [visible, setVisible] = useState(false);


    useEffect(() => {
        fetchToken();
    }, []);

    const fetchToken = async () => {
        try {
            const res = await axiosInstance.get("/api-token");
            setApiInfo(res.data);
        } catch {
            setApiInfo(null);
        }
    };

    const generateToken = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.post("/generate-api-token");
            setApiInfo(res.data);
            setModal({ open: true, type: "token", data: { token: res.data.api_token } });
        } catch (err) {
            setModal({
                open: true,
                type: "error",
                data: { message: err?.response?.data?.error || "Failed to generate token." }
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteToken = async () => {
        setModal({
            open: true,
            type: "confirm-delete",
            data: {},
            onConfirm: async () => {
                setModal({ open: false, type: "", data: null });
                setLoading(true);
                try {
                    await axiosInstance.post("/revoke-api-token");
                    setApiInfo(null);
                    setModal({
                        open: true,
                        type: "success",
                        data: { message: "API token deleted successfully." }
                    });
                } catch {
                    setModal({
                        open: true,
                        type: "error",
                        data: { message: "Failed to delete token." }
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleCopy = () => {
        if (apiInfo?.api_token) {
            navigator.clipboard.writeText(apiInfo.api_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div className="min-h-screen z-50 mt-6 ml-2 p-[clamp(24px,5vw,48px)] font-[Poppins,Inter,'Segoe UI',Arial,sans-serif]">
            <h1 className="text-[clamp(1.5rem,7vw,2.2rem)] font-black text-orange-500 tracking-wide break-words">
                API Integration
            </h1>
            <p className="text-[clamp(1rem,3vw,1.2rem)] font-semibold ml-[0.8px] text-gray-800 opacity-75 mt-1 break-words">
                Manage your API key and explore developer tools.
            </p>

            <div className="absolute inset-0 border border-orange-200 rounded-2xl -z-10" />

            <div className="flex justify-end mb-6">
                <a
                    href="/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition duration-200"
                >
                    <FileCode2 className="w-4 h-4 mr-2" />
                    Open API Docs
                </a>
            </div>

            <div className="bg-white/70 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <KeyRound className="text-orange-500 w-5 h-5" />
                    <h4 className="text-lg font-semibold text-gray-800">Your API Key</h4>
                </div>

                {apiInfo ? (
                    <>
                        <div className="relative group">
                            <div className="bg-gray-100 text-gray-800 text-sm p-3 rounded-md font-mono break-all pr-10 flex items-center justify-between border border-gray-300">
                                <span>
                                    {visible ? apiInfo.api_token : "•".repeat(20)}
                                </span>
                                <div className="flex items-center gap-4 ml-auto">

                                    <button
                                        onClick={() => setVisible(!visible)}
                                        className="!text-gray-600 !hover:text-gray-800 !transition"
                                        title={visible ? "Hide token" : "Show token"}
                                    >
                                        {visible ? <FaEyeSlash /> : <FaEye />}
                                    </button>

                                    <button
                                        onClick={handleCopy}
                                        className="!text-gray-500 !hover:text-gray-700 !transition"
                                        title="Copy API Key"
                                    >
                                        {copied ? <FaClipboardCheck className="w-5 h-5" /> : <FaRegClipboard className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {visible && (
                                <div className="text-xs text-yellow-700 bg-yellow-100 border border-yellow-300 p-2 rounded mt-1">
                                    <strong>Warning:</strong> Do not share your API key with anyone. It grants access to your account.
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-gray-600 mt-3 ml-1">
                            <p><strong>Created:</strong> {new Date(apiInfo.created_at).toLocaleString()}</p>
                            <p><strong>Valid Until:</strong> {new Date(apiInfo.valid_until).toLocaleString()}</p>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => modal.onConfirm ? modal.onConfirm() : deleteToken()}
                                disabled={loading}
                                className="!px-4 !py-2 !bg-red-500 !hover:bg-red-600 !text-white !rounded-lg flex items-center gap-2 !text-sm !transition"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Key
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-sm text-gray-700">
                        You haven't generated an API key yet.
                    </div>
                )}


                {!apiInfo && (
                    <div className="mt-4">
                        <button
                            onClick={generateToken}
                            disabled={loading}
                            className="!px-4 !py-2 !bg-orange-500 !hover:bg-orange-600 !text-white !rounded-lg flex items-center gap-2 !text-sm !transition"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Generate API Key
                        </button>
                    </div>
                )}
            </div>

            {/* Modal rendered globally */}
            <TokenModal
                open={modal.type === "token" && modal.open}
                token={modal.data?.token}
                onClose={() => setModal({ open: false, type: "", data: null })}
            />

            <ErrorModal
                open={modal.type === "error" && modal.open}
                message={modal.data?.message}
                onClose={() => setModal({ open: false, type: "", data: null })}
            />

            <SuccessModal
                open={modal.type === "success" && modal.open}
                message={modal.data?.message}
                onClose={() => setModal({ open: false, type: "", data: null })}
            />

            <ConfirmDeleteModal
                open={modal.type === "confirm-delete" && modal.open}
                onClose={() => setModal({ open: false, type: "", data: null })}
                onConfirm={modal.onConfirm}
            />



        </div>
    );
}

export default ApiIntegration;
