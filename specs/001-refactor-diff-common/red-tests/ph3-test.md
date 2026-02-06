# Phase 3 RED Tests

## サマリー
- Phase: Phase 3 - User Story 2 (ユーティリティ統一)
- FAIL テスト数: 7
- テストファイル: `src/__tests__/utils/diffRendering.test.ts`

## FAIL テスト一覧

| テストファイル | テストメソッド | 期待動作 |
|---------------|---------------|---------|
| diffRendering.test.ts | added タイプは "+" を返す（スペースなし） | getPrefixSymbol('added') === '+' |
| diffRendering.test.ts | removed タイプは "-" を返す（スペースなし） | getPrefixSymbol('removed') === '-' |
| diffRendering.test.ts | modified タイプは "~" を返す（スペースなし） | getPrefixSymbol('modified') === '~' |
| diffRendering.test.ts | unchanged タイプは " "（スペース1文字）を返す | getPrefixSymbol('unchanged') === ' ' |
| diffRendering.test.ts | 返り値は常に1文字である | getPrefixSymbol(type).length === 1 |
| diffRendering.test.ts | unchanged 行は "  内容" 形式でフォーマットされる | formatLineForCopy で unchanged 行の先頭に2スペース |
| diffRendering.test.ts | 空白のみの行を正しくフォーマットする | unchanged + 3スペース = 5スペース |

## 実装ヒント

### getPrefixSymbol の修正

`src/utils/diffRendering.ts` の `getPrefixSymbol` 関数を以下のように修正:

```typescript
// 現在の実装（スペース付き）
export const getPrefixSymbol = (type: DiffLine['type']): string => {
  switch (type) {
    case 'added': return '+ ';     // スペース付き
    case 'removed': return '- ';   // スペース付き
    case 'modified': return '~ ';  // スペース付き
    default: return '  ';          // 2スペース
  }
};

// 統一後の実装（スペースなし）
export const getPrefixSymbol = (type: DiffLine['type']): string => {
  switch (type) {
    case 'added': return '+';      // スペースなし
    case 'removed': return '-';    // スペースなし
    case 'modified': return '~';   // スペースなし
    default: return ' ';           // 1スペース
  }
};
```

### formatLineForCopy の考慮

`formatLineForCopy` は `getPrefixSymbol(line.type).trim()` を使用しているため、getPrefixSymbol の変更により影響を受ける。ただし、現在の実装では `.trim()` 後にスペースを追加しているため、期待動作と異なる。

現在の実装:
```typescript
export const formatLineForCopy = (line: DiffLine): string => {
  const symbol = getPrefixSymbol(line.type).trim();  // '+ ' → '+'
  return `${symbol} ${line.content || ''}`;          // '+ content'
};
```

統一後も同じ出力を維持するため、実装変更は不要（.trim() が不要になるが、動作は同じ）。

ただし、unchanged の場合:
- 現在: getPrefixSymbol('unchanged') = '  ' → .trim() = '' → ' same line'
- 期待: getPrefixSymbol('unchanged') = ' ' → .trim() = '' → ' same line'

テストの期待値「'  same line'」（2スペース + 内容）と現在の出力「' same line'」（1スペース + 内容）が不一致。

**解決策**: formatLineForCopy のロジックも見直すか、または unchanged の先頭に2スペースが必要な仕様を確認する。

## FAIL 出力例

```
FAIL: added タイプは "+" を返す（スペースなし）
AssertionError: expected '+ ' to be '+' // Object.is equality

Expected: "+"
Received: "+ "

FAIL: 返り値は常に1文字である
AssertionError: expected '+ ' to have a length of 1 but got 2

FAIL: unchanged 行は "  内容" 形式でフォーマットされる（スペース + 内容）
AssertionError: expected ' same line' to be '  same line' // Object.is equality

Expected: "  same line"
Received: " same line"
```

## テスト結果サマリー

```
Test Files  1 failed | 1 passed (2)
     Tests  7 failed | 43 passed (50)
```

## 次ステップ

1. `src/utils/diffRendering.ts` の `getPrefixSymbol` からトレーリングスペースを削除
2. `formatLineForCopy` の挙動を確認（unchanged の場合のスペース数）
3. 他の重複関数を削除し、共通ユーティリティに統一
4. `npm test` で全テスト PASS を確認
