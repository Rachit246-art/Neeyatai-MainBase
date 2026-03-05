

import React, { useEffect, useRef } from "react";
import { Autocomplete, TextField, Button, Box, Typography, Paper, CircularProgress, Grid } from "@mui/material";
import { Assessment, History as HistoryIcon, Email as EmailIcon } from "@mui/icons-material";
import axiosInstance from "../api/axiosInstance";
import { FaDownload, FaCheckCircle, FaTimesCircle, FaEye } from "react-icons/fa";
import { DropdownAction } from './TestPlanGeneration';
import { FiDownload, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StatusModal from '../components/StatusModal';
import ReactDOM from "react-dom";
import { formatDateSafe } from "./IntelligentTestAnalysis";
import { FileViewerModal } from '../components/PdfActionModal';
import DescriptionIcon from '@mui/icons-material/Description';
import { useComparisonStore } from '../store/comparisonStore';
import { useAnalysisStore } from '../store/analysisStore';


// Remove MAX_FILES restriction; allow any number of files >= 2
const MIN_FILES = 2;

function PerformanceComparison() {
  // Replace useState with Zustand store hooks
  const {
    selectedFiles, setSelectedFiles,
    loading, setLoading,
    results, setResults,
    error, setError,
    success, setSuccess,
    comparing, setComparing,
    history, setHistory,
    searchQuery, setSearchQuery,
    htmlReport, setHtmlReport,
    modal, setModal,
    openMenuIndex, setOpenMenuIndex,
    menuPosition, setMenuPosition,
    statusModal, setStatusModal,
    pdfFilename, setPdfFilename,
    pdfActionModal, setPdfActionModal,
    pdfViewer, setPdfViewer
  } = useComparisonStore();

  // Analysis store for shared JTL files
  const { availableFiles, fetchJtlFiles } = useAnalysisStore();

  const resultsRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);

  // Fetch comparison history once
  const fetchComparisonHistory = async () => {
    try {
      const histRes = await axiosInstance.get("/list-files?type=pdf&filter_prefix=compare_");
      if (Array.isArray(histRes.data)) {
        setHistory(histRes.data.map(f => ({
          filename: f.filename,
          date: formatDateSafe(f.datetime)
        })));
      }
    } catch (err) {
      console.error("Failed to fetch comparison history:", err);
    }
  };

  // On mount: get JTL files from analysis store if empty, and comparison history if empty
  useEffect(() => {
    if (!availableFiles.length) {
      fetchJtlFiles();
    }
    if (!history.length) {
      fetchComparisonHistory();
    }
  }, [availableFiles.length, history.length]);


  // Click outside handler for modal
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
          setModal({ open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false });
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modal.open, setModal]);


  const handleCompare = async () => {
    setError("");
    setSuccess("");
    setResults(null);
    setPdfFilename(null);

    if (selectedFiles.length < MIN_FILES) {
      setError(`Select at least ${MIN_FILES} files for comparison.`);
      return;
    }

    setComparing(true);

    try {
      const res = await axiosInstance.post("/compare-jtls", {
        filenames: selectedFiles,
      });

      if (res.data?.status === "success") {
        setResults({
          summary: res.data.summary,
          filename: res.data.filename,
        });
        setPdfFilename(res.data.filename);
        setHtmlReport(res.data.html_report);
        setSuccess('Comparison has been completed.');
        setPdfActionModal({ open: true, filename: res.data.filename });
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
        fetchComparisonHistory(); // <-- Refresh history after comparison
      } else {
        setError('Comparison did not return a valid result.');
      }
    } catch (err) {
      setError(err.response?.data?.error || "Comparison failed.");

    } finally {
      setComparing(false);
    }
  };





  const handleDownload = async (filename) => {
    try {
      const res = await axiosInstance.get(`/download/${filename}`);
      if (res.data.status === "success" && res.data.download_url) {
        window.open(res.data.download_url, "_blank");
      } else {
        alert(res.data.message || "Failed to get download URL.");
      }
    } catch (error) {
      alert("Error downloading file.");
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

  const handleMenuAction = (action, filename, idx) => {
    setOpenMenuIndex(null);

    if (action === 'download') {
      setModal({ open: true, type: 'download', filename });
    } else if (action === 'edit') {
      const [base, ext] = filename.split(/\.(?=[^\.]+$)/);
      const prefix = 'compare_';

      if (!base.startsWith(prefix)) {
        setStatusModal({
          open: true,
          message: 'Only files starting with compare_ are allowed to be renamed.',
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

          // Refresh history
          const res2 = await axiosInstance.get("/list-files?type=pdf&filter_prefix=compare_");
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

          // Refresh history
          const res2 = await axiosInstance.get("/list-files?type=pdf&filter_prefix=compare_");
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
          .spinner {
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

        @media (max-width: 1400px) {
          .tp-main {
            max-width: 95vw !important;
            margin: 0 auto !important;
          }
          .tp-panels {
            gap: clamp(16px, 2vw, 24px) !important;
          }
        }
        @media (max-width: 1200px) {
          .tp-main {
            max-width: 100vw !important;
            padding: clamp(12px, 2vw, 24px) clamp(4px, 2vw, 12px) !important;
          }
          .tp-panels {
            gap: clamp(8px, 2vw, 20px) !important;
          }
          .tp-panel {
            padding: clamp(12px, 2vw, 20px) !important;
          }
        }
        @media (max-width: 900px) {
          .tp-main {
            padding: clamp(8px, 2vw, 16px) clamp(2px, 2vw, 8px) !important;
          }
          .tp-panels {
            gap: clamp(6px, 2vw, 12px) !important;
          }
          .tp-panel {
            padding: clamp(8px, 2vw, 14px) !important;
          }
          .tp-panel-title {
            font-size: clamp(16px, 4vw, 20px) !important;
          }
        }
        @media (max-width: 768px) {
          .tp-main {
            padding: clamp(6px, 2vw, 10px) clamp(1px, 2vw, 4px) !important;
          }
          .tp-panels {
            gap: clamp(4px, 2vw, 8px) !important;
          }
          .tp-panel {
            padding: clamp(4px, 2vw, 8px) !important;
          }
          .tp-panel-title {
            font-size: clamp(14px, 5vw, 18px) !important;
          }
          .MuiButton-root {
            font-size: clamp(12px, 3vw, 14px) !important;
            padding: clamp(8px, 2vw, 12px) !important;
          }
        }
        @media (max-width: 600px) {
          .tp-main {
            padding: clamp(3px, 2vw, 8px) clamp(1px, 2vw, 3px) !important;
          }
          .tp-panels {
            gap: clamp(2px, 2vw, 6px) !important;
          }
          .tp-panel {
            padding: clamp(2px, 2vw, 6px) !important;
          }
          .tp-panel-title {
            font-size: clamp(13px, 6vw, 16px) !important;
          }
          .MuiButton-root {
            font-size: clamp(11px, 3vw, 13px) !important;
            padding: clamp(6px, 2vw, 10px) !important;
          }
        }
        @media (max-width: 480px) {
          .tp-main {
            padding: clamp(1px, 2vw, 4px) clamp(1px, 2vw, 2px) !important;
          }
          .tp-panels {
            gap: clamp(1px, 2vw, 4px) !important;
          }
          .tp-panel {
            padding: clamp(1px, 2vw, 4px) !important;
          }
          .tp-panel-title {
            font-size: clamp(12px, 7vw, 15px) !important;
          }
          .MuiButton-root {
            font-size: clamp(10px, 3vw, 12px) !important;
            padding: clamp(4px, 2vw, 8px) !important;
          }
        }
        @media (max-width: 360px) {
          .tp-main {
            padding: clamp(1px, 2vw, 3px) clamp(1px, 2vw, 1px) !important;
          }
          .tp-panels {
            gap: clamp(1px, 2vw, 3px) !important;
          }
          .tp-panel {
            padding: clamp(1px, 2vw, 3px) !important;
          }
          .tp-panel-title {
            font-size: clamp(11px, 8vw, 14px) !important;
          }
          .MuiButton-root {
            font-size: clamp(9px, 3vw, 11px) !important;
            padding: clamp(3px, 2vw, 6px) !important;
          }
        }
        .MuiButton-root.unauthenticated {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        .MuiButton-root.unauthenticated:hover {
          background: #ccc !important;
          box-shadow: none !important;
        }
        .MuiAutocomplete-root.unauthenticated .MuiOutlinedInput-root {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 1024px) {
          .tp-panels {
            flex-direction: column !important;
            gap: clamp(8px, 2vw, 16px) !important;
            align-items: stretch !important;
          }
          .tp-panel, .tp-panel-history, .tp-panel-chat {
            min-width: 0 !important;
            max-width: 100vw !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
        @media (min-width: 1025px) {
          .tp-main {
            margin-left: clamp(8px, 2vw, 20px);
          }
          .tp-panel.tp-panel-chat {
            max-width: clamp(580px, 56vw, 780px) !important;
          }
        }
        .tp-history-list:after {
        }
        /* Remove any vertical separator between panels */
        .tp-panels, .tp-panels:before, .tp-panels:after {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .tp-panel, .tp-panel:before, .tp-panel:after {
          background: var(--tp-white);
          border: none !important;
          box-shadow: var(--tp-shadow);
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
        width: '100%',
        maxWidth: '100%',
        flex: 1,
        margin: 0,
        padding: 'clamp(16px, 4vw, 32px) clamp(4px, 2vw, 24px) clamp(24px, 4vw, 40px) clamp(4px, 2vw, 24px)',
        position: 'relative',
        boxSizing: 'border-box',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',

      }}>


        <div className="tp-header" style={{
          background: 'none',
          borderRadius: '16px',
          color: '#FF6D00',
          padding: 'clamp(18px, 5vw, 40px) clamp(8px, 4vw, 32px) clamp(12px, 3vw, 32px) clamp(8px, 4vw, 32px)',
          marginBottom: 'clamp(0px, 1vw, 8px)',
          position: 'relative',
          zIndex: 1,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div className="tp-header-title" style={{
            fontSize: 'clamp(1.5rem, 7vw, 2.2rem)',
            fontWeight: '900',
            color: '#FF6D00',
            letterSpacing: '0.5px',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}>
            Comparison
          </div>
          <div className="tp-header-desc" style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            fontWeight: '550',
            marginLeft: 3,
            fontStyle: 'bold',
            opacity: '0.85',
            color: '#333333',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}>
            Compare performance metrics across multiple KickLoad test runs
          </div>
        </div>

        {/* Panels Row - match RunTestPage */}
        <div style={{ width: '100%', maxWidth: '100%', margin: 0, boxSizing: 'border-box', flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'stretch',  // or 'flex-start' if needed
            alignItems: 'flex-start',
            padding: '0 2vw',
            width: '100%',
            boxSizing: 'border-box',
          }}>

            <div className="tp-panels route-transition" style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '32px',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              alignItems: 'stretch',
              flex: 1,
              overflowX: 'hidden',
            }}>
              {/* Input Panel */}
              <div className="tp-panel tp-panel-chat card-transition" style={{
                background: '#fff',
                borderRadius: '16px',
                padding: 'clamp(16px, 3vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.7s ease',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 2,
                minWidth: 0,
                cursor: 'default',
                minHeight: '330px', // Updated height
                height: '330px',    // Updated height
                boxSizing: 'border-box',
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF6D00', mb: 2, fontSize: 20, letterSpacing: 0.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 24, color: '#FF6D00' }} />
                  Select JTL Files
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#333', fontWeight: 500 }}>
                  Choose <b>2 or more</b> JTL files to compare their results.
                </Typography>
                <Autocomplete
                  style={{ maxHeight: '150px', overflowY: 'auto' }}
                  multiple
                  options={availableFiles}
                  value={selectedFiles}
                  onChange={(_, value) => setSelectedFiles(value)}
                  loading={loading}
                  freeSolo={false}
                  disableCloseOnSelect
                  filterSelectedOptions
                  renderTags={(value, getTagProps) => {
                    const maxVisible = 3; // Show max 3 files
                    const visibleTags = value.slice(0, maxVisible);
                    const hiddenCount = value.length - maxVisible;

                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                        {visibleTags.map((option, index) => (
                          <div
                            key={index}
                            style={{
                              background: 'linear-gradient(135deg, #FF6D00, #FF8A00)',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              maxWidth: '120px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(255,109,0,0.2)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,109,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(255,109,0,0.2)';
                            }}
                            onClick={() => {
                              // Remove the file when clicked
                              const newValue = value.filter((_, i) => i !== index);
                              setSelectedFiles(newValue);
                            }}
                            title={`Click to remove: ${option}`}
                          >
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '80px'
                            }}>
                              {option}
                            </span>
                            <span
                              style={{
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                marginLeft: '2px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newValue = value.filter((_, i) => i !== index);
                                setSelectedFiles(newValue);
                              }}
                            >
                              ×
                            </span>
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <div
                            style={{
                              background: 'rgba(255,109,0,0.1)',
                              color: '#FF6D00',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: '1px solid rgba(255,109,0,0.3)',
                              cursor: 'default',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title={`${hiddenCount} more file${hiddenCount > 1 ? 's' : ''} selected`}
                          >
                            <span>+{hiddenCount}</span>
                            <span style={{ fontSize: '10px' }}>files</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select JTL Files"
                      placeholder="Choose 2 or more files"
                      size="medium"
                      margin="normal"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: params.InputProps.endAdornment,
                        style: {
                          background: '#FFF',
                          borderRadius: 8,
                          fontSize: 15,
                          height: 56, // Make input fatter
                        }
                      }}
                    />
                  )}
                  sx={{ mb: 2, minHeight: 56 }} // Make Autocomplete fatter
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 3, width: '100%' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={selectedFiles.length < MIN_FILES || comparing}
                    onClick={handleCompare}
                    sx={{
                      flex: 1,
                      background: comparing ? '#ccc' : '#FF6D00',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 16,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(255, 109, 0, 0.18)',
                      p: 1.2,
                      textTransform: 'none', // <-- Added to prevent all caps
                      transition: 'all 0.3s',
                      '&:hover': {
                        background: '#e06600',
                        boxShadow: '0 8px 24px rgba(255, 109, 0, 0.22)',
                      },
                    }}
                  >
                    {comparing ? 'Comparing...' : 'Compare'}
                  </Button>

                  <Button
                    onClick={() => handleDownload(results?.filename)}
                    disabled={!results?.filename}
                    sx={{
                      flex: 1,
                      background: '#FFFFFF',
                      color: '#FF6D00',
                      padding: '10px',
                      border: '1px solid #FF6D00',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: results?.filename ? 'pointer' : 'not-allowed',
                      opacity: results?.filename ? 1 : 0.5,
                      textTransform: 'none', // <-- Added to prevent all caps
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#FFF3E0',
                      }
                    }}
                  >
                    <FaDownload style={{ marginRight: '6px', fontSize: 16 }} />
                    Download

                  </Button>
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
                      fontSize: 16,
                      cursor: pdfFilename ? "pointer" : "not-allowed",
                      opacity: pdfFilename ? 1 : 0.5,
                      transition: "all 0.3s ease"
                    }}
                  >
                    <EmailIcon style={{ marginRight: "4px" }} />
                    Email
                  </button>
                </Box>

                {error && (
                  <Typography
                    color="error"
                    sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <FaTimesCircle style={{ marginRight: 6 }} /> {error}
                  </Typography>
                )}

                {success && (
                  <Typography
                    color="success.main"
                    sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <FaCheckCircle style={{ marginRight: 6 }} /> {success}
                  </Typography>
                )}


              </div>
              {/* History Panel */}
              <div style={{
                background: "#fff",
                border: "1px solid #E0E0E0",
                borderRadius: "16px",
                padding: "24px",
                flex: 1,                 // allow it to grow
                minWidth: 0,             // prevent overflow
                boxShadow: "0 8px 24px rgba(255, 153, 102, 0.08)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "default",
                animation: "fadeInUp 0.5s ease-out",
                position: 'relative',
                boxSizing: 'border-box',
                minHeight: '330px', // Updated height
                height: '330px',    // Updated height
                maxHeight: '700px',
                overflowY: 'auto',
              }}

                className="card-transition"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 153, 102, 0.13)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
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
                  Comparison History
                </Typography>

                {/* Search Input */}
                <div className="tp-history-search" style={{ marginBottom: '16px' }}>
                  <TextField
                    placeholder="Search files..."
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
                {/* Add gap below search bar */}
                <div style={{ height: '18px' }} />

                {/* History List */}
                <div className="tp-history-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflowX: 'hidden',
                  maxHeight: '600px', // Set max height for history panel
                  maxWidth: '100%',
                  position: 'absolute',
                  left: '10px',
                  right: '10px',
                  top: '130px',
                  bottom: '20px',
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
                          <span style={{ color: '#666666', fontSize: 13 }}>Compared: {item.date}</span>
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
                                await handleViewPdfFile(item.filename);  // Shared logic
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
                      No comparison history yet
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Results Panel - perfectly aligned */}
          {results && (
            <div
              className="tp-panel tp-panel-results card-transition"
              ref={resultsRef}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "32px 28px",
                margin: "32px 0 0 29px",
                width: "96%",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                animation: "fadeIn 0.7s ease",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                zIndex: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#FF6D00", fontWeight: 800, mb: 2, display: "flex", alignItems: "center" }}
              >
                <Assessment sx={{ fontSize: 24, mr: 1 }} />
                Comparison Results
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 3,
                  p: 2,
                  minHeight: 180,
                  maxHeight: 600,
                  overflowY: "auto",
                  border: "1px solid #FFE0B2",
                }}
              >
                {htmlReport ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: htmlReport }}
                    style={{
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#333",
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ color: "#999", fontStyle: "italic" }}>
                    No summary available.
                  </Typography>
                )}
              </Box>
            </div>
          )}

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

                        setModal({
                          ...modal,
                          newName: e.target.value
                        });
                      }}
                      onFocus={(e) => {

                      }}
                      onBlur={(e) => {

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




        </div>
      </div>
    </>
  );
}

export default PerformanceComparison; 
