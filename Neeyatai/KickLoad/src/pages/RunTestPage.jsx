import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  FaFileUpload,
  FaPlay,
  FaDownload,
  FaArrowDown,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHistory,
  FaChartPie,
  FaChartLine,
  FaChartBar,
  FaTimes,
  FaEye,
  FaStop
} from "react-icons/fa";
import {
  Box,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  RadioGroup,
  Radio,
  Autocomplete,
  TextField,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Email as EmailIcon } from "@mui/icons-material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReactDOM from "react-dom";
import StatusModal, { ConfirmStopTestModal } from '../components/StatusModal';
import { DropdownAction } from './TestPlanGeneration';
import { FiDownload, FiEdit2, FiTrash2, FiCheckCircle, FiZap, FiTerminal } from 'react-icons/fi';
import { PdfActionModal, FileViewerModal } from '../components/PdfActionModal';
import { useTestStore } from '../store/testStore';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { BiLoaderAlt } from "react-icons/bi";

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

// Utility to parse summary output and format as table data
function parseSummaryOutput(summaryArray) {
  if (!Array.isArray(summaryArray)) return [];

  return summaryArray.map(item => {
    const {
      label,
      samples,
      average_ms,
      min_ms,
      max_ms,
      stddev_ms,
      error_pct,
      throughput_rps,
      received_kbps,
      sent_kbps,
      avg_bytes
    } = item;

    let performanceStatus = 'Good';
    let statusColor = '#4CAF50';

    if (error_pct > 50) {
      performanceStatus = 'Critical';
      statusColor = '#F44336';
    } else if (error_pct > 10) {
      performanceStatus = 'Warning';
      statusColor = '#FF9800';
    } else if (average_ms > 1000) {
      performanceStatus = 'Slow';
      statusColor = '#FFC107';
    }

    return {
      label,
      requests: samples,
      avgResponse: average_ms,
      minResponse: min_ms,
      maxResponse: max_ms,
      stddev: stddev_ms,
      errorRate: error_pct,
      throughput: throughput_rps,
      received_kbps,
      sent_kbps,
      avg_bytes,
      performanceBadge: {
        label: performanceStatus,
        color: statusColor
      }
    };
  });
}

const COLUMN_UNITS = {
  avgResponse: 'ms',
  minResponse: 'ms',
  maxResponse: 'ms',
  stddev: 'ms',
  min: 'ms',
  max: 'ms',
  avg: 'ms',
  errorRate: '%',
  successRate: '%',
  throughput: 'RPS',
  rate: 'RPS',
  received_kbps: 'KBps',
  sent_kbps: 'KBps',
  avg_bytes: 'bytes',
  samples: '',
  requests: '',
};


