import React, { useEffect, useRef } from "react";

import {
    Typography,
    Box,
    Grid,
    Autocomplete,
    TextField,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Assessment,
    Email as EmailIcon,
    History as HistoryIcon,
    Search as SearchIcon,
    PlayArrow as AnalyzeIcon,
} from "@mui/icons-material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { FaDownload, FaEye } from "react-icons/fa";
import axiosInstance from "../api/axiosInstance";
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import ReactDOM from "react-dom";
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
import StatusModal from '../components/StatusModal';
import { BiTestTube } from 'react-icons/bi';
import { DropdownAction } from './TestPlanGeneration';
import { FiDownload, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { PdfActionModal, FileViewerModal } from '../components/PdfActionModal';
import { useAnalysisStore } from '../store/analysisStore';

// Utility to safely format dates
export function formatDateSafe(dateString) {
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

function PdfViewerModal({ open, url, onClose }) {
    if (!open) return null;
    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(20,22,34,0.55)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width: '90vw',
                maxWidth: 900,
                maxHeight: '80vh',
                background: '#fff',
                borderRadius: '18px',
                color: '#222',
                padding: '2rem 1.5rem 1.5rem 1.5rem',
                boxShadow: '0 12px 28px rgba(0,0,0,0.3)',
                borderLeft: '5px solid #FF6D00',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        zIndex: 99999,
                        fontSize: 20,
                        color: '#FF6D00',
                        transition: 'background 0.2s',
                        pointerEvents: 'auto',
                    }}
                    title="Close"
                    onMouseEnter={e => e.currentTarget.style.background = '#FFE0B2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
                >
                    <FaDownload />
                </button>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 14, color: '#FF6D00' }}>PDF File Viewer</div>
                <iframe
                    src={url}
                    title="PDF Viewer"
                    style={{ flex: 1, width: '100%', height: '60vh', border: 'none', borderRadius: 8, background: '#fff' }}
                />
            </div>
        </div>,
        document.body
    );
}

