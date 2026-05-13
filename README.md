# 天禧Claw 技能仓库

收集和整理OpenClaw平台的实用技能，提升工作效率。

## 技能列表

### 🛠️ lark-cli-helper (飞书CLI工具助手)
飞书CLI工具助手，提供飞书CLI的安装、配置、授权等基础能力。
- **功能**：自动安装飞书CLI、交互式配置应用凭证、设备流授权、健康检查
- **触发词**：安装飞书CLI、配置飞书、飞书授权、检查飞书配置
- **依赖**：Node.js & npm

### 📝 lark-doc-reviewer (飞书文档评审助手)
飞书文档智能评审助手，自动评审飞书文档并添加定点评论。
- **功能**：智能解析飞书文档、内置多场景评审模板、精准定点评论、自定义评审规则
- **触发词**：评审飞书文档、PRD评审、技术方案评审、给飞书文档加评论
- **依赖**：lark-cli-helper

### 🎯 agent-eval (天禧 Claw Agent 评测工具)
天禧 Claw Agent 标准能力评测工具，自动运行测试集、LLM 自动评分，输出结构化结果表格。
- **功能**：通用评测 Skill（一个覆盖所有 Agent）、内置10题标准测试集（A/B/C三组）、LLM-as-judge 自动评分（Q1-Q4）、输出 Markdown 汇总表格
- **触发词**：`评测 [Agent名称]`，如：`评测 产品经理`、`评测 前端开发工程师`
- **依赖**：无

## 安装使用

### 手动安装
将对应技能文件夹复制到OpenClaw技能目录：
- 全局模式：`~/.openclaw/skills/`
- 工作区模式：`./workspace/skills/`

### 通过ClawHub安装
```bash
# 安装飞书CLI助手
clawhub install lark-cli-helper

# 安装文档评审助手
clawhub install lark-doc-reviewer

# 安装 Agent 评测工具
clawhub install agent-eval
```

## 使用示例

```
用户：帮我安装飞书CLI
AI：好的，正在获取最新安装脚本...
AI：✅ 飞书CLI已安装，请输入App ID和App Secret完成配置...
```

```
用户：帮我评审这篇PRD https://xxx.feishu.cn/wiki/xxx
AI：好的，正在拉取文档并使用PRD模板评审...
AI：✅ 评审完成！共添加了8条定点评论，你可以在文档中查看。
```

```
用户：评测 产品经理
AI：╔══════════════════════════════════════╗
      评测对象：产品经理
      测试集：10题（A组5 / B组3 / C组2）
      评分维度：Q1 Q2 Q3 Q4（各1-5分，满分20分）
    ╚══════════════════════════════════════╝
    输入「开始」运行全部10题...
```

## 开源协议
MIT License
