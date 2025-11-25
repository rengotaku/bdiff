# Issue #30: エクスポートするHTMLの改良

**Issue URL**: https://github.com/rengotaku/bdiff/issues/30

## 作業概要
ph1

## ベースブランチ
origin/main

## ブランチ名
Issue-30-export-html-improvement-ph1

## 作成日時
2025-11-21 07:50:04

---

## 作業ログ

### 2025-11-21 - Phase 1 Implementation Complete

#### 実装内容

**1. Export Options の拡張**
- `HtmlExportOptions` インターフェースに `viewMode` フィールドを追加
- デフォルト値は `'unified'` (後方互換性のため)
- `'unified'` | `'side-by-side'` の2つのモードをサポート

**2. Side-by-Side View の実装**
- `pairLinesForSideBySide()` メソッドを実装
  - 差分行をOriginalとModifiedに対応付けるアルゴリズム
  - Added/Removed/Modified/Unchangedの各タイプを適切にペアリング
- `generateSideBySideView()` メソッドを実装
  - 2カラムレイアウトのHTML生成
  - 各パネルに適切なスタイルを適用

**3. CSS スタイリング**
- Side-by-Sideビュー用のCSSスタイルを追加
- アプリケーションのカラーパレットと統一
- レスポンシブデザイン対応（モバイルでは1カラムに切り替え）
- ライト/ダークテーマのサポート

**4. UI の更新**
- `HTMLExportDialog` にView Mode選択セクションを追加
- Unified / Side by Side のラジオボタン選択UI
- 日本語の説明テキストを追加

**5. Export Service の更新**
- `generateHtmlDocument()` メソッドを更新
- `viewMode` オプションに基づいて適切なビューを生成
- 既存のUnified viewも維持（後方互換性）

#### ビルド結果
✅ TypeScript型チェック: 成功
✅ Viteビルド: 成功 (883ms)

#### 次のステップ
- [ ] 実際のブラウザでの動作確認
- [ ] 大規模な差分での性能テスト
- [ ] ユーザーフィードバックの収集
