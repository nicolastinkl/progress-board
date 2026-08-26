# 项目进度总览（progress-board）

这是一个**独立的 GitHub 项目**，一个零依赖、单页、由 `progress.json` 驱动的**多项目进度看板**。

- 它本身就是一个仓库/项目，单独部署一次，用 GitHub Pages 运行。
- 它管理你**所有**的项目：所有项目的数据都集中放在这一个 `progress.json` 里。
- 页面有「项目总览 / 模块总览」，支持按仓库筛选、搜项目/仓库/模块/任务/待办。
- 每个项目都带 `repo` 字段，点一下就能跳到它真实的 GitHub 仓库。

## 怎么用

1. 把 `index.html`、`progress.json`、（可选）`AGENTS.md`、`scripts/auto-track.mjs` 放进**这个仓库**的根目录。
2. 推上去，开启仓库的 `Settings → Pages → Deploy from a branch → main / (root)`。
3. 访问 `https://你的用户名.github.io/progress-board/`，看板就会读取这个仓库自己的 `progress.json`。

以后每次改 `progress.json` 并 push，页面自动更新。**你只需要维护这一个仓库**，不需要在每个项目里重复放看板。

## 怎么加一个新项目

在 `progress.json` 的 `projects` 里加一条即可：

```json
{
  "id": "你的项目",
  "name": "项目名",
  "repo": "owner/仓库名",
  "status": "active",
  "priority": "high",
  "description": "一句话目标",
  "startDate": "2026-08-26",
  "targetDate": "2026-09-30",
  "modules": [
    { "name": "登录", "status": "doing", "progress": 40, "estHours": 12, "spentHours": 5, "updatedAt": "2026-08-26",
      "tasks": [ { "name": "邮箱登录", "status": "done", "progress": 100, "estHours": 6, "spentHours": 4 } ] }
  ],
  "todos": [
    { "title": "完成会员体系", "status": "todo", "priority": "high", "due": "2026-09-05", "note": "" }
  ]
}
```

也可以直接让 AI 帮你加：

> 在 progress.json 新增一个项目「XX」，仓库 owner/name，状态 active，目标 9 月底；模块「登录」进行中 40%，下面拆两个子任务；待办「完成会员体系」high。

## 预览

本机直接打开 `index.html` 显示内置示例；要看真实数据，用 `python3 -m http.server 8000` 后访问 `http://localhost:8000`，或直接部署到 GitHub Pages。

## 字段速查

| 字段 | 说明 |
| --- | --- |
| `id` | 项目唯一标识 |
| `name` | 项目名 |
| `repo` | GitHub 仓库 `owner/name` |
| `status` | `active` / `done` / `paused` / `blocked` |
| `priority` | `high` / `medium` / `low` |
| `progress` | 整体进度 0–100（按模块加权自动算） |
| `modules[]` | 模块：`status`(`todo/doing/done`)、`progress`、`estHours`、`spentHours`、`notes`、`tasks[]` |
| `tasks[]` | 子任务（可选）：`status`、`progress`、`estHours`、`spentHours` |
| `todos[]` | 待办：`status`(`todo/doing/done`)、`priority`、`due`、`note` |

## 与 AI 协作

根目录的 `AGENTS.md` 让 AI 在这个仓库里干活时自动帮你更新 `progress.json`。日常可用：

```bash
node scripts/auto-track.mjs            # 看最近 git 改动摘要
node scripts/auto-track.mjs --write    # 重算整体进度并写回
```

## 推送成为一个独立仓库

```bash
cd progress-board
git init && git add . && git commit -m "feat: 项目进度总览"
git branch -M main
git remote add origin git@github.com:你的用户名/progress-board.git
git push -u origin main
```
