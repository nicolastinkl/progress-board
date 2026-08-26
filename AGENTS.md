# AGENTS.md — 给 AI 助手的进度维护说明

本仓库是一个**多项目进度看板**：`index.html` 负责展示，`progress.json` 是唯一数据源。
`progress.json` 里的 `projects` 数组承载**所有项目**，看板一页即可总览全部项目，也能切换到「模块总览」按模块看。
当你（AI）在推进任何项目、模块、子任务或待办时，请**同步更新 `progress.json`**。

## 何时更新

- 完成 / 推进了某个模块或子任务。
- 变更项目状态（开始、暂停、完成、阻塞）。
- 新增一个项目或模块。
- 修改了预计 / 实际工时、目标日期、备注。

## 数据结构（必须保持合法 JSON）

```jsonc
{
  "meta": { "title": "项目进度总览", "updatedAt": "2026-08-26T12:00:00Z", "note": "..." },
  "projects": [
    {
      "id": "demo-workspace",        // 唯一，建议 kebab-case
      "name": "工作台 Demo",
      "repo": "owner/repo",          // GitHub 仓库 owner/name，看板按它筛选/跳转
      "status": "active",            // active | done | paused | blocked
      "priority": "high",            // high | medium | low
      "description": "一句话目标",
      "startDate": "2026-08-05",
      "targetDate": "2026-09-20",
      "progress": 55,                // 整体 0-100，由 modules 按 estHours 加权
      "modules": [
        {
          "name": "任务看板",
          "status": "doing",         // todo | doing | done
          "progress": 53,            // 0-100，若含 tasks 则由 tasks 加权
          "estHours": 40,            // 模块预估
          "spentHours": 26,
          "updatedAt": "2026-08-24",
          "notes": "可选说明",
          "tasks": [                 // 可选：把复杂模块继续拆成子任务
            { "name": "拖拽交互", "status": "done", "progress": 100, "estHours": 14, "spentHours": 12 },
            { "name": "卡片详情弹窗", "status": "doing", "progress": 45, "estHours": 16, "spentHours": 8 }
          ]
        }
      ],
      "todos": [
        { "title": "写 README", "status": "todo", "priority": "high", "due": "2026-08-30", "note": "可选" }
      ]
    }
  ]
}
```

## 维护规则

1. **模块完成**：`status` → `done`，`progress` → `100`，`spentHours` 填实际，`notes` 记一行结果。
2. **复杂模块**：拆成 `tasks`（子任务），每个子任务有独立 `status`/`progress`/`estHours`/`spentHours`。模块进度会自动按子任务工时加权。
3. **整体进度**：由模块按 `estHours` 加权自动计算，不需要手填 `project.progress`（脚本会自动重算）。
4. **待办**：状态只允许 `todo` / `doing` / `done`；完成的保留，供历史参考。
5. **多项目**：直接往 `projects` 数组加对象即可，看板会自动出现在「项目总览」。每个项目写自己的 `repo`。
6. **时间戳**：`updatedAt` 用 ISO 8601（UTC），如 `2026-08-26T12:00:00Z`。
7. **保持 JSON 合法**，提交前校验：
   ```bash
   node -e "const d=require('./progress.json');console.log('ok', d.projects.length, 'projects')"
   ```

## 自动追踪

`scripts/auto-track.mjs` 会读取 `git log` 与 `progress.json`，输出最近改动摘要，并重算整体进度（含子任务）：

```bash
node scripts/auto-track.mjs            # 只打印报告
node scripts/auto-track.mjs --write    # 重算整体进度并写回 progress.json
```

在你改动项目后建议运行一次，提交信息示例：
`docs(progress): 更新「工作台 Demo」任务看板进度（拖拽交互完成）`
