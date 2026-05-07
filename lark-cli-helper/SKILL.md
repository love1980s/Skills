# Lark CLI Helper Skill

飞书CLI工具助手，提供飞书CLI的安装、配置、授权等基础能力。

## 功能描述
- 自动从官方仓库获取最新安装脚本，跨平台安装飞书CLI
- 交互式引导用户配置App ID和App Secret
- 自动完成设备流授权，支持令牌自动续期
- 健康检查功能，一键诊断配置问题
- 提供标准化API供其他Skill调用

## 触发关键词
- 安装飞书CLI
- 配置飞书
- 飞书授权
- 检查飞书配置
- lark-cli初始化

## 依赖
- Node.js & npm (用于安装@larksuite/cli)
- 网络连接 (用于访问飞书开放平台)

## 使用示例
```
用户：帮我安装飞书CLI
AI：好的，正在获取最新安装脚本...
AI：✅ 飞书CLI已安装，版本：1.0.24
AI：请输入你的App ID：
用户：cli_a94261f878f8dbb6
AI：请输入你的App Secret：
用户：******
AI：✅ 配置已保存，正在进行授权...
AI：请打开链接完成授权：https://xxx.feishu.cn/xxx 验证码：XXXX-XXXX
AI：✅ 授权完成，所有检查项通过！
```

## API 接口
- `install(): boolean` - 安装最新版本飞书CLI
- `configure(app_id: string, app_secret: string): boolean` - 配置应用凭证
- `authorize(scope: string = 'recommend'): string` - 发起授权，返回授权链接和验证码
- `get_status(): object` - 获取当前配置和授权状态
- `execute(cmd: string): object` - 执行飞书CLI命令，返回结构化结果
