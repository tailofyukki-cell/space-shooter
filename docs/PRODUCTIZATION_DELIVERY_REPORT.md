# PC向け同人弾幕シューティング基盤：成果報告書

**作成日:** 2026-08-18（JST）  
**対象リポジトリ:** <https://github.com/tailofyukki-cell/space-shooter>  
**対象コミット:** `403f996c31aa1b46eb2c8215746e8657658d5ddf`  
**Windowsリリース候補ビルド:** <https://github.com/tailofyukki-cell/space-shooter/actions/runs/32041098760>

## 結論

既存の横スクロールWebゲームを、**作品データとアセットを差し替えて別の弾幕シューティングへ展開できる、データ駆動型のPCゲーム基盤**として再構築した。ゲームエンジン、作品パック定義、タイトル・ステージ選択・設定・結果画面、音声フック、設定保存、Electronデスクトップ配布設定、Windowsビルド自動化、販売準備資料を実装している。

Windows x64向けのNSISインストーラーとポータブル版は、GitHub ActionsのWindowsネイティブランナーで**ビルド成功**を確認した。Linux x64向けには、ローカルでAppImageの生成を完了した。Windows配布アーティファクトはGitHub Actionsに30日間保存されている。実行環境からのアーティファクト取得はGitHub側の一時的なHTTP 503により未完了だったが、ワークフロー本体は成功し、メタデータ上で187,547,707バイトの成果物が保存されていることを確認した。

| 項目 | 結果 | 証跡 |
| --- | --- | --- |
| データ駆動型ゲームエンジン | 合格 | `src/`、`game-data/`、`docs/ENGINE_SPEC.md` |
| 弾幕・敵・ボス・ステージ進行 | 合格 | `PatternRunner`、`StageRunner`、スモークテスト |
| タイトル・設定・ステージ選択・結果画面 | 合格 | `index.html`、ブラウザ視覚確認記録 |
| 音量・フルスクリーン設定保存 | 合格 | `SettingsStore`、設定テスト |
| 音声差し替えフック | 合格 | `AudioManager`、`manifest.json` の論理名マッピング |
| Linux AppImage | 合格 | `release/Danmaku Engine Demo-0.1.0-linux-x86_64.AppImage`、約111MB |
| Windows NSIS／ポータブル版 | 合格 | GitHub Actions Run `32041098760` |
| 販売前の権利・実機確認資料 | 合格 | `COMMERCIAL_RELEASE_CHECKLIST.md`、`THIRD_PARTY_NOTICES.md` |

## 実装した再利用設計

### 1. 作品パックとエンジンの分離

作品固有の内容を `game-data/` に集約した。`manifest.json` は作品ID、作品名、開始ステージ、アセット論理名を持ち、`player.json`、`bullets.json`、`enemies.json`、`patterns.json`、`stages/*.json`、`text/ja.json` がゲームの差し替え可能な要素を定義する。これにより、敵の耐久値・移動・出現順・弾速・発射角・発射周期・ボスフェーズ・表示文章を、エンジンコードから切り離して編集できる。

### 2. 弾幕システム

`PatternRunner` は、扇状、円形、狙い撃ち、螺旋の弾幕イベントをJSONから実行する。`EntityPool` により自弾・敵弾・敵を再利用し、発生頻度の高い弾幕での不要な生成を抑える。自機にはショット、低速移動、残機、被弾後無敵、グレイズ、ボムを実装し、ゲームワールド側が衝突・得点・クリア・ゲームオーバーを統合管理する。

### 3. アート・BGM・SEの差し替え

アセットは `assets/` と `game-data/manifest.json` の論理名を通じて接続する。ゲーム側は `bgm_stage`、`se_shot`、`se_bomb` のような論理名を扱うため、実ファイルの画像・BGM・SEを新作ごとに差し替えても、ゲーム進行のコードを変更する必要がない。詳細な配置規約は `assets/README.md` に、作品パックの制作規約は `docs/GAME_PACK_AUTHORING_GUIDE.md` に記載した。

### 4. PC向け配布

