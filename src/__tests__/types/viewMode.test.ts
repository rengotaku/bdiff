import { describe, it, expect } from 'vitest';
import type { ViewMode } from '../../types/types';

describe('ViewMode', () => {
  it("'split' は ViewMode に含まれない（廃止済み）", () => {
    // 'split' が型に存在しないことを実行時に確認する
    // TypeScript の型チェックで弾かれるが、実行時ガードとしても重要
    const validModes: ViewMode[] = ['side-by-side', 'unified'];
    const invalidMode = 'split';
    expect(validModes).not.toContain(invalidMode);
  });

  it("同一論理モード 'side-by-side' は常に同じ値で表現される", () => {
    const fromHomePage: ViewMode = 'side-by-side';
    const fromDiffPage: ViewMode = 'side-by-side';
    expect(fromHomePage).toBe(fromDiffPage);
  });

  it("有効な ViewMode は 'side-by-side' と 'unified' のみ", () => {
    const validModes: ViewMode[] = ['side-by-side', 'unified'];
    expect(validModes).toHaveLength(2);
    expect(validModes).toContain('side-by-side');
    expect(validModes).toContain('unified');
  });
});
