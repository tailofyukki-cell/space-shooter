# ASTRAL BLOOM — Asset Register

## Art Direction Reference

| ファイル | 用途 | 制作上の拘束条件 |
| --- | --- | --- |
| `assets/art-direction/astral-bloom-stage-01-reference.png` | 第1ステージ「硝子雨の庭園」の色彩、背景密度、弾幕の視認性を共有するコンセプトリファレンス | 深い群青の余白、自機は青緑、危険弾はマゼンタ〜珊瑚色、中央に回避経路を残す。実ゲームでは文字を入れず、背景と敵弾を混同させない。 |

## Integrated Stage 01 Visual Assets

| 論理名 | ファイル | 用途 | 状態 |
| --- | --- | --- | --- |
| `stage01_garden_bg` | `assets/astral-bloom/images/backgrounds/stage01_glassrain_garden_game.jpg` | 横長の硝子雨の庭園背景。非シームレスのため静止配置し、星レイヤーで右→左の移動感を補う。 | 統合済み |
| `player_cadenza7` | `assets/astral-bloom/images/sprites/player_cadenza7_game.png` | 自機〈カデンツァ7〉。右向きの青緑・白の迎撃機。 | 統合済み |
| `enemy_pollen_scout` | `assets/astral-bloom/images/sprites/enemy_pollen_scout_game.png` | 花粉偵察機。黄緑の単眼、三枚の黒紫機械花弁翼、左向きの小型迎撃ドローン。 | 刷新・統合済み |
| `enemy_petal_wisp` | `assets/astral-bloom/images/sprites/enemy_petal_wisp_game.png` | 花弁精霊。青緑の硝子核と五枚の刃状花弁を持つ、左向きの蛇行敵。 | 刷新・統合済み |
| `enemy_crystal_gardener` | `assets/astral-bloom/images/sprites/enemy_crystal_gardener_game.png` | 結晶ガーデナー。深緑の六角温室、剪定アーム、黒曜石装甲を持つ中型整備機。 | 刷新・統合済み |
| `boss_flora_orbis` | `assets/astral-bloom/images/sprites/boss_flora_orbis_game.png` | フローラ・オルビス。深紅の結晶核、六枚の装甲花弁、硝子軌道リングを持つ第1ステージボス。 | 刷新・統合済み |
| `stage02_conduit_bg` | `assets/astral-bloom/images/backgrounds/stage02_moonrain_conduit_game.jpg` | 月虹の導水路背景。中央の回避空間を暗く保った、月光・星水・水晶水門の横長戦闘背景。 | 統合済み |
| `boss_lumen_archon` | `assets/astral-bloom/images/sprites/lumen_archon_game.png` | ルーメン・アーコン。琥珀の結晶核、銀白の水門環、群青の結晶翼を持つ第2ステージボス。 | 統合済み |
| `stage03_eclipse_bg` | `assets/astral-bloom/images/backgrounds/stage03_eclipse_canopy_game.jpg` | 星蝕の外環樹海背景。皆既太陽と右側に集約された深緑の軌道植物を持ち、中央レーンの視認性を保つ。 | 統合済み |
| `midboss_tessa_reave` | `assets/astral-bloom/images/sprites/tessa_reave_game.png` | 冠鎌機テッサ・リーヴ。二本の剪定鎌と琥珀の単眼を持つ第3ステージ中ボス。 | 統合済み |
| `boss_aurea_eclipse` | `assets/astral-bloom/images/sprites/aurea_eclipse_game.png` | アウレア・エクリプス。皆既冠、太陽花弁、二対のソーラーランスを持つ第3ステージボス。 | 統合済み |
| `stage04_core_bg` | `assets/astral-bloom/images/backgrounds/stage04_astral_core_game.jpg` | アストラル・ブルーム中枢背景。右側に星核と分光導管を配置した最終戦用の横長背景。 | 統合済み |
| `midboss_nox_reave` | `assets/astral-bloom/images/sprites/nox_reave_game.png` | 深層接続機ノクス・リーヴ。群青の星核と6本の結晶接続アームを持つ第4ステージ中ボス。 | 統合済み |
| `boss_garden_heart` | `assets/astral-bloom/images/sprites/garden_heart_game.png` | ガーデン・ハート。白紫の多層花弁、中心星核、軌道リングを持つキャンペーン最終ボス。 | 統合済み |

これらは `content-packs/astral-bloom/manifest.json` の `visuals` から参照する。別作品へ展開する際は、同じ論理キーを別の画像ファイルへ差し替えるだけで、既存の敵・ボス・ステージロジックを保ったままアートを置換できる。画像読込に失敗した場合はCanvasの図形描画が表示される。

## 音声・演出アセット

| 論理名 | 種別 | 対象 | 状態 |
| --- | --- | --- | --- |
| `bg_stage01` | BGM | 硝子雨の庭園 | 統合済み：オービタル温室を進む132 BPMのインストゥルメンタル。 |
| `bg_boss01` | BGM | フローラ・オルビス戦 | 統合済み：150 BPMの高密度なボス戦インストゥルメンタル。 |
| `se_player_shot` | SE | 自機ショット | 統合済み：青緑の光線を示す短い上昇音。 |
| `se_enemy_shot` | SE | 花弁・種子・蔓弾発射 | 統合済み：危険を知らせる柔らかい上昇音。 |
| `se_enemy_destroy` | SE | 敵・結晶破壊 | 統合済み：硝子花の破裂音。 |
| `se_boss_phase` | SE | ボスフェーズ移行 | 統合済み：花弁が開く結晶転調音。 |
| `se_player_hit` | SE | 被弾 | 統合済み：BGMダッキングを伴う警告音。 |
| `se_graze` | SE | グレイズ | 統合済み：短時間連打を抑制したきらめき。 |
| `se_bomb` | SE | ボム | 統合済み：星環展開の広がりを示す効果音。 |

第2〜第4ステージは現時点で `bg_stage01` と `bg_boss01` を再利用する試遊版である。販売候補では第2〜第4ステージごとの通常BGM・ボスBGMを追加し、各ステージの音楽的な識別性を確立する。

実アセットは `assets/README.md` の配置規約に従い、販売ビルドに含める前に `THIRD_PARTY_NOTICES.md` へ権利情報を記録する。
