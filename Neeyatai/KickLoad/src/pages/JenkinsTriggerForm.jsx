import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useJenkinsStore } from "../store/jenkinsStore";
import { FaGithub, FaPlay, FaLink, FaCheckCircle, FaCircleNotch, FaRegClock, FaCloudUploadAlt, FaPlayCircle, FaTimesCircle, FaInfoCircle, FaUserPlus, FaExchangeAlt, FaTerminal } from "react-icons/fa";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Paper,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import { FiZap, FiFolder, FiGitBranch, FiFile, FiLogOut } from "react-icons/fi";
import StatusModal from "../components/StatusModal";
import { MdCloudDone, MdDownloadDone } from 'react-icons/md';
import { BsGit, BsArrowRepeat } from 'react-icons/bs';
import { ImSpinner9 } from 'react-icons/im';
import {
  DisconnectConfirmModal,
  DisconnectLoadingModal,
  ConfirmModal
} from '../components/JenkinsModal'

const JenkinsTriggerForm = () => {
  // Zustand store state
  const {
    isConnected, repos, branches, folders, files,
    isLoading, isDisconnecting, statusMessage, statusModal, confirmModal,
    disconnectConfirmModal, disconnectLoadingModal,
    pipelineStage, pipelineStatus, showProgressUI, queueUrl, jenkinsLogs, currentJmx,
    selectedRepo, selectedBranch, selectedFolder, selectedFiles,
    setConnected, setLoggedIn, setRepos, setBranches, setFolders, setFiles,
    setLoading, setDisconnecting, setStatusMessage, setStatusModal, setConfirmModal,
    setDisconnectConfirmModal, setDisconnectLoadingModal,
    setPipelineStage, setPipelineStatus, setShowProgressUI, setQueueUrl, setJenkinsLogs, setCurrentJmx,
    setSelectedRepo, setSelectedBranch, setSelectedFolder, setSelectedFiles,
    resetAll
  } = useJenkinsStore();

  // 🔁 Hold polling interval reference
  const pollingRef = useRef(null);

  const fetchProgress = async () => {
    try {
      const res = await axiosInstance.get(`/jenkins/progress?queue_url=${queueUrl}`);
      const data = res.data;



      setJenkinsLogs(data.logs || "");
      setPipelineStatus(data.status);

      // Normalize step and update pipelineStage
      const step = (data.step || "").toLowerCase();
      if (step) {

        setPipelineStage(step);
      } else if (data.status === "completed") {

        setPipelineStage("done");
      }

      // Stop polling when done
      if (step === "done" || data.status === "completed") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;

        }
      }

      // JMX file detection
      if (data.message?.includes("Running JMX test")) {
        const match = data.message.match(/Running JMX test: (.+\.jmx)/);
        if (match) {
          setCurrentJmx(match[1]);
        }
      }

    } catch (err) {
      console.error("❌ Error fetching Jenkins progress:", err);
    }
  };

  const StageIcon = ({ label, current, done, icon, isFinalStage }) => {
    const iconStyle = "text-xl";
    let iconToRender = icon;

    if (isFinalStage && current) {
      iconToRender = <MdCloudDone className={iconStyle} />;
    } else if (done) {
      iconToRender = <MdDownloadDone className={iconStyle} />;
    } else if (current) {
      iconToRender = <ImSpinner9 className={`${iconStyle} animate-spin`} />;
    }

    return (
      <div className="flex flex-col items-center space-y-1 min-w-[80px] relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative z-10
        ${done ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/30" :
            current ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30" :
              "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600"}`}>
          {iconToRender}
        </div>
        <span className={`text-xs text-center font-medium transition-colors duration-300 ${done ? "text-green-600" : current ? "text-blue-600" : "text-gray-400"
          }`}>
          {label}
        </span>
      </div>
    );
  };

  const renderProgressUI = () => {
    const stages = [
      { key: "cloning", label: "Clone Repo", icon: <BsGit className="text-xl text-white" /> },
      { key: "running", label: "Run JMX Tests", icon: <FaPlayCircle className="text-xl text-white" /> },
      { key: "uploading", label: "Upload Result", icon: <FaCloudUploadAlt className="text-xl text-white" /> },
      { key: "done", label: "Send Report", icon: <MdCloudDone className="text-xl text-white" /> }
    ];

    const stageIndex = stages.findIndex(s => s.key === pipelineStage);
    const current = stageIndex >= 0;
    if (stageIndex === -1 && pipelineStage !== "queued") {
      console.warn("⚠️ Unknown pipeline stage:", pipelineStage);
    }

    // Calculate progress percentage based on stage positions
    // For 4 stages: 0%, 33.33%, 66.67%, 100% (but cap at 66.67% for visual bounds)
    const stageProgress = stageIndex >= 0 ? (stageIndex / (stages.length - 1)) * 100 : 0;
    const finalProgressPercentage = Math.min(stageProgress, 96.67); // Cap at 66.67% to stop at center of last stage

    return (
      <div className="relative">
        {/* Pipeline Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6 -z-10"></div>

        {/* Pipeline Container */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
          {/* Pipeline Stages */}
          <div className="flex items-center justify-between relative">
            {/* Main Pipeline Line */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full"></div>

            {/* Progress Bar Overlay */}
            <div
              className="absolute top-6 left-5 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{
                width: stageIndex >= 0 ? `calc(${finalProgressPercentage}% - 40px)` : '0px'
              }}

            ></div>


            {stages.map((stage, index) => {
              const done = stageIndex > index;
              const current = stageIndex === index;
              const isFinalStage = stage.key === "done";

              return (
                <div key={stage.key} className="relative z-10">
                  <StageIcon
                    label={stage.label}
                    done={done}
                    current={current}
                    icon={stage.icon}
                    isFinalStage={isFinalStage}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ⏱ Polling effect
  useEffect(() => {
    if (queueUrl && !pollingRef.current) {
      pollingRef.current = setInterval(fetchProgress, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [queueUrl]);



  // Add modalRef for better modal handling
  const modalRef = useRef(null);
  const confirmModalRef = useRef(null);

  const startOAuthFlow = () => {
    const url = new URL(`${import.meta.env.VITE_APP_API_BASE_URL}/github/connect`);
    url.searchParams.append("force", "true");  // Always request fresh session

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const features = `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=1`;

    const authWindow = window.open(url.toString(), "GitHubAuthPopup", features);

    if (!authWindow || authWindow.closed || typeof authWindow.closed === "undefined") {
      throw new Error("Popup blocked");
    }

    // Start polling for connection status after OAuth window opens
    const pollInterval = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(pollInterval);
        // Check connection status after window closes
        setTimeout(() => {
          checkGitHubConnection();
        }, 2000); // Give backend time to process
      }
    }, 1000); // Check every second

    // Also listen for postMessage from success page
    const messageHandler = (event) => {
      if (event.data && event.data.type === "GITHUB_CONNECTED") {
        clearInterval(pollInterval);
        window.removeEventListener("message", messageHandler);
        setTimeout(() => {
          checkGitHubConnection();
        }, 1000);
      }
    };

    window.addEventListener("message", messageHandler);
  };

  const handleGitHubConnect = async () => {
    try {
      // Show account choice modal for all users
      const newModalState = {
        open: true,
        message: (
          <div style={{ textAlign: 'left' }}>
            <p style={{ marginBottom: 12 }}>
              You're about to connect your GitHub account.
            </p>
            <ul style={{ paddingLeft: '1.2em', margin: 0, listStyle: 'disc' }}>
              <li style={{ marginBottom: 10 }}>
                To connect with your GitHub account, click <strong>Connect</strong>.
              </li>
              <li>
                To use a different GitHub account, click <strong>Switch Account</strong>, log in with your preferred account, and then return to connect.
              </li>
            </ul>
          </div>
        ),


        onConfirm: () => {
          // Continue with existing account or connect new account
          startOAuthFlow();
        }
      };

      setConfirmModal(newModalState);

    } catch (error) {
      console.error("Error initiating GitHub OAuth:", error);
      setStatusModal({
        open: true,
        type: 'error',
        message: 'Failed to initiate GitHub login. Please allow popups and try again.'
      });
    }
  };

  const handleSwitchAccount = () => {
    try {
      // Show account switch confirmation
      const newModalState = {
        open: true,
        message: "Do you want to logout of your current GitHub account?\n\nThis is helpful if you want to connect a different GitHub account.\n\nAfter switching accounts, please come back and click 'Connect GitHub' again to continue.",
        onConfirm: () => {
          const logoutWindow = window.open(
            "https://github.com/logout",
            "_blank",
            "width=500,height=600,left=200,top=200"
          );

          if (!logoutWindow) {
            throw new Error("Logout popup blocked");
          }

          // Poll every 500ms to check if logout window is closed
          const pollInterval = setInterval(() => {
            if (logoutWindow.closed) {
              clearInterval(pollInterval);
              startOAuthFlow(); // Automatically trigger connect once logout is done
            }
          }, 500);
        }
      };

      setConfirmModal(newModalState);

    } catch (error) {
      console.error("Error initiating account switch:", error);
      setStatusModal({
        open: true,
        type: 'error',
        message: 'Failed to initiate account switch. Please allow popups and try again.'
      });
    }
  };

  const checkUserLoginStatus = async () => {
    try {
      // Check if user has a valid JWT token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        // Verify token is valid by making a test request
        const res = await axiosInstance.get("/user/profile"); // Assuming this endpoint exists
        if (res.status === 200) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking user login status:", error);
      setLoggedIn(false);
    }
  };

  const checkGitHubConnection = async () => {
    try {
      const res = await axiosInstance.get("/github/token");
      if (res.status === 200) {
        const wasConnected = isConnected;
        setConnected(true);
        fetchRepos();

        // Show success message if this is a new connection
        if (!wasConnected) {
          setStatusModal({
            open: true,
            type: 'success',
            message: 'GitHub connected successfully! You can now configure your repository settings.',
          });
        }
      }
    } catch {
      setConnected(false);
    }
  };

  const fetchRepos = async () => {
    try {
      const res = await axiosInstance.get("/github/repos");
      setRepos(res.data || []);
    } catch (err) {
      console.error("Repo fetch failed", err);
      setStatusModal({ open: true, type: 'error', message: 'Failed to fetch repositories' });
    }
  };

  const fetchBranches = async (repoFullName) => {
    try {
      const res = await axiosInstance.get(`/github/branches?repo=${repoFullName}`);
      setBranches(res.data || []);
    } catch (err) {
      console.error("Branch fetch failed", err);
      setStatusModal({ open: true, type: 'error', message: 'Failed to fetch branches' });
    }
  };

  const fetchFolders = async (repoFullName, branch) => {
    try {
      const res = await axiosInstance.get(`/github/contents?repo=${repoFullName}&path=&branch=${branch}`);
      const folderList = res.data.filter(item => item.type === "dir");
      setFolders(folderList);
    } catch (err) {
      console.error("Folder fetch failed", err);
      setStatusModal({ open: true, type: 'error', message: 'Failed to fetch folders' });
    }
  };

  const fetchFiles = async (repoFullName, path, branch) => {
    if (!path) return;
    try {
      const res = await axiosInstance.get(`/github/contents?repo=${repoFullName}&path=${path}&branch=${branch}`);
      const allowedExtensions = [".jmx", ".csv", ".xlsx"];
      const testFiles = res.data.filter(file =>
        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );

      setFiles(testFiles);


      // Auto-select all if no files are currently selected
      if (selectedFiles.length === 0) {
        const allFileNames = testFiles.map(file => file.name); // ✅
        setSelectedFiles(allFileNames);
      }

    } catch (err) {
      console.error("File fetch failed", err);
      setStatusModal({ open: true, type: 'error', message: 'Failed to fetch JMX files' });
    }
  };

  const handleRepoChange = (e) => {
    const repo = e.target.value;
    setSelectedRepo(repo);
    setSelectedBranch("main");
    setSelectedFolder("");
    setSelectedFiles([]);
    if (repo) {
      fetchBranches(repo);
      fetchFolders(repo, "main");
    }
  };

  const handleBranchChange = (e) => {
    const branch = e.target.value;
    setSelectedBranch(branch);
    if (selectedRepo && branch) {
      fetchFolders(selectedRepo, branch);
    }
  };

  const handleFolderChange = (e) => {
    const folder = e.target.value;
    setSelectedFolder(folder);
    setSelectedFiles([]);
    if (selectedRepo && folder && selectedBranch) {
      fetchFiles(selectedRepo, folder, selectedBranch);
    }
  };

  const handleFileToggle = (fileName) => {
    if (!fileName) {
      console.warn("No filename provided for toggle");
      return;
    }
    const updated = selectedFiles.includes(fileName)
      ? selectedFiles.filter(f => f !== fileName)
      : [...selectedFiles, fileName];
    setSelectedFiles(updated);
  };

  const handleSelectAll = () => {
    if (!files || files.length === 0) {
      console.warn("No files available to select");
      return;
    }
    const all = files.map(f => f.name);
    setSelectedFiles(all);
  };

  const triggerJenkins = async () => {
    // Validate all required fields
    if (!selectedRepo?.trim()) {
      setStatusModal({ open: true, type: 'info', message: 'Please select a repository.' });
      return;
    }
    if (!selectedBranch?.trim()) {
      setStatusModal({ open: true, type: 'info', message: 'Please select a branch.' });
      return;
    }
    if (!selectedFolder?.trim()) {
      setStatusModal({ open: true, type: 'info', message: 'Please select a folder.' });
      return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      setStatusModal({ open: true, type: 'info', message: 'Please select at least one JMX file.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', message: '' });

    // Reset progress-related state
    setQueueUrl("");
    setPipelineStatus("running");
    setPipelineStage("queued");
    setJenkinsLogs("");
    setShowProgressUI(false);


    try {
      const payload = {
        repo_url: `https://github.com/${selectedRepo.trim()}`,
        branch: selectedBranch.trim(),
        jmx_folder: selectedFolder.trim(),
        test_files: selectedFiles,  // now includes .jmx, .csv, .xlsx
      };

      const res = await axiosInstance.post("/jenkins/trigger-jenkins", payload);


      if (res.data?.status === "success") {
        setQueueUrl(res.data.queue_url);
        setStatusModal({ open: true, type: 'success', message: 'Jenkins triggered successfully!' });
        setShowProgressUI(true);
      } else {
        setStatusModal({ open: true, type: 'error', message: `Jenkins trigger failed: ${res.data?.message || 'Unknown error'}` });
        console.error("Backend responded with error:", res.data);
      }
    } catch (err) {
      console.error("❌ Axios error triggering Jenkins:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
        setStatusModal({ open: true, type: 'error', message: `❌ Error: ${err.response.data?.message || "Unknown backend error"}` });
      } else if (err.request) {
        console.error("Request made but no response:", err.request);
        setStatusModal({ open: true, type: 'error', message: '❌ No response from server' });
      } else {
        console.error("Something else went wrong:", err.message);
        setStatusModal({ open: true, type: 'error', message: '❌ Failed to trigger Jenkins' });
      }
    } finally {
      setLoading(false);
    }
  };




  const handleDisconnectClick = () => {
    setDisconnectConfirmModal({ open: true });
  };

  const disconnectGitHub = async () => {
    if (isDisconnecting) {
      return;
    }

    setDisconnecting(true);
    setDisconnectConfirmModal({ open: false }); // Close the confirmation modal

    const clearStorageAndState = () => {
      resetAll();
    };

    try {
      // Show loading modal (non-dismissible)
      setDisconnectLoadingModal({ open: true });

      const response = await axiosInstance.post("/github/disconnect");

      // Add artificial delay for better UX (3-5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3500));

      clearStorageAndState();
      setDisconnectLoadingModal({ open: false });
      setStatusModal({
        open: true,
        type: "success",
        message: "GitHub disconnected successfully",
      });

      // 👇 Sign out of GitHub in background (no popup UI)
      const logoutUrl = response.data.github_logout_url;
      if (logoutUrl) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = logoutUrl;
        document.body.appendChild(iframe);

        // Auto-remove after a while
        setTimeout(() => document.body.removeChild(iframe), 3000);
      }
    } catch (err) {
      console.error("Disconnect failed:", err);

      if (err.response) {
        setStatusModal({
          open: true,
          type: "error",
          message: `Failed to disconnect: ${err.response.data?.error || "Server error"}`
        });
      } else {
        setStatusModal({
          open: true,
          type: "error",
          message: `Failed to disconnect: ${err.message}`
        });
      }

      clearStorageAndState();
    } finally {
      setDisconnecting(false);
    }
  };




  useEffect(() => {
    checkUserLoginStatus();
    checkGitHubConnection();
  }, []);

  // Listen for GitHub connection success messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "GITHUB_CONNECTED") {

        // Refresh the connection status after successful connection
        setTimeout(() => {
          checkGitHubConnection();
        }, 1000); // Small delay to ensure backend has processed the connection
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchBranches(selectedRepo);
      fetchFolders(selectedRepo, selectedBranch);
    }
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedRepo && selectedFolder && selectedBranch) {
      fetchFiles(selectedRepo, selectedFolder, selectedBranch);
    }
  }, [selectedFolder]);



  // Improved modal handling with click-outside detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle status modal closing - check if click is outside the modal
      if (statusModal.open && modalRef.current) {
        // Check if the click target is within the modal
        const isClickInsideModal = modalRef.current.contains(event.target);

        // If click is outside modal, close it
        if (!isClickInsideModal) {
          setStatusModal({ open: false, message: '', type: 'info' });
        }
      }

      // Handle confirm modal closing - check if click is outside the modal
      if (confirmModal.open && confirmModalRef.current) {
        // Check if the click target is within the modal
        const isClickInsideConfirmModal = confirmModalRef.current.contains(event.target);

        // If click is outside modal, close it
        if (!isClickInsideConfirmModal) {
          setConfirmModal({ open: false, message: '', onConfirm: null });
        }
      }
    };

    // Add event listener for click outside
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusModal.open, confirmModal.open]);




  // Render different UI based on connection status and user login status
  if (!isConnected) {
    return (
      <>
        <div style={{ paddingLeft: 'clamp(16px, 3vw, 28px)' }}>
          <div style={{ marginTop: "34px", paddingLeft: "clamp(10px, 3vw, 48px)", padding: "32px", width: "100%", boxSizing: "border-box", position: "relative" }}>
            <Typography
              variant="h3"
              className="main-page-heading"
              style={{
                marginLeft: '-4px',
                marginBottom: '8px',
                fontSize: "clamp(1.5rem, 7vw, 2.2rem)",
                fontWeight: "900",
                color: "#FF6D00",
                letterSpacing: "0.5px",
                whiteSpace: 'normal',
                overflowWrap: 'break-word', // tighter than before
              }}
            >
              GitHub Jenkins Integration
            </Typography>

            <Typography
              variant="h6"
              style={{
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                fontWeight: '550',
                fontStyle: 'bold',
                opacity: '0.85',
                color: '#333333',
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                marginTop: '0px',
                marginBottom: '0px',
              }}
            >
              Connect your GitHub repository to trigger Jenkins tests automatically!
            </Typography>
          </div>

          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: '2rem'
          }}>
            <Paper elevation={3} sx={{
              maxWidth: 600,
              width: '100%',
              padding: '3rem 2rem',
              borderRadius: '16px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #ffffff 0%, #fff8f0 100%)',
              border: '1px solid #FFE0B2',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <FaGithub size={64} color="#FF6D00" />
              </Box>



              <Typography variant="h5" sx={{
                color: '#FF6D00',
                fontWeight: 700,
                mb: 2,
                fontFamily: "'Poppins', sans-serif"
              }}>
                Connect GitHub
              </Typography>
              <Typography variant="body1" sx={{
                color: '#666',
                mb: 3,
                fontFamily: "'Poppins', sans-serif"
              }}>
                Link your GitHub account to access repositories and trigger Jenkins tests
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleGitHubConnect()}
                startIcon={<FaUserPlus />}
                sx={{
                  background: '#FF6D00',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(255, 109, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#e65c00',
                    boxShadow: '0 6px 16px rgba(255, 109, 0, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Connect with GitHub
              </Button>

            </Paper>
          </Box>
        </div >

        {/* Confirmation Modal - moved outside conditional return */}
        {
          confirmModal.open && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div
                ref={confirmModalRef}
                style={{
                  width: '100%',
                  maxWidth: 480,
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  borderRadius: '20px',
                  color: '#ffffff',
                  padding: '2.5rem 2rem 2rem 2rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                  borderLeft: '5px solid #FF7A00',
                  animation: 'fadeInScale 0.3s ease-out',
                  position: 'relative',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Header with Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 20,
                  gap: 12,
                  color: '#FF7A00',
                  textShadow: '0 0 10px rgba(255, 122, 0, 0.3)',
                }}>
                  <FaInfoCircle size={26} />
                  Confirm Action
                </div>

                {/* Message */}
                <div style={{
                  fontSize: 16,
                  color: '#e0e0e0',
                  marginBottom: 28,
                  wordBreak: 'break-word',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  fontWeight: 400,
                }}>
                  {confirmModal.message}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                }}>
                  <button
                    onClick={() => {
                      setConfirmModal({ open: false, message: '', onConfirm: null });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: '14px 28px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease',
                      minWidth: 120,
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #5a5a5a 0%, #4a4a4a 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirmModal({ open: false, message: '', onConfirm: null });
                      if (confirmModal.onConfirm) {
                        try {
                          confirmModal.onConfirm();
                        } catch (error) {
                          console.error("Error in confirm action:", error);
                          setStatusModal({
                            open: true,
                            type: 'error',
                            message: 'Failed to initiate GitHub login. Please allow popups and try again.'
                          });
                        }
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF6D00 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px 28px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 15px rgba(255, 122, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease',
                      minWidth: 120,
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FF8A00 0%, #FF7A00 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 122, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FF7A00 0%, #FF6D00 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 122, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                    }}
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => {
                      setConfirmModal({ open: false, message: '', onConfirm: null });
                      // Switch to new account
                      const logoutWindow = window.open(
                        "https://github.com/logout",
                        "_blank",
                        "width=500,height=600,left=200,top=200"
                      );

                      if (!logoutWindow) {
                        setStatusModal({
                          open: true,
                          type: 'error',
                          message: 'Failed to open logout window. Please allow popups and try again.'
                        });
                        return;
                      }

                      // Poll every 500ms to check if logout window is closed
                      const pollInterval = setInterval(() => {
                        if (logoutWindow.closed) {
                          clearInterval(pollInterval);
                          startOAuthFlow(); // Automatically trigger connect once logout is done
                        }
                      }, 500);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0096FF 0%, #0077CC 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '14px 28px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 15px rgba(0, 150, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease',
                      minWidth: 120,
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00A6FF 0%, #0096FF 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 150, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #0096FF 0%, #0077CC 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 150, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
                    }}
                  >
                    Switch Account
                  </button>
                </div>
              </div>

              <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0.92);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
            </div>
          )
        }
      </>
    );
  }

  return (
    <div style={{ paddingLeft: 'clamp(16px, 3vw, 28px)', marginBottom: '50px' }}>
      <div style={{ marginTop: "30px", paddingLeft: "clamp(10px, 3vw, 48px)", padding: "32px", width: "100%", boxSizing: "border-box", position: "relative" }}>
        <Typography
          variant="h3"
          className="main-page-heading"
          style={{
            marginLeft: 0,
            marginBottom: '8px',
            fontSize: "clamp(1.5rem, 7vw, 2.2rem)",
            fontWeight: "900",
            color: "#FF6D00",
            letterSpacing: "0.5px",
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          GitHub Jenkins Integration
        </Typography>

        <Typography
          variant="h6"
          style={{
            color: '#333333',
            fontWeight: 550,
            fontSize: '16px',
            fontStyle: 'bold',
            letterSpacing: '0.3px',
            opacity: '0.85',
            position: 'relative',
            zIndex: 1,
            marginLeft: 0,
            marginTop: '0px',
            marginBottom: '0px',
          }}
        >
          Connect your GitHub repository to trigger Jenkins tests automatically!
        </Typography>
      </div>

      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 1,
        padding: '0 2vw'
      }}>
        <Paper elevation={6} sx={{
          maxWidth: 800,
          width: '100%',
          padding: '2.5rem 2rem',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff8f0 100%)',
          border: '1.5px solid #FFD180',
          boxShadow: '0 12px 36px 0 rgba(255, 109, 0, 0.10)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 20px 48px 0 rgba(255, 109, 0, 0.16)',
            transform: 'translateY(-6px) scale(1.01)',
            borderColor: '#FFB74D',
          },
        }}>
          {/* Header with disconnect and switch account buttons */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '2px solid #FFE0B2'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FaLink color="#FF6D00" size={24} />
              <Typography variant="h5" sx={{
                color: '#FF6D00',
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif"
              }}>
                Repository Configuration
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleDisconnectClick}
              disabled={isDisconnecting}
              startIcon={isDisconnecting ? <CircularProgress size={16} color="inherit" /> : <FiLogOut />}
              sx={{
                backgroundColor: '#d32f2f',
                color: 'white',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                marginLeft: 'auto', // Push to the right
                '&:hover': {
                  backgroundColor: '#b71c1c',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#999',
                }
              }}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </Box>

          {/* Status Message - Removed Alert component, now using StatusModal */}

          {/* Repository Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{
              color: '#FF6D00',
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FaGithub />
              Repository
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Repository</InputLabel>
              <Select
                value={selectedRepo}
                onChange={handleRepoChange}
                label="Select Repository"
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF6D00',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF6D00',
                  }
                }}
              >
                <MenuItem value="">-- Choose a repository --</MenuItem>
                {repos.map(repo => (
                  <MenuItem key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Branch Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{
              color: '#FF6D00',
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiGitBranch />
              Branch
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Branch</InputLabel>
              <Select
                value={selectedBranch}
                onChange={handleBranchChange}
                label="Select Branch"
                disabled={!selectedRepo}
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF6D00',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF6D00',
                  }
                }}
              >
                {branches.map(branch => (
                  <MenuItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Folder Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{
              color: '#FF6D00',
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiFolder />
              JMX Folder
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Folder</InputLabel>
              <Select
                value={selectedFolder}
                onChange={handleFolderChange}
                label="Select Folder"
                disabled={!selectedRepo || !selectedBranch}
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF6D00',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FF6D00',
                  }
                }}
              >
                <MenuItem value="">-- Choose a folder --</MenuItem>
                {folders.map(folder => (
                  <MenuItem key={folder.name} value={folder.path}>
                    {folder.path}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* File Selection */}
          {files.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h6" sx={{
                  color: '#FF6D00',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <FiFile />
                  Test Files ({selectedFiles.length}/{files.length})
                </Typography>
                <Button
                  variant="text"
                  onClick={() => {
                    if (selectedFiles.length === files.length) {
                      // Deselect all
                      setSelectedFiles([]);
                    } else {
                      // Select all
                      handleSelectAll();
                    }
                  }}
                  sx={{
                    color: '#FF6D00',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 109, 0, 0.04)',
                    }
                  }}
                >
                  {selectedFiles.length === files.length ? "Deselect All" : "Select All"}
                </Button>

              </Box>

              <Paper elevation={1} sx={{
                p: 2,
                borderRadius: '12px',
                backgroundColor: '#fafafa',
                border: '1px solid #E0E0E0'
              }}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 1
                }}>
                  {files.map(file => (
                    <FormControlLabel
                      key={file.name}
                      control={
                        <Checkbox
                          checked={selectedFiles.includes(file.name)}
                          onChange={() => handleFileToggle(file.name)}
                          sx={{
                            color: '#FF6D00',
                            '&.Mui-checked': {
                              color: '#FF6D00',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{
                          fontSize: '14px',
                          color: '#333',
                          fontFamily: 'monospace'
                        }}>
                          {file.name}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          )}



          {/* Summary Info */}
          {selectedRepo && (
            <Box sx={{
              mt: 3,
              p: 2,
              backgroundColor: '#FFF3E0',
              borderRadius: '12px',
              border: '1px solid #FFE0B2'
            }}>
              <Typography variant="subtitle2" sx={{
                color: '#FF6D00',
                fontWeight: 600,
                mb: 1
              }}>
                Configuration Summary
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`Repo: ${selectedRepo}`}
                  size="small"
                  sx={{ backgroundColor: '#FF6D00', color: 'white' }}
                />
                <Chip
                  label={`Branch: ${selectedBranch}`}
                  size="small"
                  sx={{ backgroundColor: '#FF6D00', color: 'white' }}
                />
                {selectedFolder && (
                  <Chip
                    label={`Folder: ${selectedFolder}`}
                    size="small"
                    sx={{ backgroundColor: '#FF6D00', color: 'white' }}
                  />
                )}
                <Chip
                  label={`Files: ${selectedFiles.length}`}
                  size="small"
                  sx={{ backgroundColor: '#FF6D00', color: 'white' }}
                />
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3, borderColor: '#FFE0B2' }} />

          {/* Trigger Button */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2
          }}>
            <Button
              variant="contained"
              onClick={triggerJenkins}
              disabled={isLoading || !selectedRepo?.trim() || !selectedBranch?.trim() || !selectedFolder?.trim() || !selectedFiles || selectedFiles.length === 0}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <FaPlay />}
              sx={{
                background: isLoading ? '#ccc' : 'linear-gradient(90deg, #FF9800 0%, #FF6D00 100%)',
                color: 'white',
                padding: '16px 38px',
                borderRadius: '14px',
                fontSize: '18px',
                fontWeight: '700',
                textTransform: 'none',
                boxShadow: '0 4px 16px rgba(255, 109, 0, 0.18)',
                transition: 'all 0.3s ease',
                minWidth: '220px',
                letterSpacing: '0.01em',
                '&:hover': {
                  background: isLoading ? '#ccc' : 'linear-gradient(90deg, #FFB74D 0%, #FF6D00 100%)',
                  boxShadow: isLoading ? 'none' : '0 8px 24px rgba(255, 109, 0, 0.22)',
                  transform: isLoading ? 'none' : 'translateY(-2px) scale(1.01)'
                },
                '&:disabled': {
                  background: '#ccc',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              {isLoading ? "Triggering..." : "Trigger Jenkins Test"}
            </Button>
          </Box>


        </Paper>
      </Box>

      {showProgressUI && pipelineStatus && (
        <Box sx={{
          mt: 4,
          mr: 'clamp(16px, 3vw, 24px)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background elements */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'linear-gradient(135deg, rgba(255,109,0,0.1) 0%, rgba(255,109,0,0.05) 100%)',
            borderRadius: '50%',
            zIndex: 0
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, rgba(255,109,0,0.08) 0%, rgba(255,109,0,0.03) 100%)',
            borderRadius: '50%',
            zIndex: 0
          }}></div>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Enhanced Pipeline Progress Header */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              pb: 2,
              borderBottom: '2px solid #FFE0B2'
            }}>
              <div style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 109, 0, 0.3)'
              }}>
                <FaPlay style={{ color: 'white', fontSize: '18px' }} />
              </div>
              <Typography variant="h5" sx={{
                color: "#FF6D00",
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                background: 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Pipeline Progress
              </Typography>
            </Box>

            {/* Enhanced Progress UI */}
            <Box sx={{
              background: 'none',
              borderRadius: '16px',
              padding: '1.5rem',
              mb: 3,


            }}>
              {renderProgressUI()}
            </Box>

            {/* Enhanced Currently Running Display */}
            {currentJmx && (
              <Box sx={{
                background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                borderRadius: '12px',
                padding: '1rem',
                mb: 3,
                border: '1px solid #2196F3',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)'
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: '#2196F3',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 2s infinite'
                }}>
                  <FaPlay style={{ color: 'white', fontSize: '12px' }} />
                </div>
                <Typography sx={{
                  color: '#1976D2',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  🧪 Currently Running: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{currentJmx}</span>
                </Typography>
              </Box>
            )}

            {/* Enhanced Jenkins Logs Header */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              pt: 2,
              borderTop: '2px solid #FFE0B2'
            }}>
              <div style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 109, 0, 0.3)'
              }}>
                <FaTerminal style={{ color: 'white', fontSize: '18px' }} />
              </div>
              <Typography variant="h5" sx={{
                color: "#FF6D00",
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                background: 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Jenkins Logs
              </Typography>
            </Box>

            {/* Enhanced Logs Display */}
            <Box sx={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Log header with status indicator */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                pb: 1,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  background: pipelineStatus === 'completed' ? '#4CAF50' : '#FF9800',
                  borderRadius: '50%',
                  animation: pipelineStatus !== 'completed' ? 'pulse 2s infinite' : 'none'
                }}></div>
                <Typography sx={{
                  color: '#e0e0e0',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  {pipelineStatus === 'completed' ? 'Pipeline Completed' : 'Pipeline Running'}
                </Typography>
              </Box>

              {/* Enhanced logs content */}
              <Box sx={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: '1rem',
                maxHeight: '400px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#e0e0e0',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#e0e0e0'
                }}>
                  {jenkinsLogs || (
                    <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                      Waiting for logs...
                    </span>
                  )}
                </pre>
              </Box>
            </Box>
          </Box>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </Box>
      )}





      {/* Status Modal */}
      <StatusModal
        ref={modalRef}
        open={statusModal.open}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => {

          setStatusModal({ ...statusModal, open: false });
        }}
      />

      {/* Disconnect Confirmation Modal */}
      <DisconnectConfirmModal
        open={disconnectConfirmModal.open}
        onClose={() => setDisconnectConfirmModal({ open: false })}
        onConfirm={disconnectGitHub}
      />

      <DisconnectLoadingModal open={disconnectLoadingModal.open} />

      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        onCancel={() => {
          setConfirmModal({ open: false, message: '', onConfirm: null });
          startOAuthFlow();
        }}
        onConfirm={() => {
          setConfirmModal({ open: false, message: '', onConfirm: null });
          confirmModal.onConfirm?.();
        }}
      />




    </div>
  );
};

export default JenkinsTriggerForm;