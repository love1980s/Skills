---
name: agent-memory-sync
description: Manages cross-agent memory synchronization using the Notion Agent Memory system. Use when you need to record important progress, decisions, or issues, or when you need to catch up on what other agents have done.
---

# Agent Memory Sync

This skill automates interactions with the Notion-based "Agent Memory" system. It ensures all records follow the strict Markdown format required for cross-agent compatibility.

## Core Resources
- **Database ID**: `bbb09e0c-664d-4f56-9e1f-0a99f3ecc8a1`
- **Data Source ID**: `7a5923fa-96c2-4e16-bc60-b2e654bfbe38`
- **Tool**: `ntn` (Notion CLI)

## Workflows

### 1. Check for Updates
Before starting a complex task, check if other agents have left relevant notes.
```bash
ntn datasources query 7a5923fa-96c2-4e16-bc60-b2e654bfbe38 --limit 10
```

### 2. Read a Specific Record
```bash
ntn pages get <page-id>
```

### 3. Record a Memory
Use the bundled script to format the record correctly, then pipe it to `ntn`.

```bash
# Example
CONTENT=$(node ./scripts/format_record.cjs "Docker Config Done" "config" "docker,infra" "Synced Docker config for NAS" "Details about the SSH setup...")
ntn pages create --parent "database:bbb09e0c-664d-4f56-9e1f-0a99f3ecc8a1" --content "$CONTENT"
```

## Format Specification
For details on fields and types, see [references/FORMAT.md](references/FORMAT.md).

### Metadata Definitions
- **agent-name**: `claude-code`, `gemini-cli`, `openclaw`, etc.
- **device-name**: `mac-mini`, `windows-pc`, `synology`, etc.
- **type**: `summary`, `decision`, `issue`, `config`, `progress`.
