# ASTRAL BLOOM — Windows インストーラー配布報告

## ビルド対象

| 項目 | 値 |
| --- | --- |
| 製品名 | ASTRAL BLOOM |
| バージョン | 0.5.0 |
| 対象OS | Windows x64 |
| 元コミット | `f90f1045e3f0510fb04ac58f7f2bd846fa0233c3` |
| Windowsネイティブビルド | GitHub Actions Run `32423384726` |
| ビルド結果 | 成功 |

## 生成物

| ファイル | 形式 | サイズ | SHA-256 |
| --- | --- | ---: | --- |
| `ASTRAL BLOOM-0.5.0-win-x64-setup.exe` | NSIS インストーラー | 106,815,452 bytes | `29e85c53d3feede96cb4d920362fd90884cdb32895f364cfa4c9d73051b5d42b` |
| `ASTRAL BLOOM-0.5.0-win-x64-portable.exe` | ポータブル版 | 106,472,508 bytes | `c7c06bb838996e7912cf371aa03ebbdd3d422609903e04b7ab2b8371b7675f82` |

## 配布前検査

| 検査 | 結果 |
| --- | --- |
| WindowsネイティブでのNSIS・ポータブルEXE生成 | 成功 |
| 4ステージ、難易度、エンディング、音声、アート参照のCI検証 | 成功 |
| NSISサイレント導入 | 成功（終了コード0） |
| 導入済み `ASTRAL BLOOM.exe` の起動スモークテスト | 成功 |
| ポータブルEXEの起動スモークテスト | 成功 |
| 実画面の視覚確認 | 成功（タイトル、ASTRAL BLOOM表記、日本語副題・操作表示を確認） |
| ASAR同梱 | 4ステージJSON、BGM/SE 9件、背景4件、スプライト10件、LICENSE、THIRD_PARTY_NOTICESを確認 |
| バッチのASCII検査 | 成功 |
| 日本語ファイル名を含む最終ZIP | 該当なし（配布物はEXE、成果物名はASCII） |

## 利用方法

`setup.exe` は通常のインストーラーであり、インストール先を選択できる。`portable.exe` は展開・インストールなしで起動できる。一般配布には `setup.exe` を推奨する。

## 販売公開前の残ゲート

この成果物は技術的に動作するリリース候補である。ただし、一般販売でのWindows SmartScreen警告を減らすには、Windowsコード署名証明書による署名が必要である。さらに、生成画像の使用サービスにおける商用利用条件と必要表記を、販売開始前に `THIRD_PARTY_NOTICES.md` の方針に沿って最終確認する必要がある。
