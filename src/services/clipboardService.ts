/**
 * ClipboardService - Modern clipboard API with fallback support
 * Provides secure, cross-browser clipboard functionality
 */

export interface ClipboardPermissionState {
  granted: boolean
  denied: boolean
  prompt: boolean
}

export class ClipboardService {
  /**
   * Check if modern Clipboard API is supported
   */
  static isModernClipboardSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof navigator.clipboard.writeText === 'function'
    )
  }

  /**
   * Check if legacy clipboard (execCommand) is supported
   */
  static isLegacyClipboardSupported(): boolean {
    return (
      typeof document !== 'undefined' &&
      typeof document.execCommand === 'function'
    )
  }

  /**
   * Check if any clipboard functionality is available
   */
  static isClipboardSupported(): boolean {
    return this.isModernClipboardSupported() || this.isLegacyClipboardSupported()
  }

  /**
   * Request clipboard permission (modern browsers)
   */
  static async requestPermission(): Promise<ClipboardPermissionState> {
    if (!this.isModernClipboardSupported()) {
      return { granted: false, denied: true, prompt: false }
    }

    try {
      // @ts-ignore - navigator.permissions.query may not be available in all browsers
      if (navigator.permissions && navigator.permissions.query) {
        // @ts-ignore
        const permission = await navigator.permissions.query({ name: 'clipboard-write' })
        return {
          granted: permission.state === 'granted',
          denied: permission.state === 'denied',
          prompt: permission.state === 'prompt'
        }
      }
    } catch (error) {
      console.debug('Permission query not supported:', error)
    }

    // If permission query is not supported, assume we can try
    return { granted: false, denied: false, prompt: true }
  }

  /**
   * Copy text to clipboard using modern API
   */
  private static async copyWithModernAPI(text: string): Promise<void> {
    if (!this.isModernClipboardSupported()) {
      throw new Error('Modern clipboard API not supported')
    }

    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      // Handle specific clipboard errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Clipboard access denied. Please allow clipboard permissions.')
        } else if (error.name === 'SecurityError') {
          throw new Error('Clipboard access requires HTTPS or localhost.')
        } else {
          throw new Error(`Clipboard error: ${error.message}`)
        }
      }
      throw error
    }
  }

  /**
   * Copy text to clipboard using legacy API (fallback)
   */
  private static async copyWithLegacyAPI(text: string): Promise<void> {
    if (!this.isLegacyClipboardSupported()) {
      throw new Error('Legacy clipboard API not supported')
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '-9999px'
        textarea.style.opacity = '0'
        textarea.setAttribute('readonly', '')
        textarea.setAttribute('aria-hidden', 'true')

        document.body.appendChild(textarea)
        
        // Select and copy
        textarea.select()
        textarea.setSelectionRange(0, textarea.value.length)
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)

        if (successful) {
          resolve()
        } else {
          reject(new Error('Legacy clipboard copy failed'))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Copy text to clipboard with automatic fallback
   */
  static async copyText(text: string): Promise<void> {
    if (!text) {
      throw new Error('No text provided to copy')
    }

    // Validate that we have some clipboard support
    if (!this.isClipboardSupported()) {
      throw new Error('Clipboard functionality is not supported in this browser')
    }

    // Try modern API first
    if (this.isModernClipboardSupported()) {
      try {
        await this.copyWithModernAPI(text)
        return
      } catch (error) {
        console.debug('Modern clipboard failed, trying legacy:', error)
        
        // If modern API fails and we have legacy support, try fallback
        if (this.isLegacyClipboardSupported()) {
          await this.copyWithLegacyAPI(text)
          return
        }
        
        // If no fallback, re-throw the modern API error
        throw error
      }
    }

    // If modern API not supported, use legacy directly
    if (this.isLegacyClipboardSupported()) {
      await this.copyWithLegacyAPI(text)
      return
    }

    throw new Error('No clipboard API available')
  }

  /**
   * Copy HTML to clipboard (modern browsers only)
   * Note: This is more complex and not all browsers support it well
   */
  static async copyHtml(html: string, fallbackText?: string): Promise<void> {
    if (!this.isModernClipboardSupported()) {
      if (fallbackText) {
        await this.copyText(fallbackText)
        return
      }
      throw new Error('HTML clipboard not supported, please provide fallbackText')
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([fallbackText || html.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
        })
      ])
    } catch (error) {
      // If HTML copy fails, try plain text fallback
      if (fallbackText) {
        await this.copyText(fallbackText)
        return
      }
      throw error
    }
  }

  /**
   * Check if clipboard write permission is granted
   */
  static async hasWritePermission(): Promise<boolean> {
    const permission = await this.requestPermission()
    return permission.granted
  }

  /**
   * Get user-friendly error message for clipboard errors
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Return user-friendly messages
      if (error.message.includes('denied')) {
        return 'クリップボードへのアクセスが拒否されました。ブラウザの設定でクリップボードのアクセスを許可してください。'
      }
      if (error.message.includes('HTTPS')) {
        return 'クリップボード機能にはHTTPS接続が必要です。'
      }
      if (error.message.includes('not supported')) {
        return 'このブラウザではクリップボード機能がサポートされていません。'
      }
      return `クリップボードエラー: ${error.message}`
    }
    return 'クリップボードへのコピーに失敗しました。'
  }
}