import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import type { 
  DiffHistory, 
  HistoryConfig, 
  HistorySearchOptions, 
  HistoryStorageStats,
  HistoryExportData
} from '../types/types';
import { HistoryService } from '../services/historyService';

// Context state interface
interface HistoryState {
  historyItems: DiffHistory[];
  isLoading: boolean;
  error: string | null;
  config: HistoryConfig;
  storageStats: HistoryStorageStats | null;
  searchOptions: HistorySearchOptions;
  selectedItems: Set<string>;
  isInitialized: boolean;
}

// Action types
type HistoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HISTORY_ITEMS'; payload: DiffHistory[] }
  | { type: 'ADD_HISTORY_ITEM'; payload: DiffHistory }
  | { type: 'REMOVE_HISTORY_ITEM'; payload: string }
  | { type: 'UPDATE_CONFIG'; payload: Partial<HistoryConfig> }
  | { type: 'SET_STORAGE_STATS'; payload: HistoryStorageStats | null }
  | { type: 'SET_SEARCH_OPTIONS'; payload: HistorySearchOptions }
  | { type: 'SET_SELECTED_ITEMS'; payload: Set<string> }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ALL' };

// Context interface
interface HistoryContextType {
  // State
  historyItems: DiffHistory[];
  isLoading: boolean;
  error: string | null;
  config: HistoryConfig;
  storageStats: HistoryStorageStats | null;
  searchOptions: HistorySearchOptions;
  selectedItems: Set<string>;
  isInitialized: boolean;

  // Actions
  loadHistory: (options?: HistorySearchOptions) => Promise<void>;
  addHistoryItem: (
    originalFile: { name: string; content: string; size: number },
    modifiedFile: { name: string; content: string; size: number },
    diffResult: any,
    comparisonOptions: any,
    processingTime?: number
  ) => Promise<DiffHistory | null>;
  deleteHistoryItem: (id: string) => Promise<void>;
  deleteSelectedItems: () => Promise<void>;
  clearAllHistory: () => Promise<void>;
  updateConfig: (config: Partial<HistoryConfig>) => Promise<void>;
  setSearchOptions: (options: HistorySearchOptions) => void;
  setSelectedItems: (items: Set<string>) => void;
  toggleItemSelection: (id: string) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  exportHistory: (itemIds?: string[]) => Promise<HistoryExportData | null>;
  importHistory: (data: HistoryExportData, overwrite?: boolean) => Promise<number>;
  getHistoryItem: (id: string) => Promise<DiffHistory | null>;
  refreshStorageStats: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Initial state
const initialState: HistoryState = {
  historyItems: [],
  isLoading: false,
  error: null,
  config: {
    maxItems: 50,
    enableCompression: true,
    autoSave: true,
    userConsent: false,
    enableFullTextSearch: true
  },
  storageStats: null,
  searchOptions: {
    sortBy: 'timestamp',
    sortOrder: 'desc'
  },
  selectedItems: new Set(),
  isInitialized: false
};

// Reducer
function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_HISTORY_ITEMS':
      return { ...state, historyItems: action.payload, isLoading: false, error: null };

    case 'ADD_HISTORY_ITEM':
      return { 
        ...state, 
        historyItems: [action.payload, ...state.historyItems],
        isLoading: false,
        error: null
      };

    case 'REMOVE_HISTORY_ITEM':
      return { 
        ...state, 
        historyItems: state.historyItems.filter(item => item.id !== action.payload),
        selectedItems: new Set([...state.selectedItems].filter(id => id !== action.payload))
      };

    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };

    case 'SET_STORAGE_STATS':
      return { ...state, storageStats: action.payload };

    case 'SET_SEARCH_OPTIONS':
      return { ...state, searchOptions: action.payload };

    case 'SET_SELECTED_ITEMS':
      return { ...state, selectedItems: action.payload };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    case 'CLEAR_ALL':
      return { 
        ...state, 
        historyItems: [], 
        selectedItems: new Set(),
        error: null
      };

    default:
      return state;
  }
}

// Create context
const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

// Provider component
interface HistoryProviderProps {
  children: ReactNode;
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(historyReducer, initialState);
  const historyService = HistoryService.getInstance();

  // Initialize service
  const initialize = useCallback(async () => {
    if (state.isInitialized) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Wait for complete initialization including config loading
      const result = await historyService.initialize();
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to initialize' });
        return;
      }

      // NOW get the loaded configuration (after IndexedDB initialization is complete)
      const config = historyService.getConfig();
      dispatch({ type: 'UPDATE_CONFIG', payload: config });

      // Load initial history if user has consented
      if (config.userConsent) {
        await loadHistory();
        await refreshStorageStats();
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isInitialized]);

