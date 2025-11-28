# リファクタリング推奨事項

プロジェクトの包括的な分析結果に基づくリファクタリング推奨事項です。

## 📋 エグゼクティブサマリー

- **重複コード**: 4箇所で`escapeHtml`メソッドの重複を発見
- **非推奨ファイル**: 1つの@deprecatedファイルが将来の削除候補
- **未使用ファイル**: デモ/サンプルファイルが本番では不要
- **二重実装**: Export機能が新旧2つのシステムで実装されている

## 🔴 高優先度（即座に実施可能）

### 1. escapeHtml メソッドの統合

**問題点**:
同じ機能の`escapeHtml`メソッドが4箇所に重複しています：

- `src/utils/diffExport.ts` (DiffExporter/escapeHtml)
- `src/utils/diffStyling.ts` (DiffStyler/escapeHtml)
- `src/services/export/renderers/BaseRenderer.ts` (BaseRenderer/escapeHtml)
- `src/services/htmlExportService.ts` (HtmlExportService/escapeHtml) - @deprecated

**推奨アクション**:
```typescript
// 新規ファイル: src/utils/htmlEscape.ts
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

その後、すべての箇所をこの共通ユーティリティに置き換え。

**影響範囲**: 低（純粋関数の置き換え）
**削減コード行数**: 約15-20行
**工数**: 30分

### 2. 非推奨ファイルの削除計画

**対象ファイル**:
- `src/services/htmlExportService.ts` - @deprecated マーク済み

**現状**:
```typescript
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Use the new ExportService from 'services/export' instead.
 * This file will be removed in version 2.0
 */
```

**推奨アクション**:
1. すべての参照箇所を新しい`ExportService`に移行
2. 移行完了後、ファイルを削除
3. Phase 1での実装により、新しいExportServiceは既に稼働中

**影響範囲**: 中（既存コードの移行が必要）
**削減コード行数**: 約650行
**工数**: 2-3時間

## 🟡 中優先度（計画的に実施）

### 3. デモ/サンプルファイルの整理

**対象ファイル**:
- `src/components/examples/ComponentShowcase.tsx` (436行)

**現状**:
- 本番コードからの参照なし
- デフォルトエクスポートのみ（開発時の手動テスト用と思われる）

**推奨アクション**:
```
オプションA: 完全削除
- 本番ビルドに不要
- Storybookやテストスイートがある場合はそちらで代替

オプションB: 開発専用ディレクトリへ移動
- dev/examples/ または stories/ へ移動
- ビルドから除外する設定を追加
```

**影響範囲**: 低（本番コードから参照されていない）
**削減コード行数**: 約436行（削除の場合）
**工数**: 15分

### 4. 二重ファイル名の整理

**対象**:
- `src/components/diff/ComparisonOptions.tsx` (エクスポート名: `ComparisonOptionsComponent`)
- `src/components/diff/ComparisonOptionsSidebar.tsx` (別コンポーネント)

**現状**:
```typescript
// index.ts でエイリアス化
export { ComparisonOptionsComponent as ComparisonOptions } from './ComparisonOptions';
```

**推奨アクション**:
ファイル名とエクスポート名を統一：
```
オプションA: ComparisonOptionsForm.tsx に改名
オプションB: コンポーネント名を ComparisonOptions に変更
```

**影響範囲**: 低（index.tsで既にエイリアス化済み）
**工数**: 10分

## 🟢 低優先度（品質向上）

### 5. SVG/HTML Export の統合度向上

**現状**:
- `src/services/svgDiffRenderer.ts` と `src/services/htmlExportService.ts` で類似ロジック
- 新しいExportServiceでは統合されているが、旧実装が残存

**推奨アクション**:
- 高優先度項目#2（非推奨ファイル削除）を実施すれば自動的に解決
- 特別な追加作業は不要

### 6. 重複するtype定義の確認

**対象**:
- `src/types/types.ts` - メインのtype定義
- 各サービス内の個別type定義

**推奨アクション**:
次のフェーズで調査：
- 重複するinterface定義がないか確認
- 共通化できるtype定義の抽出

**工数**: 1-2時間（調査）

## 📊 削減可能なコード行数の推定

| 項目 | 削減行数 | 優先度 |
|------|----------|--------|
| escapeHtml統合 | 15-20行 | 高 |
| htmlExportService削除 | 650行 | 高 |
| ComponentShowcase削除 | 436行 | 中 |
| 命名統一 | 0行（リネームのみ） | 中 |
| **合計** | **約1,100行** | - |

## 🎯 推奨実施順序

1. **Week 1**: escapeHtml統合（30分）
2. **Week 1**: ComponentShowcase整理（15分）
3. **Week 2**: htmlExportService削除の事前調査（1時間）
4. **Week 2**: htmlExportService削除実施（2時間）
5. **Week 3**: 命名統一（10分）
6. **Future**: Type定義の調査・統合（計画フェーズ）

## 🔍 不要なファイルの最終リスト

### 削除候補（本番不要）
1. `src/services/htmlExportService.ts` - @deprecated、新ExportServiceで代替済み
2. `src/components/examples/ComponentShowcase.tsx` - 開発デモ用、本番参照なし

### 条件付き削除候補（確認後）
1. `test-pages.html` - ルートディレクトリのテストファイル
2. 各種 `.md` ファイル in `docs/` - 古い設計書の可能性

## ✅ リファクタリングによる効果

### コード品質
- ✅ DRY原則の徹底（escapeHtml統合）
- ✅ 保守性向上（非推奨コードの削除）
- ✅ ビルドサイズ削減（不要ファイル削除）

### 開発効率
- ✅ コードベースの理解が容易に
- ✅ 新機能追加時の迷いが減少
- ✅ テストカバレッジの向上

### 技術的負債
- ✅ 約1,100行のコード削減
- ✅ メンテナンス対象ファイルの削減
- ✅ 将来のバージョンアップリスク低減

## 📝 備考

- Phase 1リファクタリング完了により、Export システムは既に統合済み
- 今回の推奨事項は「クリーンアップ」が主目的
- アーキテクチャ的な大きな変更は不要
- すべての推奨事項は段階的に実施可能

---

**生成日時**: 2025-11-27
**分析対象**: bdiff プロジェクト全体
**分析手法**: Serena MCP + Static Analysis
