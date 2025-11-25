/**
 * SVG Utility Functions
 * Helper functions for SVG generation and manipulation
 */

/**
 * Build SVG element attributes string from object
 * @param attrs - Key-value pairs of attribute names and values
 * @returns Formatted attribute string
 */
export function buildSvgAttributes(attrs: Record<string, string | number>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

/**
 * Escape text for safe use in SVG text elements
 * Prevents XSS and rendering issues
 * @param text - Text to escape
 * @returns Escaped text safe for SVG
 */
export function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Ensure color value is in valid SVG format
 * @param color - Color value (hex or rgb)
 * @returns Valid SVG color string
 */
export function normalizeColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Convert string to Base64
 * Handles Unicode characters properly
 * @param str - String to encode
 * @returns Base64 encoded string
 */
export function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Convert SVG string to Data URI
 * @param svg - SVG markup string
 * @returns data:image/svg+xml;base64,{encoded}
 */
export function svgToDataUri(svg: string): string {
  const base64 = toBase64(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Calculate text width approximation for monospace font
 * Used for layout calculations
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @returns Approximate width in pixels
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  // Monospace fonts are typically 0.6 * fontSize wide per character
  return text.length * fontSize * 0.6;
}

/**
 * Create SVG rect element
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param fill - Fill color
 * @param additionalAttrs - Additional attributes
 * @returns SVG rect element string
 */
export function createSvgRect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  additionalAttrs: Record<string, string | number> = {}
): string {
  const attrs = buildSvgAttributes({
    x,
    y,
    width,
    height,
    fill: normalizeColor(fill),
    ...additionalAttrs
  });
  return `<rect ${attrs} />`;
}

/**
 * Create SVG text element
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param content - Text content
 * @param options - Text styling options
 * @returns SVG text element string
 */
export function createSvgText(
  x: number,
  y: number,
  content: string,
  options: {
    fontFamily?: string;
    fontSize?: number;
    fill?: string;
    textAnchor?: 'start' | 'middle' | 'end';
    opacity?: number;
    additionalAttrs?: Record<string, string | number>;
  } = {}
): string {
  const {
    fontFamily = 'monospace',
    fontSize = 12,
    fill = '#000000',
    textAnchor = 'start',
    opacity = 1,
    additionalAttrs = {}
  } = options;

  const attrs = buildSvgAttributes({
    x,
    y,
    'font-family': fontFamily,
    'font-size': fontSize,
    fill: normalizeColor(fill),
    'text-anchor': textAnchor,
    opacity,
    ...additionalAttrs
  });

  return `<text ${attrs}>${escapeSvgText(content)}</text>`;
}

/**
 * Create SVG group element with transform
 * @param transform - Transform attribute value
 * @param content - Inner SVG content
 * @param additionalAttrs - Additional attributes
 * @returns SVG g element string
 */
export function createSvgGroup(
  transform: string,
  content: string,
  additionalAttrs: Record<string, string | number> = {}
): string {
  const attrs = buildSvgAttributes({
    transform,
    ...additionalAttrs
  });
  return `<g ${attrs}>${content}</g>`;
}
