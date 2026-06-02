# Feishu Doc Review Workflow

## Auth and Fetch

Verify the current user before any write:

```bash
lark-cli auth status --verify
```

Fetch Docs with v2 JSON:

```bash
lark-cli docs +fetch --as user --api-version v2 --doc "<doc_url>" --format json
```

For Wiki URLs, resolve the wiki node to the underlying document before fetching. For long documents, fetch outline first and review one section at a time when the user scoped the request.

Use raw docx blocks when markdown loses structure or when anchors are ambiguous:

```bash
lark-cli api GET "/open-apis/docx/v1/documents/<doc_id>/blocks" --as user --page-all --format json
```

## Anchoring

Build a review plan before writing comments. Each candidate should include:

- `checkId`: stable id from the template check.
- `category`: PRD, technical design, or general.
- `anchorText`: short visible text selected from the document.
- `headingPath`: nearest heading hierarchy.
- `contextBefore` and `contextAfter`: small snippets to disambiguate repeated text.
- `confidence`: `high`, `medium`, or `low`.
- `status`: `ready`, `needs_manual_anchor`, or `skip`.

Treat these as low confidence:

- Generic words such as `权限`, `安全`, `性能`, `流程`.
- Text that appears more than once.
- Matches found only in headings when the comment is about body content.
- Content inside tables, images, or widgets when no visible text anchor is available.

Do not auto-write low-confidence comments unless the user explicitly approves them.

## Write and Verify

Prepare comment payloads as JSON arrays:

```json
[
  {
    "type": "text",
    "text": "这里写评审建议。 来自天禧Claw"
  }
]
```

Then add the comment. `drive +add-comment --content` expects inline JSON; it does not currently accept `@file`:

```bash
lark-cli drive +add-comment --as user --doc "<doc_url>" --selection-with-ellipsis "<anchor_text>" --content '[{"type":"text","text":"... 来自天禧Claw"}]'
```

On Windows PowerShell, `lark-cli.cmd` can strip JSON quotes when forwarding `%*`. If inline JSON fails, call the node runner directly with an argument array:

```powershell
$runner = "$env:APPDATA\npm\node_modules\@larksuite\cli\scripts\run.js"
$content = Get-Content -Path .\comment_payload.json -Raw -Encoding UTF8
& node $runner drive +add-comment --as user --doc $doc --block-id $blockId --content $content
```

For content inside tables or nested blocks, automatic `--selection-with-ellipsis` may resolve to a table block that cannot receive comments. Inspect docx blocks and write to the concrete text/list block:

```bash
lark-cli api GET "/open-apis/docx/v1/documents/<doc_id>/blocks" --as user --page-all --format json
lark-cli drive +add-comment --as user --doc "<doc_url>" --block-id "<text_or_list_block_id>" --content '[{"type":"text","text":"... 来自天禧Claw"}]'
```

After writes, list comments using inline params or a params file:

```json
{
  "file_token": "<file_token>",
  "file_type": "docx"
}
```

```bash
lark-cli drive file.comments list --as user --params @./comments_list_params.json
```

The final report must show which comments were verified, which failed, and which were intentionally left for manual anchoring.
