# Agent 技能仓库 (Personal Skills)

个人收集和整理的 AI Agent 实用技能仓库，旨在提升多 Agent 环境下的工作效率。支持在 Gemini CLI、Claude Desktop、Cursor 等具备扩展能力的 Agent 软件中快速部署。

## 技能维护规范 (Mandatory)
为了确保多 Agent 环境下的技能一致性，所有更新必须遵循以下规则：
1. **目录结构**：每个技能必须存放在独立的子目录下。
2. ** README 更新**：每次新增或更新技能后，必须同步更新本根目录下的 `README.md` 列表。
3. **格式一致性**：技能内容应遵循 Gemini CLI / Claude 的标准技能格式（含 `SKILL.md`）。

## 技能列表

### 🧠 agent-memory-sync (跨 Agent 记忆同步专家)
- **功能**：基于 Notion 的多 Agent 记忆同步系统，自动格式化并记录工作进度、决策和坑点。
- **目录**：`agent-memory-sync/`

### 🧾 invoice-organizer-pro (差旅发票整理专家)
- **功能**：PDF 内容识别（酒店/打车/餐饮）、自动重命名、Excel 报销单金额比对、合规性验证。
- **目录**：`invoice-organizer-pro/`

### 🔄 lark-weekly-okr-sync (周报 OKR 同步助手)
- **功能**：从飞书文档提取工作内容并自动同步更新至个人 OKR。
- **目录**：`lark-weekly-okr-sync/`

### 🛠️ lark-cli-helper (飞书 CLI 工具助手)
- **功能**：提供飞书 CLI 的安装、配置、设备流授权及健康检查。
- **目录**：`lark-cli-helper/`

### 📝 lark-doc-reviewer (飞书文档评审助手)
- **功能**：智能解析飞书文档、内置评审模板、精准定点评论。
- **目录**：`lark-doc-reviewer/`

## 部署说明
将对应技能文件夹复制到 Agent 软件指定的技能目录即可。

## 开源协议
MIT License
