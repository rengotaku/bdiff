// 差分タイプ - Union type for all possible diff line types
export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified';

// 表示モード - Union type for diff viewer display modes
export type ViewMode = 'side-by-side' | 'unified' | 'split';

// 入力タイプ - Union type for input methods
export type InputType = 'file' | 'text';

/**
 * Represents a single line in a diff comparison
 */
export interface DiffLine {
  /** Line number in the diff output */
  lineNumber: number;
  /** Content of the line (can be empty for blank lines) */
  content: string;
  /** Type of change for this line */
  type: DiffType;
  /** Original line number before changes (for tracking purposes) */
  originalLineNumber?: number;
  /** New line number after changes (for tracking purposes) */
  newLineNumber?: number;
}

/**
 * File information interface for uploaded or selected files
 */
export interface FileInfo {
  /** Display name of the file */
  name: string;
  /** Complete text content of the file */
  content: string;
  /** File size in bytes */
  size: number;
  /** Optional last modified date */
  lastModified?: Date;
  /** Optional MIME type */
  type?: string;
  /** Optional file extension */
  extension?: string;
}

/**
 * Comparison options for diff calculation
 */
export interface ComparisonOptions {
  /** Sort lines alphabetically before comparison */
  sortLines: boolean;
  /** Ignore case differences when comparing */
  ignoreCase: boolean;
  /** Ignore leading and trailing whitespace */
  ignoreWhitespace: boolean;
  /** Ignore trailing newlines (final empty lines) */
  ignoreTrailingNewlines: boolean;
}

/**
 * Statistical information about diff comparison
 */
export interface DiffStats {
  /** Number of added lines */
  added: number;
  /** Number of removed lines */
  removed: number;
  /** Number of modified lines */
  modified: number;
  /** Number of unchanged lines */
  unchanged: number;
  /** Similarity percentage (0-100) */
  similarity: number;
}

/**
 * Complete diff result containing lines and statistics
 */
export interface DiffResult {
  /** Array of all diff lines */
  lines: DiffLine[];
  /** Statistical summary of the diff */
  stats: DiffStats;
  /** Optional metadata about the comparison */
  metadata?: DiffMetadata;
}

/**
 * Optional metadata for diff results
 */
export interface DiffMetadata {
  /** Timestamp when diff was calculated */
  timestamp: Date;
  /** Time taken to calculate diff (in milliseconds) */
  processingTime?: number;
  /** Algorithm used for diff calculation */
  algorithm?: string;
  /** Original file hash for verification */
  originalHash?: string;
  /** Modified file hash for verification */
  modifiedHash?: string;
}

/**
 * Configuration options for diff calculation
 */
export interface DiffOptions {
  /** Whether to ignore whitespace differences */
  ignoreWhitespace?: boolean;
  /** Whether to ignore case differences */
  ignoreCase?: boolean;
  /** Minimum similarity threshold for line matching */
  similarityThreshold?: number;
  /** Context lines to include around changes */
  contextLines?: number;
  /** Maximum file size to process (in bytes) */
  maxFileSize?: number;
}

/**
 * Error types that can occur during diff processing
 */
export interface DiffError extends Error {
  /** Error code for programmatic handling */
  code: DiffErrorCode;
  /** Additional context about the error */
  details?: Record<string, unknown>;
  /** Whether the error is recoverable */
  recoverable: boolean;
}

/**
 * Specific error codes for diff operations
 */
export enum DiffErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  INSUFFICIENT_MEMORY = 'INSUFFICIENT_MEMORY',
  INVALID_INPUT = 'INVALID_INPUT',
  CALCULATION_FAILED = 'CALCULATION_FAILED'
}

/**
 * Type guard to check if an error is a DiffError
 */
export function isDiffError(error: unknown): error is DiffError {
  return (
    error instanceof Error &&
    'code' in error &&
    'recoverable' in error &&
    typeof (error as DiffError).code === 'string' &&
    typeof (error as DiffError).recoverable === 'boolean'
  );
}

/**
 * Type for keyboard shortcut configurations
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., 'c', 'Enter') */
  key: string;
  /** Whether Ctrl key is required */
  ctrlKey?: boolean;
  /** Whether Shift key is required */
  shiftKey?: boolean;
  /** Whether Alt key is required */
  altKey?: boolean;
  /** Whether Meta key is required (Cmd on Mac) */
  metaKey?: boolean;
  /** Action to execute when shortcut is triggered */
  action: () => void | Promise<void>;
  /** Human-readable description of the shortcut */
  description: string;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
}

/**
 * Theme configuration for diff display
 */
