import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTestStore } from './testStore'; // adjust path

export const useTestPlanStore = create(
  persist(
    (set, get) => ({
      // State
      message: '',
      chat: [
        {
          type: 'bot',
          text: `👋 Welcome to KickLoad!\n\nI help you generate test plans for load and performance testing — just describe your test in plain English!\n\n💡 You can also type:\n• 'help' — for full instructions & test format\n• 'upload csv' — to learn how CSV data works with examples\n• 'upload jmx' — to reuse or fix a JMeter test plan\n• 'clear' or 'reset' — to restart the chat anytime\n\n🚀 Just type your test idea or one of the keywords above to begin.`,
        },
      ],
      jmxFilename: '',
      history: [],
      searchQuery: '',
      isLoading: false,
      downloadReady: false,
      showUploadMenu: false,
      uploading: false,
      attachedFiles: [],
      openMenuIndex: null,
      menuPosition: { top: 0, left: 0 },
      modal: { open: false, type: '', filename: '' },
      statusModal: { open: false, message: '', type: 'info' },
      pdfActionModal: { open: false, filename: '' },
      jmxViewer: { open: false, content: '', filename: '' },
      containerHeight: 100,
      rows: 2,

      // Actions
      setMessage: (v) => set({ message: v }),
      setChat: (v) => set({ chat: v }),
      setJmxFilename: (v) => set({ jmxFilename: v }),
      setHistory: (v) => {
        set({ history: Array.isArray(v) ? [...v] : [] });
        useTestStore.getState().fetchJmxFiles();
      },

      setSearchQuery: (v) => set({ searchQuery: v }),
      setIsLoading: (v) => set({ isLoading: v }),
      setDownloadReady: (v) => set({ downloadReady: v }),
      setShowUploadMenu: (v) => set({ showUploadMenu: v }),
      setUploading: (v) => set({ uploading: v }),
      setAttachedFiles: (value) =>
        set((state) => {
          // If it's a function (like prev => ...)
          if (typeof value === 'function') {
            return { attachedFiles: value(state.attachedFiles) };
          }

          // If it's a File object
          if (value && value.name) {
            // Prevent duplicates
            if (state.attachedFiles.some(f => f.name === value.name)) {
              return state;
            }
            return { attachedFiles: [...state.attachedFiles, value] };
          }

          // If somehow it's empty/null, reset to []
          return { attachedFiles: [] };
        }),



      setOpenMenuIndex: (v) => set({ openMenuIndex: v }),
      setMenuPosition: (v) => set({ menuPosition: v }),
      setModal: (v) => set({ modal: v }),
      setStatusModal: (v) => set({ statusModal: v }),
      setPdfActionModal: (v) => set({ pdfActionModal: v }),
      setJmxViewer: (v) => set({ jmxViewer: v }),
      setContainerHeight: (v) => set({ containerHeight: v }),
      setRows: (v) => set({ rows: v }),
    }),
    {
      name: 'testplan-store',
      version: 2,

      // Migration to fix older corrupted chat values
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;

        return {
          ...persistedState,
          chat: Array.isArray(persistedState.chat)
            ? persistedState.chat
            : [
              {
                type: 'bot',
                text: `👋 Welcome to KickLoad!\n\nI help you generate test plans for load and performance testing — just describe your test in plain English!\n\n💡 You can also type:\n• 'help' — for full instructions & test format\n• 'upload csv' — to learn how CSV data works with examples\n• 'upload jmx' — to reuse or fix a JMeter test plan\n• 'clear' or 'reset' — to restart the chat anytime\n\n🚀 Just type your test idea or one of the keywords above to begin.`,
              },
            ],
        };
      },



      // Only persist relevant keys
      partialize: (state) => ({
        message: state.message,
        chat: state.chat,
        jmxFilename: state.jmxFilename,
        history: state.history,
        searchQuery: state.searchQuery,
        downloadReady: state.downloadReady,
        attachedFiles: state.attachedFiles,
        modal: state.modal,
        statusModal: state.statusModal,
        pdfActionModal: state.pdfActionModal,
        jmxViewer: state.jmxViewer,
        containerHeight: state.containerHeight,
        rows: state.rows,
      }),

    }
  )
);


