# BUILD_PLAN.md — 毎日1セッション実装の進行台帳

最終更新: 2026-08-28 by Claude (Opus 5)

**この文書の役割**: どのセッション（Opus 想定）が、いつ開かれても、ここを読めば「今日やる1つの Build」を迷いなく実装して終われるようにする進行管理台帳。
**仕様の正は [DESIGN.md](DESIGN.md)**（何を作るか）。本書は「どう進めるか」と「今どこまで進んだか」だけを持つ。矛盾したら DESIGN.md が勝つ。設計を変えたくなったら DESIGN.md を先に直してから実装する。

---

## 運用の約束（HK と合意済み・2026-08-28）

1. **1セッション = 1 Build。** 終わったら次の Build に手を付けず終了する（コンテキスト温存と品質維持のため。残り容量があっても着手しない）
2. HK の指示は毎回同じ一言:「**次の Build をやって**」
3. 起動はこのディレクトリから: `cd C:/Users/c6341/Documents/Projects/aicx-lab` → `claude`
4. 日付は目安。1日サボっても順番がズレるだけで、順序は変えない
5. 詰まったら: 無理に進めず、下の進行表の「メモ」欄にブロッカーを書いて終了し、HK に報告する

---

## セッションの型（毎回この順で実行）

### Step 1: キャッチアップ（5分・読むのはこれだけ）
1. 本書の**進行表**を見て、状態が「未」の最上行 = 今日の Build を特定
2. DESIGN.md の該当セクションを読む（各 Build チケットに参照先を明記してある）
3. `index.html` は**全読みしない**。下の「index.html の地図」で必要な場所だけ Grep で開く

### Step 2: 実装
- 対象は原則 `index.html` 1ファイル（Python スクリプト経由の置換でも Edit でも可。**文字化け防止のため必ず UTF-8 で読み書き**）
- 作問は DESIGN.md §3（作問規約）を厳守。特に: 4択・正解1つ／誤答肢は「試験が嫌う思想5パターン」から／解説は選択肢の中身で参照（記号 (a)(b) 禁止）／ケースは 120〜250 字 + limit:180
- **問題 ID は一度 push したら不変**（SRS 履歴が紐づく）

### Step 3: 検証（DESIGN.md §6 チェックリストと同一・全項目必須）
1. `python -m http.server 8777` でローカル起動 → Playwright で: レッスン展開／全問回答／スコア表示／SRS due 更新／console errors 0
2. localStorage v1→v2 移行テスト（Build A 以降は v2 の後方互換）
3. シャッフル後の正答判定（`_a` 参照）が正しいこと
4. push → 本番 https://kannohi1.github.io/aicx-lab/ で同スモーク
5. **サーバー停止 → `netstat -ano | grep 8777` で待受ゼロを確認**（`pkill` は Windows で効かない。`taskkill //PID <pid> //F` を使う）

### Step 4: クローズ（これを終えるまで「完了」と言わない）
1. 本書の進行表を更新: 状態「済」・日付・commit 短縮ハッシュ・特記事項
2. `../ask-anything-local-01/materials/aicx/progress.md` に1行追記（例: `- 2026-08-30 Build B2 完了（Sec5-8 + mock12問）`）
3. commit メッセージ: `Build {ID}: {1行サマリ}`（Co-Authored-By 付き）→ push
4. HK への報告: 何ができたか3行以内 + 「次は Build {次のID}。明日も『次の Build をやって』でOK」

---

## 進行表（セッション終了時に必ず更新する・ここが唯一の状態台帳）

