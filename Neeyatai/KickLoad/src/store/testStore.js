import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../api/axiosInstance';
import { useAnalysisStore } from './analysisStore';



const formatDateSafe = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "" : date.toLocaleString();
};


export const useTestStore = create(
  persist(
    (set, get) => ({
      remainingUsers: 0,


      currentTestId: null,
      isRunning: false,
      logs: [],
      eventSource: null, // To hold SSE connection
      resultFile: null,
      summaryOutput: null,
      selectedFilename: '',
      editedParams: null,
      jmxParams: null,
      pdfActionModal: { open: false, filename: '' },
      modal: { open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false },
      // Actions

      // Inside the Zustand store:
      fetchRemainingUsers: async () => {
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        let user = null;

        try {
          user = userStr ? JSON.parse(userStr) : null;
        } catch (e) {
          console.warn("Failed to parse user from storage", e);
        }

        const now = new Date();
        const trialEnd = user?.trial_ends_at ? new Date(user.trial_ends_at) : null;
        const paidEnd = user?.paid_ends_at ? new Date(user.paid_ends_at) : null;

        let licenseStatus = "expired";
        if (paidEnd && paidEnd > now) licenseStatus = "paid";
        else if (trialEnd && trialEnd > now) licenseStatus = "trial";

        try {
          const res = await axiosInstance.get("/remaining-virtual-users");
          const remaining = res.data?.remaining_virtual_users ?? (licenseStatus === "trial" ? 100 : 1_000_000);
          set({ remainingUsers: remaining });
        } catch (err) {
          console.error("Failed to fetch remaining virtual users:", err);
          set({
            remainingUsers:
              licenseStatus === "trial" ? 100 :
                licenseStatus === "paid" ? 1_000_000 : 0
          });
        }
      }
      ,
      // Inside useTestStore:
      availableFiles: [],
      history: [],

      setAvailableFiles: (files) => set({ availableFiles: files }),
      setHistory: (history) => {

        set({ history: Array.isArray(history) ? [...history] : [] });
        // Trigger fetchJtlFiles from the other store
        useAnalysisStore.getState().fetchJtlFiles();

      },


      fetchJmxFiles: async () => {
        try {
          const res = await axiosInstance.get("/list-files?type=jmx");
          const files = (res.data || []).map(file => file.filename);
          set({ availableFiles: files });
        } catch (err) {
          console.error("Failed to fetch .jmx files:", err);
        }
      },

      fetchPdfHistory: async () => {
        try {
          const res = await axiosInstance.get("/list-files?type=pdf&filter_prefix=test_plan_");

          const parsedHistory = (res.data || []).map(file => ({
            filename: file.filename,
            date: formatDateSafe(file.datetime),
          }));
          get().setHistory(parsedHistory);
        } catch (err) {
          console.error("Error fetching PDF history:", err);
        }
      },

      setRemainingUsers: (count) => set({ remainingUsers: count }),
      // Start test and open SSE connection for live logs
      startTest: (testId) => {
        // Close old connection if any
        if (get().eventSource) {
          get().eventSource.close();
        }

        set({ currentTestId: testId, isRunning: true, logs: [] });

        const source = new EventSource(`${import.meta.env.VITE_APP_API_BASE_URL}/stream-logs/${testId}`);

        source.onmessage = (event) => {
          const message = event.data;
          set(state => ({ logs: [...state.logs, message] }));

          if (message.includes("TEST COMPLETE")) {
            get().stopTest();
            source.close();
          }
        };

        source.onerror = (err) => {
          console.error("SSE error:", err);
          source.close();
          set({ eventSource: null, isRunning: false });
        };

        set({ eventSource: source });
      },

     
      setResult: (resultFile, summaryOutput) => set({ resultFile, summaryOutput, isRunning: false }),
      // Stop test and close connection
      stopTest: () => {
        if (get().eventSource) {
          get().eventSource.close();
        }
        set({ currentTestId: null, isRunning: false, eventSource: null });
      },

      appendLog: (log) => {
        set(state => ({ logs: [...state.logs, log] }));
      },
      // Reset test, clear logs
      resetTest: () => {
        if (get().eventSource) {
          get().eventSource.close();
        }
        set({ currentTestId: null, isRunning: false, logs: [], eventSource: null, resultFile: null, summaryOutput: null, lastShownPdfFilename: null });
      },
      setSelectedFilename: (filename) => set({ selectedFilename: filename }),
      setEditedParams: (params) => set({ editedParams: params }),
      setJmxParams: (params) => set({ jmxParams: params }),
      setPdfActionModal: (modal) => set({ pdfActionModal: modal }),
      setModal: (modal) => set({ modal }),
      lastShownPdfFilename: null,
      setLastShownPdfFilename: (filename) => set({ lastShownPdfFilename: filename }),
    }),
    {
      name: 'test-store', // localStorage key
      partialize: (state) => ({
        currentTestId: state.currentTestId,
        isRunning: state.isRunning,
        logs: state.logs,
        resultFile: state.resultFile,
        summaryOutput: state.summaryOutput,
        selectedFilename: state.selectedFilename,
        editedParams: state.editedParams,
        jmxParams: state.jmxParams,
        pdfActionModal: state.pdfActionModal,
        modal: state.modal,
        lastShownPdfFilename: state.lastShownPdfFilename,
        remainingUsers: state.remainingUsers,

        availableFiles: state.availableFiles,
        history: state.history,
      }),
    }
  )
);



