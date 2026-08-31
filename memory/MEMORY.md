# Claude Code Auto Memory

## プロジェクト索引

- [project_aicx_lab_build_ops.md](project_aicx_lab_build_ops.md) — 1セッション1Build の進め方と、別プロジェクト progress.md への追記が承認済みである範囲
- [feedback_announce_before_work.md](feedback_announce_before_work.md) — 作業に入る前に「何をやるか」を一言伝えてから着手する（自律作業モードの部分上書き）
- [project_aicx_lab_question_quality.md](project_aicx_lab_question_quality.md) — 作問Buildごとの機械チェック項目と閾値（長さ手がかり・型3順位語）。指標は「単独最長」で測る。第1〜7回は 2026-08-29 に是正済み
- [project_aicx_lab_final_review_plan.md](project_aicx_lab_final_review_plan.md) — R2 横断レビューは 2026-08-31 に Fable 8体で実施済み（高2・中10・低15）。Fable の価値の実測結論。closed
- [project_aicx_lab_deadline_and_text.md](project_aicx_lab_deadline_and_text.md) — 学習開始 2026-09-01 が納期。公式テキストは受領・書き起こし済み。Sec27=5つの問い / Sec18=3層フレームワークで公式表現が確定
- [project_official_text_ocr.md](project_official_text_ocr.md) — 公式テキスト401ページの書き起こしの所在・三重検証の到達点（欠陥ゼロ）・順序の保証と「png で原文確認してから直す」恒久ルール
- [feedback_ocr_verification_method.md](feedback_ocr_verification_method.md) — 大量書き起こしの三重検証手順（二重キー入力＋機構の違うOCR）。総数一致を根拠にしない・検証スクリプト自体の循環論法を疑う
- [project_aicx_lab_mock_allocation.md](project_aicx_lab_mock_allocation.md) — 模試3セットの問題割付を一括で解く理由と、Section 割当を章まるごとで厳密に解く設計（tools/mockplan.js）
- [feedback_primary_source_first.md](feedback_primary_source_first.md) — 一次資料が手に入ったら、局所補正でなくまず全体突き合わせを1回走らせる（aicx-lab で「高」47件・全面再構築に至った実例）
- [project_aicx_lab_rebuild.md](project_aicx_lab_rebuild.md) — 全面再構築 F シリーズの設計と、公式「学習のポイント」を骨格にする原則
- [feedback_context_budget_by_source_volume.md](feedback_context_budget_by_source_volume.md) — 一次資料を通読する作業は「通読量」でセッションを割る。auto-compact で一次資料の記憶が欠けると「推測で書く」失敗が再発する
- [feedback_no_side_reminders.md](feedback_no_side_reminders.md) — 作業報告に本題外のリマインドを足さない。進捗を聞かれたら残セッション数と日付で答える
- [feedback_large_file_edit_safety.md](feedback_large_file_edit_safety.md) — 数千行の単一ファイルを node で splice/replace するときの事故パターン。行番号は3点 assert・長文の完全一致 replace は使わない・書き込みは末尾で1回
- [feedback_js_duplicate_object_keys.md](feedback_js_duplicate_object_keys.md) — JS オブジェクトリテラルの重複キーは後勝ちで前が黙って消える。件数検査はユニーク件数と一致するかまで見る
- [feedback_spawn_task_same_worktree.md](feedback_spawn_task_same_worktree.md) — spawn_task のチップは同じ作業ツリーの現ブランチへ直接コミットしうる。並行編集の衝突を前提に commit 直前で git log を確認する
- [feedback_decompose_before_search.md](feedback_decompose_before_search.md) — 貪欲＋局所探索が頭打ちになったら、探索を足す前に「解く単位（分解）」を疑う
- [project_aicx_lab_exam_facts.md](project_aicx_lab_exam_facts.md) — 本番の実態＝全50問75分・合格ライン非公開は公式明言・受験期限は「開始ボタンを押す」期限。ケース構造は**公式テキストの理解度チェック60問の実測で決着**＝共有ケース0件・1問完結・中央値391字（サイトは53字で300字超が0問）
