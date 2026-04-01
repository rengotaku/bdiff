/**
 * Export Service Types
 * Centralized type definitions for the export system
 */

import type { DiffLine, ViewMode, FileInfo } from '../../types/types';

/**
 * Supported export formats
 */
export type ExportFormat = 'html' | 'svg' | 'markdown' | 'plaintext';

/**
 * Translated labels passed from components to renderers (方式B)
 * Renderers use these instead of hardcoded strings
 */
export interface ExportLabels {
  comparisonReport?: string;
  generated?: string;
  originalFile?: string;
  modifiedFile?: string;
  name?: string;
  size?: string;
  lines?: string;
  lastModified?: string;
  footerText?: string;
  noDifferences?: string;
  linesHidden?: string;
  original?: string;
  modified?: string;
  fileInformation?: string;
  statistics?: string;
  diffContent?: string;
  added?: string;
  removed?: string;
  modifiedStat?: string;
  unchanged?: string;
  similarityStat?: string;
  diffComparison?: string;
  statisticsLabel?: string;
}

/**
 * Base export options shared across all formats
 */
export interface BaseExportOptions {
  /** Custom title for the export */
  title?: string;
  /** Custom filename for the export */
  filename?: string;
  /** Include line numbers */
  includeLineNumbers?: boolean;
  /** Include statistics summary */
  includeStats?: boolean;
  /** Include file metadata header */
  includeHeader?: boolean;
  /** Original file information */
  originalFile?: FileInfo;
  /** Modified file information */
  modifiedFile?: FileInfo;
  /** Collapse unchanged lines (show only context around changes) */
  collapseUnchanged?: boolean;
  /** Translated labels for i18n support */
  labels?: ExportLabels;
}

/**
 * HTML-specific export options
 */
export interface HtmlExportOptions extends BaseExportOptions {
  /** Color theme */
  theme?: 'light' | 'dark';
  /** View mode for diff display */
  viewMode?: ViewMode;
  /** Show only differences (hide unchanged lines) */
  differencesOnly?: boolean;
}

/**
 * SVG-specific export options
 */
export interface SvgExportOptions extends BaseExportOptions {
  /** SVG width in pixels */
  width?: number;
  /** Line height in pixels */
  lineHeight?: number;
  /** Font family */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Color theme */
  theme?: 'light' | 'dark';
}

/**
 * Markdown-specific export options
 */
export interface MarkdownExportOptions extends BaseExportOptions {
  /** Use code blocks for diff content */
  useCodeBlocks?: boolean;
  /** Include diff symbols (+/-/~) */
  includeDiffSymbols?: boolean;
}

/**
 * Plain text export options
 */
export interface PlainTextExportOptions extends BaseExportOptions {
  /** Include diff symbols (+/-/~) */
  includeDiffSymbols?: boolean;
  /** Column width for formatting */
  columnWidth?: number;
}

/**
 * Union type for all export options
 */
export type ExportOptions =
  | HtmlExportOptions
  | SvgExportOptions
  | MarkdownExportOptions
  | PlainTextExportOptions;

/**
 * Export result containing the generated content
 */
export interface ExportResult {
  /** The exported content (string or Blob) */
  content: string | Blob;
  /** MIME type of the exported content */
  mimeType: string;
  /** Suggested filename for download */
  filename: string;
  /** Export format used */
  format: ExportFormat;
}

/**
 * Renderer interface that all format renderers must implement
 */
export interface IRenderer {
  /**
   * Render diff lines to the target format
   * @param lines - Diff lines to render
   * @param options - Format-specific options
   * @returns Rendered content as string or Blob
   */
  render(lines: DiffLine[], options: ExportOptions): string | Blob;

  /**
   * Get the MIME type for this format
   */
  getMimeType(): string;

  /**
   * Generate default filename for this format
   * @param originalFile - Original file info
   * @param modifiedFile - Modified file info
   */
  generateFilename(originalFile?: FileInfo, modifiedFile?: FileInfo): string;
}
