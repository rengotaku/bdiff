import * as LZString from 'lz-string';

/**
 * Service for compressing and decompressing text content using LZ-string
 */
export class CompressionService {
  /**
   * Compress text content using LZ-string UTF16 encoding
   * @param content - Text content to compress
   * @returns Compressed string
   */
  static compress(content: string): string {
    try {
      return LZString.compressToUTF16(content);
    } catch (error) {
      console.error('Compression failed:', error);
      return content; // Return original content if compression fails
    }
  }

  /**
   * Decompress LZ-string compressed content
   * @param compressedContent - Compressed string
   * @returns Original text content
   */
  static decompress(compressedContent: string): string {
    try {
      const decompressed = LZString.decompressFromUTF16(compressedContent);
      return decompressed !== null ? decompressed : compressedContent;
    } catch (error) {
      console.error('Decompression failed:', error);
      return compressedContent; // Return compressed content if decompression fails
    }
  }

  /**
   * Calculate compression ratio (compressed size / original size)
   * @param original - Original text content
   * @param compressed - Compressed content
   * @returns Compression ratio as decimal (e.g., 0.3 = 30% of original size)
   */
  static getCompressionRatio(original: string, compressed: string): number {
    const originalSize = new Blob([original]).size;
    const compressedSize = new Blob([compressed]).size;
    
    if (originalSize === 0) return 0;
    return compressedSize / originalSize;
  }

  /**
   * Get size information for content
   * @param content - Text content
   * @returns Size in bytes
   */
  static getSize(content: string): number {
    return new Blob([content]).size;
  }

  /**
   * Test compression effectiveness
   * @param content - Content to test
   * @returns Compression statistics
   */
  static testCompression(content: string): {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressionTime: number;
    decompressionTime: number;
  } {
    const startCompress = performance.now();
    const compressed = this.compress(content);
    const compressionTime = performance.now() - startCompress;

    const startDecompress = performance.now();
    const decompressed = this.decompress(compressed);
    const decompressionTime = performance.now() - startDecompress;

    const originalSize = this.getSize(content);
    const compressedSize = this.getSize(compressed);
    const compressionRatio = this.getCompressionRatio(content, compressed);

    // Verify integrity
    if (decompressed !== content) {
      console.warn('Compression/decompression integrity check failed');
    }

    return {
      originalSize,
      compressedSize,
      compressionRatio,
      compressionTime,
      decompressionTime
    };
  }
}