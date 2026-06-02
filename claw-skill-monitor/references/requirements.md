# Claw Skill Monitor Requirements

## Goal

Create a reusable Skill that helps agents monitor the public Skill ecosystem, discover useful OpenClaw/ClawHub Skills, and generate a daily Tianxi-style report.

## V1 Requirements

- Collect signals from:
  - Bing/web search with Skill/OpenClaw/ClawHub keywords.
  - ai-bot.cn daily AI news page.
  - ClawHub newest API.
- Enrich candidate items through ClawHub search when possible.
- Filter obvious B-end, devops, seller-only, and developer-only tools.
- Prefer C-end user scenarios such as reading, social, local services, travel, weather, content creation, documents, finance, music, family, and daily productivity.
- Generate three outputs:
  - JSON data file for audit and re-rendering.
  - Text report for quick terminal review.
  - HTML report matching the established Tianxi report format.
- HTML report groups:
  - Media Hot Skill: confirmed ClawHub Skills found through web/news signals.
  - ai-bot.cn Discoveries: ai-bot.cn hits, kept as a separate source group.
  - ClawHub Newest: recent ClawHub Skills after C-end filtering.
- Avoid publishing unconfirmed generic Skill articles in the HTML report by default.
- Keep unconfirmed leads in JSON diagnostics where useful.

## V1 Non-Goals

- No deep scraping of WeChat official accounts, video platforms, or creator feeds.
- No automatic Skill Gallery version/state comparison.
- No fully automated relevance judgment by LLM unless the running agent adds one manually.
- No production scheduler or notification delivery.

## V2 Backlog

### 1. Monitoring Range

- Add broader media sources:
  - WeChat official accounts.
  - Web media.
  - Independent creator/blogger feeds.
- Add short-video platforms:
  - Bilibili.
  - Douyin.
  - WeChat Channels.
- Treat difficult sources incrementally:
  - Start with manually configured source lists.
  - Add source-specific adapters one by one.
  - Track unsupported or blocked sources as diagnostics instead of failing the whole run.

### 2. Tianxi Claw Skill Gallery Integration

- Check whether Skill Gallery already contains each discovered Skill.
- Classify state:
  - Same version.
  - Recently updated.
  - Brand new.
  - Old Skill newly active again.
- Record Gallery evidence:
  - Skill id/slug.
  - Current version or update timestamp.
  - Prior known state if available.
  - Reason for classification.

## Quality Bar

- A daily HTML report should be readable without opening the JSON.
- Every published card should have a name, URL, summary, source, and reason.
- Prefer fewer high-confidence cards over a noisy long list.
- Diagnostics should explain skipped sources or suspiciously empty results.
