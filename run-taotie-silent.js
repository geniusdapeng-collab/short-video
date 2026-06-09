/**
 * 静默预生产执行器
 * 
 * 根治上下文膨胀：
 * 1. Pipeline日志写入文件（不进入对话上下文）
 * 2. stdout只输出关键节点摘要
 * 3. 失败时读取最后50行日志定位问题
 * 
 * 用法：node run-taotie-silent.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join('/root/.openclaw/workspace', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const timestamp = Date.now();
const logFile = path.join(LOG_DIR, `preproduction-${timestamp}.log`);

console.log(`🎬 预生产启动 | 日志: logs/preproduction-${timestamp}.log`);

// 运行预生产，所有输出重定向到文件
try {
  execSync(`node run-taotie-preproduction.js > "${logFile}" 2>&1`, {
    cwd: '/root/.openclaw/workspace',
    timeout: 600000, // 10分钟
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  // 生成摘要（从日志提取关键行）
  const summary = generateSummary(logFile);
  console.log('\n' + summary);
  console.log(`\n✅ 预生产完成 | 完整日志: ${logFile}`);
  
} catch (e) {
  console.error(`\n❌ 预生产失败 | 退出码: ${e.status}`);
  
  // 读取最后50行定位问题
  const tail = readTail(logFile, 50);
  console.error('\n--- 最后50行日志 ---');
  console.error(tail);
  console.error(`\n📄 完整日志: ${logFile}`);
  
  process.exit(1);
}

function generateSummary(logPath) {
  if (!fs.existsSync(logPath)) return '日志文件未找到';
  
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  // 关键模式
  const patterns = [
    { regex: /STAGE-\d+.*完成.*耗时.*ms/, label: 'Stage完成' },
    { regex: /✅.*导演评审完成.*评分/, label: '导演评审' },
    { regex: /✅.*编剧优化完成.*修复/, label: '编剧优化' },
    { regex: /⛔.*链路验证失败/, label: '链路错误' },
    { regex: /镜头数:\s*\d+/, label: '镜头统计' },
    { regex: /总耗时.*秒/, label: '总耗时' }
  ];
  
  const summary = [];
  for (const line of lines) {
    for (const p of patterns) {
      if (p.regex.test(line)) {
        summary.push(`[${p.label}] ${line.trim()}`);
        break;
      }
    }
  }
  
  return `=== 执行摘要 ===\n共${lines.length}行日志 | 关键节点${summary.length}个\n\n${summary.join('\n')}`;
}

function readTail(filePath, n) {
  if (!fs.existsSync(filePath)) return '日志文件未找到';
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  return lines.slice(-n).join('\n');
}
