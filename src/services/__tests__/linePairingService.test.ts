import { describe, it, expect } from 'vitest';
import { LinePairingService } from '../linePairingService';
import type { DiffLine } from '../../types/types';

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
  // 類似度しきい値設定テスト
  // ========================================
  // 注: MatchingAlgorithm / setAlgorithm / getAlgorithm は #120 の修正で
  // matchByContent ディスパッチャと greedy 実装が削除され、参照箇所が
  // 無くなったため撤去した（side-by-side の順序保存は選択式にできないため）。
  describe('類似度しきい値設定', () => {
    it('similarityThresholdを変更可能', () => {
      const original = LinePairingService.getSimilarityThreshold();

      LinePairingService.setSimilarityThreshold(0.8);
      expect(LinePairingService.getSimilarityThreshold()).toBe(0.8);

      // Reset
      LinePairingService.setSimilarityThreshold(original);
    });
  });

  // ========================================
  // 基本的なペアリング動作（アルゴリズム切り替えとは無関係の挙動検証）
  // ========================================
  describe('基本的なペアリング動作', () => {
    it('同数の完全一致ブロックはA↔A, B↔Bの順でペアリングされる', () => {
      const lines: DiffLine[] = [
        createLine('A', 'removed', 1),
        createLine('B', 'removed', 2),
        createLine('A', 'added', 3),
        createLine('B', 'added', 4),
      ];

      const result = LinePairingService.pairLinesForSideBySide(lines, false);

      expect(result).toHaveLength(2);
      expect(result[0].original?.line.content).toBe('A');
      expect(result[0].modified?.line.content).toBe('A');
      expect(result[1].original?.line.content).toBe('B');
      expect(result[1].modified?.line.content).toBe('B');
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

      it('全く異なる行でも同一ブロック内なら位置ベースでペアリングされる', () => {
        const lines: DiffLine[] = [
          createLine('これは削除される行です', 'removed', 1),
          createLine('ABCDEFGHIJKLMNOP', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // 同一ブロック内のremoved/addedは位置ベースで横並びにペアリングされる
        expect(result).toHaveLength(1);
        expect(result[0].original?.line.content).toBe('これは削除される行です');
        expect(result[0].modified?.line.content).toBe('ABCDEFGHIJKLMNOP');
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

      it('unchanged行を跨いだ2パス目の再マッチは行わない（#120で順序保持のため廃止）', () => {
        // 旧実装は「2パス目」で unchanged 行を跨いで removed/added を結合していたが、
        // それは結合先の行を元の位置から動かすことになり、右カラムの行番号が
        // 単調増加でなくなる（#120）。跨ぎマッチは廃止し、各行は自分の位置に留まる。
        const lines: DiffLine[] = [
          createLine('削除される行', 'removed', 1),
          createLine('変更なしの行', 'unchanged', 2),
          createLine('削除される行', 'added', 3),  // 内容は同じだが、もう跨いでマッチしない
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expect(result).toHaveLength(3);
        // removed は単独のまま（unchanged を跨いだ added との結合はしない）
        expect(result[0].original?.line.content).toBe('削除される行');
        expect(result[0].modified).toBeNull();
        // unchanged
        expect(result[1].original?.line.type).toBe('unchanged');
        expect(result[1].modified?.line.type).toBe('unchanged');
        // added も単独のまま、自分の位置(unchanged の後)に留まる
        expect(result[2].original).toBeNull();
        expect(result[2].modified?.line.content).toBe('削除される行');
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
    // F. コンテキストレス行の遠隔マッチング防止（issue #97）
    // ========================================
    describe('コンテキストレス行の遠隔マッチング防止', () => {
      it('空行は遠隔マッチングの候補にならない', () => {
        // removed block: 有意なテキスト行 + 空行（純粋な削除ブロック）
        // added block: 別箇所の空行（純粋な追加ブロック）
        // unchanged で区切られた2つのブロックを模擬
        const lines: DiffLine[] = [
          createLine('削除される有意な行', 'removed', 1),
          createLine('', 'removed', 2),  // 空行
          createLine('変更なし行', 'unchanged', 3),
          createLine('', 'added', 4),    // 別箇所の空行 - 遠隔マッチングされてはいけない
          createLine('追加される有意な行', 'added', 5),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // 空行のremoved（index 1）は空行のadded（index 3）と遠隔マッチングされてはいけない
        const emptyRemovedPair = result.find(
          p => p.original?.line.content === '' && p.original?.line.type === 'removed'
        );
        // 空行は単独（modified=null）のままであるべき
        expect(emptyRemovedPair?.modified).toBeNull();
      });

      it('閉じ括弧 } は遠隔マッチングの候補にならない', () => {
        const lines: DiffLine[] = [
          createLine('削除されるコードブロック', 'removed', 1),
          createLine('}', 'removed', 2),  // 閉じ括弧
          createLine('変更なし行', 'unchanged', 3),
          createLine('}', 'added', 4),    // 別箇所の閉じ括弧 - 遠隔マッチングされてはいけない
          createLine('追加されるコードブロック', 'added', 5),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // }のremoved は }のadded と遠隔マッチングされてはいけない
        const braceRemovedPair = result.find(
          p => p.original?.line.content === '}' && p.original?.line.type === 'removed'
        );
        expect(braceRemovedPair?.modified).toBeNull();
      });

      it('有意なテキスト行もunchangedを跨いだ遠隔マッチングはされない（#120で順序保持のため廃止）', () => {
        // #97 時点では「有意なテキストは unchanged を跨いでも遠隔マッチングする」仕様だったが、
        // #120 の調査でこの遠隔マッチングが右カラムの行順を崩す原因と判明したため廃止された。
        // 各行は unchanged を跨がず、自分の位置に単独で留まる。
        const lines: DiffLine[] = [
          createLine('マッチすべき有意なテキスト', 'removed', 1),
          createLine('変更なし行', 'unchanged', 2),
          createLine('マッチすべき有意なテキスト', 'added', 3),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // unchanged を跨いだ結合はもう発生しない
        const matchedPair = result.find(
          p => p.original?.line.content === 'マッチすべき有意なテキスト' &&
               p.modified?.line.content === 'マッチすべき有意なテキスト'
        );
        expect(matchedPair).toBeUndefined();

        expect(result).toHaveLength(3);
        expect(result[0].original?.line.content).toBe('マッチすべき有意なテキスト');
        expect(result[0].modified).toBeNull();
        expect(result[2].original).toBeNull();
        expect(result[2].modified?.line.content).toBe('マッチすべき有意なテキスト');
      });

      it('同一ブロック内の空行は位置ベースでペアリングされる', () => {
        // ブロック内の空行は位置ベースで処理される（遠隔マッチングではない）
        const lines: DiffLine[] = [
          createLine('テキスト行1', 'removed', 1),
          createLine('', 'removed', 2),
          createLine('テキスト行1', 'added', 3),
          createLine('', 'added', 4),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        // ブロック内の場合: テキスト行はマッチ、空行は位置ベースでペアになる
        expect(result).toHaveLength(2);
        const textPair = result.find(p => p.original?.line.content === 'テキスト行1');
        expect(textPair?.modified?.line.content).toBe('テキスト行1');
        const emptyPair = result.find(p => p.original?.line.content === '');
        // 同一ブロック内の空行は位置ベースでペアになる（修正後は fallback で paired）
        expect(emptyPair).toBeDefined();
      });
    });

    // ========================================
    // G. パフォーマンス考慮
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

    // ========================================
    // H. 行番号単調増加の不変条件（issue #120）
    // ========================================
    describe('行番号単調増加の不変条件（issue #120）', () => {
      /**
       * 左右いずれのカラムも、行番号が常に単調増加であることを検証する。
       * git / GitHub の side-by-side と同じ不変条件（issue #120 の受け入れ条件）。
       */
      function expectMonotonicLineNumbers(result: ReturnType<typeof LinePairingService.pairLinesForSideBySide>): void {
        const originalLineNumbers = result
          .filter(p => p.original !== null)
          .map(p => p.original!.line.originalLineNumber ?? p.original!.line.lineNumber);
        for (let i = 1; i < originalLineNumbers.length; i++) {
          expect(originalLineNumbers[i]).toBeGreaterThan(originalLineNumbers[i - 1]);
        }

        const modifiedLineNumbers = result
          .filter(p => p.modified !== null)
          .map(p => p.modified!.line.newLineNumber ?? p.modified!.line.lineNumber);
        for (let i = 1; i < modifiedLineNumbers.length; i++) {
          expect(modifiedLineNumbers[i]).toBeGreaterThan(modifiedLineNumbers[i - 1]);
        }
      }

      it('最小再現ケース1: 変更ブロック内のcrossingが解消され、右カラムが1→2の昇順になる', () => {
        // Issue #120 ケース1
        // 元: alpha beta gamma one / delta epsilon two
        // 変更後: delta epsilon two three / alpha beta gamma one four
        // 修正前は右カラムが 2→1 の順で表示されていた
        const lines: DiffLine[] = [
          createLine('alpha beta gamma one', 'removed', 1),
          createLine('delta epsilon two', 'removed', 2),
          createLine('delta epsilon two three', 'added', 1),
          createLine('alpha beta gamma one four', 'added', 2),
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expectMonotonicLineNumbers(result);

        const modifiedLineNumbers = result
          .filter(p => p.modified !== null)
          .map(p => p.modified!.line.newLineNumber);
        expect(modifiedLineNumbers).toEqual([1, 2]);

        // 全ての行が失われていないこと
        expect(result.filter(p => p.original !== null)).toHaveLength(2);
        expect(result.filter(p => p.modified !== null)).toHaveLength(2);
      });

      it('最小再現ケース2: unchanged行を跨いだaddedの移動が解消され、右カラムが1→2→3→4の昇順になる', () => {
        // Issue #120 ケース2
        // 元: Capistrano deploy notes here / unchanged line
        // 変更後: unchanged line / brand new section A / brand new section B / Capistrano deploy notes here modified
        // 修正前は右カラムが 4→1→2→3 の順で表示されていた
        const lines: DiffLine[] = [
          { lineNumber: 1, content: 'Capistrano deploy notes here', type: 'removed', originalLineNumber: 1 },
          { lineNumber: 2, content: 'unchanged line', type: 'unchanged', originalLineNumber: 2, newLineNumber: 1 },
          { lineNumber: 3, content: 'brand new section A', type: 'added', newLineNumber: 2 },
          { lineNumber: 4, content: 'brand new section B', type: 'added', newLineNumber: 3 },
          { lineNumber: 5, content: 'Capistrano deploy notes here modified', type: 'added', newLineNumber: 4 },
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expectMonotonicLineNumbers(result);

        const modifiedLineNumbers = result
          .filter(p => p.modified !== null)
          .map(p => p.modified!.line.newLineNumber);
        expect(modifiedLineNumbers).toEqual([1, 2, 3, 4]);

        // 全ての行が失われていないこと（original側はremoved1行+unchanged1行=2）
        expect(result.filter(p => p.original !== null)).toHaveLength(2);
        expect(result.filter(p => p.modified !== null)).toHaveLength(4);
      });

      it('複数の変更ブロックが混在していても左右カラムとも単調増加を維持する', () => {
        const lines: DiffLine[] = [
          { lineNumber: 1, content: 'unchanged 1', type: 'unchanged', originalLineNumber: 1, newLineNumber: 1 },
          { lineNumber: 2, content: 'foo old', type: 'removed', originalLineNumber: 2 },
          { lineNumber: 3, content: 'bar old', type: 'removed', originalLineNumber: 3 },
          { lineNumber: 4, content: 'bar new', type: 'added', newLineNumber: 2 },
          { lineNumber: 5, content: 'foo new', type: 'added', newLineNumber: 3 },
          { lineNumber: 6, content: 'unchanged 2', type: 'unchanged', originalLineNumber: 4, newLineNumber: 4 },
          { lineNumber: 7, content: 'baz old', type: 'removed', originalLineNumber: 5 },
          { lineNumber: 8, content: 'baz new', type: 'added', newLineNumber: 5 },
          { lineNumber: 9, content: 'qux new only', type: 'added', newLineNumber: 6 },
          { lineNumber: 10, content: 'unchanged 3', type: 'unchanged', originalLineNumber: 6, newLineNumber: 7 },
        ];
        const result = LinePairingService.pairLinesForSideBySide(lines, false);

        expectMonotonicLineNumbers(result);
      });
    });
  });

  // ========================================
  // matchBlockLinesの基本動作（旧: 両アルゴリズムでのクロステスト）
  // ========================================
  // 注: 以前はここで 'greedy'/'recursive' を切り替えて同一挙動を確認していたが、
  // #120 の修正でアルゴリズム切り替えAPI自体が撤去されたため、単一の実装として検証する。
  describe('matchBlockLinesの基本動作', () => {
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
