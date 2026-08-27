---
name: aicx-lab の Build 運用（進行表・クローズ手順・承認済み範囲）
description: aicx-lab で「次の Build をやって」と言われたときの進め方と、別プロジェクト progress.md への追記が承認済みであること
type: project
last_verified: 2026-08-28
---

aicx-lab（AICX資格の学習サイト）は **1セッション1Build** で進める。進行状態の正は `BUILD_PLAN.md` の進行表、仕様の正は `DESIGN.md`。HK の「次の Build をやって」は「進行表の未着手の最上行を実装せよ」の意味。

**Build クローズ時の `progress.md` 追記は HK 承認済み（2026-08-28）**。書き込み先は `Projects/ask-anything-local-01/materials/aicx/progress.md` の `## サイト実装ログ（aicx-lab）` セクション（Build A 完了時に新設）。**別プロジェクト配下だが、この1行追記については毎回 GO を取り直さない。** HK の学習結果テーブル（回ごとの正答数）は HK 自身が書く領域なので触らない。

**Why**: グローバルルールは「起動プロジェクト外のファイル編集は事前確認必須」だが、BUILD_PLAN.md のクローズ手順に毎 Build この追記が含まれているため、都度確認するとセッションごとにブロッキング質問が発生する。HK が範囲を明示して承認済み。

**How to apply**: Build 完了時は ①BUILD_PLAN.md 進行表を「済」+日付+commit ②progress.md のサイト実装ログに1行 ③commit/push ④本番URLでスモーク ⑤検証サーバーを taskkill して `netstat | grep -i listening` で待受ゼロ確認 — の順で閉じる。承認範囲を超える編集（例: 学習結果テーブルの書き換え、別プロジェクトのソース）は従来どおり事前確認する。

関連: [[feedback_token_discipline]]
