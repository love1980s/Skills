# Agent Memory Record Format

Every record must follow this Markdown structure:

# <标题>

## 元信息
- 来源: <agent-name> @ <device-name>
- 类型: <type>
- 标签: <tag1>, <tag2>
- 时间: <YYYY-MM-DD>

## 摘要
<一段话概括关键信息，其他 Agent 通过此段快速判断是否需要读详情>

## 详情
<具体内容：命令、路径、配置、注意事项等>

### Field Definitions

- **agent-name**: `claude-code`, `gemini-cli`, `openclaw`, etc.
- **device-name**: `mac-mini`, `windows-pc`, `synology`, etc.
- **type**:
    - `summary`: Task completion summary.
    - `decision`: Important technical decisions.
    - `issue`: Bugs, "gotchas", or non-obvious notes.
    - `config`: Environment/tool configuration changes.
    - `progress`: Incremental task updates.
- **tags**: comma-separated keywords (e.g., `docker, infra, dev`).
