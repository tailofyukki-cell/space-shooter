# アセット配置ガイド

このディレクトリには、**作品固有**の画像、BGM、SE、フォントを配置します。エンジンコードはアセットを直接参照せず、`game-data/manifest.json` に記載した論理名を通じて参照します。新作へ展開する際は、まずマニフェストのパスを更新し、次にこのディレクトリへ素材を置いてください。

| 種別 | 推奨配置先 | 例 | 注意点 |
| --- | --- | --- | --- |
| BGM | `assets/audio/bgm/` | `stage-01.ogg` | ループ位置、音量、権利表記を確認する。 |
| SE | `assets/audio/se/` | `player-shot.ogg` | 多重再生時に耳障りにならない音量へ調整する。 |
| 自機・敵・弾 | `assets/images/sprites/` | `player.png` | 当たり判定は画像外周と分離して調整する。 |
| 背景 | `assets/images/backgrounds/` | `stage-01.webp` | プレイフィールドの可読性を優先する。 |
| UI | `assets/images/ui/` | `logo.png` | 高解像度版と縮小表示時の可読性を確認する。 |
| フォント | `assets/fonts/` | `title-font.woff2` | 商用配布・埋込・再配布の許可を確認する。 |

## 論理名の例

`game-data/manifest.json` の `assets` は、ゲームコードが扱う論理名と実ファイルを対応付けます。

```json
{
  "assets": {
    "bgm_stage": "assets/audio/bgm/stage-01.ogg",
    "se_shot": "assets/audio/se/player-shot.ogg",
    "player_sprite": "assets/images/sprites/player.png"
  }
}
```

ステージや弾幕側では `bgm_stage` や `se_shot` のような論理名だけを利用します。ファイル名を差し替えても、論理名を維持する限りエンジン側を変更する必要はありません。

## 権利の記録

販売用の素材を追加するたびに、入手先、制作者、ライセンス、商用利用条件、必要なクレジット、購入・許諾記録への参照を `THIRD_PARTY_NOTICES.md` に記載してください。許可範囲が不明な素材は、販売候補に含めないでください。
