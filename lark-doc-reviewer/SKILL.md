---
name: lark-doc-reviewer
description: Use when reviewing Feishu/Lark Docs, Wikis, PRDs, technical designs, project plans, or when the user asks to add precise document comments.
---

# Lark Doc Reviewer

飞书文档评审技能，用于读取飞书 Doc/Wiki，生成可核对的定点评论计划，并在用户确认后写入评论。

## Core Rule

评论写入是用户身份下的飞书写操作。默认必须两阶段执行：

1. **评审计划阶段**：读取文档、定位章节和候选锚点，生成评论计划并暂停。
2. **写入验证阶段**：用户明确确认后，才批量添加评论并读取评论列表验证。

除非用户明确说“直接写评论”或“无需确认”，不要在第一阶段调用 `drive +add-comment`。

## Progressive Loading

- 开始评审前，读取 `references/feishu_doc_review_workflow.md` 的 “Auth and Fetch” 与 “Anchoring”。
- 准备写评论前，再读取 “Write and Verify”。
- 只有要修改模板或新增模板时，才读取 README 或 `index.js` 中的模板结构。

## Preconditions

1. 检查 CLI 和用户身份：
   ```bash
   lark-cli auth status --verify
   ```
   必须确认 `identity=user` 且 token 有效。若沙箱看不到 CLI，可改用用户环境中的 npm shim。

2. 读取文档时优先使用 v2：
   ```bash
   lark-cli docs +fetch --as user --api-version v2 --doc "<doc_url>" --format json
   ```

3. 对 Wiki URL，先解析 wiki node，再读取真实文档 token；对长文档优先读取 outline，再按章节评审。

## Stage 1: Review Plan

生成评论计划，不写评论。计划至少包含：

- 文档标题、URL、读取方式和当前用户。
- 每条候选评论的 `checkId`、类别、建议内容、锚点文本、所在标题路径、上下文摘录、置信度。
- 无法可靠定位的检查项，标为 `needs_manual_anchor`，不要自动写入。
- 重复关键词或泛关键词命中的检查项，标为低置信度。

评论建议必须基于文档具体内容，不要只因为模板关键词出现就机械评论。

## Stage 2: Write and Verify

只有用户确认评论计划后才进入本阶段。

写入规则：

- 使用 `drive +add-comment --as user`。
- `drive +add-comment --content` 当前只接受内联 JSON，不接受 `@file`。在 PowerShell 中优先直接调用 CLI 的 node runner 或用参数数组，避免 `.cmd` 转发吃掉 JSON 双引号。
- 不要用裸 keyword 作为唯一定位依据；优先使用计划里的短锚点和上下文摘录。
- 表格、嵌套列表、重复文本中自动定位容易落到不支持评论的 table block；先用 docx block tree 找到具体文本/list block，再用 `--block-id` 写入。
- 每条写入后记录 `comment_id`、锚点、状态和错误。

写后验证：

```bash
lark-cli drive file.comments list --as user --params @./comments_list_params.json
```

最终报告必须区分：

- 已成功写入并验证的评论。
- 写入成功但验证未确认的评论。
- 未写入或定位不可靠的评论。

## Review Templates

内置模板：

- PRD：需求完整性、用户场景、交互逻辑、边界情况、异常处理、性能兼容。
- 技术方案：架构设计、技术选型、安全性、可维护性、性能优化、风险应对。
- 通用文档：逻辑、准确性、格式、完整性、错别字。

模板只提供检查维度；不要把模板评论当作无需阅读原文的固定文案。

## Common Mistakes

- 直接批量写评论，跳过评论计划和用户确认。
- 用 `content.match(regex)` 的第一个结果当成精准定位。
- 把 JSON 直接拼进 PowerShell 命令字符串。
- 只看 `commentResult.ok`，不读取评论列表验证。
- 对 Wiki/长文档整篇拉平读取，丢失标题层级和块级上下文。
