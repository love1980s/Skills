# @Mention 与 OKR Block 写入细节

按需加载本文件，不要在阶段一开始就展开所有细节。

## 一、@Mention 正确写法

### 结论

- 正确 XML 写法：`<cite type="user" user-id="ou_xxx"></cite>`
- 原生 docx block 表现：`mention_user`
- 错误写法：`<mention-user id="ou_xxx"/>`

`<mention-user id="..."/>` 会在 `docs +create --doc-format markdown` 中变成普通文本，用户会看到 `姓名 <mention-user id="..."/>`，不是蓝色 @ 人。

### 写入前校验

```bash
lark-cli contact +get-user --as user --user-id <open_id> --user-id-type open_id --format json
```

校验通过后才允许写 XML cite：

```xml
<p>协同人：<cite type="user" user-id="ou_xxx"></cite></p>
<h4><cite type="user" user-id="ou_xxx"></cite></h4>
```

如果只能用 Markdown 创建确认单：

```markdown
#### **姓名**
```

不要附加任何 `<mention-user .../>` 文本。

### 验证方式

写入后用原生 block API 抽查：

```bash
lark-cli api GET "/open-apis/docx/v1/documents/<doc_id>/blocks" --as user --page-all \
  --jq '.data.items[] | select(.heading4.elements[]? | has("mention_user"))'
```

能看到 `mention_user.user_id` 才表示是真正 @Mention。

## 二、OKR Block Progress 区写入

用户手动插入 OKR Block 后，读取 docx block tree：

```bash
lark-cli api GET "/open-apis/docx/v1/documents/<doc_id>/blocks" --as user --page-all --format json
```

关键结构：

- `block_type=37`：Objective
- `block_type=38`：Key Result
- `block_type=39`：KR/Objective 后面的 progress 区
- `block_type=2`：progress 区内部空文本锚点

写入步骤：

1. 找到每个 `block_type=38` 的 KR。
2. 读取该 KR 的 `children[0]`，通常是 progress block (`block_type=39`)。
3. 读取 progress block 的 `children[0]`，通常是空文本锚点 (`block_type=2`)。
4. 对这个空文本锚点执行 `block_insert_after`。

示例：

```bash
lark-cli docs +update --as user --api-version v2 \
  --doc "<确认单URL>" \
  --command block_insert_after \
  --block-id "<progress_text_anchor_block_id>" \
  --content @./kr_progress.xml
```

这只更新确认单里的 OKR Block UI，不等于后端 OKR 进展写入。后端写入仍必须使用 `okr +progress-create`，且只能在用户明确确认后执行。

## 三、已踩坑点

- 不要在 Markdown 确认单里写 `<mention-user id="..."/>`。
- 不要用 `str_replace` 试图批量清理已被拆成多个 text run 的 mention 字面量；命中率不稳定。
- 不要 append 到 `block_type=39` 本身；要先找到其内部空文本块作为锚点。
- `docs +fetch` 对 OKR Block 富内容展开不完整；验证 OKR Block 写入要用原生 docx block API。
