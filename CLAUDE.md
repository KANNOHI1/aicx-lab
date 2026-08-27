# CLAUDE.md — aicx-lab

AICX認定「AIエージェント・ストラテジスト」資格（2026年10月受験）の学習サイト。HK の合格がゴール。

## このプロジェクトでの動き方

1. **最初に [BUILD_PLAN.md](BUILD_PLAN.md) を読む**。進行表の「未」の最上行が今日のタスク。セッションの型（キャッチアップ→実装→検証→クローズ）もそこに書いてある
2. 仕様の正は [DESIGN.md](DESIGN.md)。矛盾したら DESIGN.md が勝つ。設計変更は DESIGN.md を先に更新してから実装
3. **1セッション = 1 Build**。終わったら次に手を付けず終了
4. HK の「次の Build をやって」= BUILD_PLAN.md 進行表の次の未着手 Build を実装せよ、の意味

## 構成

- `index.html` — サイト本体（単一ファイル・ビルド不要・外部依存なし・localStorage）
- 本番: https://kannohi1.github.io/aicx-lab/ （GitHub Pages / main / root、push で自動デプロイ）
- コミット規約: `Build {ID}: {1行サマリ}`

## 禁止事項（詳細は BUILD_PLAN.md 末尾）

- 公式テキストの転載・流出版の探索
- 公開済み問題 ID の変更
- `pkill` でのプロセス停止（Windows では効かない。taskkill + netstat 確認）
- 進行表を更新せずに終了
