# STATUS.md

> **Build の進行状態の正は [BUILD_PLAN.md](BUILD_PLAN.md) の進行表**。本ファイルはセッション横断の現在地・判断・ハマりパターンだけを持つ（進行表は複製しない）。仕様の正は [DESIGN.md](DESIGN.md)。

## 現在地

- Build B3（第3回 Sec9-11 業務分解の道具箱・重量回）まで完了し、本番 https://kannohi1.github.io/aicx-lab/ で稼働中。B3 も HK 指示による前倒し実施（本来 8/31 予定）
- サイトの実体: QB 54問（pool both 30 / mock 24）・用語 47語・レッスン公開 3/14回。localStorage スキーマ v2（SRS・daily・streak）で v1 からの自動移行あり
- 次は Build B4（第4回 Sec12-13,16 ナレッジとデータ）
- 最新リモート同期: 2026-08-28 13:35 JST — origin/main = HEAD (ahead 0 / behind 0)

## 次にやること

1. Build B4: 第4回 Sec12-13,16（ナレッジとデータ）→ DESIGN.md §4「第4回」 [Claude]
2. 以降 B5〜B11 を進行表の順に 1セッション1Build で消化 [Claude]
3. Build C1（模試エンジン＋弱点マップ）— 弱点マップは Build A で実装せず C1 へ据え置いた（設計どおり） [Claude]

## 未解決・保留

| 項目 | 状態 | メモ |
|---|---|---|
| 出題数・配点・合格基準 | 非公式のまま | 50問/100点・8割は代理指標。公式ガイド or 受験実体験で確定（DESIGN §7） [Claude] |
| 「7つの問い」「3層定義」の公式表現 | 暫定版で作問済み | 公式テキスト入手後に Build E で差分補正（DESIGN §7・Build E は HK 依存） [Claude] |

## 判断済みの決定

| 決定 | 理由 | 日付 |
|---|---|---|
| 第1回の既存10問は `pool:'both'` で登録 | DESIGN §3.3 の総数計算（lesson110 + mock132 + 第1回既存10 = 252問）が第1回を模試プールに算入しているため | 2026-08-28 [Claude] |
| 記録リセットをヘッダーから「設定」カードへ移動 | DESIGN §5.4 が書き出し/読み込みを「記録リセットの横」と規定。3ボタンを1箇所に集約し、ヘッダーにはストリークを置いた | 2026-08-28 [Claude] |
| 日付は UTC ではなくローカル日で算出（`isoOf()`） | `toISOString()` 直用だと JST 00:00〜09:00 の学習が前日扱いになり、SRS の due とストリークが1日ずれる | 2026-08-28 [Claude] |
| B5（卒業）の due は +3650日で表現 | 「日次復習に出さない」を専用フラグではなく間隔表の一値で表現でき、`dueIds()` に分岐を足さずに済む | 2026-08-28 [Claude] |
| 想起クイズはレッスンのスコアに算入しない | スコアは「その回の理解度」を測る指標。過去問の出来で上下すると回ごとの比較ができなくなる | 2026-08-28 [Claude] |
| 別プロジェクト `ask-anything-local-01/materials/aicx/progress.md` への Build 完了行の追記は HK 承認済み | BUILD_PLAN.md Step 4-2 の手順。毎 Build 発生するため都度確認しない | 2026-08-28 [Claude] |

## ハマりパターン

- **Bash ツールの heredoc は約 7KB で無言に切れる。** `cat > file <<'EOF'` で 300行超の JS を書こうとしたら 173行目の文字列中で truncate され、`warning: here-document ... delimited by end-of-file` だけが出た。**大きなファイル（数KB超）は Write ツールで書く**。Bash heredoc は短いスクリプト専用にする [Claude]
- **`python -m http.server` の停止確認は `netstat | grep :8777` だけでは不十分。** TIME_WAIT の行が残るため「まだ生きている」と誤読する。`grep -i listening` まで絞って初めて待受ゼロを確認できる（`pkill` は Windows で効かない。`taskkill //PID <pid> //F`） [Claude]
- **index.html への大規模編集は Python スクリプト + `assert s.count(old)==1` で行う。** 置換対象が見つからないまま黙って進むのを防げる。実際 GLO の挿入位置指定を1回外したが、assert が先に落ちてファイルは無傷だった（書き込みは全 assert 通過後に1回だけ実行する構成にしておくこと） [Claude]

## 更新履歴

- 2026-08-28 [Claude] Build A（QB一元化・スキーマv2・SRS・今日の復習・ストリーク・想起クイズ・結果コピー・エクスポート/インポート）を実装し本番反映。commit 33d8939 / a3d926e
- 2026-08-28 [Claude] Build B2（第2回 5D骨格＋Sec5-8：教材・lesson10問・模試プール12問・用語4語）を HK 指示で前倒し実装し本番反映。commit 812c0c9 / b70e12e
- 2026-08-28 [Claude] STATUS.md 新規作成（進行表は BUILD_PLAN.md に置いたまま、本ファイルは判断とハマりパターンを持つ役割に限定）
- 2026-08-28 [Claude] Build B3（第3回 Sec9-11 業務分解の道具箱：教材・lesson10問・模試プール12問・用語3語）を HK 指示で前倒し実装し本番反映。commit 4c19d60 / 2ec55db
