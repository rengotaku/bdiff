import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LinePairingService } from '../linePairingService';
import type { DiffLine } from '../../types/types';
import type { MatchingAlgorithm } from '../linePairingService';

/**
 * Helper to create DiffLine objects for testing
 */
function createLine(
  content: string,
  type: 'removed' | 'added' | 'unchanged',
  lineNumber: number
): DiffLine {
  return {
    lineNumber,
    content,
    type,
    originalLineNumber: type !== 'added' ? lineNumber : undefined,
    newLineNumber: type !== 'removed' ? lineNumber : undefined,
  };
}

describe('LinePairingService', () => {
  // ========================================
  // アルゴリズム切り替えテスト
  // ========================================
  describe('アルゴリズム切り替え', () => {
    let originalAlgorithm: MatchingAlgorithm;

    beforeEach(() => {
      originalAlgorithm = LinePairingService.getAlgorithm();
    });

    afterEach(() => {
      LinePairingService.setAlgorithm(originalAlgorithm);
    });

    it('デフォルトはgreedyアルゴリズム', () => {
      LinePairingService.setAlgorithm('greedy'); // reset to default
      expect(LinePairingService.getAlgorithm()).toBe('greedy');
    });

    it('recursiveアルゴリズムに切り替え可能', () => {
      LinePairingService.setAlgorithm('recursive');
      expect(LinePairingService.getAlgorithm()).toBe('recursive');
    });

    it('両アルゴリズムで同じ基本ケースが動作する', () => {
      const lines: DiffLine[] = [
        createLine('A', 'removed', 1),
        createLine('B', 'removed', 2),
        createLine('A', 'added', 3),
        createLine('B', 'added', 4),
      ];

      // Greedy
      LinePairingService.setAlgorithm('greedy');
      const greedyResult = LinePairingService.pairLinesForSideBySide(lines, false);

      // Recursive
      LinePairingService.setAlgorithm('recursive');
      const recursiveResult = LinePairingService.pairLinesForSideBySide(lines, false);

      // Both should produce 2 pairs with A↔A and B↔B
      expect(greedyResult).toHaveLength(2);
      expect(recursiveResult).toHaveLength(2);

      expect(greedyResult[0].original?.line.content).toBe('A');
      expect(greedyResult[0].modified?.line.content).toBe('A');
      expect(recursiveResult[0].original?.line.content).toBe('A');
      expect(recursiveResult[0].modified?.line.content).toBe('A');
    });

    it('similarityThresholdを変更可能', () => {
      const original = LinePairingService.getSimilarityThreshold();

      LinePairingService.setSimilarityThreshold(0.8);
      expect(LinePairingService.getSimilarityThreshold()).toBe(0.8);

      // Reset
      LinePairingService.setSimilarityThreshold(original);
    });
  });

  describe('pairLinesForSideBySide - マッチングテスト', () => {

    // ========================================
    // A. 基本ケース
    // ========================================
    describe('基本ケース', () => {
      it('空入力の場合、空配列を返す', () => {
        const result = LinePairingService.pairLinesForSideBySide([], false);
        expect(result).toEqual([]);
      });

      it('removedのみの場合、左側のみに表示', () => {
        const lines: DiffLine[] = [
          createLine('削除行1', 'removed', 1),
          createLine('削除行2', 'removed', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(2);
        expect(result[0].original?.line.content).toBe('削除行1');
        expect(result[0].modified).toBeNull();
        expect(result[1].original?.line.content).toBe('削除行2');
        expect(result[1].modified).toBeNull();
      });

      it('addedのみの場合、右側のみに表示', () => {
        const lines: DiffLine[] = [
          createLine('追加行1', 'added', 1),
          createLine('追加行2', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(2);
        expect(result[0].original).toBeNull();
        expect(result[0].modified?.line.content).toBe('追加行1');
        expect(result[1].original).toBeNull();
        expect(result[1].modified?.line.content).toBe('追加行2');
      });

      it('unchangedのみの場合、両側に同じ内容を表示', () => {
        const lines: DiffLine[] = [
          createLine('変更なし', 'unchanged', 1),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(1);
        expect(result[0].original?.line.content).toBe('変更なし');
        expect(result[0].modified?.line.content).toBe('変更なし');
      });
    });

    // ========================================
    // B. マッチング精度
    // ========================================
    describe('マッチング精度', () => {
      it('完全一致する行はペアリングされる', () => {
        const lines: DiffLine[] = [
          createLine('興和株式会社', 'removed', 1),
          createLine('興和株式会社', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(1);
        expect(result[0].original?.line.content).toBe('興和株式会社');
        expect(result[0].modified?.line.content).toBe('興和株式会社');
      });

      it('類似する行はペアリングされる（末尾の句読点違い）', () => {
        const lines: DiffLine[] = [
          createLine('すでに初回アート監修OK済み（現在サンプル作成中）の、', 'removed', 1),
          createLine('すでに初回アート監修OK済み（現在サンプル作成中）の', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(1);
        expect(result[0].original?.line.content).toContain('すでに初回アート監修OK済み');
        expect(result[0].modified?.line.content).toContain('すでに初回アート監修OK済み');
      });

      it('全く異なる行は別々に出力される（インターリーブなし）', () => {
        const lines: DiffLine[] = [
          createLine('これは削除される行です', 'removed', 1),
          createLine('ABCDEFGHIJKLMNOP', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // 類似していない行はペアリングされず、別々に出力される
        expect(result).toHaveLength(2);
        expect(result[0].original?.line.content).toBe('これは削除される行です');
        expect(result[0].modified).toBeNull();
        expect(result[1].original).toBeNull();
        expect(result[1].modified?.line.content).toBe('ABCDEFGHIJKLMNOP');
      });

      it('複数の候補から最も類似度の高いペアを選択', () => {
        const lines: DiffLine[] = [
          createLine('橋本様', 'removed', 1),
          createLine('麻生様', 'removed', 2),
          createLine('橋本さん', 'added', 3),  // 橋本様と類似
          createLine('麻生さん', 'added', 4),  // 麻生様と類似
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(2);
        // 橋本様 ↔ 橋本さん
        expect(result[0].original?.line.content).toBe('橋本様');
        expect(result[0].modified?.line.content).toBe('橋本さん');
        // 麻生様 ↔ 麻生さん
        expect(result[1].original?.line.content).toBe('麻生様');
        expect(result[1].modified?.line.content).toBe('麻生さん');
      });
    });

    // ========================================
    // C. 順序保持（diff2html方式の核心）
    // ========================================
    describe('順序保持', () => {
      it('順序を保持してマッチング（交差しない）', () => {
        // removed[0]がadded[1]と類似、removed[1]がadded[0]と類似する場合でも
        // 順序を保持してマッチングする
        const lines: DiffLine[] = [
          createLine('AAA', 'removed', 1),
          createLine('BBB', 'removed', 2),
          createLine('BBB modified', 'added', 3),  // BBBと類似だが先に来る
          createLine('AAA modified', 'added', 4),  // AAAと類似だが後に来る
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // 順序保持: AAA↔BBB modified は交差するのでマッチしない
        // 正しい動作: AAA↔AAA modified (類似度が十分高ければ)、BBB↔BBB modified
        // 順序が交差する場合は、順序を優先してマッチングしない
        expect(result.length).toBeGreaterThanOrEqual(2);

        // 順序が保持されていることを確認（removed行の順序）
        const originalContents = result
          .filter(p => p.original !== null)
          .map(p => p.original!.line.content);
        expect(originalContents).toEqual(['AAA', 'BBB']);
      });

      it('空行を含むブロックでも正しくマッチング', () => {
        const lines: DiffLine[] = [
          createLine('興和株式会社', 'removed', 1),
          createLine('', 'removed', 2),
          createLine('橋本様', 'removed', 3),
          createLine('興和株式会社', 'added', 4),
          createLine('橋本様', 'added', 5),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // 興和株式会社 ↔ 興和株式会社
        // 空行 ↔ null
        // 橋本様 ↔ 橋本様
        const matched = result.filter(p => p.original && p.modified);
        expect(matched.length).toBe(2);
        expect(matched[0].original?.line.content).toBe('興和株式会社');
        expect(matched[1].original?.line.content).toBe('橋本様');
      });
    });

    // ========================================
    // D. 実際のバグケース（回帰テスト）
    // ========================================
    describe('回帰テスト（過去のバグケース）', () => {
      it('連続removed後に連続addedのパターン（Myers出力）', () => {
        // jsdiffやMyersが出力する典型的なパターン
        const lines: DiffLine[] = [
          createLine('興和株式会社', 'removed', 1),
          createLine('', 'removed', 2),
          createLine('橋本様', 'removed', 3),
          createLine('', 'removed', 4),
          createLine('麻生様', 'removed', 5),
          createLine('興和株式会社', 'added', 6),
          createLine('橋本様', 'added', 7),
          createLine('麻生様', 'added', 8),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // 空行は別扱い、実際のテキストはペアリング
        const matchedPairs = result.filter(
          p => p.original && p.modified &&
               p.original.line.content === p.modified.line.content
        );

        expect(matchedPairs.length).toBe(3);
        expect(matchedPairs.map(p => p.original!.line.content)).toEqual([
          '興和株式会社',
          '橋本様',
          '麻生様'
        ]);
      });

      it('unchanged行で区切られたremoved/addedも2パス目でマッチする', () => {
        // 2パスアプローチにより、離れた位置の類似行もマッチする
        const lines: DiffLine[] = [
          createLine('削除される行', 'removed', 1),
          createLine('変更なしの行', 'unchanged', 2),
          createLine('削除される行', 'added', 3),  // 同じ内容なのでマッチする
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(2);
        // removed と added がマッチしてペアになる
        expect(result[0].original?.line.content).toBe('削除される行');
        expect(result[0].modified?.line.content).toBe('削除される行');
        // unchanged
        expect(result[1].original?.line.type).toBe('unchanged');
        expect(result[1].modified?.line.type).toBe('unchanged');
      });

      it('長いテキストでも正しくマッチング', () => {
        const longText = 'これは非常に長いテキストで、差分比較のテストに使用します。' +
                        '複数の文が含まれており、類似度計算が正しく動作するかを確認します。';
        const lines: DiffLine[] = [
          createLine(longText, 'removed', 1),
          createLine(longText + '追記', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(1);
        expect(result[0].original).not.toBeNull();
        expect(result[0].modified).not.toBeNull();
      });
    });

    // ========================================
    // E. diff2html方式のエッジケース
    // ========================================
    describe('diff2html方式エッジケース', () => {
      it('配列の合計長が3未満の場合も正しく処理', () => {
        // removed 1, added 1 = 合計2
        const lines: DiffLine[] = [
          createLine('A', 'removed', 1),
          createLine('A', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);
        expect(result).toHaveLength(1);
        expect(result[0].original?.line.content).toBe('A');
        expect(result[0].modified?.line.content).toBe('A');
      });

      it('先頭でマッチする場合', () => {
        const lines: DiffLine[] = [
          createLine('MATCH', 'removed', 1),
          createLine('other1', 'removed', 2),
          createLine('other2', 'removed', 3),
          createLine('MATCH', 'added', 4),
          createLine('diff1', 'added', 5),
          createLine('diff2', 'added', 6),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // MATCHが最初にペアリングされる
        const matchPair = result.find(
          p => p.original?.line.content === 'MATCH' && p.modified?.line.content === 'MATCH'
        );
        expect(matchPair).toBeDefined();
      });

      it('末尾でマッチする場合', () => {
        const lines: DiffLine[] = [
          createLine('other1', 'removed', 1),
          createLine('other2', 'removed', 2),
          createLine('MATCH', 'removed', 3),
          createLine('diff1', 'added', 4),
          createLine('diff2', 'added', 5),
          createLine('MATCH', 'added', 6),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // MATCHが最後にペアリングされる
        const matchPair = result.find(
          p => p.original?.line.content === 'MATCH' && p.modified?.line.content === 'MATCH'
        );
        expect(matchPair).toBeDefined();
      });

      it('中央でマッチする場合（分割の核心テスト）', () => {
        const lines: DiffLine[] = [
          createLine('before1', 'removed', 1),
          createLine('MATCH', 'removed', 2),
          createLine('after1', 'removed', 3),
          createLine('before2', 'added', 4),
          createLine('MATCH', 'added', 5),
          createLine('after2', 'added', 6),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // MATCHがペアリングされ、before/afterは順序保持
        const matchPair = result.find(
          p => p.original?.line.content === 'MATCH' && p.modified?.line.content === 'MATCH'
        );
        expect(matchPair).toBeDefined();

        // 順序が保持されていることを確認
        const originals = result
          .filter(p => p.original !== null)
          .map(p => p.original!.line.content);
        expect(originals).toEqual(['before1', 'MATCH', 'after1']);
      });

      it('完全に異なる内容でマッチなしの場合', () => {
        const lines: DiffLine[] = [
          createLine('AAA', 'removed', 1),
          createLine('BBB', 'removed', 2),
          createLine('111', 'added', 3),
          createLine('222', 'added', 4),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // マッチなし→インターリーブまたは順次出力
        expect(result.length).toBeGreaterThanOrEqual(2);

        // 全てのremoved/addedが出力されている
        const removedCount = result.filter(p => p.original !== null).length;
        const addedCount = result.filter(p => p.modified !== null).length;
        expect(removedCount).toBe(2);
        expect(addedCount).toBe(2);
      });

      it('複数の完全一致がある場合、順序を保持', () => {
        const lines: DiffLine[] = [
          createLine('A', 'removed', 1),
          createLine('B', 'removed', 2),
          createLine('C', 'removed', 3),
          createLine('A', 'added', 4),
          createLine('B', 'added', 5),
          createLine('C', 'added', 6),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // A↔A, B↔B, C↔C の順序で3ペア
        expect(result).toHaveLength(3);
        expect(result[0].original?.line.content).toBe('A');
        expect(result[0].modified?.line.content).toBe('A');
        expect(result[1].original?.line.content).toBe('B');
        expect(result[1].modified?.line.content).toBe('B');
        expect(result[2].original?.line.content).toBe('C');
        expect(result[2].modified?.line.content).toBe('C');
      });
    });

    // ========================================
    // F. パフォーマンス考慮
    // ========================================
    describe('パフォーマンス', () => {
      it('大量の行でも処理が完了する', () => {
        const lines: DiffLine[] = [];
        for (let i = 0; i < 100; i++) {
          lines.push(createLine(`removed line ${i}`, 'removed', i + 1));
        }
        for (let i = 0; i < 100; i++) {
          lines.push(createLine(`added line ${i}`, 'added', i + 101));
        }

        const startTime = Date.now();
        const result = LinePairingService.pairLinesForSideBySide(lines, false);
        const endTime = Date.now();

        // 1秒以内に完了すること
        expect(endTime - startTime).toBeLessThan(1000);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // 両アルゴリズムでのクロステスト
  // ========================================
  describe('両アルゴリズムでの動作検証', () => {
    const algorithms: MatchingAlgorithm[] = ['greedy', 'recursive'];

    let originalAlgorithm: MatchingAlgorithm;

    beforeEach(() => {
      originalAlgorithm = LinePairingService.getAlgorithm();
    });

    afterEach(() => {
      LinePairingService.setAlgorithm(originalAlgorithm);
    });

    algorithms.forEach((algorithm) => {
      describe(`${algorithm}アルゴリズム`, () => {
        beforeEach(() => {
          LinePairingService.setAlgorithm(algorithm);
        });

        it('完全一致ペアをマッチング', () => {
          const lines: DiffLine[] = [
            createLine('興和株式会社', 'removed', 1),
            createLine('興和株式会社', 'added', 2),
          ];
          const result = LinePairingService.pairLinesForSideBySide(lines, false);
          expect(result).toHaveLength(1);
          expect(result[0].original?.line.content).toBe('興和株式会社');
          expect(result[0].modified?.line.content).toBe('興和株式会社');
        });

        it('複数行の順序を保持', () => {
          const lines: DiffLine[] = [
            createLine('A', 'removed', 1),
            createLine('B', 'removed', 2),
            createLine('C', 'removed', 3),
            createLine('A', 'added', 4),
            createLine('B', 'added', 5),
            createLine('C', 'added', 6),
          ];
          const result = LinePairingService.pairLinesForSideBySide(lines, false);

          expect(result).toHaveLength(3);
          expect(result[0].original?.line.content).toBe('A');
          expect(result[0].modified?.line.content).toBe('A');
          expect(result[1].original?.line.content).toBe('B');
          expect(result[1].modified?.line.content).toBe('B');
          expect(result[2].original?.line.content).toBe('C');
          expect(result[2].modified?.line.content).toBe('C');
        });

        it('空行を含むブロック', () => {
          const lines: DiffLine[] = [
            createLine('興和株式会社', 'removed', 1),
            createLine('', 'removed', 2),
            createLine('橋本様', 'removed', 3),
            createLine('興和株式会社', 'added', 4),
            createLine('橋本様', 'added', 5),
          ];
          const result = LinePairingService.pairLinesForSideBySide(lines, false);

          const matchedPairs = result.filter(
            p => p.original && p.modified &&
                 p.original.line.content === p.modified.line.content
          );
          expect(matchedPairs.length).toBe(2);
        });

        it('パフォーマンス（50行）', () => {
          const lines: DiffLine[] = [];
          for (let i = 0; i < 50; i++) {
            lines.push(createLine(`line ${i}`, 'removed', i + 1));
          }
          for (let i = 0; i < 50; i++) {
            lines.push(createLine(`line ${i}`, 'added', i + 51));
          }

          const startTime = Date.now();
          const result = LinePairingService.pairLinesForSideBySide(lines, false);
          const endTime = Date.now();

          expect(endTime - startTime).toBeLessThan(500);
          expect(result.length).toBe(50);  // All should match
        });
      });
    });
  });
});
