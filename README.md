# Danmaku Engine Demo

**Danmaku Engine Demo** は、PC向け同人弾幕シューティングを継続的に制作・販売するための、データ駆動型ゲーム基盤です。敵配置、弾幕、ステージ、UI文言、画像、BGM、SEをゲームデータとアセットに分離し、エンジンのコード変更を最小限に抑えながら別作品へ展開できることを目的にしています。

> 現在は「基盤検証ステージ」を収録した**技術デモ兼プロトタイプ**です。販売版にする前に、作品固有のシナリオ、ステージ、アート、音声、難易度調整、動作検証、権利確認を行ってください。

| 区分 | 内容 |
| --- | --- |
| 描画 | HTML5 Canvas API |
| 実行基盤 | ElectronによるWindows／Linuxデスクトップ配布対応 |
| 操作 | キーボード、ゲームパッド、低速移動、ショット、ボム、ポーズ |
| データ定義 | JSONによる自機、敵、弾、弾幕、ステージ、文言 |
| 配布物 | Windows NSISインストーラー、Windowsポータブル版、Linux AppImage |

## 現在実装済みのゲーム機能

プロトタイプには、縦長プレイフィールド、低速移動、連射、ボム、残機、グレイズ、スコア、ポーズ、ゲームオーバー、ステージクリア、タイトル画面、設定画面、ステージ選択画面を実装しています。敵とボスはステージタイムラインから出現し、扇状、円形、狙い撃ち、螺旋の各弾幕をJSONイベントから実行します。高密度の敵弾はエンティティプールで再利用します。

音量設定、フルスクリーン設定、将来のキー割当は、ゲームIDごとにローカルストレージへ保存されます。音声アセットが未配置の場合は再生を安全にスキップするため、アート・音声を段階的に追加できます。

## 操作方法

| 操作 | キー |
| --- | --- |
| 移動 | `W` `A` `S` `D` または矢印キー |
| 低速移動 | `Shift` |
| ショット | `Z` または `Space` |
| ボム | `X` |
| ポーズ／再開 | `Esc` |
| メニュー決定 | `Enter` |

## プロジェクト構成

```text
.
├── game-data/                  # 作品固有のゲームパック
│   ├── manifest.json           # 作品名、アセット、開始ステージ
│   ├── player.json             # 自機とショット
│   ├── bullets.json            # 自弾・敵弾の物理値
│   ├── enemies.json            # 敵とボス
│   ├── patterns.json           # 弾幕イベント
│   ├── stages/                 # ステージタイムライン
│   └── text/ja.json            # UI・演出テキスト
├── assets/                     # 作品固有の画像・音声を配置
├── src/                        # 作品共通のゲームエンジン
│   ├── core/                   # 入力、設定、音声、プール
│   ├── content/                # ゲームパック検証・読込
│   ├── gameplay/               # 自機、敵、弾幕、ステージ、衝突
│   └── render/                 # Canvas描画
├── electron/                   # デスクトップ版のメインプロセス
├── build/                      # アプリケーションアイコン
├── docs/                       # 仕様、作品パック制作、販売準備資料
└── tests/                      # スモークテストと設定テスト
```

## 新作へ差し替える手順

作品を新たに制作する際は、まず `game-data/manifest.json` の作品ID、タイトル、開始ステージ、アセット論理名を更新します。次に `player.json`、`bullets.json`、`enemies.json`、`patterns.json`、`stages/*.json` を編集して、ゲームルールと難易度を定義します。画面テキストは `game-data/text/ja.json` に集約されているため、世界観に合わせた文章へ差し替えられます。

画像と音声は `assets/` 以下に配置し、`manifest.json` 内で論理名とパスを対応付けます。エンジン側は `sound` と `music` のイベントを論理名で扱うため、SEやBGMのファイル名を入れ替えてもゲームロジックを変更する必要はありません。詳細な規約は [ゲームパック制作ガイド](docs/GAME_PACK_AUTHORING_GUIDE.md) と [エンジン仕様](docs/ENGINE_SPEC.md) を参照してください。

## 開発と検証

Node.js 22系とpnpm 11系を使用します。初回のみ依存関係を導入してください。

```bash
pnpm install
pnpm run check
pnpm run test:smoke
pnpm run test:settings
```

ブラウザ版を確認する場合は、以下を実行して `http://localhost:4173` を開きます。

```bash
pnpm run serve
```

Electronのデスクトップ版を開発モードで起動する場合は、以下を実行します。

```bash
pnpm run desktop:dev
```

## 販売用パッケージの生成

Windows x64向けには、インストーラー形式とポータブル形式の両方を生成します。Linux向けにはAppImageを生成します。Electronの配布では、アプリのソースをランタイムとともにパッケージ化し、Windowsではインストーラーやポータブル実行ファイルのような配布対象を作成できます。[1] [2]

```bash
# Windows x64: setup.exe と portable.exe
pnpm run build:win

# Linux x64: AppImage
pnpm run build:linux
```

出力先は `release/` です。Windowsのネイティブビルドは、リポジトリに含めた `.github/workflows/windows-release.yml` をWindowsランナーで実行する方式を標準とします。タグ `v*` をpushするか、GitHub Actionsの手動実行を行うと、NSISインストーラーとポータブル版がリリース候補アーティファクトとして保存されます。

## 販売前の必須確認

販売ビルドを配布する前に、全ての画像、音楽、効果音、フォント、第三者ライブラリについて、商用配布に必要な利用許諾とクレジット条件を確認してください。生成AI素材を用いる場合も、利用するサービスの当該時点の商用利用規約と、販売プラットフォームのガイドラインを確認する必要があります。

| 確認領域 | 販売開始前に行うこと |
| --- | --- |
| 作品内容 | 難易度、クリア可能性、スコア、コンティニュー、設定復帰を通しで確認する。 |
| PC互換性 | Windows実機でインストール、起動、終了、フルスクリーン、ゲームパッドを確認する。 |
| アセット権利 | 画像、BGM、SE、フォントの商用利用範囲、表記、再配布条件を記録する。 |
| 配布資料 | ストア用説明文、スクリーンショット、アイコン、利用規約、既知の不具合を用意する。 |
| セキュリティ | Windows実行ファイルのコード署名と、ダウンロードファイルのハッシュを検討する。 |

Windowsのコード署名は、配布ファイルの発行者と改ざん有無を検証する仕組みとして扱われます。公開ビルドで署名を行う場合は、保有する証明書をCIのシークレットに設定し、署名付きの最終配布物をWindows実機で確認してください。[3]

## ライセンス

本リポジトリのエンジンコードはMIT Licenseとして扱います。ただし、`assets/` に追加する画像・音声・フォント、および将来追加する外部ライブラリには、個別のライセンス条件が適用されます。販売作品ごとに、使用素材とライセンスを記録した `THIRD_PARTY_NOTICES.md` を作成することを推奨します。

## 旧Webデモ

初期MVPの公開URLは <https://tailofyukki-cell.github.io/space-shooter/> です。このデモは基盤化前の横スクロール版であり、現在のデスクトップ版基盤とは構成が異なります。

## References

[1]: https://www.electronjs.org/docs/latest/tutorial/application-distribution "Electron: Application Packaging"
[2]: https://www.electron.build/configuration.html "electron-builder: Configuration"
[3]: https://www.electron.build/win.html "electron-builder: Windows Configuration"
