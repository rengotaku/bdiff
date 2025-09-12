import type { DiffLine, DiffType } from '../types/types'

export interface DiffFormatOptions {
  includeLineNumbers?: boolean
  includeContext?: boolean
  format?: 'plain' | 'diff' | 'markdown' | 'html'
  selectedTypes?: DiffType[]
}

export class DiffFormatter {
  /**
   * Filter diff lines by type
   */
  static filterByType(lines: DiffLine[], types: DiffType[]): DiffLine[] {
    return lines.filter(line => types.includes(line.type))
  }

  /**
   * Get diff symbol for line type
   */
  private static getDiffSymbol(type: DiffType): string {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      case 'modified':
        return '~'
      case 'unchanged':
        return ' '
      default:
        return ' '
    }
  }

  /**
   * Format lines as plain text
   */
  static toPlainText(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const {
      includeLineNumbers = false,
      selectedTypes = ['added', 'removed', 'modified', 'unchanged']
    } = options

    const filteredLines = this.filterByType(lines, selectedTypes)
    
    return filteredLines.map(line => {
      const parts: string[] = []
      
      if (includeLineNumbers) {
        parts.push(`${line.lineNumber}:`)
      }
      
      parts.push(line.content || '')
      
      return parts.join(' ').trim()
    }).join('\n')
  }

  /**
   * Format lines with diff symbols (+/-)
   */
  static toDiffFormat(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const {
      includeLineNumbers = false,
      selectedTypes = ['added', 'removed', 'modified', 'unchanged']
    } = options

    const filteredLines = this.filterByType(lines, selectedTypes)
    
    return filteredLines.map(line => {
      const parts: string[] = []
      
      // Add diff symbol
      parts.push(this.getDiffSymbol(line.type))
      
      if (includeLineNumbers) {
        parts.push(`${line.lineNumber}:`)
      }
      
      parts.push(line.content || '')
      
      return parts.join(' ').trim()
    }).join('\n')
  }

  /**
   * Format lines as Markdown
   */
  static toMarkdown(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const {
      includeLineNumbers = false,
      selectedTypes = ['added', 'removed', 'modified', 'unchanged']
    } = options

    const filteredLines = this.filterByType(lines, selectedTypes)
    
    if (filteredLines.length === 0) {
      return ''
    }

    const markdownLines = ['```diff']
    
    filteredLines.forEach(line => {
      const parts: string[] = []
      
      // Add diff symbol
      parts.push(this.getDiffSymbol(line.type))
      
      if (includeLineNumbers) {
        parts.push(`${line.lineNumber}:`)
      }
      
      parts.push(line.content || '')
      
      markdownLines.push(parts.join(' ').trim())
    })
    
    markdownLines.push('```')
    
    return markdownLines.join('\n')
  }

  /**
   * Format lines as HTML
   */
  static toHtml(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const {
      includeLineNumbers = false,
      selectedTypes = ['added', 'removed', 'modified', 'unchanged']
    } = options

    const filteredLines = this.filterByType(lines, selectedTypes)
    
    if (filteredLines.length === 0) {
      return ''
    }

    const escapeHtml = (text: string): string => {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }

    const getLineClass = (type: DiffType): string => {
      switch (type) {
        case 'added':
          return 'diff-added'
        case 'removed':
          return 'diff-removed'
        case 'modified':
          return 'diff-modified'
        default:
          return 'diff-unchanged'
      }
    }

    const htmlLines = ['<div class="diff-container">']
    
    filteredLines.forEach(line => {
      const className = getLineClass(line.type)
      const symbol = escapeHtml(this.getDiffSymbol(line.type))
      const content = escapeHtml(line.content || '')
      const lineNumber = includeLineNumbers ? `<span class="line-number">${line.lineNumber}:</span>` : ''
      
      htmlLines.push(
        `<div class="diff-line ${className}">` +
        `<span class="diff-symbol">${symbol}</span>` +
        lineNumber +
        `<span class="diff-content">${content}</span>` +
        '</div>'
      )
    })
    
    htmlLines.push('</div>')
    
    return htmlLines.join('\n')
  }

  /**
   * Get a summary of diff statistics
   */
  static getDiffSummary(lines: DiffLine[]): string {
    const stats = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0,
      total: lines.length
    }

    lines.forEach(line => {
      stats[line.type]++
    })

    const parts: string[] = []
    
    if (stats.added > 0) {
      parts.push(`+${stats.added}`)
    }
    
    if (stats.removed > 0) {
      parts.push(`-${stats.removed}`)
    }
    
    if (stats.modified > 0) {
      parts.push(`~${stats.modified}`)
    }

    return parts.length > 0 ? parts.join(' ') : 'No differences'
  }

  /**
   * Format diff with multiple options
   */
  static format(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const { format = 'plain' } = options

    switch (format) {
      case 'diff':
        return this.toDiffFormat(lines, options)
      case 'markdown':
        return this.toMarkdown(lines, options)
      case 'html':
        return this.toHtml(lines, options)
      case 'plain':
      default:
        return this.toPlainText(lines, options)
    }
  }

  /**
   * Create a formatted diff with header information
   */
  static formatWithHeader(
    lines: DiffLine[], 
    options: DiffFormatOptions & { 
      filename?: string
      originalFilename?: string
      modifiedFilename?: string
    } = {}
  ): string {
    const { 
      format = 'plain',
      filename = 'diff',
      originalFilename = 'original',
      modifiedFilename = 'modified'
    } = options

    const summary = this.getDiffSummary(lines)
    const content = this.format(lines, options)

    switch (format) {
      case 'markdown':
        return `## ${filename}\n\n**Changes:** ${summary}\n\n${content}`
      
      case 'html':
        return `<h3>${filename}</h3><p><strong>Changes:</strong> ${summary}</p>${content}`
      
      case 'diff':
        return `--- ${originalFilename}\n+++ ${modifiedFilename}\n@@ Changes: ${summary} @@\n${content}`
      
      case 'plain':
      default:
        return `${filename} (${summary}):\n\n${content}`
    }
  }

  /**
   * Get only changed lines (added, removed, modified)
   */
  static getChangedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['added', 'removed', 'modified'])
  }

  /**
   * Get only added lines
   */
  static getAddedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['added'])
  }

  /**
   * Get only removed lines
   */
  static getRemovedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['removed'])
  }

  /**
   * Get only modified lines
   */
  static getModifiedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['modified'])
  }

  /**
   * Get line count by type
   */
  static getLineStats(lines: DiffLine[]): Record<DiffType, number> {
    const stats: Record<DiffType, number> = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    }

    lines.forEach(line => {
      stats[line.type]++
    })

    return stats
  }
}