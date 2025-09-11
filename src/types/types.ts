// 差分タイプ
export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified';

// 差分行
export interface DiffLine {
  lineNumber: number;
  content: string;
  type: DiffType;
  originalLineNumber?: number;
  newLineNumber?: number;
}

// ファイル情報
export interface FileInfo {
  name: string;
  content: string;
  size: number;
  lastModified?: Date;
}

// 差分結果
export interface DiffResult {
  lines: DiffLine[];
  stats: DiffStats;
}

// 差分統計
export interface DiffStats {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  similarity: number; // パーセンテージ
}

// 表示モード
export type ViewMode = 'side-by-side' | 'unified' | 'split';

// 入力タイプ
export type InputType = 'file' | 'text';