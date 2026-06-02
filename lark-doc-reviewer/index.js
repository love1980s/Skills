/**
 * Lark Doc Reviewer Skill
 * 飞书文档智能评审助手
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class LarkDocReviewer {
  constructor() {
    this.larkHelper = require('lark-cli-helper');
    this.templateDir = path.join(os.homedir(), '.openclaw', 'config', 'lark-review-templates');
    this.commentSuffix = '来自天禧Claw';
    this.workspaceTmpDir = path.join(process.cwd(), '.lark-doc-reviewer-tmp');

    try {
      this._initTemplates();
    } catch (error) {
      if (!['EACCES', 'EPERM'].includes(error.code)) {
        throw error;
      }

      this.templateDir = path.join(this.workspaceTmpDir, 'templates');
      this._initTemplates();
    }
  }

  _initTemplates() {
    if (!fs.existsSync(this.templateDir)) {
      fs.mkdirSync(this.templateDir, { recursive: true });

      const prdTemplate = {
        name: 'PRD评审模板',
        description: '产品需求文档评审标准',
        checks: [
          {
            id: 'prd-background',
            category: '需求完整性',
            keyword: '需求说明|功能描述|背景|目标',
            comment: '建议补充需求背景、目标和要解决的用户问题。'
          },
          {
            id: 'prd-scenarios',
            category: '用户场景',
            keyword: '用户场景|使用场景|业务场景',
            comment: '建议补充主流程之外的异常场景和边界场景。'
          },
          {
            id: 'prd-flow',
            category: '交互逻辑',
            keyword: '交互流程|操作流程|流程',
            comment: '建议明确关键交互节点、异常处理和用户引导逻辑。'
          },
          {
            id: 'prd-security',
            category: '权限与安全',
            keyword: '权限|安全',
            comment: '建议补充权限控制、数据安全和角色边界说明。'
          },
          {
            id: 'prd-performance',
            category: '性能兼容',
            keyword: '性能|兼容性',
            comment: '建议明确性能指标、兼容范围和验收标准。'
          }
        ]
      };

      const techTemplate = {
        name: '技术方案评审模板',
        description: '技术设计方案评审标准',
        checks: [
          {
            id: 'tech-architecture',
            category: '架构设计',
            keyword: '架构设计|系统架构',
            comment: '建议评估架构的扩展性、可维护性和边界划分。'
          },
          {
            id: 'tech-selection',
            category: '技术选型',
            keyword: '技术选型|技术栈',
            comment: '建议说明技术选型依据、替代方案和取舍。'
          },
          {
            id: 'tech-data',
            category: '数据设计',
            keyword: '数据结构|数据库|数据模型',
            comment: '建议补充数据结构设计、索引和查询性能考虑。'
          },
          {
            id: 'tech-security',
            category: '安全性',
            keyword: '安全|权限',
            comment: '建议补充安全风险评估和防护措施。'
          },
          {
            id: 'tech-performance',
            category: '性能优化',
            keyword: '性能|优化',
            comment: '建议补充性能指标、容量预估和优化方案。'
          }
        ]
      };

      fs.writeFileSync(
        path.join(this.templateDir, 'prd.json'),
        JSON.stringify(prdTemplate, null, 2),
        'utf8'
      );
      fs.writeFileSync(
        path.join(this.templateDir, 'tech.json'),
        JSON.stringify(techTemplate, null, 2),
        'utf8'
      );
    }
  }

  isReady() {
    if (!this.larkHelper.isInstalled()) {
      return false;
    }

    const status = this.larkHelper.getStatus();
    return Boolean(status && status.ok);
  }

  getAuthStatus() {
    return this.larkHelper.execute('auth status --verify');
  }

  async getDocument(docUrl) {
    const result = this.larkHelper.execute(
      `docs +fetch --as user --api-version v2 --doc "${this._escapeArg(docUrl)}" --format json`
    );
    if (!result.ok) {
      throw new Error(`获取文档失败：${result.error}`);
    }
    return result.data || result;
  }

  loadTemplate(templateName = 'prd') {
    const templatePath = path.join(this.templateDir, `${templateName}.json`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板不存在：${templateName}`);
    }
    return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  }

  async createReviewPlan(docUrl, templateName = 'prd') {
    if (!this.isReady()) {
      throw new Error('飞书CLI未配置，请先运行"配置飞书"完成初始化');
    }

    const authStatus = this.getAuthStatus();
    if (!authStatus.ok) {
      throw new Error(`飞书CLI授权状态异常：${authStatus.error || 'unknown error'}`);
    }

    const doc = await this.getDocument(docUrl);
    const template = this.loadTemplate(templateName);
    const content = this._extractText(doc);
    const headingPath = this._extractHeadingPath(content);
    const candidates = [];

    for (const check of template.checks) {
      const matches = this._findMatches(content, check.keyword);

      if (matches.length === 0) {
        candidates.push(this._buildMissingCandidate(check));
        continue;
      }

      for (const match of matches) {
        const confidence = this._scoreConfidence(match.text, matches.length);
        candidates.push({
          checkId: check.id || this._slug(check.category || check.keyword),
          category: check.category || template.name,
          comment: check.comment,
          anchorText: match.text,
          headingPath,
          contextBefore: match.before,
          contextAfter: match.after,
          confidence,
          status: confidence === 'low' ? 'needs_manual_anchor' : 'ready'
        });
      }
    }

    return {
      ok: true,
      mode: 'plan',
      docTitle: this._extractTitle(doc),
      docUrl,
      template: template.name,
      authVerified: true,
      totalCandidates: candidates.length,
      readyCount: candidates.filter((item) => item.status === 'ready').length,
      manualAnchorCount: candidates.filter((item) => item.status === 'needs_manual_anchor').length,
      candidates
    };
  }

  /**
   * Backward-compatible entry. By default this now returns a review plan.
   * Pass { confirmed: true } only after the user approves the plan.
   */
  async reviewDocument(docUrl, templateName = 'prd', options = {}) {
    const plan = await this.createReviewPlan(docUrl, templateName);
    if (!options.confirmed) {
      return plan;
    }

    return this.writeConfirmedComments(docUrl, plan, options);
  }

  async writeConfirmedComments(docUrl, plan, options = {}) {
    if (!plan || !Array.isArray(plan.candidates)) {
      throw new Error('缺少评论计划，不能写入评论');
    }

    const includeLowConfidence = Boolean(options.includeLowConfidence);
    const writableCandidates = plan.candidates.filter((candidate) => {
      if (!candidate.anchorText || !candidate.anchorText.trim()) {
        return false;
      }
      if (candidate.status === 'ready') {
        return true;
      }
      return includeLowConfidence && candidate.status === 'needs_manual_anchor';
    });

    const comments = [];
    for (const candidate of writableCandidates) {
      const result = await this.addComment(docUrl, candidate.anchorText, candidate.comment);
      comments.push({
        checkId: candidate.checkId,
        category: candidate.category,
        anchorText: candidate.anchorText,
        success: Boolean(result.ok),
        commentId: result.data?.comment_id,
        error: result.ok ? undefined : result.error
      });
    }

    const verification = await this.verifyComments(docUrl).catch((error) => ({
      ok: false,
      error: error.message
    }));

    return {
      ok: comments.every((comment) => comment.success),
      mode: 'write',
      docTitle: plan.docTitle,
      template: plan.template,
      totalComments: comments.length,
      successCount: comments.filter((comment) => comment.success).length,
      failCount: comments.filter((comment) => !comment.success).length,
      skippedCount: plan.candidates.length - comments.length,
      comments,
      verification
    };
  }

  async addComment(docUrl, anchorText, comment, options = {}) {
    if (!options.blockId && (!anchorText || !anchorText.trim())) {
      throw new Error('缺少评论锚点或 blockId，不能写入定点评论');
    }

    const fullComment = `${comment}${this.commentSuffix ? ` ${this.commentSuffix}` : ''}`;
    const content = JSON.stringify([
      {
        type: 'text',
        text: fullComment
      }
    ]);

    const cmdParts = [
      'drive +add-comment',
      '--as user',
      `--doc "${this._escapeArg(docUrl)}"`
    ];

    if (options.blockId) {
      cmdParts.push(`--block-id "${this._escapeArg(options.blockId)}"`);
    } else {
      cmdParts.push(`--selection-with-ellipsis "${this._escapeArg(anchorText)}"`);
    }
    cmdParts.push(`--content '${this._escapeSingleQuotedArg(content)}'`);

    return this.larkHelper.execute(cmdParts.join(' '));
  }

  async verifyComments(docUrl) {
    const docResult = this.larkHelper.execute(
      `drive +add-comment --as user --doc "${this._escapeArg(docUrl)}" --dry-run`
    );
    if (!docResult.ok) {
      throw new Error('解析文档失败');
    }

    const fileToken = docResult.data?.file_token;
    const fileType = docResult.data?.file_type || 'docx';
    if (!fileToken) {
      throw new Error('未能解析 file_token');
    }

    const paramsPath = this._writeJsonPayload('comments-list-params', {
      file_token: fileToken,
      file_type: fileType
    });

    return this.larkHelper.execute(`drive file.comments list --as user --params @${paramsPath}`);
  }

  async getComments(docUrl) {
    return this.verifyComments(docUrl);
  }

  setCommentSuffix(suffix) {
    this.commentSuffix = suffix;
  }

  addTemplate(name, template) {
    const templatePath = path.join(this.templateDir, `${name}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf8');
  }

  _extractText(doc) {
    const candidates = [
      doc.markdown,
      doc.content,
      doc.text,
      doc.data?.markdown,
      doc.data?.content,
      doc.data?.text
    ];
    const text = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
    return text || JSON.stringify(doc);
  }

  _extractTitle(doc) {
    return doc.title || doc.data?.title || doc.document?.title || '未命名文档';
  }

  _extractHeadingPath(content) {
    const headings = String(content)
      .split(/\r?\n/)
      .filter((line) => /^#{1,6}\s+/.test(line.trim()))
      .slice(0, 3)
      .map((line) => line.replace(/^#{1,6}\s+/, '').trim());

    return headings.length > 0 ? headings.join(' > ') : '';
  }

  _findMatches(content, keyword) {
    const matches = [];
    const source = String(content || '');
    const regex = new RegExp(keyword, 'gi');
    let match;

    while ((match = regex.exec(source)) !== null) {
      const start = Math.max(0, match.index - 80);
      const end = Math.min(source.length, match.index + match[0].length + 80);
      matches.push({
        text: match[0],
        before: source.slice(start, match.index).trim(),
        after: source.slice(match.index + match[0].length, end).trim()
      });

      if (match[0].length === 0) {
        regex.lastIndex += 1;
      }
    }

    return matches;
  }

  _buildMissingCandidate(check) {
    return {
      checkId: check.id || this._slug(check.category || check.keyword),
      category: check.category || '通用检查',
      comment: check.comment,
      anchorText: '',
      headingPath: '',
      contextBefore: '',
      contextAfter: '',
      confidence: 'low',
      status: 'needs_manual_anchor',
      reason: '未匹配到可用锚点'
    };
  }

  _scoreConfidence(anchorText, occurrenceCount) {
    const genericTerms = new Set(['权限', '安全', '性能', '流程', '优化', '背景', '目标']);
    if (occurrenceCount !== 1) {
      return 'low';
    }
    if (genericTerms.has(anchorText.trim())) {
      return 'low';
    }
    if (anchorText.trim().length <= 2) {
      return 'low';
    }
    return anchorText.trim().length <= 4 ? 'medium' : 'high';
  }

  _writeJsonPayload(prefix, data) {
    if (!fs.existsSync(this.workspaceTmpDir)) {
      fs.mkdirSync(this.workspaceTmpDir, { recursive: true });
    }

    const filename = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
    const fullPath = path.join(this.workspaceTmpDir, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');

    return path.join('.lark-doc-reviewer-tmp', filename).replace(/\\/g, '/');
  }

  _escapeArg(value) {
    return String(value).replace(/"/g, '\\"');
  }

  _escapeSingleQuotedArg(value) {
    return String(value).replace(/'/g, "''");
  }

  _slug(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'check';
  }
}

module.exports = new LarkDocReviewer();
