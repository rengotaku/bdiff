/**
 * Export Service Module
 * Centralized export functionality for diff results
 */

// Main service
export { ExportService } from './ExportService';

// Types
export type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  BaseExportOptions,
  HtmlExportOptions,
  SvgExportOptions,
  MarkdownExportOptions,
  PlainTextExportOptions,
  IRenderer,
} from './types';

// Renderers (for advanced usage)
export { BaseRenderer } from './renderers/BaseRenderer';
export { HTMLRenderer } from './renderers/HTMLRenderer';
export { PlainTextRenderer } from './renderers/PlainTextRenderer';
export { MarkdownRenderer } from './renderers/MarkdownRenderer';
