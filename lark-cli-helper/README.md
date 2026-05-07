# Lark CLI Helper Skill for OpenClaw

飞书CLI工具助手，为OpenClaw提供飞书CLI的安装、配置、授权等基础能力。

## 功能特性
- 🚀 一键安装最新版本飞书CLI
- 🔒 安全的应用凭证配置流程
- 📱 设备流授权，支持扫码登录
- ✅ 自动健康检查和问题诊断
- 🔌 标准化API接口，方便其他Skill调用

## 安装
```bash
openclaw skill add lark-cli-helper
```

## 使用方法
### 基础使用
直接在对话中触发关键词即可：
- "安装飞书CLI"
- "配置飞书账号"
- "检查飞书配置状态"

### 作为依赖调用
其他Skill可以通过以下方式调用：
```javascript
const larkHelper = require('lark-cli-helper');

// 检查是否已安装
if (!larkHelper.isInstalled()) {
  await larkHelper.install();
}

// 配置应用
larkHelper.configure(appId, appSecret);

// 发起授权
const authInfo = await larkHelper.authorize();
console.log(`请打开链接授权：${authInfo.verificationUrl}，验证码：${authInfo.userCode}`);

// 执行命令
const result = larkHelper.execute('docs +fetch --doc "https://xxx.feishu.cn/wiki/xxx"');
```

## 配置说明
配置文件默认存储在 `~/.lark-cli/openclaw/config.json`，包含应用ID和加密后的密钥。

## 安全说明
- App Secret通过标准输入传递，不会出现在进程列表中
- 授权令牌存储在系统密钥链中，不会明文存储
- 所有操作符合飞书开放平台安全规范

## 开源地址
https://github.com/your-repo/lark-cli-helper

## 许可证
MIT
