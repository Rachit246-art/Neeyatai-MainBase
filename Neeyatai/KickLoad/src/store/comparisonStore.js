
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useComparisonStore = create(
  persist(
    (set, get) => ({
      availableFiles: [],
      selectedFiles: [],
      loading: false,
      results: null,
      error: '',
      success: '',
      comparing: false,
      history: [],
      searchQuery: '',
      htmlReport: null,
      modal: { open: false, type: '', filename: '', newName: '', extension: '', prefix: '', isLockedPrefix: false },
      openMenuIndex: null,
      menuPosition: { top: 0, left: 0 },
      statusModal: { open: false, message: '', type: 'info' },
      pdfFilename: null,
      pdfActionModal: { open: false, filename: '' },
      pdfViewer: { open: false, url: '' },
      setAvailableFiles: (v) => set({ availableFiles: v }),
      setSelectedFiles: (v) => set({ selectedFiles: v }),
      setLoading: (v) => set({ loading: v }),
      setResults: (v) => set({ results: v }),
      setError: (v) => set({ error: v }),
      setSuccess: (v) => set({ success: v }),
      setComparing: (v) => set({ comparing: v }),
      setHistory: (v) => set({ history: Array.isArray(v) ? v : [] }),
      setSearchQuery: (v) => set({ searchQuery: v }),
      setHtmlReport: (v) => set({ htmlReport: v }),
      setModal: (v) => set({ modal: v }),
      setOpenMenuIndex: (v) => set({ openMenuIndex: v }),
      setMenuPosition: (v) => set({ menuPosition: v }),
      setStatusModal: (v) => set({ statusModal: v }),
      setPdfFilename: (v) => set({ pdfFilename: v }),
      setPdfActionModal: (v) => set({ pdfActionModal: v }),
      setPdfViewer: (v) => set({ pdfViewer: v }),
    }),
    { name: 'comparison-store' }
  )
); 
