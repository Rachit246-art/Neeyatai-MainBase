import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useJenkinsStore = create(
  persist(
    (set, get) => ({
      // GitHub Connection State
      isConnected: false,
      
      // Repository Selection
      selectedRepo: '',
      selectedBranch: 'main',
      selectedFolder: '',
      selectedFiles: [],
      
      // Pipeline State
      pipelineStage: 'queued',
      pipelineStatus: 'running',
      showProgressUI: false,
      queueUrl: '',
      jenkinsLogs: '',
      currentJmx: '',
      
      // UI State
      isLoading: false,
      isDisconnecting: false,
      statusMessage: { type: '', message: '' },
      statusModal: { open: false, message: '', type: 'info' },
      confirmModal: { open: false, message: '', onConfirm: null },
      disconnectConfirmModal: { open: false },
      disconnectLoadingModal: { open: false },
      
      // Data Lists
      repos: [],
      branches: [],
      folders: [],
      files: [],
      
      // Actions
      setConnected: (isConnected) => set({ isConnected }),
     
      
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
      setSelectedFolder: (folder) => set({ selectedFolder: folder }),
      setSelectedFiles: (files) => set({ selectedFiles: files }),
      
      setPipelineStage: (stage) => set({ pipelineStage: stage }),
      setPipelineStatus: (status) => set({ pipelineStatus: status }),
      setShowProgressUI: (show) => set({ showProgressUI: show }),
      setQueueUrl: (url) => set({ queueUrl: url }),
      setJenkinsLogs: (logs) => set({ jenkinsLogs: logs }),
      setCurrentJmx: (jmx) => set({ currentJmx: jmx }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setDisconnecting: (disconnecting) => set({ isDisconnecting: disconnecting }),
      setStatusMessage: (message) => set({ statusMessage: message }),
      setStatusModal: (modal) => set({ statusModal: modal }),
      setConfirmModal: (modal) => set({ confirmModal: modal }),
      setDisconnectConfirmModal: (modal) => set({ disconnectConfirmModal: modal }),
      setDisconnectLoadingModal: (modal) => set({ disconnectLoadingModal: modal }),
      
      setRepos: (repos) => set({ repos }),
      setBranches: (branches) => set({ branches }),
      setFolders: (folders) => set({ folders }),
      setFiles: (files) => set({ files }),
      
      // Reset actions
      resetPipeline: () => set({
        pipelineStage: 'queued',
        pipelineStatus: 'running',
        showProgressUI: false,
        queueUrl: '',
        jenkinsLogs: '',
        currentJmx: ''
      }),
      
      resetSelection: () => set({
        selectedRepo: '',
        selectedBranch: 'main',
        selectedFolder: '',
        selectedFiles: []
      }),
      
      resetAll: () => set({
        isConnected: false,
       
        selectedRepo: '',
        selectedBranch: 'main',
        selectedFolder: '',
        selectedFiles: [],
        pipelineStage: 'queued',
        pipelineStatus: 'running',
        showProgressUI: false,
        queueUrl: '',
        jenkinsLogs: '',
        currentJmx: '',
        isLoading: false,
        isDisconnecting: false,
        statusMessage: { type: '', message: '' },
        statusModal: { open: false, message: '', type: 'info' },
        confirmModal: { open: false, message: '', onConfirm: null },
        disconnectConfirmModal: { open: false },
        disconnectLoadingModal: { open: false },
        repos: [],
        branches: [],
        folders: [],
        files: []
      })
    }),
    {
      name: 'jenkins-store', // localStorage key
      partialize: (state) => ({
        isConnected: state.isConnected,
       
        selectedRepo: state.selectedRepo,
        selectedBranch: state.selectedBranch,
        selectedFolder: state.selectedFolder,
        selectedFiles: state.selectedFiles,
        pipelineStage: state.pipelineStage,
        pipelineStatus: state.pipelineStatus,
        showProgressUI: state.showProgressUI,
        queueUrl: state.queueUrl,
        jenkinsLogs: state.jenkinsLogs,
        currentJmx: state.currentJmx,
        repos: state.repos,
        branches: state.branches,
        folders: state.folders,
        files: state.files
      }),
    }
  )
); 