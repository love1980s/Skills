---
name: claw-skill-monitor
description: Use when monitoring, discovering, ranking, or reporting OpenClaw/ClawHub Skills, generating a daily Skill report, or turning public Skill signals into a shareable HTML digest.
---

# Claw Skill Monitor

## Overview

Use this skill to produce a daily Claw/OpenClaw Skill discovery report. V1 focuses on the current working flow: public web/news signals, ai-bot.cn keyword hits, ClawHub newest skills, C-end filtering, and a shareable HTML report matching the established Tianxi daily report format.

## Requirements

Before running or changing the monitor, read `references/requirements.md`. It defines the V1 scope, V2 backlog, grouping rules, and quality bar.

## V1 Workflow

1. Run the bundled script from this skill directory or pass an explicit output directory:

```powershell
python .\scripts\skill_monitor.py --output-dir "C:\path\to\report"
```

2. If network access is restricted, rerun with normal network permissions. The script needs Bing, ai-bot.cn, and ClawHub API access.

3. Outputs are:

- `skill_discovery_YYYY-MM-DD.json`
- `skill_report_YYYY-MM-DD.txt`
- `skill_report_YYYY-MM-DD.html`

4. To regenerate only the HTML from an existing JSON:

```powershell
python .\scripts\skill_monitor.py --input-json "C:\path\skill_discovery_YYYY-MM-DD.json" --html-only
```

## Report Rules

- Publish confirmed ClawHub Skill pages first.
- Keep unconfirmed news/article hits out of the HTML report unless explicitly requested.
- Group output as:
  - Media Hot Skill
  - ai-bot.cn discoveries
  - ClawHub newest C-end selected
- Prefer C-end daily-use skills. Filter obvious B-end/devops/seller/developer-only tools.
- Keep the HTML style consistent with the Tianxi blue hero + card grid report.

## Common Issues

- If a command returns zero results in a sandbox, retry with network permission before judging the monitor.
- If Bing returns generic “Skill” articles, treat them as leads, not confirmed report items.
- If ClawHub API shape changes, inspect `scripts/skill_monitor.py` around `clawhub_newest()` and `clawhub_search()`.
