# レイアウト改善設計仕様書
**Issue #6: Layout Enhancement - UI Improvement and Button Placement Optimization**

## 現状の問題点

### 1. 不要なアイコンの使用
**問題箇所: DiffPage.tsx:228**
- InfoIconがFile Information見出しの横に配置されている
- 情報はTooltip内に隠されており、アクセシビリティが低い
- ユーザーがホバーしないと重要な情報が見えない

### 2. HTML Export モーダルの複雑さ
**問題箇所: HTMLExportDialog.tsx:85-295**
- 設定項目が多すぎて視覚的に混雑
- 4つの異なるCard要素が縦に並び、階層が不明確
- 絵文字の過剰使用（📄, 📋, 🎨, 📊, 💡など）
- 設定概要セクション(199-233行)が冗長

### 3. 要素の高さ不揃い
**問題箇所: DiffPage.tsx:196-314**
- 3カラムグリッド内の各セクション高さがばらばら
- ボタン群（289-309行）の配置が詰まりすぎ
- カード内のpaddingとspacingが一貫していない

## 設計方針

### A. アイコン削除と情報表示の最適化
**目標**: 重要情報を直接表示し、情報階層を明確化

#### 変更内容
1. **InfoIconの削除**
   - DiffPage.tsx:228のInfoIconを削除
   - Tooltip内の詳細情報を適切にレイアウト

2. **ファイル情報の直接表示**
   ```tsx
   // Before: Tooltip内に隠されている
   <Tooltip content={...}><InfoIcon /></Tooltip>

   // After: 重要情報を直接表示
   <div className="space-y-2">
     <div className="text-sm"><strong>Original:</strong> {originalFile.name}</div>
     <div className="text-sm"><strong>Modified:</strong> {modifiedFile.name}</div>
     <details className="text-xs text-gray-600">
       <summary>詳細情報</summary>
       {/* 詳細情報を展開可能に */}
     </details>
   </div>
   ```

### B. HTML Export モーダルの簡素化
**目標**: 視覚的な複雑さを50%削減し、認知負荷を軽減

#### 変更内容

1. **構造の単純化**
   ```
   Before: 5セクション構造
   - Filename Preview (88-92)
   - Custom Title (95-110)
   - Display Options Card (113-158)
   - Theme Selection Card (161-196)
   - Export Options Summary Card (199-233)
   - Help Text (284-294)

   After: 3セクション構造
   - 基本設定（Title + Filename）
   - オプション（Display + Theme統合）
   - アクションボタン
   ```

2. **絵文字の削除**
   - タイトルから📄を削除
   - セクション見出しから🎨, 📋, 📊を削除
   - ボタンから💾, 👀を削除（テキストラベルのみ）
   - ヘルプテキストから💡を削除

3. **設定概要セクションの削除**
   - 199-233行の冗長な設定概要Cardを削除
   - 選択された設定は各コントロールの状態から明確

4. **新しいレイアウト構造**
   ```tsx
   <Modal title="HTML Export Settings">
     {/* Section 1: 基本設定 */}
     <div className="space-y-4">
       <Input label="Filename" value={suggestedFilename} disabled />
       <Input label="Custom Title (Optional)" value={customTitle} />
     </div>

     {/* Section 2: オプション（2カラム） */}
     <div className="grid grid-cols-2 gap-6">
       <div>
         <h3>Display Options</h3>
         {/* チェックボックス */}
       </div>
       <div>
         <h3>Theme</h3>
         {/* ラジオボタン */}
       </div>
     </div>

     {/* Section 3: アクション */}
     <div className="flex justify-between">
       <Button>Reset</Button>
       <div className="flex gap-2">
         <Button>Cancel</Button>
         <Button>Preview</Button>
         <Button>Export</Button>
       </div>
     </div>
   </Modal>
   ```

### C. 要素高さの統一化
**目標**: 一貫したリズムと視覚的バランス

#### 変更内容

