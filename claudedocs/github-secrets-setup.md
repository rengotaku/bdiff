# GitHub Secrets セットアップガイド

## 🚨 現在のエラー

GitHub Actions で以下のエラーが発生しています：
```
Input required and not supplied: apiToken
```

## 🔐 必要な環境変数

| 変数名 | 状態 | 説明 |
|--------|------|------|
| `CLOUDFLARE_ACCOUNT_ID` | ✅ 設定済み | CloudflareアカウントID |
| `CLOUDFLARE_API_TOKEN` | ❌ **未設定** | Cloudflare API Token (必須) |
| `SLACK_WEBHOOK_URL` | ✅ 設定済み | Slack通知用WebhookURL |

## 🛠️ Cloudflare API Token 作成手順

### 1. Cloudflare Dashboard にアクセス
1. https://dash.cloudflare.com/ にログイン
2. 右上のプロフィールアイコン → "My Profile"
3. "API Tokens" タブを選択

### 2. API Token 作成
1. "Create Token" ボタンをクリック
2. "Custom Token" を選択
3. 以下の権限を設定：

```
Token name: GitHub Actions - BDiff Pages
Permissions:
  - Account: Cloudflare Pages:Edit
  - Zone: Zone:Read  
  - Zone Resources: Include All zones
Account Resources: Include All accounts
Zone Resources: Include All zones
```

### 3. Token をコピーして保存

## 🔧 GitHub Secrets 設定手順

### 1. GitHub リポジトリにアクセス
1. https://github.com/rengotaku/bdiff に移動
2. "Settings" タブをクリック
3. 左メニューから "Secrets and variables" → "Actions"

### 2. Secret 追加
1. "New repository secret" をクリック
2. 以下を入力：
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Secret**: (Cloudflareで作成したAPI Token)
3. "Add secret" をクリック

## ✅ 設定完了後の確認

### 必要な Secrets 一覧
```
CLOUDFLARE_API_TOKEN     ← 新規追加必要
CLOUDFLARE_ACCOUNT_ID    ← 設定済み
SLACK_WEBHOOK_URL        ← 設定済み
```

### テスト方法
1. API Token設定後、PR #4 に新しいコミットをプッシュ
2. GitHub Actions が自動実行される
3. デプロイが成功することを確認

## 🚨 セキュリティ注意事項

- **API Token は機密情報**: 絶対にコードに直接記載しない
- **最小権限の原則**: 必要最小限の権限のみ付与
- **定期的なローテーション**: セキュリティ上、定期的にToken更新を推奨

## 📋 トラブルシューティング

### Token作成時のよくあるエラー
1. **権限不足**: "Cloudflare Pages:Edit" 権限が必要
2. **スコープ設定ミス**: Account/Zone Resourcesの設定確認
3. **Token期限**: Token有効期限の確認

### GitHub Actions エラー確認
1. Repository Settings → Secrets で設定を確認
2. Actions タブでワークフロー実行ログを確認
3. Cloudflare Dashboard でPages デプロイ状況を確認