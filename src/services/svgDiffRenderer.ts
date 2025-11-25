/**
 * SVG Diff Renderer Service
 * Generates SVG images for diff visualization in side-by-side view
 */

import type { DiffLine } from '../types/types';
import {
  createSvgRect,
  createSvgText,
  createSvgGroup,
  svgToDataUri,
  buildSvgAttributes
} from '../utils/svgUtils';

/**
 * SVG generation options
 */
export interface SvgDiffOptions {
  /** SVG total width in pixels */
  width: number;
  /** Line height in pixels */
  lineHeight: number;
  /** Font family for code display */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Include line numbers */
  includeLineNumbers: boolean;
  /** Color theme */
  theme: 'light' | 'dark';
  /** Padding configuration */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * SVG color scheme
 */
export interface SvgColorScheme {
  /** Background color */
  background: string;
  /** Text color */
  text: string;
  /** Line number color */
  lineNumber: string;
  /** Added line colors */
  added: {
    bg: string;
    border: string;
    text: string;
  };
  /** Removed line colors */
  removed: {
    bg: string;
    border: string;
    text: string;
  };
  /** Modified line colors */
  modified: {
    bg: string;
    border: string;
    text: string;
  };
  /** Unchanged line colors */
  unchanged: {
    bg: string;
    border: string;
    text: string;
  };
}

/**
 * Light theme color scheme
 */
const LIGHT_THEME_COLORS: SvgColorScheme = {
  background: '#ffffff',
  text: '#1f2937',
  lineNumber: '#6b7280',
  added: {
    bg: '#dcfce7',
    border: '#22c55e',
    text: '#166534'
  },
  removed: {
    bg: '#fee2e2',
    border: '#ef4444',
    text: '#991b1b'
  },
  modified: {
    bg: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af'
  },
  unchanged: {
    bg: '#f9fafb',
    border: '#d1d5db',
    text: '#6b7280'
  }
};

/**
 * Dark theme color scheme
 */
const DARK_THEME_COLORS: SvgColorScheme = {
  background: '#1a1a1a',
  text: '#e0e0e0',
  lineNumber: '#9ca3af',
  added: {
    bg: '#0d4f28',
    border: '#16a34a',
    text: '#4ade80'
  },
  removed: {
    bg: '#4c0f1a',
    border: '#dc2626',
    text: '#f87171'
  },
  modified: {
    bg: '#1e3a8a',
    border: '#3b82f6',
    text: '#93c5fd'
  },
  unchanged: {
    bg: '#1f2937',
    border: '#4b5563',
    text: '#9ca3af'
  }
};

/**
 * Default SVG options
 */
const DEFAULT_SVG_OPTIONS: SvgDiffOptions = {
  width: 600,
  lineHeight: 20,
  fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
  fontSize: 13,
  includeLineNumbers: true,
  theme: 'light',
  padding: {
    top: 8,
    right: 8,
    bottom: 8,
    left: 8
  }
};

/**
 * SVG Diff Renderer
 * Generates SVG images for diff visualization
 */
export class SvgDiffRenderer {
  /**
   * Generate side-by-side SVG as data URI
   * @param originalLines - Original file diff lines
   * @param modifiedLines - Modified file diff lines
   * @param options - SVG generation options
   * @returns Base64-encoded SVG data URI
   */
  static generateSideBySideSvg(
    originalLines: DiffLine[],
    modifiedLines: DiffLine[],
    options: Partial<SvgDiffOptions> = {}
  ): string {
    const opts = { ...DEFAULT_SVG_OPTIONS, ...options };
    const colorScheme = this.getColorScheme(opts.theme);

    // Use only the provided lines (no merging)
    const lines = originalLines.length > 0 ? originalLines : modifiedLines;

    if (lines.length === 0) {
      return this.generateEmptySvg(opts, colorScheme);
    }

    // Calculate dimensions
    const totalHeight = lines.length * opts.lineHeight + opts.padding.top + opts.padding.bottom;
    const totalWidth = opts.width;

    // Generate SVG content
    const panelContent = this.renderPanel(
      lines,
      opts.padding.left,
      opts.padding.top,
      totalWidth - opts.padding.left - opts.padding.right,
      opts,
      colorScheme
    );

    // Build complete SVG
    const svgAttrs = buildSvgAttributes({
      width: totalWidth,
      height: totalHeight,
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${totalWidth} ${totalHeight}`
    });

    const svg = `<svg ${svgAttrs}>
  ${createSvgRect(0, 0, totalWidth, totalHeight, colorScheme.background)}
  ${panelContent}
</svg>`;

    return svgToDataUri(svg);
  }

  /**
   * Render a single panel
   * @param lines - Diff lines to render
   * @param x - X coordinate offset
   * @param y - Y coordinate offset
   * @param width - Panel width
   * @param options - SVG options
   * @param colorScheme - Color scheme
   * @returns SVG content string
   */
  private static renderPanel(
    lines: DiffLine[],
    x: number,
    y: number,
    width: number,
    options: SvgDiffOptions,
    colorScheme: SvgColorScheme
  ): string {
    const lineElements = lines.map((line, index) => {
      const lineY = y + index * options.lineHeight;
      return this.renderLine(line, x, lineY, width, options, colorScheme);
    });

    return lineElements.join('\n  ');
  }

  /**
   * Render a single diff line
   * @param line - Diff line data
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Line width
   * @param options - SVG options
   * @param colorScheme - Color scheme
   * @returns SVG line content string
   */
  private static renderLine(
    line: DiffLine,
    x: number,
    y: number,
    width: number,
    options: SvgDiffOptions,
    colorScheme: SvgColorScheme
  ): string {
    const colors = this.getLineColors(line.type, colorScheme);
    const symbol = this.getPrefixSymbol(line.type);

    // Layout constants
    const borderWidth = 4;
    const lineNumberWidth = options.includeLineNumbers ? 60 : 0;
    const symbolWidth = 20;
    const textX = x + borderWidth + lineNumberWidth + symbolWidth;
    const baselineY = y + options.lineHeight / 2 + options.fontSize / 3;

    const elements: string[] = [];

    // Background rectangle
    elements.push(
      createSvgRect(x, y, width, options.lineHeight, colors.bg)
    );

    // Left border indicator
    elements.push(
      createSvgRect(x, y, borderWidth, options.lineHeight, colors.border)
    );

    // Line number (if enabled)
    if (options.includeLineNumbers) {
      elements.push(
        createSvgText(
          x + borderWidth + 10,
          baselineY,
          line.lineNumber.toString(),
          {
            fontFamily: options.fontFamily,
            fontSize: options.fontSize - 1,
            fill: colorScheme.lineNumber,
            textAnchor: 'start'
          }
        )
      );
    }

    // Prefix symbol
    elements.push(
      createSvgText(
        x + borderWidth + lineNumberWidth + 5,
        baselineY,
        symbol,
        {
          fontFamily: options.fontFamily,
          fontSize: options.fontSize,
          fill: colors.text,
          opacity: 0.5
        }
      )
    );

    // Line content
    const content = line.content || '';
    elements.push(
      createSvgText(
        textX,
        baselineY,
        content,
        {
          fontFamily: options.fontFamily,
          fontSize: options.fontSize,
          fill: colors.text,
          textAnchor: 'start'
        }
      )
    );

    return createSvgGroup(`translate(0, 0)`, elements.join('\n    '));
  }

  /**
   * Get colors for a specific line type
   * @param type - Line type
   * @param colorScheme - Color scheme
   * @returns Line colors
   */
  private static getLineColors(
    type: string,
    colorScheme: SvgColorScheme
  ): { bg: string; border: string; text: string } {
    switch (type) {
      case 'added':
        return colorScheme.added;
      case 'removed':
        return colorScheme.removed;
      case 'modified':
        return colorScheme.modified;
      default:
        return colorScheme.unchanged;
    }
  }

  /**
   * Get prefix symbol for line type
   * @param type - Line type
   * @returns Prefix symbol
   */
  private static getPrefixSymbol(type: string): string {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'modified':
        return '~';
      default:
        return ' ';
    }
  }

  /**
   * Get color scheme based on theme
   * @param theme - 'light' | 'dark'
   * @returns Color scheme
   */
  private static getColorScheme(theme: 'light' | 'dark'): SvgColorScheme {
    return theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
  }

  /**
   * Generate empty SVG for no content
   * @param options - SVG options
   * @param colorScheme - Color scheme
   * @returns SVG data URI
   */
  private static generateEmptySvg(
    options: SvgDiffOptions,
    colorScheme: SvgColorScheme
  ): string {
    const width = options.width;
    const height = 100;

    const svgAttrs = buildSvgAttributes({
      width,
      height,
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${width} ${height}`
    });

    const svg = `<svg ${svgAttrs}>
  ${createSvgRect(0, 0, width, height, colorScheme.background)}
  ${createSvgText(
    width / 2,
    height / 2,
    'No differences to display',
    {
      fontFamily: options.fontFamily,
      fontSize: 14,
      fill: colorScheme.text,
      textAnchor: 'middle',
      opacity: 0.5
    }
  )}
</svg>`;

    return svgToDataUri(svg);
  }
}
