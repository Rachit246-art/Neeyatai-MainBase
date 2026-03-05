import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../api/axiosInstance'; // adjust path

const formatDateSafe = (dateString) => {
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

export const useAnalysisStore = create(
  persist(
    (set, get) => ({
      selectedFilename: '',
      pdfFilename: null,
      analyzing: false,
      history: [], // PDF history
      searchQuery: '',
      availableFiles: [], // JTL files
      modal: { open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false },
      pdfActionModal: { open: false, filename: '' },
      htmlReport: null,
      pdfUrl: null,

      // State setters
      setSelectedFilename: (v) => set({ selectedFilename: v }),
      setPdfFilename: (v) => set({ pdfFilename: v }),
      setAnalyzing: (v) => set({ analyzing: v }),
      setHistory: (v) => set({ history: Array.isArray(v) ? v : [] }),
      setSearchQuery: (v) => set({ searchQuery: v }),
      setAvailableFiles: (v) => set({ availableFiles: v }),
      setModal: (v) => set({ modal: v }),
      setPdfActionModal: (v) => set({ pdfActionModal: v }),
      setHtmlReport: (v) => set({ htmlReport: v }),
      setPdfUrl: (v) => set({ pdfUrl: v }),

      // Fetch JTL files only if not already fetched
      fetchJtlFiles: async () => {
      
        try {
          const jtlRes = await axiosInstance.get("/list-files?type=jtl");
        
          if (Array.isArray(jtlRes.data)) {
            set({ availableFiles: jtlRes.data.map(f => f.filename) });
          } else {
            console.warn("Unexpected JTL response shape:", jtlRes.data);
          }
        } catch (err) {
          console.error("Failed to fetch JTL files:", err);
        }
      },

      // Fetch PDF history only if not already fetched
      fetchPdfHistory: async () => {
        if (get().history && get().history.length) return; // already fetched
        try {
          const pdfRes = await axiosInstance.get("/list-files?type=pdf&filter_prefix=analysis_");
          if (Array.isArray(pdfRes.data)) {
            const formatted = pdfRes.data.map(f => ({
              filename: f.filename,
              date: formatDateSafe(f.datetime),
            }));
            set({ history: formatted });
          } else {
            console.warn("Unexpected PDF response shape:", pdfRes.data);
          }
        } catch (err) {
          console.error("Failed to fetch PDF history:", err);
        }
      },
    }),
    {
      name: 'analysis-store',
      version: 2, // bump version if schema changes
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;
        return {
          ...persistedState,
          history: Array.isArray(persistedState.history) ? persistedState.history : [],
        };
      },
    }
  )
);
