# Lark Doc Reviewer Skill

飞书文档智能评审助手，用于读取飞书 Doc/Wiki、生成定点评论计划，并在用户确认后写入评论。

## 功能特性

- 支持 PRD、技术方案、通用文档评审模板。
- 默认两阶段执行：先生成评论计划，再确认写入。
- 使用 v2 文档读取命令，保留标题和结构上下文。
- 评论 payload 保持 JSON 数组形状；PowerShell 下必要时直接调用 CLI 的 node runner，避免 `.cmd` 转发破坏 JSON 引号。
- 表格内评论支持先定位 docx block，再用 `--block-id` 写入。
- 写入后读取评论列表做验证报告。

## 使用方法

### 生成评论计划

```js
const reviewer = require('./index');

const plan = await reviewer.reviewDocument('https://xxx.feishu.cn/wiki/xxx', 'prd');
console.log(plan.candidates);
```

默认不会写评论。计划中每条候选包含：

- `checkId`
- `category`
- `comment`
- `anchorText`
- `headingPath`
- `contextBefore`
- `contextAfter`
- `confidence`
- `status`

### 用户确认后写入

```js
const result = await reviewer.reviewDocument('https://xxx.feishu.cn/wiki/xxx', 'prd', {
  confirmed: true
});
console.log(result.comments);
```

低置信度或无法定位的评论默认跳过。若用户明确批准，也可以传：

```js
const result = await reviewer.writeConfirmedComments(docUrl, plan, {
  includeLowConfidence: true
});
```

## 模板

模板目录：

```text
~/.openclaw/config/lark-review-templates/
```

模板示例：

```json
{
  "name": "自定义模板",
  "description": "我的自定义评审标准",
  "checks": [
    {
      "id": "custom-risk",
      "category": "风险",
      "keyword": "风险|阻塞|待决策",
      "comment": "建议补充风险影响、负责人和下一步处理方案。"
    }
  ]
}
```

## 飞书操作原则

- 写评论前必须检查 `lark-cli auth status --verify`。
- 第一阶段不得调用 `drive +add-comment`。
- Wiki 长文档优先按 outline/section 缩小范围。
- 重复关键词、泛关键词、富媒体附近内容都要标为低置信度。
- 表格和嵌套列表里的文本，优先使用 docx block id，不要依赖自动文本定位。
- 写入后必须验证评论列表，不只依赖写入命令返回值。

更多细节见 `references/feishu_doc_review_workflow.md`。
