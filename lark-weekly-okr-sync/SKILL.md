---
name: lark-weekly-okr-sync
description: 周报汇总与个人 OKR 进展同步。当需要从团队周报、周会记录或飞书文档中提炼成员工作，并在用户确认后同步到当前登录用户自己的 OKR/KR 进展时使用。
---

# lark-weekly-okr-sync

## 核心原则

这个 Skill 只更新**当前 lark-cli 登录用户自己的 OKR**。团队成员的周报内容是输入材料，最终 OKR 更新必须站在项目、Objective、Key Result 的视角总结进展、风险和变化，不按成员逐条搬运。

工作流分成两个大阶段：

1. **周报提炼确认**：提炼最新一周团队周报，保持原二级标题大组和成员顺序，生成确认单并暂停。
2. **OKR 更新执行**：用户在确认单中手动插入 OKR Block、检查并改写周报摘要后，再读取确认单，按 KR 视角正式写入 OKR。

阶段一绝对禁止调用 `lark-cli okr +progress-create`。

## 渐进式加载要求

这个流程较复杂，不要一次性展开所有细节。按当前阶段只读取必要 reference：

- 生成确认单前：读取 `references/user_mapping.md` 和 `references/mention_and_okr_block.md` 的 @Mention 章节。
- 用户插入 OKR Block 后：再读取 `references/mention_and_okr_block.md` 的 OKR Block 章节。
- 只有需要修改模板结构时，才读取 `references/confirmation_template.md`。

## Token 与耗时控制

第二阶段默认走**轻量 OKR Block 更新路径**。目标是在确认单中已有 OKR Block 和 KR 提纲时，避免全量展开整篇文档、避免把大型 block tree 带入上下文。

- 先用 `docs +fetch` 读取确认单正文，确认周报摘要和 OKR Block 存在；不要把普通 fetch 当作 OKR Block 内容验证依据，因为它通常只显示 `<okr></okr>`。
- 读取原生 block tree 时，优先保存到本地临时 JSON，再用脚本提取“Objective / KR / Progress block / 提纲项 / 空占位 / 锚点”的压缩清单；不要把完整 JSON 粘进上下文或最终答复。
- 如果用户明确要求“仅更新确认单 UI / OKR Block 展示”，不要调用 `okr +progress-list` 或 `okr +progress-create`，也不要展开后端 OKR 写入流程。
- 如果确认单里的每个 KR 已经有进展提纲，按提纲补充内容，不重写整个 KR，不删除原有条目；需要配图、表格、截图时写明确备注，例如 `备注：需补充“用户反馈重点问题表”和相关截图。`
- 验证时只做关键词和少量 KR 抽查；除非定位失败或用户要求，不要再次输出或分析完整 block tree。
- 遇到空列表项 `block_replace` 不生效时，改用 `block_insert_after` 在该空占位或对应提纲项后插入内容，并记录未删除的空占位可能需要人工清理。

## 关键信息提炼标准

第二阶段写入 OKR 时，关键信息不是“听起来像进展的总结”，而是能改变 KR 判断、排期判断、风险判断或下一步决策的信息。宁可少写，也不要用抽象套话填满每个 KR。

优先保留：

- **版本节点**：明确版本号、发布日期、排期窗口、封板时间，例如 `6/18 发布 1.0`、`6/29 发布 1.0.x`、`8/20 左右软件封板`。
- **硬数据**：数量、比例、评测分数、完成比例、入库/上架/通过数，例如 `爬取 skill 370 个，入库 47 个`、`Kimi-k2.6 得分 3.45`。
- **评测状态**：测试环境是否完成、评测集是否补齐、主要失败原因、脚本或链路问题。
- **风险与阻塞**：测试受阻、设备时间不确定、附件缺失、接口限额、模型下线、外部结论未定。
- **决策依赖**：待确认策略、待研究院/研发/Global 对齐事项、影响版本准入的外部变化。
- **证据材料**：原始文档、看板、表格、截图、图片、trace、评测报告；能插入就插入，不能插入就写明确备注。

尽量删除或压缩：

- “持续推进”“继续对齐”“补齐能力”“形成闭环”“真实工作流命中”等没有新事实的抽象表述。
- 仅说明团队很忙、方向正确、后续继续跟进，但没有节点、数据、风险、阻塞或证据的句子。
- 按成员搬运的过程噪声；除非负责人、风险归属或协同关系对 KR 判断有帮助。

