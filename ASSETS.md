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
| `enemy_pollen_scout` | `assets/astral-bloom/images/sprites/enemy_pollen_scout_game.png` | 花粉偵察機。左向きの小型花弁ドローン。 | 統合済み |
| `enemy_petal_wisp` | `assets/astral-bloom/images/sprites/enemy_petal_wisp_game.png` | 花弁精霊。左向きの蛇行敵。 | 統合済み |
| `enemy_crystal_gardener` | `assets/astral-bloom/images/sprites/enemy_crystal_gardener_game.png` | 結晶ガーデナー。水晶温室を模した中型敵。 | 統合済み |
| `boss_flora_orbis` | `assets/astral-bloom/images/sprites/boss_flora_orbis_game.png` | フローラ・オルビス。桜の花冠と深紅の制御核を持つボス。 | 統合済み |

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

実アセットは `assets/README.md` の配置規約に従い、販売ビルドに含める前に `THIRD_PARTY_NOTICES.md` へ権利情報を記録する。
