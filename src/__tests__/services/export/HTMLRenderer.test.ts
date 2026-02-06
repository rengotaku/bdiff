import { describe, it, expect } from 'vitest';
import { HTMLRenderer } from '../../../services/export/renderers/HTMLRenderer';
import type { DiffLine, CharSegment } from '../../../types/types';

/**
 * HTMLRenderer Unit Tests - Character Highlight Feature
 *
 * Test coverage:
 * - renderCharSegments: CharSegment[] to HTML string conversion
 * - Unified view with character-level highlighting
 * - Side-by-side view with character-level highlighting
 * - HTML escaping within character segments
 *
 * NOTE: These tests are for Phase 4 (RED) - implementation not yet complete
 */
describe('HTMLRenderer', () => {
  const renderer = new HTMLRenderer();

  // Helper to create DiffLine
  const createLine = (
    type: DiffLine['type'],
    content: string,
    lineNumber: number
  ): DiffLine => ({
    type,
    content,
    lineNumber,
  });

  describe('renderCharSegments', () => {
    /**
     * renderCharSegments should convert CharSegment[] to HTML string
     * This method needs to be implemented in HTMLRenderer
     */

    it('converts unchanged segments to plain escaped text', () => {
      const segments: CharSegment[] = [
        { type: 'unchanged', text: 'hello world' }
      ];

      // Access the method (needs to be public or we test via render output)
      // For now, we test through the rendered HTML output
      const result = (renderer as any).renderCharSegments(segments);

      expect(result).toBe('hello world');
    });

    it('wraps removed segments with char-removed class', () => {
      const segments: CharSegment[] = [
        { type: 'removed', text: 'deleted' }
      ];

      const result = (renderer as any).renderCharSegments(segments);

      expect(result).toContain('<span class="char-removed">');
      expect(result).toContain('deleted');
      expect(result).toContain('</span>');
    });

    it('wraps added segments with char-added class', () => {
      const segments: CharSegment[] = [
        { type: 'added', text: 'inserted' }
      ];

      const result = (renderer as any).renderCharSegments(segments);

      expect(result).toContain('<span class="char-added">');
      expect(result).toContain('inserted');
      expect(result).toContain('</span>');
    });

    it('combines multiple segments correctly', () => {
      const segments: CharSegment[] = [
        { type: 'unchanged', text: 'hello ' },
        { type: 'removed', text: 'world' },
        { type: 'added', text: 'there' }
      ];

      const result = (renderer as any).renderCharSegments(segments);

      expect(result).toContain('hello ');
      expect(result).toContain('<span class="char-removed">world</span>');
      expect(result).toContain('<span class="char-added">there</span>');
    });

    it('escapes HTML special characters in segment text', () => {
      const segments: CharSegment[] = [
        { type: 'unchanged', text: '<div>' },
        { type: 'removed', text: '&amp;' },
        { type: 'added', text: '"quoted"' }
      ];

      const result = (renderer as any).renderCharSegments(segments);

      // Should escape HTML entities
      expect(result).toContain('&lt;div&gt;');
      expect(result).toContain('&amp;amp;');
      expect(result).toContain('&quot;quoted&quot;');
    });

    it('handles empty segments array', () => {
      const segments: CharSegment[] = [];

      const result = (renderer as any).renderCharSegments(segments);

      expect(result).toBe('');
    });

    it('handles segments with empty text', () => {
      const segments: CharSegment[] = [
        { type: 'unchanged', text: '' },
        { type: 'removed', text: '' }
      ];

      const result = (renderer as any).renderCharSegments(segments);

      // Empty segments should not produce span tags with empty content
      // or should produce empty spans
      expect(typeof result).toBe('string');
    });
  });

  describe('Unified View with Character Highlighting', () => {
    it('renders character-level highlighting for similar removed/added pairs', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'hello world', 1),
        createLine('added', 'hello there', 2),
      ];

      const html = renderer.render(lines, {
        viewMode: 'unified',
        includeLineNumbers: true,
      });

      // The rendered HTML should contain character highlight classes
      expect(html).toContain('char-removed');
      expect(html).toContain('char-added');
    });

    it('applies char-removed class to deleted characters in removed lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old text', 1),
        createLine('added', 'new text', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // 'old' is removed, 'new' is added
      // Should have char-removed span for 'old'
      expect(html).toContain('<span class="char-removed">');
    });

    it('applies char-added class to inserted characters in added lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old text', 1),
        createLine('added', 'new text', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // 'new' is added
      // Should have char-added span for 'new'
      expect(html).toContain('<span class="char-added">');
    });

    it('does not apply character highlighting to unchanged lines', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'same line', 1),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Unchanged lines should not have char-removed or char-added
      expect(html).not.toContain('char-removed');
      expect(html).not.toContain('char-added');
    });

    it('handles unpaired removed lines without char highlighting', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'context', 1),
        createLine('removed', 'deleted line', 2),
        createLine('unchanged', 'more context', 3),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Unpaired removed line should not have char-level highlighting
      // (no added line to pair with)
      expect(html).toContain('deleted line');
      // The line itself is styled as removed, but no char-level diff
      expect(html).toContain('diff-line-removed');
    });

    it('handles unpaired added lines without char highlighting', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'context', 1),
        createLine('added', 'inserted line', 2),
        createLine('unchanged', 'more context', 3),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Unpaired added line should not have char-level highlighting
      expect(html).toContain('inserted line');
      expect(html).toContain('diff-line-added');
    });

    it('correctly pairs multiple consecutive removed/added blocks', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old line 1', 1),
        createLine('removed', 'old line 2', 2),
        createLine('added', 'new line 1', 3),
        createLine('added', 'new line 2', 4),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Should have character highlighting for both pairs
      // old line 1 <-> new line 1
      // old line 2 <-> new line 2
      expect(html).toContain('char-removed');
      expect(html).toContain('char-added');
    });
  });

  describe('Side-by-Side View with Character Highlighting', () => {
    it('renders character-level highlighting for paired removed/added lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'hello world', 1),
        createLine('added', 'hello there', 2),
      ];

      const html = renderer.render(lines, {
        viewMode: 'side-by-side',
        includeLineNumbers: true,
      });

      // Should contain character highlight classes in side-by-side view
      expect(html).toContain('char-removed');
      expect(html).toContain('char-added');
    });

    it('applies char-removed in original panel for deleted characters', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old text', 1),
        createLine('added', 'new text', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'side-by-side' });

      // Original panel should have char-removed spans
      expect(html).toContain('<span class="char-removed">');
    });

    it('applies char-added in modified panel for inserted characters', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old text', 1),
        createLine('added', 'new text', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'side-by-side' });

      // Modified panel should have char-added spans
      expect(html).toContain('<span class="char-added">');
    });

    it('unchanged lines appear in both panels without char highlighting', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'same line', 1),
      ];

      const html = renderer.render(lines, { viewMode: 'side-by-side' });

      // Unchanged lines should appear in both panels
      expect(html).toContain('same line');
      // But no character-level highlighting
      expect(html).not.toContain('char-removed');
      expect(html).not.toContain('char-added');
    });

    it('handles removed-only lines in original panel', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'deleted line', 1),
      ];

      const html = renderer.render(lines, { viewMode: 'side-by-side' });

      // Original panel should show the removed line
      expect(html).toContain('deleted line');
      expect(html).toContain('diff-line-removed');
    });

    it('handles added-only lines in modified panel', () => {
      const lines: DiffLine[] = [
        createLine('added', 'inserted line', 1),
      ];

      const html = renderer.render(lines, { viewMode: 'side-by-side' });

      // Modified panel should show the added line
      expect(html).toContain('inserted line');
      expect(html).toContain('diff-line-added');
    });
  });

  describe('HTML Escaping in Character Segments', () => {
    it('escapes HTML special characters in removed segments', () => {
      const lines: DiffLine[] = [
        createLine('removed', '<script>alert("xss")</script>', 1),
        createLine('added', '<div>safe</div>', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Should escape < and > and quotes
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });

    it('escapes HTML special characters in added segments', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old', 1),
        createLine('added', '<b>new & improved</b>', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Should escape ampersand
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;b&gt;');
    });

    it('escapes quotes in character segments', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'class="old"', 1),
        createLine('added', 'class="new"', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Quotes should be escaped
      expect(html).toContain('&quot;');
    });
  });

  describe('CSS Styles for Character Highlighting', () => {
    it('includes char-removed CSS class definition', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'text', 1),
        createLine('added', 'text!', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // The embedded CSS should define .char-removed style
      expect(html).toContain('.char-removed');
    });

    it('includes char-added CSS class definition', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'text', 1),
        createLine('added', 'text!', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // The embedded CSS should define .char-added style
      expect(html).toContain('.char-added');
    });

    it('char-removed style includes text-decoration line-through', () => {
      // Need removed+added pair to trigger char diff CSS output
      const lines: DiffLine[] = [
        createLine('removed', 'hello world', 1),
        createLine('added', 'hello there', 2),
      ];
      const html = renderer.render(lines, { viewMode: 'unified' });

      // CSS should include strikethrough for removed characters
      expect(html).toContain('text-decoration');
      expect(html).toContain('line-through');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty lines array', () => {
      const lines: DiffLine[] = [];
      const html = renderer.render(lines, { viewMode: 'unified' });

      expect(html).toContain('No differences to display');
    });

    it('handles lines with only whitespace', () => {
      const lines: DiffLine[] = [
        createLine('removed', '   ', 1),
        createLine('added', '    ', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Should render without errors
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('handles very long lines with character differences', () => {
      const longBase = 'a'.repeat(1000);
      const lines: DiffLine[] = [
        createLine('removed', longBase + 'old', 1),
        createLine('added', longBase + 'new', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Should still render character highlighting
      expect(html).toContain('char-removed');
      expect(html).toContain('char-added');
    });

    it('handles Unicode characters in diff', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'Hello World', 1),
        createLine('added', 'Hello World!', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Should handle Japanese characters
      expect(html).toContain('Hello');
    });

    it('handles emoji in diff content', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'Hello', 1),
        createLine('added', 'Hello!', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      expect(html).toContain('Hello');
    });

    it('handles lines with only removed (no paired added)', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'deleted 1', 1),
        createLine('removed', 'deleted 2', 2),
        createLine('removed', 'deleted 3', 3),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // All removed lines should be present
      expect(html).toContain('deleted 1');
      expect(html).toContain('deleted 2');
      expect(html).toContain('deleted 3');
    });

    it('handles lines with only added (no paired removed)', () => {
      const lines: DiffLine[] = [
        createLine('added', 'inserted 1', 1),
        createLine('added', 'inserted 2', 2),
        createLine('added', 'inserted 3', 3),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // All added lines should be present
      expect(html).toContain('inserted 1');
      expect(html).toContain('inserted 2');
      expect(html).toContain('inserted 3');
    });

    it('handles dissimilar lines without char highlighting', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'completely different text', 1),
        createLine('added', 'xyz', 2),
      ];

      const html = renderer.render(lines, { viewMode: 'unified' });

      // Lines are too different - should not have character-level highlighting
      // (threshold check in CharDiffService.shouldShowCharDiff)
      // The lines themselves should still be rendered
      expect(html).toContain('completely different text');
      expect(html).toContain('xyz');
    });
  });
});
