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
- **功能**：从飞书文档提取团队周报，生成确认单，并在用户确认后按 KR 视角同步到个人 OKR；支持原生 OKR Block 的轻量第二阶段更新，强调版本节点、硬数据、风险阻塞、评测状态和图片/引用证据。
- **目录**：`lark-weekly-okr-sync/`

### 🛠️ lark-cli-helper (飞书 CLI 工具助手)
- **功能**：提供飞书 CLI 的安装、配置、设备流授权及健康检查。
- **目录**：`lark-cli-helper/`

### 📝 lark-doc-reviewer (飞书文档评审助手)
- **功能**：两阶段评审飞书 Doc/Wiki/PRD，先生成可核对的评论计划，确认后再写入定点评论并验证；支持 docx block 定位、表格内评论、评论来源后缀。
- **目录**：`lark-doc-reviewer/`

### 📡 claw-skill-monitor (Claw Skill 全网监控日报)
- **功能**：监控 OpenClaw/ClawHub Skill 公开信号，整合 Bing/news、ai-bot.cn 与 ClawHub 新上线数据，过滤 C 端场景并生成 JSON、文本和 HTML 日报；V2 backlog 已记录媒体源扩展、短视频平台监控与 Skill Gallery 状态识别。
- **目录**：`claw-skill-monitor/`

### 🔥 aihot (AI HOT 中文 AI 资讯查询)
- **功能**：从 aihot.virxact.com 免 API key 实时获取并自动整理精选的模型/产品/行业/论文/技巧动态为中文资讯简报。
- **目录**：`aihot/`

## 部署说明
将对应技能文件夹复制到 Agent 软件指定的技能目录即可。

## 开源协议
MIT License