### OKR 格式要求

- 先读取并复用 KR 里已有的小标题，例如 `快慢路由`、`记忆、上下文`、`openclaw相关`、`支付相关`、`Claw mini/AI 主机相关`。
- 如果已有标题不足以承载新增内容，按版本或对象新增短标题，例如 `Mini`、`P7`、`Yoga`、`数据飞轮`、`评测平台`。
- 保留上一周已有进展，在对应标题后追加本周内容；不要把旧内容改写成新的长段落。
- 每条尽量短，优先写“事实 + 影响/风险”；一条信息过长时拆成多条。
- 没有关键变化的 KR 写“本周无新增关键变化”或保持不写，不要强行生成泛泛总结。
- 有图、表、看板或引用时，必须放到对应条目旁边；不要集中放到文末，也不要只写“参考原文档”。

## 前置检查

1. 检查 CLI 是否在当前执行环境可用：
   ```bash
   lark-cli auth status
   ```
   如果沙箱中找不到 `lark-cli` 或无法访问 `AppData/Roaming/npm`，改用非沙箱执行，并说明这是执行环境可见性问题。

2. 显式展示当前用户，确认 OKR 主体：
   - `userName`
   - `userOpenId`
   - `identity` 必须为 `user`
   - `tokenStatus` 必须为 `valid`

3. 读取 `references/user_mapping.md`。生成任何 @Mention 前，必须先用通讯录接口校验：
   ```bash
   lark-cli contact +get-user --as user --user-id <open_id> --user-id-type open_id --format json
   ```

## @Mention 规则

**关键坑点：不要使用 `<mention-user id="..."/>`。** 这个写法会在 `docs +create --doc-format markdown` 中被转义成普通文本，用户会看到 `姓名 <mention-user id="..."/>`。

正确方法见 `references/mention_and_okr_block.md`。简要规则：

```bash
lark-cli contact +get-user --as user --user-id <open_id> --user-id-type open_id --format json
```

- 使用前必须校验 open_id 属于当前租户且可用。
- 用 `docs +create/update` 生成飞书文档时，优先使用 XML 格式，@ 人写为 `<cite type="user" user-id="ou_xxx"></cite>`。
- XML `<cite type="user">` 写入后，在原生 docx block 里会表现为 `mention_user`。
- Markdown 确认单不支持可靠生成 @ 人；如必须用 Markdown，只写 `**姓名**`，不要附带任何 mention 标签。
- 如果周报里解析出的姓名/open_id 与 `references/user_mapping.md` 不一致，以通讯录校验结果为准，并更新 mapping。
- 如果无法校验或 ID 失效，仍写 `**姓名**`，并在确认单中标注：`[该成员 @Mention 校验失败，请人工核对]`。

## 阶段一：周报提炼确认

触发条件：用户提供周报/周会/Wiki 文档链接，希望先生成确认单。

### 读取材料

1. 获取当前用户：
   ```bash
   lark-cli auth status
   ```

2. 获取用户 OKR 周期和详情，只用于确认单上下文，不用于本阶段写入：
   ```bash
   lark-cli okr +cycle-list --as user --user-id <userOpenId> --user-id-type open_id --format json
   lark-cli okr +cycle-detail --as user --cycle-id <active_cycle_id> --format json
   ```

3. 读取周报文档：
   ```bash
   lark-cli docs +fetch --as user --api-version v2 --doc "<周报文档URL>" --format json
   ```

4. 只提取最新一周内容。优先使用最新日期标题；如果无法判断最新一周，停止并向用户确认日期范围。

### 提炼规则

目标是把组员写得很细的周报压缩成可检查、可复用的周报摘要。

- 保持原文档的排布逻辑：二级标题是大组，三级标题或成员块是成员；不得为了 OKR 映射重排成员。
- 每个成员保留 2-6 个主要工作要点，聚合重复细节，删除过程噪声。
- 不要在第一阶段按 OKR/KR 打散成员内容。
- 保留重要百分比、日期、里程碑、风险、阻塞、待决策事项。
- 富媒体处理：
  - 表格、图片、画板、附件、外部看板能通过飞书文档能力复用时，尽量插入或保留引用。
  - 不能直接写入时，写成明确占位：`这里需要插入 XXX`，例如 `这里需要插入预装后看板截图`。
  - 不要只写笼统的“有多模态内容无法解析”。

### 确认单结构

