# Agent 技能仓库 (Personal Skills)

个人收集和整理的 AI Agent 实用技能仓库，旨在提升多 Agent 环境下的工作效率。支持在 Gemini CLI、Claude Desktop、Cursor 等具备扩展能力的 Agent 软件中快速部署。

## 技能列表

### 🧾 invoice-organizer-pro (差旅发票整理专家)
**最新加入**：智能整理发票并比对报销明细。
- **功能**：PDF 内容识别（酒店/打车/餐饮）、自动重命名、Excel 报销单金额比对、合规性验证。
- **依赖**：Python (scripts/extract_pdf.py)

### 🛠️ lark-cli-helper (飞书CLI工具助手)
飞书CLI工具助手，提供飞书CLI的安装、配置、授权等基础能力。
- **功能**：自动安装飞书CLI、交互式配置应用凭证、设备流授权、健康检查。

### 📝 lark-doc-reviewer (飞书文档评审助手)
飞书文档智能评审助手，自动评审飞书文档并添加定点评论。
- **功能**：智能解析飞书文档、内置多场景评审模板、精准定点评论、自定义评审规则。

## 部署说明

### 手动部署
将对应技能文件夹复制到 Agent 软件指定的技能目录：
- **Gemini CLI**: 放置在项目根目录的 `.gemini/skills/` 文件夹下。
- **其他 Agent**: 根据相应软件的 Skill 加载规则进行路径配置。

## 开源协议
MIT License

