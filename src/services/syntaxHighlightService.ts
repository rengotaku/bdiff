import Prism from 'prismjs'

// Import language components
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-nginx'
import 'prismjs/components/prism-xml-doc'

// Language detection map
const extensionToLanguage: Record<string, string> = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  
  // Web
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.svg': 'xml',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'scss',
  '.less': 'css',
  
  // Data formats
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  
  // Programming languages
  '.py': 'python',
  '.java': 'java',
  '.c': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.php': 'php',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.r': 'r',
  '.lua': 'lua',
  '.dart': 'dart',
  
  // Shell/Config
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.fish': 'bash',
  '.ps1': 'powershell',
  '.dockerfile': 'docker',
  'Dockerfile': 'docker',
  '.dockerignore': 'docker',
  '.nginx': 'nginx',
  '.conf': 'nginx',
  
  // Database
  '.sql': 'sql',
  '.psql': 'sql',
  '.mysql': 'sql',
  
  // Documentation
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.rst': 'rest',
  '.tex': 'latex',
  
  // Others
  '.graphql': 'graphql',
  '.proto': 'protobuf',
  '.vim': 'vim',
  '.patch': 'diff',
  '.diff': 'diff'
}

export class SyntaxHighlightService {
  /**
   * Detect language from file name
   */
  static detectLanguage(fileName: string): string | null {
    if (!fileName) return null
    
    // Check for specific file names
    const lowerFileName = fileName.toLowerCase()
    if (lowerFileName === 'dockerfile') return 'docker'
    if (lowerFileName === 'makefile') return 'makefile'
    if (lowerFileName === '.gitignore') return 'gitignore'
    if (lowerFileName === '.env') return 'bash'
    
    // Check extension
    const extension = this.getFileExtension(fileName)
    if (extension && extensionToLanguage[extension]) {
      return extensionToLanguage[extension]
    }
    
    // Check if it's a common config file
    if (fileName.endsWith('rc') || fileName.endsWith('config')) {
      return 'json'
    }
    
    return null
  }
  
  /**
   * Get file extension
   */
  private static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    if (lastDot === -1) return ''
    return fileName.substring(lastDot).toLowerCase()
  }
  
  /**
   * Highlight code with detected or specified language
   */
  static highlightCode(code: string, language?: string): string {
    if (!language || !Prism.languages[language]) {
      return this.escapeHtml(code)
    }
    
    try {
      const highlighted = Prism.highlight(code, Prism.languages[language], language)
      return highlighted
    } catch (error) {
      console.error('Syntax highlighting error:', error)
      return this.escapeHtml(code)
    }
  }
  
  /**
   * Highlight code line with preserved formatting
   */
  static highlightLine(line: string, language?: string): string {
    if (!language || !Prism.languages[language]) {
      return this.escapeHtml(line)
    }
    
    try {
      // Preserve leading/trailing whitespace
      const trimmed = line.trim()
      const leadingSpace = line.match(/^(\s*)/)?.[1] || ''
      const trailingSpace = line.match(/(\s*)$/)?.[1] || ''
      
      if (!trimmed) {
        return this.escapeHtml(line)
      }
      
      const highlighted = Prism.highlight(trimmed, Prism.languages[language], language)
      return this.escapeHtml(leadingSpace) + highlighted + this.escapeHtml(trailingSpace)
    } catch (error) {
      console.error('Syntax highlighting error:', error)
      return this.escapeHtml(line)
    }
  }
  
  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    
    return text.replace(/[&<>"']/g, (m) => map[m])
  }
  
  /**
   * Check if syntax highlighting is available for a language
   */
  static isLanguageSupported(language: string): boolean {
    return !!Prism.languages[language]
  }
  
  /**
   * Get list of supported languages
   */
  static getSupportedLanguages(): string[] {
    return Object.keys(Prism.languages).filter(
      lang => lang !== 'extend' && lang !== 'insertBefore' && lang !== 'DFS'
    )
  }
  
  /**
   * Get display name for a language
   */
  static getLanguageDisplayName(language: string): string {
    const displayNames: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      jsx: 'JSX',
      tsx: 'TSX',
      python: 'Python',
      java: 'Java',
      csharp: 'C#',
      cpp: 'C++',
      c: 'C',
      go: 'Go',
      rust: 'Rust',
      php: 'PHP',
      ruby: 'Ruby',
      swift: 'Swift',
      kotlin: 'Kotlin',
      sql: 'SQL',
      bash: 'Bash',
      docker: 'Docker',
      nginx: 'Nginx',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
      xml: 'XML'
    }
    
    return displayNames[language] || language.charAt(0).toUpperCase() + language.slice(1)
  }
}