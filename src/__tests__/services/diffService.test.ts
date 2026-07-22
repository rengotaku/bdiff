import { describe, it, expect } from 'vitest';
import { DiffService } from '../../services/diffService';
import { LinePairingService } from '../../services/linePairingService';
import type { ComparisonOptions, DiffLine } from '../../types/types';

const defaultOptions: ComparisonOptions = {
  sortLines: false,
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreTrailingNewlines: false,
  enableCharDiff: false,
  indentHeuristic: false,
};

describe('DiffService', () => {
  describe('calculateDiff - 基本動作', () => {
    it('同一テキストの差分は unchanged のみ', () => {
      const text = 'line1\nline2\nline3';
      const result = DiffService.calculateDiff(text, text, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.modified).toBe(0);
      expect(result.stats.unchanged).toBe(3);
    });

    it('完全に異なるテキストの差分', () => {
      const original = 'AAA\nBBB';
      const modified = 'CCC\nDDD';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.removed).toBe(2);
      expect(result.stats.added).toBe(2);
      expect(result.stats.modified).toBe(0);
    });
  });

  describe('calculateDiff - modified 統計（issue #97）', () => {
    it('enableCharDiff=false の場合、modified は常に 0', () => {
      const original = 'hello world\nfoo bar\nbaz';
      const modified = 'hello there\nfoo baz\nbaz';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: false,
      });
      expect(result.stats.modified).toBe(0);
    });

    it('enableCharDiff=true で類似行ペアが存在する場合、modified = 1', () => {
      // 末尾1語だけ変わった行（高類似度 → char diff 対象）
      const original = 'hello world\nunchanged line';
      const modified = 'hello there\nunchanged line';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      // 'hello world' と 'hello there' は類似 → modified=1, removed=0, added=0
      expect(result.stats.modified).toBe(1);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.added).toBe(0);
      expect(result.stats.unchanged).toBe(1);
    });

    it('enableCharDiff=true で完全に異なる行は modified にならない', () => {
      // 類似度が低い（0.6未満）行は char diff 対象外 → removed/added のまま
      const original = 'AAAAAAAAAAA\nunchanged';
      const modified = 'ZZZZZZZZZZZ\nunchanged';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      expect(result.stats.modified).toBe(0);
      expect(result.stats.removed).toBe(1);
      expect(result.stats.added).toBe(1);
    });

    it('enableCharDiff=true で統計の合計は全行数に等しい', () => {
      const original = 'line one\nline two\nline three\ncommon line';
      const modified = 'line 1\nline 2\nline three\ncommon line';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      const total = result.stats.added + result.stats.removed +
                    result.stats.modified * 2 + result.stats.unchanged;
      expect(total).toBe(result.lines.length);
    });
  });

  describe('calculateDiff - encoding normalization (issue #118)', () => {
    it('CRLF と LF の混在は差分を生まない', () => {
      const original = 'line1\r\nline2\r\nline3\r\n';
      const modified = 'line1\nline2\nline3\n';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.modified).toBe(0);
    });

    it('先頭 BOM の有無で差分が出ない', () => {
      const original = '﻿hello\nworld';
      const modified = 'hello\nworld';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
    });

    it('Unicode NFC / NFD 差では差分を生まない (濁点の合成/分解)', () => {
      const composed = 'あがい';
      const decomposed = 'あがい';
      const result = DiffService.calculateDiff(composed, decomposed, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
    });

    it('CR のみの改行 (旧 Mac) も LF と等価扱い', () => {
      const original = 'a\rb\rc';
      const modified = 'a\nb\nc';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
    });
  });

  describe('calculateDiff - contextless anchor block merge (issue #123 v2)', () => {
    // 最小再現 v2: 初版より行を長くし、新旧4ペアの類似度が 0.5 以上になるようにした
    // （初版の短い行は類似度 0.5 未満になり、跨ぎ類似ペアの検証に使えなかった）。
    const original = [
      '<aside>',
      '🕐',
      '',
      'T+0 = mainte mode ON time. each gate go/nogo. see child page for detail.',
      '',
      '</aside>',
      '',
      '- [ ] T+0:00 B8 mainte mode ON (old ALB sorry page, old account auth)',
      '- [ ] T+0:00 B7 stop old sidekiq and monit process',
      '- [ ] T+0:05 B3 RDS migrate with cross account script',
      '- [ ] T+1:50 B8 mainte mode OFF (old ALB cleanup)',
      '',
      '# next section',
    ].join('\n');

    const modified = [
      '> 🕐 each gate go/nogo. see child page for detail. times are measured.',
      '',
      '- [ ] mainte mode ON (old ALB sorry page, old account auth) -- approx 2 min',
      '- [ ] stop old sidekiq and monit process -- approx 1 min',
      '- [ ] brand new ASG suspend step for health check',
      '- [ ] RDS migrate with cross account script -- approx 75 min',
      '- [ ] more new step one for something',
      '- [ ] more new step two for something',
      '- [ ] mainte mode OFF (old ALB cleanup) -- approx 2 min',
      '- [ ] postcheck cutover script -- approx 5 min',
      '',
      '## next section',
    ].join('\n');

    /** Split DiffLine[] into contiguous change blocks (removed/added runs) separated by unchanged lines. */
    function changeBlocks(lines: DiffLine[]): DiffLine[][] {
      const blocks: DiffLine[][] = [];
      let current: DiffLine[] = [];
      for (const line of lines) {
        if (line.type === 'unchanged') {
          if (current.length > 0) blocks.push(current);
          current = [];
        } else {
          current.push(line);
        }
      }
      if (current.length > 0) blocks.push(current);
      return blocks;
    }

    it.each(['jsdiff', 'builtin'] as const)(
      '旧チェックリスト(4行)と新チェックリスト(8行)が同一の変更ブロックに入る (%s)',
      (algorithm) => {
        const result = DiffService.calculateDiff(original, modified, {
          ...defaultOptions,
          algorithm,
        });
        const blocks = changeBlocks(result.lines);

        const oldChecklistBlock = blocks.find((b) =>
          b.some((l) => l.content === '- [ ] T+0:00 B8 mainte mode ON (old ALB sorry page, old account auth)')
        );
        const newChecklistBlock = blocks.find((b) =>
          b.some((l) => l.content === '- [ ] mainte mode ON (old ALB sorry page, old account auth) -- approx 2 min')
        );

        expect(oldChecklistBlock).toBeDefined();
        expect(newChecklistBlock).toBeDefined();
        // 修正前は、旧チェックリストは aside 末尾/セクション見出しと同じブロックに、
        // 新チェックリストは aside 内部テキストと同じブロックに分断されて別々になる。
        expect(oldChecklistBlock).toBe(newChecklistBlock);

        const removedContents = oldChecklistBlock!.filter((l) => l.type === 'removed').map((l) => l.content);
        const addedContents = oldChecklistBlock!.filter((l) => l.type === 'added').map((l) => l.content);

        expect(removedContents).toEqual([
          'T+0 = mainte mode ON time. each gate go/nogo. see child page for detail.',
          '',
          '</aside>',
          '',
          '- [ ] T+0:00 B8 mainte mode ON (old ALB sorry page, old account auth)',
          '- [ ] T+0:00 B7 stop old sidekiq and monit process',
          '- [ ] T+0:05 B3 RDS migrate with cross account script',
          '- [ ] T+1:50 B8 mainte mode OFF (old ALB cleanup)',
          '',
          '# next section',
        ]);
        expect(addedContents).toEqual([
          '- [ ] mainte mode ON (old ALB sorry page, old account auth) -- approx 2 min',
          '- [ ] stop old sidekiq and monit process -- approx 1 min',
          '- [ ] brand new ASG suspend step for health check',
          '- [ ] RDS migrate with cross account script -- approx 75 min',
          '- [ ] more new step one for something',
          '- [ ] more new step two for something',
          '- [ ] mainte mode OFF (old ALB cleanup) -- approx 2 min',
          '- [ ] postcheck cutover script -- approx 5 min',
          '',
          '## next section',
        ]);
      }
    );

    it('先頭の aside 前置きの空行アンカー（跨ぎ類似ペアの範囲外）は降格されずに残る', () => {
      // 跨ぎ類似ペアは checklist 同士（2番目・3番目の hunk）にのみ存在するため、
      // 統合範囲はその2 hunk 間のみ。1番目の hunk（aside 前置き）との間の空行アンカーは
      // 統合範囲の外なので、そのまま unchanged として残るはず。
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.unchanged).toBe(1);
      const firstUnchangedIndex = result.lines.findIndex((l) => l.type === 'unchanged');
      expect(result.lines[firstUnchangedIndex].content).toBe('');
    });

    it('LinePairingService でも新旧4ペアが同一行に横並びし文字単位ハイライトが付く（受け入れ条件 v2）', () => {
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      const pairs = LinePairingService.pairLinesForSideBySide(result.lines, true);

      const expectedPairs: [string, string][] = [
        [
          '- [ ] T+0:00 B8 mainte mode ON (old ALB sorry page, old account auth)',
          '- [ ] mainte mode ON (old ALB sorry page, old account auth) -- approx 2 min',
        ],
        [
          '- [ ] T+0:00 B7 stop old sidekiq and monit process',
          '- [ ] stop old sidekiq and monit process -- approx 1 min',
        ],
        [
          '- [ ] T+0:05 B3 RDS migrate with cross account script',
          '- [ ] RDS migrate with cross account script -- approx 75 min',
        ],
        [
          '- [ ] T+1:50 B8 mainte mode OFF (old ALB cleanup)',
          '- [ ] mainte mode OFF (old ALB cleanup) -- approx 2 min',
        ],
      ];

      for (const [oldContent, newContent] of expectedPairs) {
        const row = pairs.find((p) => p.original?.line.content === oldContent);
        expect(row).toBeDefined();
        expect(row!.modified?.line.content).toBe(newContent);
        expect(row!.original?.segments).toBeDefined();
        expect(row!.modified?.segments).toBeDefined();
      }
    });

    it('マージ後も左右カラムの行番号は単調増加のまま（issue #120 不変条件）', () => {
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      const origNums = result.lines
        .map((l) => l.originalLineNumber)
        .filter((n): n is number => n !== undefined);
      const newNums = result.lines
        .map((l) => l.newLineNumber)
        .filter((n): n is number => n !== undefined);

      for (let i = 1; i < origNums.length; i++) {
        expect(origNums[i]).toBeGreaterThan(origNums[i - 1]);
      }
      for (let i = 1; i < newNums.length; i++) {
        expect(newNums[i]).toBeGreaterThan(newNums[i - 1]);
      }
    });

    it('マージにより行が失われたり重複したりしない（原文/変更後テキストの全行を1回ずつ保持）', () => {
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      const originalLineCount = original.split('\n').length;
      const modifiedLineCount = modified.split('\n').length;

      expect(result.lines.filter((l) => l.originalLineNumber !== undefined).length).toBe(originalLineCount);
      expect(result.lines.filter((l) => l.newLineNumber !== undefined).length).toBe(modifiedLineCount);
    });

    it('前後どちらもcontextlessでない通常のunchanged行はブロックをまたいで結合しない', () => {
      const original2 = 'foo\nCOMMON\nbar';
      const modified2 = 'baz\nCOMMON\nqux';
      const result = DiffService.calculateDiff(original2, modified2, defaultOptions);
      const blocks = changeBlocks(result.lines);
      // 'COMMON' は contextless ではない実質的な共通行なので、分断を維持する
      expect(blocks.length).toBe(2);
      expect(result.stats.unchanged).toBe(1);
    });

    it('ファイル先頭がcontextlessな行のみのケースでも安全に処理する', () => {
      const original3 = '\nfoo';
      const modified3 = '\nbar';
      const result = DiffService.calculateDiff(original3, modified3, defaultOptions);
      // 先頭の空行アンカーは "前のブロック" が存在しないためマージ対象外（そのまま）
      expect(result.stats.unchanged).toBe(1);
      expect(result.lines.filter((l) => l.originalLineNumber !== undefined).length).toBe(2);
      expect(result.lines.filter((l) => l.newLineNumber !== undefined).length).toBe(2);
    });

    it('跨ぎ類似ペアが存在しない場合（純粋な新規セクション挿入）は統合が発動しない（回帰テスト）', () => {
      // セクション全体が新規追加されただけで、削除された行が1つも無い（= removed 行が
      // 存在しない）ため、跨ぎ類似ペアはそもそも成立しようがない。
      const originalNoOverlap = [
        'intro line',
        '',
        '# Section A',
        'content a1',
        'content a2',
        '',
        '# Section B',
        'content b1',
      ].join('\n');
      const modifiedNoOverlap = [
        'intro line',
        '',
        '# Section A',
        'content a1',
        'content a2',
        '',
        '# Section NEW',
        'brand new content here',
        '',
        '# Section B',
        'content b1',
      ].join('\n');

      const result = DiffService.calculateDiff(originalNoOverlap, modifiedNoOverlap, defaultOptions);

      expect(result.stats.removed).toBe(0);
      expect(result.stats.added).toBe(3);
      // 挿入前後の空行アンカーは、跨ぎ類似ペアが無いので降格されず、そのまま維持される。
      expect(result.stats.unchanged).toBe(8);
    });

    it('高い類似ペアが同一hunk内にしか無い場合は「跨ぎ」ではないため統合トリガーにならない', () => {
      // 各 hunk は単体で見ると removed/added の類似度が高い（= 既に正しくペアリング
      // されている）が、hunk をまたいだ類似ペアは存在しない。この場合は統合の必要が
      // ないため、mergeContextlessAnchorBlocks は何もせず、間の空行アンカーは維持される。
      const originalNoCrossing = ['cat sat on the mat', '', 'unrelated original line here'].join('\n');
      const modifiedNoCrossing = ['cat sat on the rug', '', 'unrelated modified line totally different'].join(
        '\n'
      );
      const result = DiffService.calculateDiff(originalNoCrossing, modifiedNoCrossing, defaultOptions);
      const blocks = changeBlocks(result.lines);

      expect(blocks.length).toBe(2);
      expect(result.stats.unchanged).toBe(1);
    });

    it('区間の総行数が400行を超える場合は性能ガードで統合をスキップする', () => {
      // 跨ぎ類似ペア自体は先頭hunkと末尾hunkの間に実在するが、区間の総行数が
      // 400行を超えるため、統合処理そのものをスキップして分断されたまま残る。
      const N = 150;
      const originalLines: string[] = [];
      const modifiedLines: string[] = [];
      for (let i = 0; i < N; i++) {
        originalLines.push(
          i === 0
            ? 'the quick brown fox jumps over the lazy dog example line'
            : `unique original filler content number ${i} alpha beta gamma delta`
        );
        originalLines.push('');
        modifiedLines.push(
          i === N - 1
            ? 'the quick brown fox jumps over the lazy dog example line variant'
            : `different modified filler payload number ${i} epsilon zeta eta theta`
        );
        modifiedLines.push('');
      }

      const result = DiffService.calculateDiff(originalLines.join('\n'), modifiedLines.join('\n'), defaultOptions);
      const blocks = changeBlocks(result.lines);

      const firstBlock = blocks.find((b) =>
        b.some((l) => l.type === 'removed' && l.content.includes('the quick brown fox jumps over the lazy dog example line') && !l.content.includes('variant'))
      );
      const lastBlock = blocks.find((b) =>
        b.some((l) => l.type === 'added' && l.content.includes('the quick brown fox jumps over the lazy dog example line variant'))
      );

      expect(firstBlock).toBeDefined();
      expect(lastBlock).toBeDefined();
      // 400行ガードにより統合されず、別ブロックのまま。
      expect(firstBlock).not.toBe(lastBlock);
    });

    it('統合範囲内の無関係な中間 hunk も一緒に統合される（MEDIUM指摘の回帰テスト）', () => {
      // H0(removed のみ) - anchor - H1(自己完結した無関係な置換) - anchor - H2(added のみ)
      // という3 hunk 構成。跨ぎ類似ペアは H0 の removed と H2 の added の間にしか無いが、
      // 統合範囲は「跨ぎ類似ペアを全て包含する最小の連続 hunk 範囲」= [H0, H2] であるため、
      // それ自体は跨ぎペアの根拠を持たず自己完結して正しくペアリングできていた H1
      // （cat sat on the mat/rug）も統合対象に巻き込まれ、前後のアンカーが降格される。
      // これは仕様どおりの意図した挙動（最小"連続"範囲）であり、回帰を防止するために固定する。
      const original = [
        'the quick brown fox jumps over the lazy dog for testing similarity',
        '',
        'cat sat on the mat',
        '',
        'totally unrelated old bottom text www',
      ].join('\n');
      const modified = [
        'totally unrelated new top text zzz',
        '',
        'cat sat on the rug',
        '',
        'the quick brown fox jumps over the lazy dog for testing similarity updated',
      ].join('\n');

      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      const blocks = changeBlocks(result.lines);

      // 中間の自己完結hunk（cat sat on the mat/rug）を含め、全体が単一ブロックに統合される。
      expect(blocks.length).toBe(1);
      const mergedBlock = blocks[0];
      expect(mergedBlock.some((l) => l.type === 'removed' && l.content === 'cat sat on the mat')).toBe(true);
      expect(mergedBlock.some((l) => l.type === 'added' && l.content === 'cat sat on the rug')).toBe(true);
      // 前後のアンカー（空行）も降格され、unchanged は残らない。
      expect(result.stats.unchanged).toBe(0);

      // 行の欠落・重複がないこと（原文5行・変更後5行がそれぞれちょうど1回ずつ現れる）。
      const originalLineCount = original.split('\n').length;
      const modifiedLineCount = modified.split('\n').length;
      expect(result.lines.filter((l) => l.originalLineNumber !== undefined).length).toBe(originalLineCount);
      expect(result.lines.filter((l) => l.newLineNumber !== undefined).length).toBe(modifiedLineCount);

      // 左右カラムの行番号単調増加が保たれること（issue #120 不変条件）。
      const origNums = result.lines
        .map((l) => l.originalLineNumber)
        .filter((n): n is number => n !== undefined);
      const newNums = result.lines
        .map((l) => l.newLineNumber)
        .filter((n): n is number => n !== undefined);
      for (let i = 1; i < origNums.length; i++) {
        expect(origNums[i]).toBeGreaterThan(origNums[i - 1]);
      }
      for (let i = 1; i < newNums.length; i++) {
        expect(newNums[i]).toBeGreaterThan(newNums[i - 1]);
      }
    });
  });
});
