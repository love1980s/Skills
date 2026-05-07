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
    
    // 初始化模板目录
    this._initTemplates();
  }

  /**
   * 初始化内置评审模板
   */
  _initTemplates() {
    if (!fs.existsSync(this.templateDir)) {
      fs.mkdirSync(this.templateDir, { recursive: true });
      
      // PRD评审模板
      const prdTemplate = {
        name: 'PRD评审模板',
        description: '产品需求文档评审标准',
        checks: [
          {
            keyword: '需求说明|功能描述',
            comment: '建议补充需求的背景和目标，明确解决什么用户问题。'
          },
          {
            keyword: '用户场景|使用场景',
            comment: '建议补充异常场景和边界场景的处理说明。'
          },
          {
            keyword: '交互流程|操作流程',
            comment: '建议明确交互流程中的异常处理和用户引导逻辑。'
          },
          {
            keyword: '权限|安全',
            comment: '建议补充权限控制和数据安全相关的说明。'
          },
          {
            keyword: '性能|兼容性',
            comment: '建议明确性能指标要求和兼容性范围。'
          }
        ]
      };
      
      fs.writeFileSync(
        path.join(this.templateDir, 'prd.json'),
        JSON.stringify(prdTemplate, null, 2)
      );
      
      // 技术方案评审模板
      const techTemplate = {
        name: '技术方案评审模板',
        description: '技术设计方案评审标准',
        checks: [
          {
            keyword: '架构设计|系统架构',
            comment: '建议评估架构的可扩展性和可维护性。'
          },
          {
            keyword: '技术选型|技术栈',
            comment: '建议说明技术选型的依据和优缺点对比。'
          },
          {
            keyword: '数据结构|数据库',
            comment: '建议评估数据结构设计的合理性和查询性能。'
          },
          {
            keyword: '安全|权限',
            comment: '建议补充安全风险评估和防护措施。'
          },
          {
            keyword: '性能|优化',
            comment: '建议补充性能指标和优化方案。'
          }
        ]
      };
      
      fs.writeFileSync(
        path.join(this.templateDir, 'tech.json'),
        JSON.stringify(techTemplate, null, 2)
      );
    }
  }

  /**
   * 检查依赖是否就绪
   * @returns {boolean} 是否就绪
   */
  isReady() {
    if (!this.larkHelper.isInstalled()) {
      return false;
    }
    
    const status = this.larkHelper.getStatus();
    return status.ok;
  }

  /**
   * 获取文档内容
   * @param {string} docUrl 文档URL
   * @returns {object} 文档内容
   */
  async getDocument(docUrl) {
    const result = this.larkHelper.execute(`docs +fetch --doc "${docUrl}"`);
    if (!result.ok) {
      throw new Error(`获取文档失败：${result.error}`);
    }
    return result.data;
  }

  /**
   * 加载评审模板
   * @param {string} templateName 模板名称
   * @returns {object} 模板内容
   */
  loadTemplate(templateName = 'prd') {
    const templatePath = path.join(this.templateDir, `${templateName}.json`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板不存在：${templateName}`);
    }
    return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  }

  /**
   * 添加定点评论
   * @param {string} docUrl 文档URL
   * @param {string} keyword 要匹配的关键词
   * @param {string} comment 评论内容
   * @returns {object} 评论结果
   */
  async addComment(docUrl, keyword, comment) {
    const fullComment = `${comment}${this.commentSuffix ? ` ${this.commentSuffix}` : ''}`;
    const content = JSON.stringify([{
      type: 'text',
      text: fullComment
    }]);
    
    const cmd = `drive +add-comment --doc "${docUrl}" --selection-with-ellipsis "${keyword}" --content '${content}'`;
    const result = this.larkHelper.execute(cmd);
    
    return result;
  }

  /**
   * 智能评审文档
   * @param {string} docUrl 文档URL
   * @param {string} templateName 模板名称
   * @returns {object} 评审结果
   */
  async reviewDocument(docUrl, templateName = 'prd') {
    // 检查依赖
    if (!this.isReady()) {
      throw new Error('飞书CLI未配置，请先运行"配置飞书"完成初始化');
    }

    // 获取文档内容
    const doc = await this.getDocument(docUrl);
    const content = doc.markdown || '';
    
    // 加载模板
    const template = this.loadTemplate(templateName);
    
    // 匹配关键词并添加评论
    const results = [];
    for (const check of template.checks) {
      const regex = new RegExp(check.keyword, 'i');
      const match = content.match(regex);
      
      if (match) {
        try {
          const commentResult = await this.addComment(docUrl, match[0], check.comment);
          results.push({
            keyword: match[0],
            comment: check.comment,
            success: commentResult.ok,
            commentId: commentResult.data?.comment_id
          });
        } catch (e) {
          results.push({
            keyword: match[0],
            comment: check.comment,
            success: false,
            error: e.message
          });
        }
      }
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      ok: true,
      docTitle: doc.title,
      template: template.name,
      totalComments: results.length,
      successCount,
      failCount,
      comments: results
    };
  }

  /**
   * 获取文档评论列表
   * @param {string} docUrl 文档URL
   * @returns {object} 评论列表
   */
  async getComments(docUrl) {
    // 先解析文档token
    const docResult = this.larkHelper.execute(`drive +add-comment --doc "${docUrl}" --dry-run`);
    if (!docResult.ok) {
      throw new Error('解析文档失败');
    }
    
    const fileToken = docResult.data?.file_token;
    const fileType = docResult.data?.file_type || 'docx';
    
    const result = this.larkHelper.execute(`drive file.comments list --params '{"file_token": "${fileToken}", "file_type": "${fileType}"}'`);
    return result;
  }

  /**
   * 设置评论后缀
   * @param {string} suffix 后缀内容
   */
  setCommentSuffix(suffix) {
    this.commentSuffix = suffix;
  }

  /**
   * 添加自定义评审模板
   * @param {string} name 模板名称
   * @param {object} template 模板内容
   */
  addTemplate(name, template) {
    const templatePath = path.join(this.templateDir, `${name}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
  }
}

module.exports = new LarkDocReviewer();
