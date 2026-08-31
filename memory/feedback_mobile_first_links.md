---
name: HK はスマホで読む。返答内のリンクは GitHub の URL で書く
description: 返答にリポジトリ相対パスを書くとスマホで開けない。ファイルを案内するときは常に GitHub の blob URL を使う
type: feedback
last_verified: 2026-08-31
---

**HK は「だいたい出先でスマホで見ている」**（2026-08-31 本人談）。

## やること

チャットの返答でリポジトリ内のファイルを案内するときは、**GitHub の URL を書く**。

```
https://github.com/{owner}/{repo}/blob/main/{path}
例: https://github.com/KANNOHI1/aicx-lab/blob/main/docs/EXAM_STRUCTURE.md
```

## やらないこと

`[docs/EXAM_STRUCTURE.md](docs/EXAM_STRUCTURE.md)` のような**リポジトリ相対パスを返答に書かない**。デスクトップの Claude Code ではエディタで開けるが、**スマホでは「リンクを開く」ダイアログが出て「開く」を押しても何も起きない**（2026-08-31 に実際に発生。HK からスクリーンショットで指摘された）。

## 適用範囲

- **返答テキスト内のリンクだけが対象**。リポジトリ内の .md 同士の相対リンク（STATUS.md → BUILD_PLAN.md 等）は GitHub 上で正しく解決されるので**そのままでよい**
- 未 push のファイルを GitHub URL で案内しない。**push してから案内する**か、その旨を書く
- 公開リポジトリでない場合や `.gitignore` 対象のファイル（例: aicx-lab の `text_ocr/`）は GitHub URL が 404 になる。その場合はリンクにせず**ファイル名だけを書き、中身の要点を返答に含める**

## 派生する配慮

スマホで読む前提なので、返答では**横に長い表を避ける**（列が多いと潰れる）。数値の比較は表でよいが、3〜4列に収める。長い出力はファイルにしてリンクではなく、要点を本文に書く。

関連: [[project_aicx_lab_exam_facts]]
