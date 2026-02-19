# SPACE SHOOTER - 横スクロールシューティング

ブラウザで遊べる横スクロール2Dシューティングゲームです。Canvas APIを使用して実装されています。

## 🎮 ゲーム概要

自機を操作して敵を撃破し、60秒間生き延びることが目標です。敵や敵弾に当たるとライフが減少し、ライフが0になるとゲームオーバーになります。

## 🕹️ 操作方法

### PC
- **移動**: W/A/S/D または ↑↓←→
- **ショット**: Space（押しっぱなしで連射）
- **ゲーム開始/リトライ**: Enter または画面ボタン

### スマートフォン
- **移動**: 画面をドラッグ
- **ショット**: 画面をタップ

## 📋 ルール

### 基本ルール
- 自機が左側に位置し、背景が右→左に流れる横スクロール
- 敵が右側から出現し、自機の弾で倒す
- 敵や敵弾に当たるとライフが1減少
- 初期ライフは3

### 敵の種類
1. **直進敵**（赤）: 右から左へ直線移動 - 100点
2. **波状敵**（マゼンタ）: 右から左へ波状移動、HP2 - 200点

### パワーアップ
- 敵撃破時に10%の確率で緑色のパワーアップアイテムが出現
- 取得すると10秒間ショットが2連射に強化

### クリア条件
- 60秒間生存でステージクリア

### ゲームオーバー条件
- ライフが0になる

## 🌐 公開URL

GitHub Pagesで公開中:
**https://tailofyukki-cell.github.io/space-shooter/**

## 🚀 ローカル実行方法

### 方法1: 簡易HTTPサーバー（Python）
```bash
cd space-shooter
python3 -m http.server 8000
```
ブラウザで `http://localhost:8000` にアクセス

### 方法2: 簡易HTTPサーバー（Node.js）
```bash
cd space-shooter
npx http-server -p 8000
```
ブラウザで `http://localhost:8000` にアクセス

### 方法3: 直接開く
`index.html` をブラウザで直接開くこともできますが、一部の機能が制限される場合があります。

## 🛠️ 技術仕様

- **描画**: HTML5 Canvas API
- **ゲームループ**: requestAnimationFrame
- **当たり判定**: AABB（Axis-Aligned Bounding Box）
- **速度調整**: deltaTime による端末差吸収
- **構成**: 静的ファイル（HTML/CSS/JavaScript）

### ファイル構成
```
space-shooter/
├── index.html      # メインHTML
├── styles.css      # スタイルシート
├── main.js         # ゲームロジック
├── README.md       # このファイル
└── SPEC.md         # 詳細仕様書
```

## 📝 ライセンス

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🎯 開発情報

- **開発期間**: 2026年2月
- **目的**: 100日チャレンジのアウトプット作成
- **対応ブラウザ**: Chrome, Edge, Firefox, Safari（モダンブラウザ）

## 🔧 今後の拡張案

- ボス戦の追加
- 複数ステージ
- サウンドエフェクト・BGM
- ハイスコアのローカルストレージ保存
- より多様な敵パターン
- 追加パワーアップアイテム

## 📞 フィードバック

バグ報告や機能要望は、GitHubのIssuesでお願いします。
