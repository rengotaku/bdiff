# Data Model: 差分表示ロジックの共通化リファクタリング

**Branch**: `001-refactor-diff-common`
**Date**: 2026-02-06

## Entities

### 既存エンティティ（変更なし）

#### DiffLine

差分の1行を表すデータ構造。

```typescript
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  lineNumber: number;
}
```

| フィールド | 型 | 説明 |
|-----------|---|------|
| type | enum | 行の差分タイプ |
| content | string | 行の内容 |
| lineNumber | number | 行番号 |

#### CharSegment

文字単位の差分セグメント。

```typescript
interface CharSegment {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}
```

| フィールド | 型 | 説明 |
|-----------|---|------|
| type | enum | セグメントの差分タイプ |
| text | string | セグメントのテキスト |

### 新規エンティティ

#### LineWithSegments

行データと文字セグメントのペア。LinePairingServiceの出力型。

```typescript
interface LineWithSegments {
  line: DiffLine;
  segments?: CharSegment[];
}
```

| フィールド | 型 | 説明 |
|-----------|---|------|
| line | DiffLine | 差分行データ |
| segments | CharSegment[] \| undefined | 文字単位セグメント（存在する場合） |

**関係**:
- `LineWithSegments` は `DiffLine` を1つ持つ
- `LineWithSegments` は `CharSegment` を0個以上持つ

## サービスインターフェース

### LinePairingService

```typescript
class LinePairingService {
  /**
   * Unified view用のペアリング
   * removed/addedブロックを検出し、位置ベースでマッチング
   */
  static pairForUnifiedView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): LineWithSegments[]

  /**
   * Side-by-side view用のペアリング
   * original（removed + unchanged）とmodified（added + unchanged）に分離
   */
  static pairForSideBySideView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): {
    original: LineWithSegments[];
    modified: LineWithSegments[];
  }
}
```

### CharDiffService（既存・変更なし）

```typescript
class CharDiffService {
  static shouldShowCharDiff(original: string, modified: string): boolean
  static calculateCharDiff(
    original: string,
    modified: string
  ): {
    originalSegments: CharSegment[];
    modifiedSegments: CharSegment[];
  }
}
```

## 状態遷移

なし（純粋関数のみ、状態を持たない）

## バリデーションルール

| ルール | 対象 | 条件 |
|--------|-----|------|
| 空配列許可 | pairForUnifiedView入力 | 空配列は空配列を返す |
| 空配列許可 | pairForSideBySideView入力 | 空配列は両方空配列を返す |
| CharDiff条件 | shouldShowCharDiff | 類似度60%以上かつ長さ比率30%以上 |

## データフロー

```
DiffLine[]
    │
    ├─ [Unified View]
    │   └─ LinePairingService.pairForUnifiedView()
    │       └─ LineWithSegments[]
    │
    └─ [Side-by-side View]
        └─ LinePairingService.pairForSideBySideView()
            └─ { original: LineWithSegments[], modified: LineWithSegments[] }
                    │
                    └─ [enableCharDiff=true]
                        └─ CharDiffService.calculateCharDiff()
                            └─ segments付きLineWithSegments
```
