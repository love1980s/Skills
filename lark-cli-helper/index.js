/**
 * Lark CLI Helper Skill
 * 飞书CLI工具助手
 */

const fs = require('fs');
const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

class LarkCliHelper {
  constructor() {
    this.configDir = path.join(os.homedir(), '.lark-cli', 'openclaw');
    this.configPath = path.join(this.configDir, 'config.json');
  }

  /**
   * 检查是否已安装lark-cli
   * @returns {boolean} 是否已安装
   */
  isInstalled() {
    try {
      execSync('lark-cli --version', { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取已安装版本
   * @returns {string} 版本号
   */
  getVersion() {
    try {
      return execSync('lark-cli --version', { encoding: 'utf8' }).trim();
    } catch (e) {
      return null;
    }
  }

  /**
   * 安装最新版本lark-cli
   * @returns {Promise<boolean>} 安装是否成功
   */
  async install() {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '-g', '@larksuite/cli'], {
        stdio: 'inherit'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`安装失败，退出码：${code}`));
        }
      });

      npm.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * 配置应用凭证
   * @param {string} appId 应用ID
   * @param {string} appSecret 应用密钥
   * @param {string} brand 品牌 (feishu/lark)
   * @returns {boolean} 配置是否成功
   */
  configure(appId, appSecret, brand = 'feishu') {
    try {
      fs.mkdirSync(this.configDir, { recursive: true });
      
      const cmd = `echo "${appSecret}" | lark-cli config init --app-id ${appId} --app-secret-stdin --brand ${brand} --force-init`;
      execSync(cmd, { stdio: 'ignore' });
      
      return true;
    } catch (e) {
      throw new Error(`配置失败：${e.message}`);
    }
  }

  /**
   * 发起授权
   * @param {string} scope 授权范围 (recommend/all)
   * @returns {Promise<object>} 授权链接和验证码
   */
  async authorize(scope = 'recommend') {
    return new Promise((resolve, reject) => {
      const args = ['auth', 'login', `--${scope}`, '--no-wait', '--json'];
      const authProcess = spawn('lark-cli', args, {
        encoding: 'utf8'
      });

      let output = '';
      authProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      authProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      authProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve({
              verificationUrl: result.verification_url,
              userCode: result.user_code,
              deviceCode: result.device_code,
              expiresIn: result.expires_in
            });
          } catch (e) {
            reject(new Error(`解析授权结果失败：${e.message}`));
          }
        } else {
          reject(new Error(`授权失败：${output}`));
        }
      });
    });
  }

  /**
   * 轮询授权结果
   * @param {string} deviceCode 设备码
   * @returns {Promise<boolean>} 授权是否成功
   */
  async pollAuthorization(deviceCode) {
    return new Promise((resolve, reject) => {
      const args = ['auth', 'login', '--device-code', deviceCode];
      const pollProcess = spawn('lark-cli', args, {
        stdio: 'inherit'
      });

      pollProcess.on('close', (code) => {
        resolve(code === 0);
      });

      pollProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * 检查配置状态
   * @returns {object} 状态信息
   */
  getStatus() {
    try {
      const result = execSync('lark-cli doctor --json', { encoding: 'utf8' });
      return JSON.parse(result);
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /**
   * 执行lark-cli命令
   * @param {string} command 命令字符串
   * @returns {object} 执行结果
   */
  execute(command) {
    try {
      const result = execSync(`lark-cli ${command}`, { encoding: 'utf8' });
      return { ok: true, data: JSON.parse(result) };
    } catch (e) {
      return { ok: false, error: e.message, stderr: e.stderr?.toString() };
    }
  }
}

module.exports = new LarkCliHelper();