export interface DiffTheme {
  /** Theme name identifier */
  name: string;
  /** Colors for different diff types */
  colors: {
    added: string;
    removed: string;
    modified: string;
    unchanged: string;
    background: string;
    text: string;
  };
  /** Font settings */
  font: {
    family: string;
    size: string;
    weight: string;
  };
  /** Whether this is a dark theme */
  isDark: boolean;
}

/**
 * User preferences for the application
 */
export interface UserPreferences {
  /** Preferred view mode */
  defaultViewMode: ViewMode;
  /** Preferred theme */
  theme: string;
  /** Whether to show line numbers by default */
  showLineNumbers: boolean;
  /** Whether to ignore whitespace by default */
  ignoreWhitespace: boolean;
  /** Whether to ignore case by default */
  ignoreCase: boolean;
  /** Number of context lines to show */
  contextLines: number;
  /** Keyboard shortcuts preferences */
  shortcuts: Record<string, boolean>;
}

/**
 * Application state interface for state management
 */
export interface AppState {
  /** Currently loaded original file */
  originalFile: FileInfo | null;
  /** Currently loaded modified file */
  modifiedFile: FileInfo | null;
  /** Current diff result */
  diffResult: DiffResult | null;
  /** Current view mode */
  viewMode: ViewMode;
  /** Whether diff calculation is in progress */
  isProcessing: boolean;
  /** Current error state */
  error: string | null;
  /** User preferences */
  preferences: UserPreferences;
  /** Loading states for different operations */
  loading: {
    fileRead: boolean;
    diffCalculation: boolean;
    clipboard: boolean;
  };
}

// Utility types for enhanced type safety

/**
 * Extract the keys of an object as a union type
 */
export type KeysOf<T> = keyof T;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract non-nullable values from a type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Create a type with all properties set to a specific type
 */
export type RecordOf<K extends keyof any, T> = Record<K, T>;

// ========================================
// History Feature Types
// ========================================

/**
 * Represents a saved diff comparison in history
 */
export interface DiffHistory {
  /** Unique identifier for the history item */
  id: string;
  /** Timestamp when the comparison was saved */
  timestamp: Date;
  /** Original file information and compressed content */
  originalFile: {
    name: string;
    content: string; // LZ-compressed content
    size: number;
  };
  /** Modified file information and compressed content */
  modifiedFile: {
    name: string;
    content: string; // LZ-compressed content
    size: number;
  };
  /** Diff calculation results */
  diffResult: {
    added: number;
    deleted: number;
    modified: number;
    unchanged: number;
    similarity: number;
  };
  /** Comparison options used for this diff */
  comparisonOptions: ComparisonOptions;
  /** Additional metadata */
  metadata: HistoryMetadata;
}

/**
 * Metadata for history items
 */
export interface HistoryMetadata {
  /** Schema version for future migrations */
  version: string;
  /** Browser user agent when saved */
  userAgent?: string;
  /** Processing time in milliseconds */
  processingTime?: number;
  /** File hash for integrity verification */
  originalHash?: string;
  /** File hash for integrity verification */
  modifiedHash?: string;
}

/**
 * Search and filter options for history
 */
export interface HistorySearchOptions {
  /** Text search query */
  query?: string;
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filter by similarity percentage range */
  similarityRange?: {
    min: number;
    max: number;
  };
  /** Filter by comparison options */
  comparisonOptions?: Partial<ComparisonOptions>;
  /** Sort options */
  sortBy?: 'timestamp' | 'similarity' | 'originalFile' | 'modifiedFile';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * History service configuration
 */
export interface HistoryConfig {
  /** Maximum number of history items to store */
  maxItems: number;
  /** Enable compression for content */
  enableCompression: boolean;
  /** Auto-save diff results */
  autoSave: boolean;
  /** User consent for data storage */
  userConsent: boolean;
  /** Enable full-text search */
  enableFullTextSearch: boolean;
}

/**
 * Export/import data structure
 */
export interface HistoryExportData {
  /** Export metadata */
  metadata: {
    version: string;
    exportDate: Date;
    itemCount: number;
  };
  /** History items */
  items: DiffHistory[];
}

/**
 * History operation result
 */
export interface HistoryOperationResult<T = any> {
  /** Operation success status */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Operation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Storage statistics
 */
export interface HistoryStorageStats {
  /** Number of items stored */
  itemCount: number;
  /** Total storage size in bytes */
  totalSize: number;
  /** Average item size in bytes */
  averageSize: number;
  /** Oldest item timestamp */
  oldestItem?: Date;
  /** Newest item timestamp */
  newestItem?: Date;
  /** Compression ratio (compressed/original) */
  compressionRatio?: number;
}