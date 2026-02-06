import type { DiffLine } from '../types/types';

/**
 * Utility functions for rendering diff lines with consistent styling
 */

export const getLineClassName = (type: DiffLine['type']): string => {
  const base = 'font-mono text-sm border-l-4 px-4 py-1 whitespace-pre-wrap';
  switch (type) {
    case 'added':
      return `${base} bg-green-50 border-green-400 text-green-800`;
    case 'removed':
      return `${base} bg-red-50 border-red-400 text-red-800`;
    case 'modified':
      return `${base} bg-blue-50 border-blue-400 text-blue-800`;
    default:
      return `${base} bg-white border-gray-200 text-gray-700`;
  }
};

export const getPrefixSymbol = (type: DiffLine['type']): string => {
  switch (type) {
    case 'added': return '+';
    case 'removed': return '-';
    case 'modified': return '~';
    default: return ' ';
  }
};

export const formatLineForCopy = (line: DiffLine): string => {
  const symbol = getPrefixSymbol(line.type);
  // For unchanged lines, we want "  content" (2 spaces)
  // For other lines, we want "X content" where X is +, -, or ~
  if (line.type === 'unchanged') {
    return `  ${line.content || ''}`;
  }
  return `${symbol} ${line.content || ''}`;
};