| # | Build | 内容（詳細は DESIGN.md 参照先） | 目安日 | 状態 | 完了日 | commit | メモ |
|---|---|---|---|---|---|---|---|
| 1 | **A** | 基盤改修: QB一元化+スキーマv2+SRS+今日の復習+ストリーク+想起クイズ+結果コピー+エクスポート/インポート+第1回10問のQB移行 → §1 全部 | 8/29 | 済 | 2026-08-28 | `33d8939` | 弱点マップは C1 に据置（設計どおり）。記録リセットはヘッダーから設定カードへ移動 |
| 2 | **B2** | 第2回: 5D骨格+Sec5-8（教材+lesson10問+mock12問+用語4語） → §4「第2回」+§3.3 | 8/30 | 済 | 2026-08-28 | `812c0c9` | HK指示で前倒し。QB計32問（both20/mock12）・用語44語 |
| 3 | **B3** | 第3回: Sec9-11 業務分解の道具箱 → §4「第3回」 | 8/31 | 済 | 2026-08-28 | `4c19d60` | HK指示で前倒し。QB計54問（both30/mock24）・用語47語 |
| 4 | **B4** | 第4回: Sec12-13,16 ナレッジとデータ → §4「第4回」 | 9/1 | 済 | 2026-08-28 | `04f3f09` | HK指示で前倒し。QB計76問（both40/mock36）・用語50語 |
| 5 | **B5** | 第5回: Sec14-15 RAG・ガバナンス → §4「第5回」 | 9/2 | 未 | | | RAG切り分けフローが核 |
| 6 | **B6** | 第6回: Sec17-18 PoC・成功3層 + **申込リマインド強化** → §4「第6回」 | 9/3 | 未 | | | 教材末尾に9/20申込CTA |
| 7 | **B7** | 第7回: Sec19-22 ワークフロー設計 → §4「第7回」 | 9/4 | 未 | | | カスタムAI/WF/エージェント3分類必須 |
| 8 | **B8** | 第8回: Sec23-24 組織文化・推進体制 → §4「第8回」 | 9/5 | 未 | | | |
| 9 | **B9** | 第9回: Sec25-27 評価・チェンジマネジメント → §4「第9回」 | 9/6 | 未 | | | 7つの問いは暫定版（§7参照） |
| 10 | **B10** | 第10回: Sec28-30 5D前半深掘り → §4「第10回」 | 9/7 | 未 | | | |
| 11 | **B11** | 第11回: Sec31-32 5D後半+総まとめ1枚図 → §4「第11回」 | 9/8 | 未 | | | |
| 12 | **C1** | 模試エンジン+弱点マップ（UIと採点系のみ・問題はダミー3問で検証） → §2+§5.2 | 9/9 | 未 | | | |
| 13 | **C2** | 模試①セット組成（50問・ブループリント準拠・不足分の新規作問） → §2 表 | 9/10 | 未 | | | プール不足なら新作で埋める |
| 14 | **D1** | 模試②セット + 第12回ページ（総復習ガイド） → §2+§4「第12回」 | 9/12 | 未 | | | |
| 15 | **D2** | 模試③（短縮25問/37分）+ 第13-14回ページ+直前チェックリスト → §4「第13-14回」 | 9/14 | 未 | | | |
| 16 | **E** | テキスト整合パス（HKがテキストの該当表現を貼る→差分補正。複数回に分けて可） → §7 | テキスト入手後 | 未 | | | HK 依存。待ち時間に他Buildを進めてよい |

全 Build 完了予定: **9月中旬**（学習日程の10月模試には5週間の余裕）。

---

## index.html の地図（全読み禁止・Grep で該当部だけ開く）

| 探すもの | Grep アンカー |
|---|---|
| CSS 変数・テーマ色 | `:root{` |
| 日程カウントダウン | `const DATES=` |
| シラバス32セクションのデータ | `const SYL=` |
| 用語集（39語） | `const GLO=` |
| 用語リンク化エンジン | `function linkify` |
| 用語ボトムシート | `function openTerm` |
| 第1回の教材本文 | `const L1_BODY` |
| 第1回のクイズ/ケース | `const L1_QUIZ` / `const L1_CASE` |
| レッスン一覧（準備中フラグ） | `const LESSONS=` |
| localStorage | `const KEY=` / `let ST=` |
| 選択肢シャッフル | `function shuffleQ` |
| レッスン描画 | `function openLesson` / `function qHTML` |
| 回答判定・採点 | `function bind` / `function checkDone` |
| ケースタイマー | `function startTimer` |
| ホーム描画 | `function renderHome` |
| 問題バンク（全設問の正） | `const QB=` / `const QBI=` |
| SRS（Leitner 5箱） | `function srsAnswer` / `const BOX_IV=` |
| 今日の復習キュー | `function dueIds` / `function renderReviewCard` |
| 復習モード画面 | `function openReview` / `function renderReviewQ` / `const REVIEW=` |
| ストリーク | `function streakN` / `ST.daily` |
| 想起クイズ（前回の復習） | `function recallIds` |
| セクション別成績・弱点 | `function secStats` / `function weakSecs` |
| 結果コピー | `function resultText` / `function toClipboard` |
| エクスポート／インポート | `const b64e=` / `impBtn` / `expBtn` |
| localStorage v2 と v1 移行 | `function loadST` / `function emptyST` |

（Build A で QB/SRS/復習キューのアンカーを追記済み。以後の Build でも新しい関数を足したらここに追記すること）

---

## 参照ファイルの所在

| もの | パス |
|---|---|
| 仕様書（正） | `DESIGN.md`（このリポジトリ直下） |
| 公式シラバス全文テキスト | `C:/Users/c6341/Documents/Projects/ask-anything-local-01/materials/aicx/syllabus_text.txt` |
| 公式シラバス PDF | 同ディレクトリの `AICX_公式シラバス_Ver1.2.pdf` |
| 学習進捗メモ（HK側） | `C:/Users/c6341/Documents/Projects/ask-anything-local-01/materials/aicx/progress.md` |
| 経緯・背景 memory | `C:/Users/c6341/Documents/Projects/ask-anything-local-01/memory/project_aicx_strategist_study.md` |

**本番 URL**: https://kannohi1.github.io/aicx-lab/ （GitHub Pages / main / root。push で自動デプロイ、反映 1〜2 分）

---

## してはいけないこと

- 設計の再発明（SRS のアルゴリズム変更・UI の大幅変更など）。改善案が浮かんだら実装せず、DESIGN.md への提案として HK に出す
- 1セッションで2 Build 以上（明示指示がある場合を除く）
- 公式テキストの文章転載・流出版 PDF の探索
- 公開済み問題 ID の変更・削除
- `pkill` でのプロセス停止（Windows では効かない）／検証サーバーの消し残し
- 進行表を更新せずに終了すること
