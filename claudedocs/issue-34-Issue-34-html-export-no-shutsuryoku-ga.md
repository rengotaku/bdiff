# Issue #34: HTML Exportの出力が不正

**Issue URL**: https://github.com/rengotaku/bdiff/issues/34

## 作業概要

SVGベースのHTML Export機能において、side-by-side表示で長い行がオーバーフローする問題を修正しました。
SVGの`<text>`要素は自動折り返しをサポートしていないため、HTML/CSSベースのレンダリングに切り替えました。

## ベースブランチ
origin/main

## ブランチ名
Issue-34-html-export-no-shutsuryoku-ga

## 作成日時
2025-11-28 18:09:18

---

## 作業ログ

### 2025-11-28 18:30 - 問題分析と解決方針決定

**問題の原因**:
- HTML ExportでSVGを使用してdiff表示を生成
- SVG `<text>`要素は自動テキスト折り返しをサポートしていない
- 長い行が固定幅(600px)を超えてオーバーフローしていた

**解決アプローチの検討**:
1. **Option A: HTML-based Rendering** (採用✅)
   - HTML/CSSで差分を表示
   - `word-wrap`, `overflow-wrap`による自動折り返し
   - より良いアクセシビリティとコピー機能
   - ファイルサイズの削減

2. Option B: SVG with `<foreignObject>` (不採用)
   - SVG内にHTMLを埋め込み
   - ブラウザサポートに制限あり

3. Option C: SVG Text Splitting (不採用)
   - テキストを複数の`<text>`要素に分割
   - 実装が複雑で動的リサイズに対応困難

### 2025-11-28 18:45 - 実装完了

**変更ファイル**:
- `src/services/export/renderers/HTMLRenderer.ts`

**実装内容**:

1. **SVG削除とHTML table導入**
   - `SvgDiffRenderer`の使用を削除
   - HTML `<table>`ベースのレンダリングに変更

2. **新規メソッド追加**:
   - `renderDiffLine()`: 個別の差分行をHTML table行として生成
   - `getDiffSymbol()`: 差分タイプに応じたシンボル(+, -, ~)を返す

3. **Unified View**:
   ```html
   <table class="diff-table unified-view">
     <tr class="diff-line diff-line-{type}">
       <td class="line-number">{lineNumber}</td>
       <td class="line-symbol">{symbol}</td>
       <td class="line-content"><pre>{content}</pre></td>
     </tr>
   </table>
   ```

4. **Side-by-Side View**:
   ```html
   <div class="side-by-side-container">
     <div class="side-by-side-panel">
       <div class="panel-header">Original</div>
       <table class="diff-table">...</table>
     </div>
     <div class="side-by-side-panel">
       <div class="panel-header">Modified</div>
       <table class="diff-table">...</table>
     </div>
   </div>
   ```

5. **CSS追加**:
   ```css
   .line-content pre {
     white-space: pre-wrap;        /* テキスト折り返し */
     word-wrap: break-word;        /* 長い単語を折り返し */
     word-break: break-all;        /* 必要に応じて単語内で改行 */
     overflow-wrap: anywhere;      /* あらゆる場所で折り返し可能 */
   }

   .diff-table-container {
     overflow-x: auto;             /* 横スクロール対応 */
   }

   .side-by-side-container {
     display: grid;
     grid-template-columns: 1fr 1fr;
     gap: 16px;
   }
   ```

6. **レスポンシブ対応**:
   ```css
   @media (max-width: 768px) {
     .side-by-side-container {
       grid-template-columns: 1fr;  /* モバイルでは縦並び */
     }
   }
   ```

**テスト結果**:
- ✅ TypeScriptコンパイル成功
- ✅ Viteビルド成功 (824ms)
- ✅ 出力サイズ: 376.74 kB (gzip: 111.58 kB)

**改善点**:
1. **テキスト折り返し**: 長い行が自動的に複数行に折り返される
2. **ファイルサイズ削減**: Base64エンコードされたSVGが不要になり軽量化
3. **アクセシビリティ向上**: HTMLテーブルによる構造化でスクリーンリーダー対応改善
4. **コピー機能**: ネイティブHTMLによりテキスト選択とコピーが改善
5. **メンテナンス性**: SVGレンダリングロジックの複雑さを削除

**今後の確認事項**:
- [ ] 実際の長い行を含むファイルでの動作確認
- [ ] ダークテーマでの表示確認
- [ ] 印刷時のレイアウト確認
- [ ] 各種ブラウザでの互換性確認

---

## 技術的メモ

### テキスト折り返しのCSS戦略

複数のCSS属性を組み合わせて、あらゆる長さのテキストに対応:

```css
white-space: pre-wrap;      /* 空白とタブを保持しつつ折り返す */
word-wrap: break-word;      /* 長い単語を折り返す (レガシー) */
word-break: break-all;      /* CJK以外のテキストも必要時に単語内改行 */
overflow-wrap: anywhere;    /* 最新の標準、どこでも折り返し可能 */
```

この組み合わせにより:
- コードのインデントやフォーマットを保持
- 非常に長いURL、パス、変数名も折り返し
- 日本語などのマルチバイト文字も適切に処理

### SVG vs HTML比較

| 項目 | SVG | HTML |
|------|-----|------|
| テキスト折り返し | ❌ 未サポート | ✅ ネイティブサポート |
| ファイルサイズ | 大 (Base64) | 小 (プレーンHTML) |
| アクセシビリティ | 制限あり | 優れている |
| ブラウザ互換性 | 良好 | 優れている |
| 実装複雑度 | 高 | 低 |
| 印刷品質 | 優れている | 良好 |

---

## 完了チェックリスト

- [x] 問題の原因分析
- [x] 解決アプローチの選定
- [x] HTMLRendererの実装変更
- [x] CSS追加と調整
- [x] ビルドテスト成功
- [x] ドキュメント更新
- [ ] 実機での動作確認
- [ ] PRレビュー対応
- [ ] マージ
