#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const [,, title, type, tags, summary, details, agentName, deviceName] = process.argv;

if (!title || !type || !summary) {
  console.error('Usage: node format_record.cjs <title> <type> <tags> <summary> <details> [agentName] [deviceName]');
  process.exit(1);
}

const date = new Date().toISOString().split('T')[0];
const finalAgentName = agentName || 'gemini-cli';
const finalDeviceName = deviceName || 'mac-mini';

const output = `# ${title}

## 元信息
- 来源: ${finalAgentName} @ ${finalDeviceName}
- 类型: ${type}
- 标签: ${tags || 'none'}
- 时间: ${date}

## 摘要
${summary}

## 详情
${details || 'No additional details provided.'}
`;

console.log(output);