const enhanceHtmlHeadings = (html) => {
    return html.replace(/<h([1-6])([^>]*)>/gi, (match, level, rest) => {
        const sizeMap = {
            '1': '28px',
            '2': '24px',
            '3': '20px',
            '4': '16px',
            '5': '12px',
            '6': '8px',
        };
        const fontSize = sizeMap[level];

        // If font-size already exists in style
        if (/style=['"][^'"]*?font-size[^'"]*?['"]/.test(rest)) {
            return `<h${level}${rest}>`;
        }

        // If a style attribute exists, append font-size
        const updatedRest = rest.replace(/style=['"]([^'"]*)['"]/, (_, s) => {
            return `style="${s}; font-size: ${fontSize} !important"`;
        });

        if (updatedRest !== rest) {
            return `<h${level}${updatedRest}>`;
        } else {
            // No style attribute at all
            return `<h${level} style="font-size: ${fontSize} !important"${rest}>`;
        }
    });
};

function IntelligentTestAnalysis() {
    // Replace useState with Zustand store hooks
    const {
        selectedFilename, setSelectedFilename,
        pdfFilename, setPdfFilename,
        analyzing, setAnalyzing,
        history, setHistory,
        searchQuery, setSearchQuery,
        availableFiles, setAvailableFiles,
        modal, setModal,
        pdfActionModal, setPdfActionModal,
        htmlReport, setHtmlReport,
        pdfUrl, setPdfUrl,
        fetchJtlFiles,          // ✅ add this
        fetchPdfHistory         // ✅ add this
    } = useAnalysisStore();

    const dropdownRef = useRef(null);
    const resultsRef = useRef(null);
    const modalRef = useRef(null);
    const [statusModal, setStatusModal] = React.useState({ open: false, message: '', type: 'info' });
    const [openMenuIndex, setOpenMenuIndex] = React.useState(null);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
    const [pdfViewer, setPdfViewer] = React.useState({ open: false, url: '' });

    useEffect(() => {
        if (!availableFiles.length) fetchJtlFiles();
        if (!history.length) fetchPdfHistory();
    }, [availableFiles.length, history.length]);

    const handleAnalyze = async () => {
        if (!selectedFilename) {
            setStatusModal({ open: true, message: 'Please select a JTL file to analyze', type: 'info' });
            return;
        }

        setAnalyzing(true);
        setPdfFilename(null);
        setPdfUrl(null);
        try {
            const res = await axiosInstance.post("/analyzeJTL", {
                filename: selectedFilename,
            });
            if (res.data.error) throw new Error(res.data.error);

            const filename = res.data.filename;
            setPdfFilename(filename);
            setHtmlReport(enhanceHtmlHeadings(res.data.html_report));

            const downloadRes = await axiosInstance.get(`/download/${filename}`);
            if (downloadRes.data.status === "success" && downloadRes.data.download_url) {
                setPdfUrl(downloadRes.data.download_url);
                fetchPdfHistory();

            } else {
                throw new Error(downloadRes.data.message || "Download URL missing");
            }


            // Add to history
            const now = new Date().toLocaleString();
            setHistory(prev => [{ filename, date: now }, ...prev]);
            setPdfActionModal({ open: true, filename });

        } catch (err) {
            setStatusModal({ open: true, message: 'Analysis failed: ' + (err.response?.data?.error || err.message), type: 'error' });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDownload = async (filename) => {
        try {
            const res = await axiosInstance.get(`/download/${filename}`);
            if (res.data.status === "success" && res.data.download_url) {
                window.open(res.data.download_url, "_blank");

            } else {
                setStatusModal({ open: true, message: res.data.message || "Failed to get download URL.", type: 'error' });
            }
        } catch (error) {
            setStatusModal({ open: true, message: 'Error downloading file.', type: 'error' });
        }
    };

    const handleEmail = async () => {
        if (!pdfFilename || !pdfFilename.endsWith(".pdf")) {
            setStatusModal({ open: true, message: 'Please analyze a file first.', type: 'info' });
            return;
        }
        if (!htmlReport) {
            setStatusModal({ open: true, message: 'No HTML report content available. Please re-run analysis.', type: 'info' });
            return;
        }

        try {
            const res = await axiosInstance.post("/sendEmail", {
                filename: pdfFilename,
                html_report: htmlReport,  // Include HTML in the email request
            });

            if (res.data.success) {
                setStatusModal({ open: true, message: 'Email sent successfully!', type: 'success' });
            } else {
                setStatusModal({ open: true, message: 'Failed to send email.', type: 'error' });
            }
        } catch (err) {
            setStatusModal({ open: true, message: 'Failed to send email: ' + (err.response?.data?.error || err.message), type: 'error' });
        }
    };

    // Menu system handlers
    const handleMenuAction = (action, filename, idx) => {
        setOpenMenuIndex(null);

        if (action === 'download') {
            setModal({ open: true, type: 'download', filename });
        } else if (action === 'edit') {
            const [base, ext] = filename.split(/\.(?=[^\.]+$)/);
            const prefix = 'analysis_';

            if (!base.startsWith(prefix)) {
                setStatusModal({
                    open: true,
                    message: 'Only files starting with analysis_ are allowed to be renamed.',
                    type: 'info',
                });
                return;
            }

            const editableName = base.slice(prefix.length); // Strip locked prefix



            setModal({
                open: true,
                type: 'edit',
                filename,
                newName: editableName,
                extension: ext,
                prefix,
                isLockedPrefix: true,
            });
        } else if (action === 'delete') {
            setModal({ open: true, type: 'delete', filename });
        }
    };

    const handleModalConfirm = async () => {


        if (modal.type === 'download') {
            await handleDownload(modal.filename);
        }

        else if (modal.type === 'edit') {


            if (!modal.newName || modal.newName.trim() === '') {
                setStatusModal({ open: true, message: 'Filename cannot be empty.', type: 'info' });
                return;
            }

            const inputName = modal.newName.trim();

            // ❌ Warn if user tries to include an extension manually
            if (/\.[^/.]+$/.test(inputName)) {
                setStatusModal({
                    open: true,
                    message: 'Please do not include the extension. It will be added automatically.',
                    type: 'info',
                });
                return;
            }

            const currentFullName = modal.filename;
            const newFullName = `${modal.isLockedPrefix ? modal.prefix : ''}${inputName}.${modal.extension}`;



            // ✅ Skip API if name is unchanged
            if (newFullName === currentFullName) {
                setModal({ open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false });
                return;
            }

            try {
                const res = await axiosInstance.post('/rename-file', {
                    old_name: currentFullName,
                    new_name: newFullName,
                });

                if (res.data.status === 'success') {
                    setStatusModal({ open: true, message: 'File renamed successfully.', type: 'success' });
                    setPdfFilename(newFullName)
                    // Refresh history
                    const res2 = await axiosInstance.get("/list-files?type=pdf&filter_prefix=analysis_");
                    if (Array.isArray(res2.data)) {
                        const formatted = res2.data.map(f => ({
                            filename: f.filename,
                            date: formatDateSafe(f.datetime),
                        }));
                        setHistory(formatted);
                    }
                } else {
                    setStatusModal({ open: true, message: res.data.error || 'Failed to rename file.', type: 'error' });
                }
            } catch (err) {
                setStatusModal({ open: true, message: err.response?.data?.error || 'Rename failed.', type: 'error' });
            }
        }

        else if (modal.type === 'delete') {
            try {
                const res = await axiosInstance.post('/delete-file', {
                    filename: modal.filename
                });

                if (res.data.status === 'success') {
                    setStatusModal({ open: true, message: 'File deleted successfully.', type: 'success' });
                    setPdfFilename(null)
                    setHtmlReport(null)
                    // Refresh history
                    const res2 = await axiosInstance.get("/list-files?type=pdf&filter_prefix=analysis_");
                    if (Array.isArray(res2.data)) {
                        const formatted = res2.data.map(f => ({
                            filename: f.filename,
                            date: formatDateSafe(f.datetime),
                        }));
                        setHistory(formatted);
                    }
                } else {
                    setStatusModal({ open: true, message: res.data.error || 'Failed to delete file.', type: 'error' });
                }
            } catch (error) {
                setStatusModal({ open: true, message: error.response?.data?.error || 'Error deleting file.', type: 'error' });
            }
        }

        // ✅ Always reset modal
        setModal({ open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false });
    };

    const handleModalCancel = () => setModal({
        open: false,
        type: '',
        filename: '',
        newName: '',
        extension: '',
        prefix: '',
        isLockedPrefix: false,
    });

    // Handler to open menu and set its position
    const handleMenuOpen = (e, index) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + window.scrollY + 4, // 4px gap
            left: rect.right - 140 + window.scrollX // align right edge, menu width ~140px
        });
        setOpenMenuIndex(index);
    };

    // Click outside handler
    React.useEffect(() => {
        function handleClickOutside(event) {
            // Handle dropdown menu clicks
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenMenuIndex(null);
            }

            // Handle modal clicks
            if (modal.open && modalRef.current && !modalRef.current.contains(event.target)) {
                setModal({ open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false });
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [modal.open]);


    // Defensive fallback: always use array
    const filteredHistory = (Array.isArray(history) ? history : []).filter(item =>
        item.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewPdfFile = async (filename) => {
        try {
            const res = await axiosInstance.get(`/download/${filename}?mode=inline`);

            if (res.data.status === "success" && res.data.download_url) {
                setPdfViewer({
                    open: true,
                    fileUrl: res.data.download_url, // For iframe preview
                    filename,
                    content: '', // Not used here
                });
            } else {
                setStatusModal({
                    open: true,
                    message: res.data.message || "Failed to fetch file URL.",
                    type: 'error',
                });
            }
        } catch (error) {
            setStatusModal({
                open: true,
                message: 'Error fetching file URL.',
                type: 'error',
            });
        }
    };

    return (
        <>
            <style>{`
        body {
          background: linear-gradient(to bottom, #FFE9D0, #FFF3E0);
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .enhanced-bg {
          min-height: 100vh;
          background: linear-gradient(to bottom, #FFE9D0, #FFF3E0);
          font-family: var(--tp-font);
          color: var(--tp-text);
          display: flex;
          flex-direction: column;
          align-items: center;
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

        /* styles.css or equivalent */
        .card-no-blur-hover {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }


        /* Comment out the breakage */
        @media (max-width: 1400px) {
          .tp-main {
            max-width: 95vw !important;
            margin: 0 auto !important;
          }
        
        }

        @media (max-width: 1200px) {
          .tp-main {
            max-width: 100vw !important;
            padding: clamp(20px, 3vw, 32px) clamp(12px, 2vw, 16px) !important;
          }
          
        }

        @media (max-width: 900px) {
          .tp-main {
            padding: clamp(16px, 4vw, 24px) clamp(8px, 2vw, 12px) !important;
          }
          .MuiGrid-container {
            gap: clamp(10px, 2vw, 16px) !important;
          }
          .MuiGrid-item {
            padding: clamp(10px, 2vw, 14px) !important;
          }
          .MuiTypography-h6 {
            font-size: clamp(16px, 4vw, 20px) !important;
          }
        }
        @media (max-width: 768px) {
          .tp-main {
            padding: clamp(12px, 3vw, 16px) clamp(4px, 2vw, 8px) !important;
          }
          .MuiGrid-container {
            gap: clamp(8px, 2vw, 12px) !important;
          }
          .MuiGrid-item {
            padding: clamp(8px, 2vw, 12px) !important;
          }
          .MuiTypography-h6 {
            font-size: clamp(14px, 5vw, 18px) !important;
          }
          .MuiButton-root {
            font-size: clamp(12px, 3vw, 14px) !important;
            padding: clamp(8px, 2vw, 12px) !important;
          }
        }
        @media (max-width: 600px) {
          .tp-main {
            padding: clamp(10px, 2vw, 14px) clamp(2px, 2vw, 6px) !important;
          }
          .MuiGrid-container {
            gap: clamp(6px, 2vw, 10px) !important;
          }
          .MuiGrid-item {
            padding: clamp(6px, 2vw, 10px) !important;
          }
          .MuiTypography-h6 {
            font-size: clamp(13px, 6vw, 16px) !important;
          }
          .MuiButton-root {
            font-size: clamp(11px, 3vw, 13px) !important;
            padding: clamp(6px, 2vw, 10px) !important;
          }
        }
        @media (max-width: 480px) {
          .tp-main {
            padding: clamp(8px, 2vw, 12px) clamp(1px, 2vw, 4px) !important;
          }
          .MuiGrid-container {
            gap: clamp(4px, 2vw, 8px) !important;
          }
          .MuiGrid-item {
            padding: clamp(4px, 2vw, 8px) !important;
          }
          .MuiTypography-h6 {
            font-size: clamp(12px, 7vw, 15px) !important;
          }
          .MuiButton-root {
            font-size: clamp(10px, 3vw, 12px) !important;
            padding: clamp(4px, 2vw, 8px) !important;
          }
        }
        @media (max-width: 360px) {
          .tp-main {
            padding: clamp(6px, 2vw, 10px) clamp(1px, 2vw, 3px) !important;
          }
          .MuiGrid-container {
            gap: clamp(3px, 2vw, 6px) !important;
          }
          .MuiGrid-item {
            padding: clamp(3px, 2vw, 6px) !important;
          }
          .MuiTypography-h6 {
            font-size: clamp(11px, 8vw, 14px) !important;
          }
          .MuiButton-root {
            font-size: clamp(9px, 3vw, 11px) !important;
            padding: clamp(3px, 2vw, 6px) !important;
          }
        }
        /* Unauthenticated user styling */
        button.unauthenticated {
          opacity: 0.6;
          cursor: not-allowed;
        }
        button.unauthenticated:hover {
          background: #ccc !important;
          box-shadow: none !important;
        }
        select.unauthenticated {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .tp-history-list:after {
          content: '';
          display: block;
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 18px;
          pointer-events: none;
          background: none;
        }
        /* Fade-in animation */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>

            <div className="tp-main" style={{
                width: "100%",
                maxWidth: "100vw",
                margin: "0 auto",
                padding: "clamp(12px, 4vw, 32px) clamp(6px, 3vw, 24px) clamp(24px, 4vw, 40px) clamp(6px, 3vw, 24px)",
                position: "relative",
                zIndex: 1,
                boxSizing: "border-box",
                minHeight: "100vh",
                display: 'flex',
                flexDirection: 'column',

                overflowX: 'hidden',
            }}>


                <div className="tp-header" style={{
                    background: "none",
                    borderRadius: "16px",
                    color: "#FF6D00",
                    padding: "clamp(18px, 5vw, 40px) clamp(8px, 4vw, 32px) clamp(12px, 3vw, 32px) clamp(8px, 4vw, 32px)",
                    marginBottom: "clamp(0px, 1vw, 8px)",
                    position: "relative",
                    zIndex: 1,
                    width: '100%',
                    boxSizing: 'border-box',

                }}>
                    <div className="tp-header-title" style={{
                        fontSize: "clamp(1.5rem, 7vw, 2.2rem)",
                        fontWeight: "900",
                        color: "#FF6D00",
                        letterSpacing: "0.5px",
                        whiteSpace: 'normal',
                        overflowWrap: 'break-word',
                    }}>
                        Intelligent Test Analysis
                    </div>
                    <div className="tp-header-desc" style={{
                        fontSize: "clamp(1rem, 3vw, 1.2rem)",
                        fontWeight: "550",
                        fontStyle: "bold",
                        opacity: "0.85",
                        color: "#333333",
                        whiteSpace: 'normal',
                        overflowWrap: 'break-word',
                        marginLeft: 1,
                    }}>
                        Unlocking Insights from KickLoad Test Runs
                    </div>
                </div>

                <div className="relative w-full min-h-screen flex flex-col lg:flex-row gap-4 px-4 lg:px-8 mt-[-10px]">
                    {/* File Action */}
                    <div className="w-full lg:w-[320px] shrink-0">

                        <div
                            className="card-transition card-no-blur-hover"
                            style={{
                                background: "white",
                                border: "1px solid rgba(255, 126, 95, 0.2)",
                                borderRadius: "16px",
                                padding: "24px",
                                boxShadow: "0 8px 24px rgba(255, 153, 102, 0.2)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                marginBottom: "24px",
                                cursor: "default",
                                animation: "fadeInUp 0.5s ease-out",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.015)";
                                e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 153, 102, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 153, 102, 0.2)";
                            }}
                        >
                            <Box
                                display="flex"
                                alignItems="center"
                                mb={1} // margin bottom as per your original 10px
                            >
                                <BiTestTube style={{ marginRight: "8px", color: "#FF6D00", fontSize: "24px" }} />
                                <Typography
                                    variant="h6"
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "700",
                                        color: "#FF6D00",
                                        letterSpacing: "0.2px"
                                    }}
                                >
                                    Analyze JTL File
                                </Typography>
                            </Box>



                            {/* File Selection */}
                            <Autocomplete
                                freeSolo
                                options={availableFiles}
                                value={selectedFilename}
                                onInputChange={(event, newValue) => setSelectedFilename(newValue)}
                                noOptionsText="No files found"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select JTL File"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        InputProps={{
                                            ...params.InputProps,
                                            style: {
                                                background: "#FFFFFF",
                                                borderRadius: "8px",
                                                fontSize: "15px",
                                                marginBottom: "18px",
                                            }
                                        }}
                                    />
                                )}
                                filterOptions={(options, { inputValue }) =>
                                    options.filter((option) =>
                                        option.toLowerCase().includes(inputValue.toLowerCase())
                                    )
                                }
                            />


                            {/* Action Buttons */}
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                style={{
                                    width: "100%",
                                    background: analyzing ? "#ccc" : "#FF6D00",
                                    color: "white",
                                    padding: "12px 24px",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontWeight: "600",
                                    marginBottom: "16px",
                                    cursor: analyzing ? "not-allowed" : "pointer",
                                    boxShadow: "0 4px 12px rgba(255, 109, 0, 0.3)",
                                    transition: "all 0.3s ease-in-out"
                                }}
                            >
                                {analyzing ? "Analyzing..." : "Analyze File"}
                            </button>

                            <div style={{
                                display: "flex",
                                gap: "8px"
                            }}>
                                <button
                                    onClick={() => handleDownload(pdfFilename)}
                                    disabled={!pdfFilename}
                                    style={{
                                        flex: 1,
                                        background: "#FFFFFF",
                                        color: "#FF6D00",
                                        padding: "10px",
                                        border: "1px solid #FF6D00",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: pdfFilename ? "pointer" : "not-allowed",
                                        opacity: pdfFilename ? 1 : 0.5,
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    <FaDownload
                                        style={{ marginRight: "4px", color: "#FF6D00", fontSize: 18 }}
                                        title="Download file"
                                    />
                                    Download
                                </button>


                                <button
                                    onClick={handleEmail}
                                    disabled={!pdfFilename}
                                    style={{
                                        flex: 1,
                                        background: "#FFFFFF",
                                        color: "#FF6D00",
                                        padding: "10px",
                                        border: "1px solid #FF6D00",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: pdfFilename ? "pointer" : "not-allowed",
                                        opacity: pdfFilename ? 1 : 0.5,
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    <EmailIcon style={{ marginRight: "4px" }} />
                                    Email
                                </button>
                            </div>
                        </div>

                        {/* History Panel */}
                        <div style={{
                            background: "#fff",
                            border: "1px solid #E0E0E0",
                            borderRadius: "16px",
                            padding: "24px",
                            boxShadow: "0 8px 24px rgba(255, 153, 102, 0.08)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "default",
                            animation: "fadeInUp 0.5s ease-out",
                        }}
                            className="card-transition"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.015)";
                                e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 153, 102, 0.13)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 153, 102, 0.08)";
                            }}>
                            <Typography variant="h6" style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#FF6D00",
                                marginBottom: "10px",
                                letterSpacing: "0.2px"
                            }}>
                                <HistoryIcon style={{ marginRight: "8px", color: "#FF6D00" }} />
                                Analysis History
                            </Typography>

                            {/* Search Input */}
                            <TextField
                                placeholder="Search files..."
                                size="small"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                InputLabelProps={{ shrink: false }}
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

                            {/* Add gap below search bar */}
                            <div style={{ height: '18px' }} />

                            {/* History List */}
                            <div className="tp-history-list" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                maxHeight: '170px',
                                position: 'relative',
                            }}>

                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((item, idx) => (
                                        <div
                                            className="tp-history-card"
                                            key={idx}
                                            style={{
                                                background: '#F5F5F5',
                                                borderRadius: '12px',
                                                padding: '16px 18px',
                                                border: '1px solid #E0E0E0',
                                                transition: 'box-shadow 0.2s, transform 0.2s',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '8px',
                                                position: 'relative',
                                                wordBreak: 'break-all',
                                                overflowWrap: 'anywhere',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 153, 102, 0.13)';
                                                e.currentTarget.style.transform = 'scale(1.01)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                <span style={{ color: '#333333', fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{item.filename}</span>
                                                <span style={{ color: '#666666', fontSize: 13 }}>Analyzed: {item.date}</span>
                                            </div>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 8, borderRadius: 6, boxShadow: 'none' }}
                                                onClick={e => { e.stopPropagation(); openMenuIndex === idx ? setOpenMenuIndex(null) : handleMenuOpen(e, idx); }}
                                                title="More options"
                                            >
                                                <MoreVertIcon style={{ fontSize: 24, color: '#FF6D00' }} />
                                            </button>
                                            {/* Portal menu for this row */}
                                            {openMenuIndex === idx && ReactDOM.createPortal(
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
                                                            await handleViewPdfFile(item.filename); // shared logic
                                                            setOpenMenuIndex(null);
                                                        }}
                                                    />

                                                    <DropdownAction
                                                        label="Download"
                                                        icon={<FiDownload size={16} />}
                                                        color="#2ecc40"
                                                        bgHover="#e8f8f2"
                                                        onClick={() => handleMenuAction('download', item.filename, idx)}
                                                    />

                                                    <DropdownAction
                                                        label="Rename"
                                                        icon={<FiEdit2 size={16} />}
                                                        color="#0096FF"
                                                        bgHover="#EAF6FF"
                                                        onClick={() => handleMenuAction('edit', item.filename, idx)}
                                                    />

                                                    <DropdownAction
                                                        label="Delete"
                                                        icon={<FiTrash2 size={16} />}
                                                        color="#E14434"
                                                        bgHover="#FFF0F0"
                                                        onClick={() => handleMenuAction('delete', item.filename, idx)}
                                                    />

                                                </div>,
                                                document.body
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        textAlign: "center",
                                        padding: "20px",
                                        color: "#666666",

                                    }}>
                                        No analysis history yet
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    {/* Results Panel */}

                    <div className="flex-1 ml-10 min-w-0">
                        <div
                            className="bg-white rounded-[16px] p-6 shadow-sm transition-all duration-300"
                            style={{
                                backdropFilter: "blur(80px)",
                                border: "1px solid rgba(255, 126, 95, 0.2)",
                                minHeight: "300px",
                                cursor: "default",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 153, 102, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 153, 102, 0.2)";
                            }}>

                            <Typography variant="h6" style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#FF6D00",
                                marginBottom: "20px",
                                letterSpacing: "0.2px"
                            }}>
                                <Assessment style={{ marginRight: "8px", color: "#FF6D00" }} />
                                Analysis Results
                            </Typography>

                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                                    padding: "16px",
                                    textAlign: "center",
                                    maxWidth: "100%",
                                    overflow: "auto",
                                    minHeight: "500px",
                                    maxHeight: "500px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center"
                                }}
                            >
                                {htmlReport ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: htmlReport }}
                                        style={{
                                            textAlign: "left",
                                            maxHeight: "468px",
                                            overflowY: "auto",
                                            width: "100%",
                                            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                                            fontSize: "14px",
                                            lineHeight: "1.6",
                                        }}
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ color: "#999", fontStyle: "italic" }}>
                                        No analysis generated. Please analyze a JTL file to view the report here.
                                    </Typography>
                                )}
                            </div>
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
                    <div
                        ref={modalRef}
                        style={{
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
                            <div style={{
                                display: 'flex',
                                marginBottom: 24,
                                border: '1px solid #ddd',
                                borderRadius: 10,
                                overflow: 'hidden',
                                fontSize: 15,
                                background: '#fafafa',
                                alignItems: 'center',
                            }}>
                                {/* Prefix - non-editable */}
                                {modal.isLockedPrefix && (
                                    <div style={{
                                        padding: '10px 12px',
                                        background: '#f0f0f0',
                                        fontWeight: 600,
                                        color: '#666',
                                        whiteSpace: 'nowrap',
                                        userSelect: 'none',
                                    }}>
                                        {modal.prefix}
                                    </div>
                                )}

                                {/* Editable middle part */}
                                <input
                                    type="text"
                                    value={modal.newName}
                                    onChange={(e) => {

                                        setModal({ ...modal, newName: e.target.value });
                                    }}
                                    placeholder="Enter filename"
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        border: 'none',
                                        outline: 'none',
                                        background: '#fafafa',
                                        fontSize: 15,
                                    }}
                                />

                                {/* Extension - non-editable */}
                                <div style={{
                                    padding: '10px 12px',
                                    background: '#f0f0f0',
                                    fontWeight: 600,
                                    color: '#666',
                                    whiteSpace: 'nowrap',
                                    userSelect: 'none',
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

            <PdfActionModal
                open={pdfActionModal.open}
                filename={pdfActionModal.filename}
                title="Analysis result created!"
                onClose={() => setPdfActionModal({ open: false, filename: '' })}
                onView={async () => {
                    setPdfActionModal({ open: false, filename: '' });
                }}
                onRename={() => {
                    handleMenuAction('edit', pdfActionModal.filename);
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
            />


            <StatusModal
                open={statusModal.open}
                message={statusModal.message}
                type={statusModal.type}
                onClose={() => setStatusModal({ ...statusModal, open: false })}
            />
            <FileViewerModal
                open={pdfViewer.open}
                title={pdfViewer.filename || "PDF File"}
                fileUrl={pdfViewer.fileUrl}
                content={pdfViewer.content}
                onClose={() => setPdfViewer({ open: false, content: '', fileUrl: '', filename: '' })}
            />

        </>
    );
}

export default IntelligentTestAnalysis;