// Dynamic TestResultsCharts: auto-generate a chart for every numeric field
const TestResultsCharts = ({ summaryData }) => {
  if (!summaryData || summaryData.length === 0) return null;

  // Map labels to numbers for compact chart display
  const mappedLabels = summaryData.map((row, idx) => `${idx + 1}`);

  // The legend data: number → full label
  const legendItems = summaryData.map((row, idx) => ({
    id: idx + 1,
    name: row.label || row.type || `Row ${idx + 1}`
  }));

  // Get numeric metric keys
  const allKeys = Array.from(new Set(summaryData.flatMap(row => Object.keys(row))));
  const numericKeys = allKeys.filter(key =>
    summaryData.some(row => typeof row[key] === 'number' && !isNaN(row[key]))
  );

  const palette = [
    "#FF6D00", "#2196F3", "#4CAF50", "#F44336",
    "#FFC107", "#9C27B0", "#009688", "#FF9800",
    "#607D8B", "#E91E63"
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          color: "#FF6D00",
          fontWeight: 700,
          display: "flex",
          alignItems: "center"
        }}
      >
        <FaChartPie style={{ marginRight: "8px", fontSize: "20px" }} />
        Performance Analytics
      </Typography>

      {/* Grid for chart + legend */}
      {numericKeys.map((key, i) => {
        const values = summaryData.map(row => row[key]);
        const color = palette[i % palette.length];

        const chartData = {
          labels: mappedLabels, // Numbers instead of full names
          datasets: [
            {
              label: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
              data: values,
              borderColor: color,
              backgroundColor: color + "33",
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }
          ]
        };

        const options = {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest', // Show tooltip for the nearest point
            intersect: false // Show even if you're slightly off the point
          },
          plugins: {
            legend: { display: false }, // Keep our custom legend only
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderWidth: 1,
              borderColor: '#ccc',
              callbacks: {
                // Optional: show full label + value in tooltip
                title: context => {
                  const dataIndex = context[0].dataIndex;
                  const datasetLabel = context[0].dataset.label;
                  const originalName = legendItems[dataIndex].name; // from outer scope
                  return `${originalName} (${datasetLabel})`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { font: { size: 12 } }
            },
            y: { beginAtZero: true }
          }
        };


        return (
          <Paper
            key={key}
            elevation={2}
            sx={{
              p: 2,
              borderRadius: "12px",
              mb: 3,
              display: "flex",
              gap: 2
            }}
          >
            {/* Chart Box */}
            <Box sx={{ flex: 3, height: 320 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color }}>
                {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              <div style={{ height: 260 }}>
                {summaryData.length > 1 ? (
                  <Line data={chartData} options={options} />
                ) : (
                  <Bar data={chartData} options={options} />
                )}
              </div>
            </Box>

            {/* Legend Box */}
            <Box
              sx={{
                flex: 1,
                borderLeft: "1px solid #ddd",
                pl: 2,
                overflowY: "auto"
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                Label Mapping
              </Typography>
              {legendItems.map(item => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 0.5
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #ccc",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      mr: 1
                    }}
                  >
                    {item.id}
                  </Box>
                  <Typography variant="body2">{item.name}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};






const RunTestPage = () => {
  const {
    availableFiles,
    history,
    fetchJmxFiles,
    fetchPdfHistory,
    setHistory,
    setAvailableFiles
  } = useTestStore();

  const [statusMessage, setStatusMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isParamsLoading, setIsParamsLoading] = useState(false);
  const summaryRef = React.useRef(null);



  // Menu system state variables
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = React.useRef(null);
  const modalRef = React.useRef(null); // Add ref for modal
  const [statusModal, setStatusModal] = useState({ open: false, message: '', type: 'info' });
  const [jmxViewer, setJmxViewer] = useState({ open: false, content: '' });
  const [pdfViewer, setPdfViewer] = useState({ open: false, url: '' });

  const logsEndRef = useRef(null);

  const [confirmStopOpen, setConfirmStopOpen] = React.useState(false);
  const openConfirmStop = () => setConfirmStopOpen(true);
  const closeConfirmStop = () => setConfirmStopOpen(false);

  const logsContainerRef = useRef(null);

  const pollingIntervalRef = useRef(null);



  const onConfirmStop = async () => {
    setConfirmStopOpen(false);
    await handleStopTest();
  };


  // Zustand store hooks
  const {
    currentTestId, isRunning, logs: liveLogs, resultFile, summaryOutput,
    startTest, appendLog, setResult, stopTest, resetTest,
    selectedFilename, setSelectedFilename,
    editedParams, setEditedParams,
    jmxParams, setJmxParams,
    pdfActionModal, setPdfActionModal,
    modal, setModal,
    lastShownPdfFilename, setLastShownPdfFilename
  } = useTestStore();



  useEffect(() => {
    if (logsContainerRef.current && liveLogs.length > 0) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [liveLogs]);





  const remainingUsers = useTestStore(state => state.remainingUsers);
  const { fetchRemainingUsers } = useTestStore();


  const maxUsers = remainingUsers;






  // ✅ Fetch only once per session
  useEffect(() => {
    if (!availableFiles.length) fetchJmxFiles();
    if (!history.length) fetchPdfHistory();
  }, [availableFiles.length, history.length]);

  const backendToFrontendMap = {
    "continue": "continue",
    "startnextloop": "start_next_thread_loop",
    "stopthread": "stop_thread",
    "stoptest": "stop_test",
    "stoptestnow": "stop_test_now"
  };


  useEffect(() => {
    const fetchParams = async () => {
      if (!selectedFilename) {
        setJmxParams(null);
        return;
      }

      try {
        setIsParamsLoading(true);
        const res = await axiosInstance.get(`/extract-params?file=${encodeURIComponent(selectedFilename)}`);
        const data = res.data?.params;

        setJmxParams(data || null);

        const tg = data?.thread_groups?.[0]; // cleaner reference

        // Helper clamp function to enforce 0-60 bounds
        const clampTo60 = (val) => {
          let num = parseInt(val, 10);
          if (isNaN(num) || num < 0) return 0;    // Return 0 instead of empty string
          if (num > 60) return 60;
          return num;
        };


        const clampLoopCount = (val) => {
          let num = parseInt(val, 10);
          if (isNaN(num) || num <= 0) return 1;        // less or equal 0 becomes 1
          if (num > 100) return 100;                    // more than 100 capped to 100
          return num;                                   // between 1 and 100 kept as is
        };

        const delayValue = clampTo60(tg?.startup_delay);

        setEditedParams({
          num_threads: tg?.num_threads || "",
          ramp_time: tg?.ramp_time || "",
          loop_count: clampLoopCount(tg?.loop_count) || "",
          duration: clampTo60(tg?.duration) || "",
          startup_delay: (delayValue === 0 || delayValue) ? delayValue : "",

          specify_thread_lifetime: tg?.specify_thread_lifetime || false,
          same_user_on_iteration: tg?.same_user_on_iteration || false,
          delay_thread_creation: tg?.delay_thread_creation || false,
          sampler_error_action: backendToFrontendMap[tg?.sampler_error_action] || "continue",
        });
      } catch (error) {
        console.error("Failed to extract JMX params:", error);
        setJmxParams(null);
      } finally {
        setIsParamsLoading(false);
      }
    };

    fetchParams();
  }, [selectedFilename]);

  const handleClear = () => {
    setSelectedFilename("");
    setEditedParams(null);
    setJmxParams(null);
    setStatusMessage("");
    setResult(null, null);
    resetTest();
    setPdfViewer({ open: false, content: '', fileUrl: '', filename: '' });
    setPdfActionModal({ open: false, filename: '' });
    setModal({ open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false });
  };


  const handleRunTest = async () => {
    if (!selectedFilename) {
      alert("Please select a JMX file to run the test");
      return;
    }

    resetTest();
    setStatusMessage("");

    try {
      const res = await axiosInstance.post(
        `/run-test/${encodeURIComponent(selectedFilename)}`,
        editedParams && typeof editedParams === "object" ? editedParams : {},
        { headers: { "Content-Type": "application/json" } }
      );

      const { status, task_id } = res.data;
      if (status !== "started" || !task_id) {
        setStatusMessage(
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "red" }}>
            <FaTimesCircle />
            <span>Failed to start test.</span>
          </div>
        );
        return;
      }

      // ✅ Only set running state after confirmation
      startTest(task_id);

      // Poll task status
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await axiosInstance.get(`/task-status/${task_id}`);
          const taskStatus = statusRes.data;

          if (taskStatus.status === "success") {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;

            setResult(taskStatus.result_file, taskStatus.summary_output);
            stopTest();
            fetchRemainingUsers();

            // ✅ show PDF action modal after success
            const pdfFilename = taskStatus.result_file.replace(/\.jtl$/, ".pdf");
            setPdfActionModal({
              open: true,
              filename: pdfFilename,
            });

            // 🔁 Refresh history
            const res2 = await axiosInstance.get("/list-files?type=pdf&filter_prefix=test_plan_");
            const parsedHistory = (res2.data || []).map((file) => ({
              filename: file.filename,
              date: formatDateSafe(file.datetime),
            }));
            setHistory(parsedHistory);
          } else if (taskStatus.status === "error") {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;

            setStatusMessage(
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "red" }}>
                <FaTimesCircle />
                <span>Error: {taskStatus.message}</span>
              </div>
            );
            stopTest();
          }
        } catch (err) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;

          setStatusMessage(
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "red" }}>
              <FaTimesCircle />
              <span>Polling failed: {err.message}</span>
            </div>
          );
          stopTest();
        }
      }, 3000);
    } catch (err) {
      setStatusMessage(
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "red" }}>
          <FaTimesCircle />
          <span>Network Error: {err.message}</span>
        </div>
      );
      stopTest();
    }
  };


  const handleStopTest = async () => {
    if (!currentTestId) {
      alert("No running test to stop.");
      return;
    }
    try {
      const res = await axiosInstance.post(`/stop-test/${currentTestId}`);
      if (res.data?.status === "stopped") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        stopTest();
        setStatusMessage(
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "green" }}>
            <FaCheckCircle />
            <span>{res.data.message}</span>
          </div>
        );
      } else {
        setStatusMessage(
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "red" }}>
            <FaTimesCircle />
            <span>{res.data.message || "Failed to stop test"}</span>
          </div>
        );
      }
    } catch (err) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setStatusMessage(
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "red" }}>
          <FaTimesCircle />
          <span>Stop failed: {err.message}</span>
        </div>
      );
      stopTest();
    } finally {
      fetchRemainingUsers();
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

  // New Email handler: generate PDF from summary panel, upload, then email
  const handleEmail = async () => {
    if (!isResultReady || !resultFile) {
      setStatusModal({ open: true, message: 'Please run a test and generate results before emailing.', type: 'info' });
      return;
    }
    try {
      const pdfFilename = resultFile.replace(/\.jtl$/, ".pdf");
      const res = await axiosInstance.post("/sendEmailWithPDF", {
        filename: pdfFilename,
      });
      if (res.data?.success) {
        setStatusModal({ open: true, message: 'Email sent successfully.', type: 'success' });
      } else {
        setStatusModal({ open: true, message: 'Email failed to send.', type: 'error' });
      }
    } catch (err) {
      setStatusModal({ open: true, message: 'Error sending email: ' + (err.response?.data?.error || err.message), type: 'error' });
    }
  };

  // Menu system handlers
  const handleMenuAction = (action, filename, idx) => {
    setOpenMenuIndex(null);

    if (action === 'download') {
      setModal({ open: true, type: 'download', filename });
    }

    else if (action === 'edit') {
      const [base, ext] = filename.split(/\.(?=[^\.]+$)/); // Safe split before last dot
      const prefixMatch = base.match(/^test_plan_/);

      if (!prefixMatch) {
        // For non test_plan files
        setModal({
          open: true,
          type: 'edit',
          filename,
          newName: base,
          extension: ext,
          prefix: '',
          isLockedPrefix: false
        });
        return;
      }

      // ✅ For test_plan_ files, lock the prefix
      const prefix = 'test_plan_';
      const middle = base.substring(prefix.length); // Extract the middle editable part

      setModal({
        open: true,
        type: 'edit',
        filename,
        newName: middle, // Show editable part only
        extension: ext,
        prefix,
        isLockedPrefix: true,
      });
    }


    else if (action === 'delete') {
      setModal({ open: true, type: 'delete', filename });
    }
  };




  // Modal confirm logic
  const handleModalConfirm = async () => {
    // helper to get base filename without extension
    const getBaseName = (filename) => filename.replace(/\.[^/.]+$/, '');

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

      const inputName = modal.newName.trim();

      // 🚫 Warn if user typed any extension
      if (/\.[^/.]+$/.test(inputName)) {
        setStatusModal({
          open: true,
          message: 'Please do not include the extension. It will be added automatically.',
          type: 'info',
        });
        return;
      }

      const trimmedNewName = inputName;
      const oldBaseName = getBaseName(modal.filename);

      // Build new filenames for both extensions
      const newPdfName = `${modal.isLockedPrefix ? modal.prefix : ''}${trimmedNewName}.pdf`;
      const newJtlName = `${modal.isLockedPrefix ? modal.prefix : ''}${trimmedNewName}.jtl`;

      // Old filenames for both extensions
      const oldPdfName = `${oldBaseName}.pdf`;
      const oldJtlName = `${oldBaseName}.jtl`;

      // If both new filenames are the same as old, no action
      if (newPdfName === oldPdfName && newJtlName === oldJtlName) {
        setModal({
          open: false,
          type: '',
          filename: '',
          newName: '',
          extension: '',
          prefix: '',
          isLockedPrefix: false,
        });
        return;
      }

      try {
        // Rename PDF file
        const resPdf = await axiosInstance.post('/rename-file', {
          old_name: oldPdfName,
          new_name: newPdfName,
        });

        // Rename JTL file
        const resJtl = await axiosInstance.post('/rename-file', {
          old_name: oldJtlName,
          new_name: newJtlName,
        });

        if (resPdf.data.status === 'success' && resJtl.data.status === 'success') {
          setStatusModal({
            open: true,
            message: 'Files renamed successfully.',
            type: 'success',
          });
          setResult(newPdfName, summaryOutput);
          fetchPdfHistory();
        } else {
          setStatusModal({
            open: true,
            message: resPdf.data.error || resJtl.data.error || 'Failed to rename files.',
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
      const baseName = getBaseName(modal.filename);
      const pdfName = `${baseName}.pdf`;
      const jtlName = `${baseName}.jtl`;

      try {
        // Delete PDF file
        const resPdf = await axiosInstance.post('/delete-file', {
          filename: pdfName,
        });

        // Delete JTL file
        const resJtl = await axiosInstance.post('/delete-file', {
          filename: jtlName,
        });

        if (resPdf.data.status === 'success' && resJtl.data.status === 'success') {
          setStatusModal({
            open: true,
            message: 'Files deleted successfully.',
            type: 'success',
          });
          setResult(null, null);
          fetchPdfHistory();
        } else {
          setStatusModal({
            open: true,
            message: resPdf.data.error || resJtl.data.error || 'Failed to delete files.',
            type: 'error',
          });
        }
      } catch (error) {
        setStatusModal({
          open: true,
          message: error.response?.data?.error || 'Error deleting files.',
          type: 'error',
        });
      }
    }


    // ✅ Always reset modal
    setModal({
      open: false,
      type: '',
      filename: '',
      newName: '',
      extension: '',
      prefix: '',
      isLockedPrefix: false,
    });
  };


  const handleModalCancel = () => setModal({
    open: false,
    type: '',
    filename: '',
    newName: '',
    extension: '',
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








  const filteredHistory = history.filter((item) =>
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

  // For isResultReady, use: const isResultReady = !!resultFile && !!summaryOutput;
  const isResultReady = !!resultFile && !!summaryOutput;

  const lastModalPdfRef = useRef(null);


  return (
    <>
      <style>{`
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
        overflowX: 'auto',
      }}>

        <div className="tp-header" style={{
          background: 'none',
          borderRadius: 'var(--tp-radius)',
          color: 'var(--tp-orange-dark)',
          padding: 'clamp(18px, 5vw, 40px) clamp(8px, 4vw, 0px) clamp(12px, 3vw, 32px) clamp(8px, 4vw, 32px)',
          marginBottom: 'clamp(0px, 1vw, 32px)',
          position: 'relative',
          zIndex: 1,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div className="tp-header-title" style={{
            fontSize: 'clamp(1.5rem, 7vw, 2.2rem)',
            fontWeight: '900',
            color: 'var(--tp-orange-dark)',
            letterSpacing: '0.5px',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            wordBreak: 'break-word',
          }}>
            Run KickLoad Test
          </div>
          <div className="tp-header-desc" style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            fontWeight: '550',
            fontStyle: 'bold',
            opacity: '0.85',
            color: 'var(--tp-text)',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
            marginLeft: 2,
          }}>
            Execute your performance tests seamlessly!
          </div>
        </div>

        {/* Shared wrapper for panels and results */}
        <div style={{ width: '100%', maxWidth: '100%', margin: 0, boxSizing: 'border-box', flex: 1 }}>
          <div style={{ width: '100%', maxWidth: '100%', margin: 0, boxSizing: 'border-box', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '0 2vw' }}>
            <div className="tp-panels route-transition" style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '32px',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              alignItems: 'stretch',
              flex: 1,
              overflowX: 'auto',
            }}>
              {/* Test Runner Panel */}
              <div className="tp-panel tp-panel-chat card-transition" style={{
                background: 'var(--tp-white)',
                borderRadius: 'var(--tp-radius)',
                padding: 'clamp(16px, 3vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.7s ease',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 1.4,
                minWidth: 360,
                width: '100%',
                cursor: 'default',
                height: '100%',
                boxSizing: 'border-box',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}>
                <div
                  className="tp-panel-title"
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--tp-orange-dark)',
                    marginBottom: '20px',
                    letterSpacing: '0.2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',  // this puts max space between text and button
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                    <FiZap style={{ fontSize: '20px' }} />
                    Select Test Plan
                  </div>

                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClear}
                    disabled={isRunning}   // ✅ Disable when test is running
                    className="!text-[#361313] !border !border-black !px-2 !py-1 !rounded-lg 
             !text-xs !font-bold !shadow-md !hover:bg-gray-100 !hover:-translate-y-1 
             !transition-transform !transition-colors
             !focus:outline-none !focus:ring-0 !focus:border-[#361313]
             !disabled:opacity-50 !disabled:cursor-not-allowed"
                  >
                    Clear Test Plan
                  </Button>




                </div>



                <div style={{ marginBottom: '24px' }}>
                  <Autocomplete
                    fullWidth
                    options={availableFiles}
                    getOptionLabel={(option) => option}
                    value={selectedFilename || null}
                    onChange={(event, newValue) => setSelectedFilename(newValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select JMX File"
                        placeholder="Search or select a file"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: 'var(--tp-white)',
                            fontSize: '16px',
                            padding: '4px',
                            '& fieldset': {
                              borderColor: 'var(--tp-border)',
                              borderWidth: '1.5px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#FF6D00',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#FF6D00',
                              borderWidth: '2px',
                            },
                            '& input': {
                              padding: '16px 14px',
                              fontSize: '16px',
                            },
                            '& .MuiAutocomplete-endAdornment': {
                              right: '14px',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '16px',
                            transform: 'translate(14px, 16px) scale(1)',
                            '&.Mui-focused, &.MuiFormLabel-filled': {
                              transform: 'translate(14px, -9px) scale(0.75)',
                            }
                          }
                        }}
                      />
                    )}
                  />
                </div>

                {jmxParams && (
                  <div style={{ marginBottom: '24px', width: '100%' }}>
                    <Typography
                      variant="subtitle1"
                      style={{ fontWeight: 600, color: '#FF6D00', marginBottom: '8px' }}
                    >
                      Configure Test Parameters
                    </Typography>

                    <Box display="flex" gap={3} flexWrap="wrap">

                      {/* Numeric inputs */}
                      <Box flex="1 1 180px" minWidth={180}>
                        <TextField
                          label="Number of Users"
                          type="number"
                          fullWidth
                          value={editedParams?.num_threads != null ? editedParams.num_threads : ""}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d]/g, "");
                            if (value === "") value = "";
                            else value = Math.max(1, Math.min(Number(value), maxUsers));
                            setEditedParams({ ...editedParams, num_threads: value });
                          }}
                          inputProps={{ min: 1, max: maxUsers }}
                          helperText={`Max users: ${maxUsers.toLocaleString()}`}
                        />

                      </Box>

                      <Box flex="1 1 150px" minWidth={140}>
                        <TextField
                          label="Ramp-Up Time (s)"
                          type="number"
                          fullWidth
                          value={editedParams?.ramp_time || ""}
                          onChange={(e) => setEditedParams({ ...editedParams, ramp_time: e.target.value })}
                        />
                      </Box>

                      <Box flex="1 1 150px" minWidth={140} display="flex" flexDirection="column" gap={1}>
                        <TextField
                          label="Loop Count"
                          type="number"
                          fullWidth
                          value={editedParams?.loop_count || ""}
                          onChange={(e) => {
                            let val = e.target.value;
                            // Convert to integer
                            let num = parseInt(val, 10);
                            if (isNaN(num) || num <= 0) {
                              num = 1;
                            } else if (num > 100) {
                              num = 100;
                            }
                            setEditedParams({ ...editedParams, loop_count: num });
                          }}
                        />


                      </Box>
                      {/* Checkboxes */}
                      <Box flex="1 1 200px" minWidth={200} display="flex" flexDirection="column" gap={1}>

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!editedParams?.same_user_on_iteration}
                              onChange={(e) =>
                                setEditedParams({ ...editedParams, same_user_on_iteration: e.target.checked })
                              }
                            />
                          }
                          label={<Typography sx={{ color: 'gray' }}>Same User on Each Iteration</Typography>}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!editedParams?.delay_thread_creation}
                              onChange={(e) =>
                                setEditedParams({ ...editedParams, delay_thread_creation: e.target.checked })
                              }
                            />
                          }
                          label={<Typography sx={{ color: 'gray' }}>Delay Thread Creation Until Needed</Typography>}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!editedParams?.specify_thread_lifetime}
                              onChange={(e) =>
                                setEditedParams({ ...editedParams, specify_thread_lifetime: e.target.checked })
                              }
                            />
                          }
                          label={<Typography sx={{ color: 'gray' }}>Specify Thread Lifetime</Typography>}
                        />
                      </Box>

                      <Box flex="1 1 140px" minWidth={140} display="flex" flexDirection="column" gap={2}>
                        <TextField
                          label="Duration (s)"
                          type="number"
                          fullWidth
                          value={editedParams?.duration || ""}
                          onChange={(e) => {
                            let val = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
                            if (isNaN(val)) val = "";
                            else if (val > 60) val = 60;   // Clamp max 60
                            else if (val < 0) val = 0;     // Clamp negatives to 0
                            setEditedParams({ ...editedParams, duration: val });
                          }}
                          disabled={!editedParams?.specify_thread_lifetime} // Disabled if thread lifetime not specified
                        />

                        <TextField
                          label="Startup Delay (s)"
                          type="number"
                          fullWidth
                          value={editedParams?.startup_delay != null ? editedParams.startup_delay : ""}
                          onChange={(e) => {
                            let val = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
                            if (isNaN(val)) val = "";
                            else if (val > 60) val = 60;   // Clamp max 60
                            else if (val < 0) val = 0;     // Clamp negatives to 0
                            setEditedParams({ ...editedParams, startup_delay: val });
                          }}
                          disabled={!editedParams?.specify_thread_lifetime}
                        />

                      </Box>



                    </Box>

                    {/* Action on sampler error (radio buttons) */}
                    <Box marginTop={4}>
                      <Typography variant="subtitle1" style={{ fontWeight: 600, color: '#FF6D00', marginBottom: '8px' }}>
                        Action to be taken after a Sampler error
                      </Typography>
                      <RadioGroup
                        value={editedParams?.sampler_error_action || "continue"}
                        onChange={(e) => setEditedParams({ ...editedParams, sampler_error_action: e.target.value })}
                      >
                        {/* Flex container with separate row and column gaps */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            columnGap: 3,   // Horizontal gap (e.g. 24px)
                            rowGap: 1,      // Vertical gap (e.g. 8px) — decrease this value to reduce vertical spacing
                          }}
                        >
                          <FormControlLabel
                            value="continue"
                            control={<Radio />}
                            label={<Typography sx={{ color: 'gray' }}>Continue</Typography>}
                          />
                          <FormControlLabel
                            value="start_next_thread_loop"
                            control={<Radio />}
                            label={<Typography sx={{ color: 'gray' }}>Start Next Thread Loop</Typography>}
                          />
                          <FormControlLabel
                            value="stop_thread"
                            control={<Radio />}
                            label={<Typography sx={{ color: 'gray' }}>Stop Thread</Typography>}
                          />
                          <FormControlLabel
                            value="stop_test"
                            control={<Radio />}
                            label={<Typography sx={{ color: 'gray' }}>Stop Test</Typography>}
                          />
                          <FormControlLabel
                            value="stop_test_now"
                            control={<Radio />}
                            label={<Typography sx={{ color: 'gray' }}>Stop Test Now</Typography>}
                          />
                        </Box>
                      </RadioGroup>
                    </Box>


                  </div>
                )}




                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={handleRunTest}
                    disabled={isRunning}
                    sx={{
                      background: isRunning ? '#ccc' : '#FF6D00',
                      color: 'white',
                      padding: 'clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)',
                      borderRadius: '12px',
                      fontSize: 'clamp(14px, 2vw, 16px)',
                      fontWeight: '600',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxShadow: '0 4px 12px rgba(255, 109, 0, 0.3)',
                      '&:hover': {
                        background: isRunning ? '#ccc' : '#e65c00',
                        boxShadow: isRunning ? 'none' : '0 6px 16px rgba(255, 109, 0, 0.4)',
                        transform: isRunning ? 'none' : 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: '#ccc',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    <FaPlay style={{ marginRight: '8px', fontSize: '16px' }} />
                    {isRunning ? "Running..." : "Run Test"}
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    onClick={openConfirmStop}
                    disabled={!isRunning}
                    sx={{
                      background: isRunning ? '#d32f2f' : '#ccc',
                      color: 'white',
                      padding: 'clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)',
                      borderRadius: '12px',
                      fontSize: 'clamp(14px, 2vw, 16px)',
                      fontWeight: '600',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxShadow: '0 4px 12px rgba(211,47,47,0.3)',
                      '&:hover': {
                        background: isRunning ? '#b71c1c' : '#ccc',
                        transform: isRunning ? 'translateY(-2px)' : 'none'
                      },
                      '&:disabled': {
                        background: '#ccc',
                        color: '#666',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    <FaStop style={{ marginRight: '8px', fontSize: '16px' }} />
                    Stop Test
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={async () => {
                      if (!isResultReady || !resultFile) {
                        alert("Please run a test and view results before downloading.");
                        return;
                      }
                      const pdfFilename = resultFile.replace(/\.jtl$/, ".pdf");
                      handleDownload(pdfFilename);
                    }}
                    disabled={!isResultReady}
                    sx={{
                      color: '#FF6D00',
                      borderColor: '#FF6D00',
                      padding: 'clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)',
                      borderRadius: '12px',
                      fontSize: 'clamp(14px, 2vw, 16px)',
                      fontWeight: '600',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxShadow: '0 4px 12px rgba(255, 109, 0, 0.1)',
                      '&:hover': {
                        borderColor: '#e65c00',
                        color: '#e65c00',
                        background: 'rgba(255, 109, 0, 0.04)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(255, 109, 0, 0.25)'
                      },
                      '&:active': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255, 109, 0, 0.2)'
                      },
                      '&:disabled': {
                        borderColor: '#666',
                        color: '#666',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    <FaDownload style={{
                      marginRight: '8px',
                      fontSize: '16px',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      fontFamily: 'inherit',
                      color: 'inherit'
                    }} />
                    Download (PDF)
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleEmail}
                    disabled={!isResultReady}
                    sx={{
                      color: '#FF6D00',
                      borderColor: '#FF6D00',
                      padding: 'clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)',
                      borderRadius: '12px',
                      fontSize: 'clamp(14px, 2vw, 16px)',
                      fontWeight: '600',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxShadow: '0 4px 12px rgba(255, 109, 0, 0.1)',
                      '&:hover': {
                        borderColor: '#e65c00',
                        color: '#e65c00',
                        background: 'rgba(255, 109, 0, 0.04)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(255, 109, 0, 0.25)'
                      },
                      '&:active': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(255, 109, 0, 0.2)'
                      },
                      '&:disabled': {
                        borderColor: '#666',
                        color: '#666',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    <EmailIcon style={{ marginRight: '8px' }} />
                    Email Results
                  </Button>


                </div>



                {statusMessage && (
                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--tp-radius-sm)',
                    background: 'var(--tp-gray)',
                    color: 'var(--tp-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {statusMessage}
                  </div>
                )}
              </div>

              {/* History Panel */}
              <div className="tp-panel tp-panel-history card-transition" style={{
                background: 'var(--tp-white)',
                borderRadius: 'var(--tp-radius)',
                padding: 'clamp(16px, 3vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.7s ease',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flex: 0.6,
                position: 'relative',
                minWidth: 200,
                width: '100%',
                cursor: 'default',
                minHeight: '300px',
                boxSizing: 'border-box',
                overflowY: 'hidden'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}>
                <div className="tp-panel-title" style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--tp-orange-dark)',
                  marginBottom: '20px',
                  letterSpacing: '0.2px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FaHistory style={{ marginRight: '8px', fontSize: '20px' }} />
                  History
                </div>

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

                <div className="tp-history-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  position: 'absolute',
                  height: '85%',
                  top: 130,
                  bottom: 60,
                  left: 10,
                  right: 10
                }}>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, idx) => (
                      <div key={idx} className="tp-history-card" style={{
                        background: 'var(--tp-gray)',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        border: '1px solid var(--tp-border)',
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
                        }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div className="tp-history-filename" style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px', color: 'var(--tp-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {item.filename}
                          </div>
                          <div className="tp-history-meta" style={{ fontSize: '13px', color: '#888' }}>Ran: {item.date}</div>
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
                                await handleViewPdfFile(item.filename);
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
                    <div
                      className="tp-history-meta"
                      style={{
                        fontSize: '13px',
                        color: '#888',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',  // Optional: ensures full width container
                        textAlign: 'center'
                      }}
                    >
                      No tests run yet.
                    </div>

                  )}
                </div>
              </div>
            </div>
          </div>

          {liveLogs.length > 0 && (
            <div
              ref={logsContainerRef}
              style={{
                background: '#ffffffff',
                border: '1px solid #FFCC80',
                borderRadius: '12px',
                padding: '20px',
                margin: '24px 32px 0',
                maxHeight: '320px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                color: 'black'
              }}
            >
              <strong style={{ color: '#FF6D00', fontSize: 20, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiTerminal style={{ fontSize: '20px' }} />Live Test Logs
              </strong>
              <div style={{ marginTop: '12px' }}>
                {liveLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}



          {/* Test Results Panel - perfectly aligned */}
          {summaryOutput && (
            <div ref={summaryRef} className="tp-panel tp-panel-results card-transition" style={{
              background: 'var(--tp-white)',
              borderRadius: 'var(--tp-radius)',
              padding: '32px 28px',
              margin: '32px 0 0 29px',
              width: '96%',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              animation: 'fadeIn 0.7s ease',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              zIndex: 2
            }}>
              <Typography variant="h5" sx={{ color: '#FF6D00', fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center' }}>
                <FaChartBar style={{ marginRight: '8px', fontSize: '20px' }} /> Test Results
              </Typography>
              {/* Table and summary output */}
              <div style={{
                marginTop: '10px',
                background: '#F9F9F9',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E0E0E0',
                fontFamily: 'monospace',
                whiteSpace: 'normal',
              }}>

                <Typography variant="h6" style={{ marginBottom: '12px', color: '#FF6D00' }}>
                  Test Summary
                </Typography>
                {(parseSummaryOutput(summaryOutput).length > 0) ? (
                  <div style={{ overflowX: 'auto' }}>
                    {(() => {
                      const summaryRows = parseSummaryOutput(summaryOutput);
                      // Get all unique keys from all rows
                      const allKeys = Array.from(
                        new Set(summaryRows.flatMap(row => Object.keys(row)))
                      );
                      const filteredKeys = allKeys.filter(k => !['active', 'started', 'finished'].includes(k));
                      return (
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontFamily: 'inherit',
                            fontSize: 12, // smaller font
                            tableLayout: 'fixed', // helps fit columns
                            wordBreak: 'break-word',
                          }}
                        >
                          <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #FF6D00, #FF8A3D)', color: 'white' }}>
                              {filteredKeys.map(key => (
                                <th key={key} style={{
                                  padding: '6px 4px', // smaller padding
                                  border: '1px solid #E0E0E0',
                                  textAlign: 'center',
                                  background: '#FF6D00',
                                  color: '#fff',
                                  fontWeight: 600,
                                  borderRight: '1px solid white',
                                  maxWidth: 120,
                                  overflow: 'hidden',
                                  wordBreak: 'break-word', // allow wrapping
                                }}>
                                  {key === 'performanceBadge'
                                    ? 'Performance Status'
                                    : `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}${COLUMN_UNITS[key] ? ` (${COLUMN_UNITS[key]})` : ''}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {summaryRows.map((row, idx) => (
                              <tr key={idx} style={{
                                background: idx % 2 === 0 ? '#FFF8F1' : '#FFFFFF',
                                transition: 'all 0.2s ease',
                              }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#FFE0B2';
                                  e.currentTarget.style.transform = 'scale(1.01)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = idx % 2 === 0 ? '#FFF8F1' : '#FFFFFF';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                {allKeys.map(key => (
                                  <td key={key} style={{
                                    padding: '4px 4px', // smaller padding
                                    border: '1px solid #E0E0E0',
                                    textAlign: 'center',
                                    fontWeight: key === 'type' || key === 'label' ? 600 : 400,
                                    maxWidth: 120,
                                    overflow: 'hidden',
                                    wordBreak: 'break-word', // allow wrapping
                                    color: '#111', // set text color to black
                                  }}>
                                    {key === 'performanceBadge' ? (
                                      <span style={{
                                        backgroundColor: row.performanceBadge.color,
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-block',
                                      }}>
                                        {row.performanceBadge.label}
                                      </span>
                                    ) : (
                                      row[key] !== undefined && row[key] !== null ? row[key] : '-'
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                ) : (
                  <pre style={{ margin: 0 }}>{summaryOutput}</pre>
                )}
              </div>
              {/* Professional Charts and Analytics */}
              {(parseSummaryOutput(summaryOutput).length > 0) && (
                <Box sx={{ mt: 4 }}>
                  <TestResultsCharts summaryData={parseSummaryOutput(summaryOutput)} />
                </Box>
              )}
            </div>
          )}
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
              <div style={{
                display: 'flex',
                marginBottom: 24,
                border: '1px solid #ddd',
                borderRadius: 10,
                overflow: 'hidden',
                fontSize: 15,
                background: '#fafafa',
              }}>
                {/* Prefix - non-editable */}
                {modal.isLockedPrefix && (
                  <div style={{
                    padding: '10px 10px',
                    background: '#eee',
                    fontWeight: 600,
                    color: '#888',
                    whiteSpace: 'nowrap',
                  }}>
                    {modal.prefix}
                  </div>
                )}

                {/* Editable Middle Part */}
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
                  placeholder="Enter name"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: 'none',
                    outline: 'none',
                    background: '#fafafa',
                    fontSize: 15,
                  }}
                />

                {/* Extension - non-editable */}
                <div style={{
                  padding: '10px 10px',
                  background: '#eee',
                  fontWeight: 600,
                  color: '#888',
                  whiteSpace: 'nowrap',
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
          setPdfActionModal({ open: false, filename: '' }); // Close first
          summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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


      <FileViewerModal
        open={pdfViewer.open}
        title={pdfViewer.filename || "PDF File"}
        fileUrl={pdfViewer.fileUrl}
        content={pdfViewer.content}
        onClose={() => setPdfViewer({ open: false, content: '', fileUrl: '', filename: '' })}
      />
      <ConfirmStopTestModal
        open={confirmStopOpen}
        filename={selectedFilename || ''}
        onCancel={closeConfirmStop}
        onConfirm={onConfirmStop}
      />



    </>
  );
};

export default RunTestPage;