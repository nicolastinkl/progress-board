#!/usr/bin/env node
// 自动追踪：读取 git 改动 + progress.json，输出摘要；--write 可重算整体进度并写回。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(scriptDir, "..", "progress.json");
const write = process.argv.includes("--write");
const dryRun = process.argv.includes("--dry-run");

function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const now = new Date().toISOString();

// 子任务加权 -> 模块进度；模块加权 -> 项目整体进度
function taskWeighted(tasks) {
  if (!tasks || !tasks.length) return null;
  const tot = tasks.reduce((s, t) => s + (t.estHours || 0), 0) || 1;
  return Math.round(tasks.reduce((s, t) => s + (t.progress || 0) * (t.estHours || 0), 0) / tot);
}
function modProgress(m) {
  const t = taskWeighted(m.tasks);
  return t !== null ? t : (m.progress || 0);
}
function weighted(mods) {
  if (!mods || !mods.length) return 0;
  const tot = mods.reduce((s, m) => s + (m.estHours || 0), 0) || 1;
  return Math.round(mods.reduce((s, m) => s + modProgress(m) * (m.estHours || 0), 0) / tot);
}

// 计算最近改动窗口
const since = data.meta?.updatedAt || new Date(Date.now() - 14 * 86400000).toISOString();
let commits = [];
try {
  const log = git("log", `--since=${since}`, "--pretty=format:%h | %ad | %s", "--date=format:%m-%d %H:%M");
  if (log) commits = log.split("\n").filter(Boolean);
} catch {}

console.log("== 项目进度自动追踪 ==");
console.log("数据源:", path.relative(process.cwd(), dataPath));
console.log("统计窗口: 自", since.slice(0, 10), "→", now.slice(0, 10));
console.log("最近提交:", commits.length ? "\n" + commits.map((c) => "  " + c).join("\n") : "  （无）");
console.log("");

let changed = false;
for (const p of data.projects || []) {
  const w = weighted(p.modules);
  const old = p.progress ?? w;
  const delta = w - old;
  const open = (p.todos || []).filter((t) => t.status !== "done").length;
  const line = `  ${p.name.padEnd(18)} 模块进度≈${w}%${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}  未完成待办 ${open}`;
  console.log(line);
  if (write && w !== old) {
    p.progress = w;
    changed = true;
  }
}

if (write && changed) {
  data.meta.updatedAt = now;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n");
  console.log("\n已重算整体进度并写回 progress.json");
} else if (write) {
  console.log("\n整体进度无需变更（未写回）");
} else {
  console.log("\n提示：加 --write 可重算整体进度并写回 progress.json");
}
