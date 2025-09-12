import type { 
  DiffHistory, 
  HistoryConfig, 
  HistorySearchOptions, 
  HistoryOperationResult,
  HistoryStorageStats,
  HistoryExportData,
  ComparisonOptions,
  DiffStats
} from '../types/types';
import { CompressionService } from './compressionService';

const DB_NAME = 'bdiff_history';
const DB_VERSION = 1;
const STORE_NAME = 'diff_history';
const CONFIG_STORE = 'config';

/**
 * Service for managing diff history using IndexedDB
 */
export class HistoryService {
  private static instance: HistoryService | null = null;
  private db: IDBDatabase | null = null;
  private config: HistoryConfig = {
    maxItems: 50,
    enableCompression: true,
    autoSave: true,
    userConsent: false,
    enableFullTextSearch: true
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<HistoryOperationResult<void>> {
    try {
      const db = await this.openDatabase();
      this.db = db;
      
      // Load configuration and wait for completion
      await this.loadConfig();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create history store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('originalFileName', 'originalFile.name', { unique: false });
          store.createIndex('modifiedFileName', 'modifiedFile.name', { unique: false });
          store.createIndex('similarity', 'diffResult.similarity', { unique: false });
        }

        // Create config store
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    if (!this.db) {
      console.warn('Database not initialized, using default config');
      return;
    }

    try {
      const result = await this.getFromStore<HistoryConfig>(CONFIG_STORE, 'config');
      if (result.success && result.data) {
        // Merge stored config with defaults to ensure all properties exist
        this.config = { ...this.config, ...result.data };
        console.log('History configuration loaded:', this.config);
      } else {
        console.log('No stored configuration found, using defaults');
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  async saveConfig(config: Partial<HistoryConfig>): Promise<HistoryOperationResult<void>> {
    try {
      console.log('🔧 saveConfig called with:', config);
      console.log('🔧 Current config before update:', this.config);
      
      // Update in-memory config
      this.config = { ...this.config, ...config };
      
      console.log('🔧 Config after update:', this.config);
      console.log('Saving history configuration:', this.config);
      
      // Save to IndexedDB
      const result = await this.putToStore(CONFIG_STORE, { key: 'config', ...this.config });
      
      if (result.success) {
        console.log('History configuration saved successfully');
      } else {
        console.error('Failed to save history configuration:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error saving history configuration:', error);
      return {
        success: false,
        error: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): HistoryConfig {
    console.log('🔧 HistoryService.getConfig() called, returning:', this.config);
    return { ...this.config };
  }

  /**
   * Verify configuration persistence by re-loading from storage
   */
  async verifyConfigPersistence(): Promise<HistoryOperationResult<boolean>> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      const result = await this.getFromStore<HistoryConfig>(CONFIG_STORE, 'config');
      if (result.success && result.data) {
        const storedConfig = result.data;
        const currentConfig = this.config;
        
        // Check if critical settings match
        const isConsistentConsent = storedConfig.userConsent === currentConfig.userConsent;
        const isConsistentAutoSave = storedConfig.autoSave === currentConfig.autoSave;
        
        console.log('Configuration verification:', {
          stored: storedConfig,
          current: currentConfig,
          consentMatch: isConsistentConsent,
          autoSaveMatch: isConsistentAutoSave
        });
        
        return { 
          success: true, 
          data: isConsistentConsent && isConsistentAutoSave 
        };
      } else {
        return { success: false, error: 'No configuration found in storage' };
      }
    } catch (error) {
      return {
        success: false,
        error: `Configuration verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save a diff result to history
   */
  async saveDiffHistory(
    originalFile: { name: string; content: string; size: number },
    modifiedFile: { name: string; content: string; size: number },
    diffResult: DiffStats,
    comparisonOptions: ComparisonOptions,
    processingTime?: number
  ): Promise<HistoryOperationResult<DiffHistory>> {
    if (!this.config.userConsent) {
      return { success: false, error: 'User consent required for saving history' };
    }

    if (!this.db) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return { success: false, error: 'Database not initialized' };
      }
    }

    try {
      const id = this.generateId();
      const timestamp = new Date();

      // Compress content if enabled
      const originalContent = this.config.enableCompression 
        ? CompressionService.compress(originalFile.content)
        : originalFile.content;
      
      const modifiedContent = this.config.enableCompression
        ? CompressionService.compress(modifiedFile.content)
        : modifiedFile.content;

      const historyItem: DiffHistory = {
        id,
        timestamp,
        originalFile: {
          name: originalFile.name,
          content: originalContent,
          size: originalFile.size
        },
        modifiedFile: {
          name: modifiedFile.name,
          content: modifiedContent,
          size: modifiedFile.size
        },
        diffResult: {
          added: diffResult.added,
          deleted: diffResult.removed,
          modified: diffResult.modified,
          unchanged: diffResult.unchanged,
          similarity: diffResult.similarity
        },
        comparisonOptions,
        metadata: {
          version: '1.0.0',
          userAgent: navigator.userAgent,
          processingTime,
          originalHash: await this.generateHash(originalFile.content),
          modifiedHash: await this.generateHash(modifiedFile.content)
        }
      };

      // Check if we need to cleanup old items
      await this.enforceStorageLimit();

      // Save to database
      const saveResult = await this.putToStore(STORE_NAME, historyItem);
      if (saveResult.success) {
        return { success: true, data: historyItem };
      } else {
        return { success: false, error: saveResult.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to save history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get all history items with optional search/filter
   */
  async getHistory(options?: HistorySearchOptions): Promise<HistoryOperationResult<DiffHistory[]>> {
    if (!this.db) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return { success: false, error: 'Database not initialized' };
      }
    }

    try {
      const allItems = await this.getAllFromStore<DiffHistory>(STORE_NAME);
      if (!allItems.success) {
        return allItems;
      }

      let items = allItems.data || [];

      // Decompress content for search
      if (this.config.enableCompression) {
        items = items.map(item => ({
          ...item,
          originalFile: {
            ...item.originalFile,
            content: CompressionService.decompress(item.originalFile.content)
          },
          modifiedFile: {
            ...item.modifiedFile,
            content: CompressionService.decompress(item.modifiedFile.content)
          }
        }));
      }

      // Apply filters
      if (options) {
        items = this.filterHistory(items, options);
      }

      return { success: true, data: items };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get a specific history item by ID
   */
  async getHistoryItem(id: string): Promise<HistoryOperationResult<DiffHistory>> {
    if (!this.db) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return { success: false, error: 'Database not initialized' };
      }
    }

    try {
      const result = await this.getFromStore<DiffHistory>(STORE_NAME, id);
      if (result.success && result.data) {
        // Decompress content
        if (this.config.enableCompression) {
          result.data = {
            ...result.data,
            originalFile: {
              ...result.data.originalFile,
              content: CompressionService.decompress(result.data.originalFile.content)
            },
            modifiedFile: {
              ...result.data.modifiedFile,
              content: CompressionService.decompress(result.data.modifiedFile.content)
            }
          };
        }
      }
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to get history item: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Delete a history item
   */
  async deleteHistoryItem(id: string): Promise<HistoryOperationResult<void>> {
    if (!this.db) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return { success: false, error: 'Database not initialized' };
      }
    }

    return await this.deleteFromStore(STORE_NAME, id);
  }

  /**
   * Delete multiple history items
   */
  async deleteMultipleItems(ids: string[]): Promise<HistoryOperationResult<void>> {
    const results = await Promise.all(
      ids.map(id => this.deleteHistoryItem(id))
    );

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      return { 
        success: false, 
        error: `Failed to delete ${failed.length} items` 
      };
    }

    return { success: true };
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<HistoryOperationResult<void>> {
    if (!this.db) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return { success: false, error: 'Database not initialized' };
      }
    }

    return await this.clearStore(STORE_NAME);
  }

  /**
   * Export history data
   */
  async exportHistory(itemIds?: string[]): Promise<HistoryOperationResult<HistoryExportData>> {
    try {
      const historyResult = await this.getHistory();
      if (!historyResult.success) {
        return { success: false, error: historyResult.error };
      }

      let items = historyResult.data || [];

      // Filter by specific IDs if provided
      if (itemIds) {
        items = items.filter(item => itemIds.includes(item.id));
      }

      const exportData: HistoryExportData = {
        metadata: {
          version: '1.0.0',
          exportDate: new Date(),
          itemCount: items.length
        },
        items
      };

      return { success: true, data: exportData };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to export history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Import history data
   */
  async importHistory(data: HistoryExportData, overwrite = false): Promise<HistoryOperationResult<number>> {
    try {
      if (overwrite) {
        const clearResult = await this.clearHistory();
        if (!clearResult.success) {
          return { success: false, error: clearResult.error };
        }
      }

      let imported = 0;
      for (const item of data.items) {
        // Generate new ID to avoid conflicts
        const newItem = { ...item, id: this.generateId() };
        const result = await this.putToStore(STORE_NAME, newItem);
        if (result.success) {
          imported++;
        }
      }

      return { success: true, data: imported };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to import history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<HistoryOperationResult<HistoryStorageStats>> {
    try {
      const historyResult = await this.getHistory();
      if (!historyResult.success) {
        return { success: false, error: historyResult.error };
      }

      const items = historyResult.data || [];
      
      if (items.length === 0) {
        return {
          success: true,
          data: {
            itemCount: 0,
            totalSize: 0,
            averageSize: 0
          }
        };
      }

      let totalSize = 0;
      let totalCompressionRatio = 0;
      
      const timestamps = items.map(item => item.timestamp);
      const oldestItem = new Date(Math.min(...timestamps.map(t => t.getTime())));
      const newestItem = new Date(Math.max(...timestamps.map(t => t.getTime())));

      for (const item of items) {
        const itemSize = CompressionService.getSize(JSON.stringify(item));
        totalSize += itemSize;

        if (this.config.enableCompression) {
          const originalContent = item.originalFile.content + item.modifiedFile.content;
          const compressedContent = CompressionService.compress(originalContent);
          totalCompressionRatio += CompressionService.getCompressionRatio(originalContent, compressedContent);
        }
      }

      const stats: HistoryStorageStats = {
        itemCount: items.length,
        totalSize,
        averageSize: totalSize / items.length,
        oldestItem,
        newestItem,
        compressionRatio: this.config.enableCompression ? totalCompressionRatio / items.length : undefined
      };

      return { success: true, data: stats };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Private helper methods

  private async enforceStorageLimit(): Promise<void> {
    const historyResult = await this.getHistory();
    if (!historyResult.success || !historyResult.data) return;

    const items = historyResult.data;
    if (items.length >= this.config.maxItems) {
      // Sort by timestamp and remove oldest items
      const sortedItems = items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const itemsToRemove = sortedItems.slice(0, items.length - this.config.maxItems + 1);
      
      await this.deleteMultipleItems(itemsToRemove.map(item => item.id));
    }
  }

  private filterHistory(items: DiffHistory[], options: HistorySearchOptions): DiffHistory[] {
    let filtered = [...items];

    // Text search
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(item => 
        item.originalFile.name.toLowerCase().includes(query) ||
        item.modifiedFile.name.toLowerCase().includes(query) ||
        (this.config.enableFullTextSearch && 
          (item.originalFile.content.toLowerCase().includes(query) ||
           item.modifiedFile.content.toLowerCase().includes(query)))
      );
    }

    // Date range filter
    if (options.dateRange) {
      filtered = filtered.filter(item => 
        item.timestamp >= options.dateRange!.start &&
        item.timestamp <= options.dateRange!.end
      );
    }

    // Similarity range filter
    if (options.similarityRange) {
      filtered = filtered.filter(item => 
        item.diffResult.similarity >= options.similarityRange!.min &&
        item.diffResult.similarity <= options.similarityRange!.max
      );
    }

    // Comparison options filter
    if (options.comparisonOptions) {
      filtered = filtered.filter(item => {
        const opts = options.comparisonOptions!;
        return (
          (opts.sortLines === undefined || item.comparisonOptions.sortLines === opts.sortLines) &&
          (opts.ignoreCase === undefined || item.comparisonOptions.ignoreCase === opts.ignoreCase) &&
          (opts.ignoreWhitespace === undefined || item.comparisonOptions.ignoreWhitespace === opts.ignoreWhitespace) &&
          (opts.ignoreTrailingNewlines === undefined || item.comparisonOptions.ignoreTrailingNewlines === opts.ignoreTrailingNewlines)
        );
      });
    }

    // Sorting
    if (options.sortBy) {
      const order = options.sortOrder === 'desc' ? -1 : 1;
      
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (options.sortBy) {
          case 'timestamp':
            aVal = a.timestamp.getTime();
            bVal = b.timestamp.getTime();
            break;
          case 'similarity':
            aVal = a.diffResult.similarity;
            bVal = b.diffResult.similarity;
            break;
          case 'originalFile':
            aVal = a.originalFile.name.toLowerCase();
            bVal = b.originalFile.name.toLowerCase();
            break;
          case 'modifiedFile':
            aVal = a.modifiedFile.name.toLowerCase();
            bVal = b.modifiedFile.name.toLowerCase();
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    } else {
      // Default sort by timestamp descending
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    return filtered;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Generic IndexedDB operations

  private putToStore<T>(storeName: string, data: T): Promise<HistoryOperationResult<void>> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ success: false, error: 'Database not initialized' });
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => resolve({ 
        success: false, 
        error: `Failed to store data: ${request.error?.message}` 
      });
    });
  }

  private getFromStore<T>(storeName: string, key: string): Promise<HistoryOperationResult<T>> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ success: false, error: 'Database not initialized' });
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve({ 
        success: true, 
        data: request.result 
      });
      request.onerror = () => resolve({ 
        success: false, 
        error: `Failed to get data: ${request.error?.message}` 
      });
    });
  }

  private getAllFromStore<T>(storeName: string): Promise<HistoryOperationResult<T[]>> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ success: false, error: 'Database not initialized' });
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve({ 
        success: true, 
        data: request.result 
      });
      request.onerror = () => resolve({ 
        success: false, 
        error: `Failed to get all data: ${request.error?.message}` 
      });
    });
  }

  private deleteFromStore(storeName: string, key: string): Promise<HistoryOperationResult<void>> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ success: false, error: 'Database not initialized' });
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => resolve({ 
        success: false, 
        error: `Failed to delete data: ${request.error?.message}` 
      });
    });
  }

  private clearStore(storeName: string): Promise<HistoryOperationResult<void>> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ success: false, error: 'Database not initialized' });
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => resolve({ 
        success: false, 
        error: `Failed to clear store: ${request.error?.message}` 
      });
    });
  }
}