1. **グリッドセクションの高さ統一**
   - DiffPage.tsx:196-314の3カラムグリッド
   - 各セクションに`min-h-[200px]`を適用
   - 内容が少ないセクションは`flex flex-col justify-between`で配置

2. **ボタン群の配置改善**
   ```tsx
   // Before: 詰まった配置
   <div className="pt-2 space-y-2">
     <CopyButton className="w-full" />
     <HTMLExportButton className="w-full" />
     <Button className="w-full" />
   </div>

   // After: 適切な間隔
   <div className="space-y-3">
     <CopyButton className="w-full h-10" />
     <HTMLExportButton className="w-full h-10" />
     <Button className="w-full h-10" />
   </div>
   ```

3. **カードpaddingの統一**
   - 全てのCard要素に`p-6`を適用
   - CardHeader内は`pb-4`
   - CardContent内は`space-y-4`

## 実装優先順位

### Phase 1: アイコン削除と情報表示改善（高優先度）
- **ファイル**: DiffPage.tsx
- **変更範囲**: 198-234行
- **工数**: 1-2時間
- **影響**: 小

### Phase 2: HTML Export モーダル簡素化（高優先度）
- **ファイル**: HTMLExportDialog.tsx
- **変更範囲**: 全体リファクタリング
- **工数**: 3-4時間
- **影響**: 中（既存の機能は全て保持）

### Phase 3: 高さ統一化とレイアウト調整（中優先度）
- **ファイル**: DiffPage.tsx
- **変更範囲**: 196-314行
- **工数**: 2-3時間
- **影響**: 小

## 期待される改善効果

### ユーザビリティ
- **情報アクセス**: 重要情報が直接表示され、ホバー不要
- **認知負荷**: モーダルの視覚的複雑さ50%削減
- **操作性**: 一貫した要素高さによる予測可能なUI

### 保守性
- **コード削減**: 約100行のコード削減（設定概要セクション削除）
- **一貫性**: 統一されたスタイルガイドラインの適用
- **可読性**: シンプルな構造による理解しやすいコード

### パフォーマンス
- **レンダリング**: 不要なCard要素削減による軽量化
- **バンドルサイズ**: 絵文字削除によるわずかな削減

## デザイントークン

### Spacing Scale
```css
space-1: 0.25rem  /* 4px */
space-2: 0.5rem   /* 8px */
space-3: 0.75rem  /* 12px */
space-4: 1rem     /* 16px */
space-6: 1.5rem   /* 24px */
space-8: 2rem     /* 32px */
```

### Button Heights
```css
sm: h-8   /* 32px */
md: h-10  /* 40px */
lg: h-12  /* 48px */
```

### Card Padding
```css
default: p-6    /* 24px */
compact: p-4    /* 16px */
relaxed: p-8    /* 32px */
```

## 検証チェックリスト

### Phase 1 完了条件
- [ ] InfoIconが削除されている
- [ ] ファイル情報が直接表示されている
- [ ] 詳細情報がdetails要素で展開可能
- [ ] アクセシビリティテスト合格

### Phase 2 完了条件
- [ ] モーダルが3セクション構造
- [ ] 全ての絵文字が削除されている
- [ ] 設定概要セクションが削除されている
- [ ] 全ての機能が正常動作
- [ ] モーダルの高さが適切（スクロール不要）

### Phase 3 完了条件
- [ ] 3カラムグリッドの高さが統一
- [ ] ボタン高さが全て`h-10`
- [ ] カードpaddingが`p-6`で統一
- [ ] 視覚的なリズムが一貫している

## 実装ガイドライン

### コードスタイル
- Tailwind CSSクラスを使用
- カスタムCSSは最小限に
- アクセシビリティ属性を忘れずに（aria-label, role等）

### テスト要件
- ビジュアルリグレッションテスト
- レスポンシブデザインテスト（sm, md, lg, xl）
- キーボードナビゲーションテスト

### レビューポイント
- 既存機能が全て動作するか
- 視覚的な一貫性が保たれているか
- コードの可読性が向上しているか