  // Load history items
  const loadHistory = useCallback(async (options?: HistorySearchOptions) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const searchOptions = options || state.searchOptions;
      const result = await historyService.getHistory(searchOptions);
      
      if (result.success) {
        dispatch({ type: 'SET_HISTORY_ITEMS', payload: result.data || [] });
        if (options) {
          dispatch({ type: 'SET_SEARCH_OPTIONS', payload: searchOptions });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load history' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.searchOptions]);

  // Add history item
  const addHistoryItem = useCallback(async (
    originalFile: { name: string; content: string; size: number },
    modifiedFile: { name: string; content: string; size: number },
    diffResult: any,
    comparisonOptions: any,
    processingTime?: number
  ): Promise<DiffHistory | null> => {
    if (!state.config.userConsent || !state.config.autoSave) {
      return null;
    }

    try {
      const result = await historyService.saveDiffHistory(
        originalFile,
        modifiedFile,
        diffResult,
        comparisonOptions,
        processingTime
      );

      if (result.success && result.data) {
        dispatch({ type: 'ADD_HISTORY_ITEM', payload: result.data });
        await refreshStorageStats();
        return result.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to save history item' });
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }, [state.config.userConsent, state.config.autoSave]);

  // Delete history item
  const deleteHistoryItem = useCallback(async (id: string) => {
    try {
      const result = await historyService.deleteHistoryItem(id);
      if (result.success) {
        dispatch({ type: 'REMOVE_HISTORY_ITEM', payload: id });
        await refreshStorageStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete history item' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, []);

  // Delete selected items
  const deleteSelectedItems = useCallback(async () => {
    if (state.selectedItems.size === 0) return;

    try {
      const ids = Array.from(state.selectedItems);
      const result = await historyService.deleteMultipleItems(ids);
      
      if (result.success) {
        ids.forEach(id => dispatch({ type: 'REMOVE_HISTORY_ITEM', payload: id }));
        dispatch({ type: 'SET_SELECTED_ITEMS', payload: new Set() });
        await refreshStorageStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete selected items' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.selectedItems]);

  // Clear all history
  const clearAllHistory = useCallback(async () => {
    try {
      const result = await historyService.clearHistory();
      if (result.success) {
        dispatch({ type: 'CLEAR_ALL' });
        await refreshStorageStats();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to clear history' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback(async (config: Partial<HistoryConfig>) => {
    try {
      const result = await historyService.saveConfig(config);
      if (result.success) {
        dispatch({ type: 'UPDATE_CONFIG', payload: config });
        
        // Verify configuration was saved properly
        const verification = await historyService.verifyConfigPersistence();
        if (!verification.success || !verification.data) {
          console.warn('Configuration verification failed:', verification.error);
          dispatch({ type: 'SET_ERROR', payload: 'Configuration may not be persisted correctly' });
        }
        
        // If user consent changed, handle accordingly
        if ('userConsent' in config) {
          if (config.userConsent && state.historyItems.length === 0) {
            await loadHistory();
          } else if (!config.userConsent) {
            await clearAllHistory();
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to update configuration' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.historyItems.length, loadHistory, clearAllHistory]);

  // Set search options
  const setSearchOptions = useCallback((options: HistorySearchOptions) => {
    dispatch({ type: 'SET_SEARCH_OPTIONS', payload: options });
  }, []);

  // Set selected items
  const setSelectedItems = useCallback((items: Set<string>) => {
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: items });
  }, []);

  // Toggle item selection
  const toggleItemSelection = useCallback((id: string) => {
    const newSelection = new Set(state.selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: newSelection });
  }, [state.selectedItems]);

  // Select all items
  const selectAllItems = useCallback(() => {
    const allIds = new Set(state.historyItems.map(item => item.id));
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: allIds });
  }, [state.historyItems]);

  // Clear selection
  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: new Set() });
  }, []);

  // Export history
  const exportHistory = useCallback(async (itemIds?: string[]): Promise<HistoryExportData | null> => {
    try {
      const result = await historyService.exportHistory(itemIds);
      if (result.success) {
        return result.data || null;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to export history' });
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }, []);

  // Import history
  const importHistory = useCallback(async (data: HistoryExportData, overwrite = false): Promise<number> => {
    try {
      const result = await historyService.importHistory(data, overwrite);
      if (result.success) {
        await loadHistory();
        await refreshStorageStats();
        return result.data || 0;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to import history' });
        return 0;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }, [loadHistory]);

  // Get specific history item
  const getHistoryItem = useCallback(async (id: string): Promise<DiffHistory | null> => {
    try {
      const result = await historyService.getHistoryItem(id);
      if (result.success) {
        return result.data || null;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to get history item' });
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }, []);

  // Refresh storage stats
  const refreshStorageStats = useCallback(async () => {
    try {
      const result = await historyService.getStorageStats();
      if (result.success) {
        dispatch({ type: 'SET_STORAGE_STATS', payload: result.data || null });
      }
    } catch (error) {
      console.warn('Failed to refresh storage stats:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!state.isInitialized) {
      initialize();
    }
  }, [initialize, state.isInitialized]);

  const contextValue: HistoryContextType = {
    // State
    historyItems: state.historyItems,
    isLoading: state.isLoading,
    error: state.error,
    config: state.config,
    storageStats: state.storageStats,
    searchOptions: state.searchOptions,
    selectedItems: state.selectedItems,
    isInitialized: state.isInitialized,

    // Actions
    loadHistory,
    addHistoryItem,
    deleteHistoryItem,
    deleteSelectedItems,
    clearAllHistory,
    updateConfig,
    setSearchOptions,
    setSelectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    exportHistory,
    importHistory,
    getHistoryItem,
    refreshStorageStats,
    initialize
  };

  return (
    <HistoryContext.Provider value={contextValue}>
      {children}
    </HistoryContext.Provider>
  );
};

// Hook to use history context
export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export default HistoryContext;