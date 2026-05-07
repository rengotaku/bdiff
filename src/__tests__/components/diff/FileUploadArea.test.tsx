import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileUploadArea } from '../../../components/diff/FileUploadArea';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fileUpload.clear': 'Clear',
        'fileUpload.browseFile': 'Browse file',
        'fileUpload.loaded': 'Loaded:',
        'fileUpload.processing': 'Processing...',
        'fileUpload.fileInputHelp': 'Select a text file to compare. Supported formats: .txt, .js, .ts, .json, .md, and more.',
      };
      return translations[key] ?? key;
    },
  }),
}));

const defaultProps = {
  title: 'Original Text',
  placeholder: 'Paste text here...',
  value: '',
  onChange: vi.fn(),
  onFileSelect: vi.fn(),
  isDragging: false,
  onDragEnter: vi.fn(),
  onDragLeave: vi.fn(),
  onDragOver: vi.fn(),
  onDrop: vi.fn(),
};

describe('FileUploadArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('スクリーンリーダー用ヘルプテキスト (sr-only)', () => {
    it('fileUpload.fileInputHelp 翻訳キー経由でヘルプテキストが表示される', () => {
      render(<FileUploadArea {...defaultProps} />);
      const helpText = screen.getByText(
        'Select a text file to compare. Supported formats: .txt, .js, .ts, .json, .md, and more.'
      );
      expect(helpText).toBeInTheDocument();
    });

    it('ヘルプテキストが sr-only クラスを持つ（スクリーンリーダー専用）', () => {
      render(<FileUploadArea {...defaultProps} />);
      const helpText = screen.getByText(
        'Select a text file to compare. Supported formats: .txt, .js, .ts, .json, .md, and more.'
      );
      expect(helpText).toHaveClass('sr-only');
    });

    it('英語ハードコード文字列が残っていない', () => {
      render(<FileUploadArea {...defaultProps} />);
      // 旧ハードコード文字列が存在しないことを確認
      expect(
        screen.queryByText(
          'Select a text file to upload. Supported formats include .txt, .js, .jsx, .ts, .tsx, .json, .md, .html, .css, and more.'
        )
      ).not.toBeInTheDocument();
    });

    it('ヘルプテキストが aria-describedby で file input から参照される', () => {
      render(<FileUploadArea {...defaultProps} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();
      const helpId = fileInput.getAttribute('aria-describedby');
      expect(helpId).not.toBeNull();
      const helpEl = document.getElementById(helpId!);
      expect(helpEl).not.toBeNull();
      expect(helpEl).toHaveClass('sr-only');
    });
  });
});
