# Ubuntu Chrome ドラッグ&ドロップ修正方法

## 問題の詳細
- **Ubuntu + Chrome**: ファイルマネージャーからのドラッグ&ドロップが動作しない
- **macOS + Safari/Chrome**: 正常に動作
- **根本原因**: Linux環境でのX11/Waylandとブラウザ間のデータ転送プロトコルの差異

## 実装した解決策

### 1. マルチメソッド対応のドロップハンドラ

```typescript
const handleDrop = useCallback(async (e: React.DragEvent, target: 'original' | 'modified') => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
  setDragTarget(null);
  
  // Method 1: Standard file drop (Works on most browsers)
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleTextChange(fileInfo.content, target);
    }
    return;
  }
  
  // Method 2: Handle text data (Fallback for Linux/Ubuntu)
  const textData = e.dataTransfer.getData('text/plain');
  if (textData) {
    if (textData.startsWith('file://')) {
      console.warn('File paths dropped from file manager are not directly accessible due to browser security.');
      return;
    }
    handleTextChange(textData, target);
    return;
  }
  
  // Method 3: Handle URI list (Additional Linux support)
  const uriList = e.dataTransfer.getData('text/uri-list');
  if (uriList) {
    console.warn('File URIs dropped from file manager detected. Please use the file input dialog.');
  }
}, [readFile, handleTextChange]);
```

### 2. ファイル選択ボタンの追加

各テキストエリアに"Browse file"ボタンを追加し、Ubuntu環境でのファイル読み込みの代替手段を提供。

```typescript
<label className="cursor-pointer">
  <input
    type="file"
    className="hidden"
    accept="text/*,.txt,.js,.jsx,.ts,.tsx,.json,.md,.html,.css,.xml,.yaml,.yml"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const fileInfo = await readFile(file);
        if (fileInfo) {
          handleTextChange(fileInfo.content, target);
        }
      }
    }}
    disabled={isReading || isProcessing}
  />
  <span className="text-xs text-blue-600 hover:text-blue-700 underline">
    Browse file
  </span>
</label>
```

## 修正のメリット

1. **クロスプラットフォーム対応**: Ubuntu、macOS、Windows全てで動作
2. **フォールバック機能**: ドラッグ&ドロップが失敗した場合の代替手段
3. **ユーザー体験向上**: 明確なファイル選択オプション
4. **デバッグ支援**: コンソールに詳細な警告メッセージ

## テスト方法

### Ubuntu Chrome での確認
1. ファイルマネージャーからファイルをドラッグ&ドロップ → フォールバック処理
2. "Browse file" ボタンをクリック → ファイル選択ダイアログ使用
3. テキストの直接ドラッグ&ドロップ → 正常動作

### 他の環境での確認
- macOS Safari/Chrome: 従来通りの動作を確認
- Windows Chrome/Edge: ドラッグ&ドロップ機能の確認

## 今後の改善案

1. **視覚的フィードバック**: Linux環境でドラッグ&ドロップが制限されていることをユーザーに通知
2. **プログレスインジケーター**: ファイル読み込み中の状態表示
3. **バッチ処理**: 複数ファイルの同時選択サポート
4. **キーボードショートカット**: アクセシビリティ向上のためのキーボード操作対応