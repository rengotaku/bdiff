import type { ComparisonOptions } from '../types/types';

/**
 * Text preprocessing utilities for diff comparison options
 */
export class TextPreprocessor {
  /**
   * Apply preprocessing to text based on comparison options
   * @param text - The text to preprocess
   * @param options - Comparison options to apply
   * @returns Preprocessed text
   */
  static preprocessText(text: string, options: ComparisonOptions): string {
    let lines = text.split('\n');
    
    // Remove trailing empty lines if ignoreTrailingNewlines is enabled
    if (options.ignoreTrailingNewlines) {
      while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
    }
    
    // Apply whitespace trimming if enabled
    // Also remove empty lines (including lines with only whitespace)
    if (options.ignoreWhitespace) {
      lines = lines.map(line => line.trim()).filter(line => line !== '');
    }
    
    // Apply case normalization if enabled
    if (options.ignoreCase) {
      lines = lines.map(line => line.toLowerCase());
    }
    
    // Apply line sorting if enabled
    if (options.sortLines) {
      // Create a copy and sort to maintain original line breaks
      const sortedLines = [...lines].sort((a, b) => {
        // Empty lines should stay at their relative positions
        if (a === '' && b === '') return 0;
        if (a === '') return 1;
        if (b === '') return -1;
        return a.localeCompare(b);
      });
      lines = sortedLines;
    }
    
    return lines.join('\n');
  }
  
  /**
   * Preprocess both texts for comparison
   * @param text1 - First text
   * @param text2 - Second text
   * @param options - Comparison options
   * @returns Tuple of preprocessed texts
   */
  static preprocessTexts(
    text1: string,
    text2: string,
    options: ComparisonOptions
  ): [string, string] {
    const processed1 = this.preprocessText(text1, options);
    const processed2 = this.preprocessText(text2, options);
    return [processed1, processed2];
  }
  
  /**
   * Create a line mapping for tracking original line numbers after preprocessing
   * @param originalText - Original text before preprocessing
   * @param processedText - Text after preprocessing
   * @returns Map of processed line index to original line index
   */
  static createLineMapping(
    originalText: string,
    processedText: string,
    options: ComparisonOptions
  ): Map<number, number> {
    const originalLines = originalText.split('\n');
    const processedLines = processedText.split('\n');
    const mapping = new Map<number, number>();
    
    if (!options.sortLines) {
      // Direct mapping when lines aren't sorted
      for (let i = 0; i < processedLines.length; i++) {
        mapping.set(i, i);
      }
    } else {
      // Complex mapping when lines are sorted
      const processedWithIndex = processedLines.map((line, index) => ({ line, index }));
      const originalWithIndex = originalLines.map((line, index) => {
        let processedLine = line;
        if (options.ignoreWhitespace) {
          processedLine = processedLine.trim();
        }
        if (options.ignoreCase) {
          processedLine = processedLine.toLowerCase();
        }
        return { line: processedLine, originalIndex: index };
      });
      
      // Match processed lines to original lines
      for (let i = 0; i < processedWithIndex.length; i++) {
        const processedItem = processedWithIndex[i];
        const matchingOriginal = originalWithIndex.find(
          item => item.line === processedItem.line
        );
        if (matchingOriginal) {
          mapping.set(i, matchingOriginal.originalIndex);
        }
      }
    }
    
    return mapping;
  }
  
  /**
   * Get default comparison options
   * @returns Default ComparisonOptions with trailing newlines ignored by default
   */
  static getDefaultOptions(): ComparisonOptions {
    return {
      sortLines: false,
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreTrailingNewlines: true,  // Default checked
      enableCharDiff: true  // Default enabled for inline character highlighting
    };
  }
  
  /**
   * Check if any preprocessing option is enabled
   * @param options - Comparison options
   * @returns True if any option is enabled
   */
  static hasActiveOptions(options: ComparisonOptions): boolean {
    return options.sortLines || options.ignoreCase || options.ignoreWhitespace || options.ignoreTrailingNewlines;
  }
  
  /**
   * Get a description of active options for display
   * @param options - Comparison options
   * @returns Human-readable description of active options
   */
  static getOptionsDescription(options: ComparisonOptions): string {
    const active: string[] = [];
    
    if (options.sortLines) {
      active.push('Sorted lines');
    }
    if (options.ignoreCase) {
      active.push('Case-insensitive');
    }
    if (options.ignoreWhitespace) {
      active.push('Whitespace ignored');
    }
    if (options.ignoreTrailingNewlines) {
      active.push('Trailing newlines ignored');
    }
    
    if (active.length === 0) {
      return 'Standard comparison';
    }
    
    return `Options: ${active.join(', ')}`;
  }
}

export default TextPreprocessor;