Electronのメインプロセスは、Node統合を無効化し、コンテキスト分離とサンドボックスを有効にした。さらに、独自の安全な `app://` プロトコルを実装し、配布されたアプリ内でもJSON、画像、BGM、SEを同一オリジンとして読み込めるようにしている。Electronではアプリケーションをランタイムとともにパッケージ化して配布できる。[1]

`electron-builder` の設定により、Windows x64でNSISインストーラーとポータブル実行ファイル、Linux x64でAppImageを生成する。NSISとポータブル実行ファイルはelectron-builderのWindowsターゲットとしてサポートされる。[2]

## 検証結果

以下の検証は、対象コミットのソースで実行済みである。

| 検証 | 結果 | 内容 |
| --- | --- | --- |
| `pnpm run check` | 成功 | ES Modules、Electronメインプロセスを含む構文検証 |
| `pnpm run test:smoke` | 成功 | タイムライン敵出現、自弾、敵弾、ボム消去を検証 |
| `pnpm run test:settings` | 成功 | 音量・フルスクリーン設定の正規化と永続化を検証 |
| `pnpm run build:linux` | 成功 | Linux AppImageを生成 |
| GitHub Actions Windowsビルド | 成功 | Windows x64でNSISとポータブル版を生成・保存 |
| ブラウザ視覚確認 | 成功 | タイトル、設定、ステージ選択、ゲーム開始、結果画面を確認 |

## 受入基準の判定

| 受入観点 | 判定 | 補足 |
| --- | --- | --- |
| 自機の移動、ショット、低速移動、ボム | Yes | キーボード・ゲームパッド入力を共通アクションとして実装。 |
| 敵出現、撃破、敵弾、当たり判定 | Yes | ステージタイムラインとAABB／円形判定を統合。 |
| 複数の弾幕・ボスフェーズ | Yes | 4種の汎用パターンとボス定義を実装。 |
| スコア、残機、グレイズ、クリア／失敗、リトライ | Yes | HUDと結果画面を実装。 |
| 画像・BGM・SEだけを替えた作品展開 | Yes | 論理名マッピングとゲームパック分離を実装。 |
| Windows配布可能なEXE | Yes | GitHub ActionsのWindowsネイティブビルド成功。 |
| 販売開始可能な完成コンテンツ | No | 作品固有のアート、音声、全ステージ、実機試験、ストア登録、コード署名は次工程。 |

## 今後の最短手順

1. `game-data/` を複製し、作品名、世界観、敵、弾幕、ステージ、UIテキストを新作向けに差し替える。
2. `assets/` に商用利用権を確認済みの画像、BGM、SE、フォントを配置し、`manifest.json` で論理名と対応付ける。
3. Normal／Hardなどの難易度、複数ステージ、ボス演出、ストーリー、ハイスコア保存を追加する。
4. `THIRD_PARTY_NOTICES.md` を実使用素材で埋め、`COMMERCIAL_RELEASE_CHECKLIST.md` のG1〜G6を完了する。
5. GitHub ActionsのWindowsアーティファクトをダウンロードし、Windows 10／11実機でインストール、起動、入力、フルスクリーン、終了、アンインストールを確認する。
6. 署名証明書を用意した段階で、CIのシークレットを設定して署名済みビルドへ移行する。Windowsのコード署名は、発行者と改ざんの有無を検証するために使われる。[3]

## 注意事項

GitHub PagesのURL <https://tailofyukki-cell.github.io/space-shooter/> は、従来の横スクロールMVPを維持する `gh-pages` ブランチを公開している。今回のデータ駆動型弾幕エンジンは `main` ブランチとデスクトップ配布物を正とする。販売対象の配布物はGitHub Pagesではなく、Windowsリリース候補アーティファクトから検証・公開する。

本基盤は、作品の商業的完成を保証するものではない。アセット権利、年齢区分、ストアの公開規約、動作保証範囲、価格、サポート方針、コード署名を個別作品のリリース条件として確定する必要がある。

## References

[1]: https://www.electronjs.org/docs/latest/tutorial/application-distribution "Electron: Application Packaging"
[2]: https://www.electron.build/win.html "electron-builder: Windows configuration and targets"
[3]: https://www.electron.build/win.html "electron-builder: Windows code signing"
