---
name: 大きな Artifact の再公開は新 URL に倒す
description: Artifact ツールは同 URL への再公開前に公開中の全文 Read を要求する。数百 KB 級では会話に全文が入るので、HK 判断で新 URL 公開を既定にした
type: feedback
last_verified: 2026-09-16
---

**事実**: Artifact を同じ URL に上書きするには、ツール仕様で「公開中のバージョンを全行 Read 済み」であることが必要。`action: read` は 800KB を tool-results に保存し、それを Read しないと publish が拒否される。ファイル生成物（buildtext.js の出力など）は diff で「差分＝自分の変更だけ」と確認できても、この要求は免除されない。

**HK の判断（2026-09-16）**: 805KB の公式テキスト Artifact で「新 URL で公開（推奨）／同 URL に上書き」を提示 → **新 URL**。iPhone のブックマーク差し替えのほうが、会話に 800KB を永続的に載せるより安い。

**How to apply**: 生成物が数百 KB を超える Artifact の更新は、最初から新 URL 公開を提案し、旧 URL は削除候補として残す。小さい Artifact（数十 KB）は素直に read → 同 URL 更新でよい。判定鍵は「全文 Read がトークン運用規律（生データを会話に入れない）に反するか」。関連: [[feedback_context_budget_by_source_volume]]
