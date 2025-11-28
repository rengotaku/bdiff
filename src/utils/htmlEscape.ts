/**
 * HTML Escape Utility
 * Shared utility for safely escaping HTML and Markdown special characters
 */

/**
 * Escape HTML special characters to prevent XSS and ensure safe HTML output
 *
 * Uses explicit character mapping for reliable escaping that works in any environment
 * (browser or server-side)
 *
 * @param text - Text to escape
 * @returns HTML-escaped text safe for embedding in HTML
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  if (!text) {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}

/**
 * Escape Markdown special characters
 *
 * @param text - Text to escape
 * @returns Markdown-escaped text
 *
 * @example
 * ```typescript
 * escapeMarkdown('This is **bold** text')
 * // Returns: 'This is \\*\\*bold\\*\\* text'
 * ```
 */
export function escapeMarkdown(text: string): string {
  if (!text) {
    return '';
  }

  const mdEscapes: Record<string, string> = {
    '\\': '\\\\',
    '`': '\\`',
    '*': '\\*',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '[': '\\[',
    ']': '\\]',
    '(': '\\(',
    ')': '\\)',
    '#': '\\#',
    '+': '\\+',
    '-': '\\-',
    '.': '\\.',
    '!': '\\!'
  };

  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, char => mdEscapes[char] || char);
}
