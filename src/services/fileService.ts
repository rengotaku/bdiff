import type { FileInfo } from '../types/types'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export class FileService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly SUPPORTED_TYPES = [
    'text/plain',
    'text/javascript',
    'text/typescript',
    'text/html',
    'text/css',
    'text/markdown',
    'application/json',
    'application/xml',
    'text/xml'
  ]

  /**
   * ファイルを読み込んでFileInfo形式に変換
   */
  static async readFile(file: File): Promise<FileInfo> {
    // ファイルバリデーション
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const fileInfo: FileInfo = {
            name: file.name,
            content: content,
            size: file.size,
            lastModified: new Date(file.lastModified)
          }
          resolve(fileInfo)
        } catch (error) {
          reject(new Error('ファイルの読み込みに失敗しました'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('ファイルの読み込み中にエラーが発生しました'))
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * 複数のファイルを同時に読み込み
   */
  static async readFiles(files: File[]): Promise<FileInfo[]> {
    const promises = files.map(file => this.readFile(file))
    return Promise.all(promises)
  }

  /**
   * ファイルのバリデーション
   */
  static validateFile(file: File): ValidationResult {
    // ファイルサイズチェック
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `ファイルサイズが上限（${this.formatFileSize(this.MAX_FILE_SIZE)}）を超えています`
      }
    }

    // ファイルタイプチェック
    if (!this.isTextFile(file)) {
      return {
        isValid: false,
        error: 'サポートされていないファイル形式です。テキストファイルのみアップロード可能です'
      }
    }

    return { isValid: true }
  }

  /**
   * テキストファイルかどうかを判定
   */
  private static isTextFile(file: File): boolean {
    // MIMEタイプでチェック
    if (file.type && this.SUPPORTED_TYPES.some(type => file.type.startsWith(type))) {
      return true
    }

    // 拡張子でチェック
    const extension = this.getFileExtension(file.name).toLowerCase()
    const textExtensions = [
      'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml',
      'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass',
      'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb',
      'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh',
      'sql', 'r', 'matlab', 'perl', 'lua', 'vim', 'log'
    ]

    return textExtensions.includes(extension)
  }

  /**
   * ファイル拡張子を取得
   */
  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.slice(lastDot + 1) : ''
  }

  /**
   * ファイルサイズをフォーマット
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * ファイルタイプを判定
   */
  static getFileType(filename: string): string {
    const extension = this.getFileExtension(filename).toLowerCase()
    
    const typeMap: Record<string, string> = {
      // Web
      'html': 'HTML',
      'htm': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'SASS',
      'js': 'JavaScript',
      'jsx': 'JSX',
      'ts': 'TypeScript',
      'tsx': 'TSX',
      
      // Data
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      
      // Programming
      'py': 'Python',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'h': 'Header',
      'hpp': 'C++ Header',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      
      // Shell
      'sh': 'Shell Script',
      'bash': 'Bash Script',
      'zsh': 'Zsh Script',
      
      // Other
      'sql': 'SQL',
      'md': 'Markdown',
      'txt': 'Text',
      'log': 'Log'
    }
    
    return typeMap[extension] || 'Text'
  }

  /**
   * テキストからファイル情報を作成
   */
  static createFileInfoFromText(content: string, name: string = 'untitled.txt'): FileInfo {
    const encoder = new TextEncoder()
    const size = encoder.encode(content).length
    
    return {
      name,
      content,
      size,
      lastModified: new Date()
    }
  }

  /**
   * エンコーディング検出（簡易版）
   */
  static detectEncoding(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    
    // UTF-8 BOMチェック
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return 'UTF-8'
    }
    
    // UTF-16 BOMチェック
    if (bytes.length >= 2) {
      if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'UTF-16LE'
      if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'UTF-16BE'
    }
    
    // デフォルトはUTF-8と仮定
    return 'UTF-8'
  }

  /**
   * ファイル内容をダウンロード
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}