确认单必须使用固定结构，可参考 `references/confirmation_template.md`：

```markdown
# 本周 OKR 更新确认单 - YYYY-MM-DD

## 执行信息

## 一、本周周报提炼

## 二、请手动插入 OKR Block

## 三、OKR 更新草稿/执行区

## 四、确认后执行说明
```

第一阶段只填充“执行信息”和“一、本周周报提炼”。“二、请手动插入 OKR Block”必须明确告诉用户：

1. 在该位置手动插入飞书原生 OKR Block。
2. 检查并直接改写第一部分周报摘要。
3. 完成后回复：`确认完毕，执行更新 + [确认单文档URL]`。

创建确认单使用当前 CLI 支持的 v2 参数。默认用 XML，因为 XML 支持 `<cite type="user">`、图片、文档引用等富组件：

```bash
lark-cli docs +create --as user --api-version v2 --content @./okr_confirm.xml
```

只有用户明确要求 Markdown 或已有 `.md` 文件必须导入时，才使用 `--doc-format markdown`；此时禁止输出 `<mention-user .../>`。

创建后必须读取新文档验证：

```bash
lark-cli docs +fetch --as user --api-version v2 --doc "<确认单URL>" --format json
```

验证内容包含：

- 周报摘要
- OKR Block 手动插入说明
- 确认后执行说明
- 成员姓名没有残留字面量 `<mention-user .../>`
- 如果本轮使用 XML，抽查至少一个成员在 docx block tree 中渲染为 `mention_user`

阶段一完成后必须暂停，等待用户确认。

## 阶段二：OKR 更新执行

触发条件：用户回复“确认完毕，执行更新 + [确认单文档URL]”。

### 读取确认单

重新读取确认单，必须以用户修改后的确认单内容为唯一依据：

```bash
lark-cli docs +fetch --as user --api-version v2 --doc "<确认单URL>" --format json
```

如果确认单缺少 OKR Block 或用户未明确确认，停止并提醒用户先完成手动插入和检查。

### 生成 KR 视角进展

第二阶段不要完整粘贴组员内容。应充分理解每个 Objective 和 Key Result，从确认单第一部分的成员周报摘要中整合：

- 已完成的关键进展
- 仍在推进的事项
- 风险、阻塞、待决策
- 指标、百分比、日期或版本节点

可以打乱成员关系，按项目/KR 组织内容。只有当负责人、协作方或风险归属有必要说明时才标注人员；如果不能通过原生 docx block API 写入真正 @Mention，就使用普通姓名，不能输出字面量 `<mention-user .../>`。

每个 KR 都必须处理：

- 有相关进展：写项目视角总结。
- 无相关进展：写“本周未更新”。
- 只有风险无进展：写风险和下一步，不写成完成项。

### 写入 OKR

正式写入前，先把每个 KR 的进展内容整理为 ContentBlock JSON 文件，再执行：

```bash
lark-cli okr +progress-create \
  --as user \
  --target-id "<KR_ID>" \
  --target-type key_result \
  --content @./kr_progress.json \
  --source-title "本周 OKR 更新确认单 - YYYY-MM-DD" \
  --source-url "<确认单URL>"
```

只写 KR，默认不写 Objective。除非用户明确要求，否则不要更新成员个人 OKR。

### 原生 OKR Block 同步

如果确认单中包含飞书原生 OKR Block，并且需要把同样内容写回文档 UI，先读取 `references/mention_and_okr_block.md` 的 OKR Block 章节：

1. 先定位原生 OKR Block (`block_type: 36`) 和 Progress Block (`block_type: 39`)。
2. 不要直接 append 到 Progress Block。
3. 先通过 API 获取 Progress Block children，找到内部空文本块 (`block_type: 2`)。
4. 以该文本块为锚点，使用 `block_insert_after` 或 `block_copy_insert_after`。

如果无法可靠定位锚点，不要强行写 UI；只完成后端 OKR progress 写入，并在结果里说明。

## 安全边界

- 阶段一只允许读取 OKR/周报、创建确认单、验证确认单。
- 阶段一禁止调用 `okr +progress-create`、`okr +progress-update`、`okr +progress-delete`。
- 阶段二必须有用户确认的确认单 URL。
- 每次执行前都必须显示当前 `userName` 和 `userOpenId`。
- 任何身份异常、token 过期、确认单缺失、mapping 校验失败，都先停下来说明，不要猜测写入。
