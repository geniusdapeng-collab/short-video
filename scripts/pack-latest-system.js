const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const OUTPUT_DIR = path.join(WORKSPACE, 'output');

// 排除目录
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'output',
  'logs',
  'tmp',
  'temp',
  'memorized_media',
  'memorized_diary',
  'memory_consolidation',
  'cache',
  'dist',
  '.trash',
  'stories',
  'videos',
  'productions',
  'production',
  'final',
  'temp',
  'merged'
];

// 排除文件模式
const EXCLUDE_PATTERNS = [
  /\.env$/i,
  /volcengine\.json$/i,
  /config\.json$/i,
  /package-lock\.json$/i,
  /\.log$/i,
  /\.tmp$/i,
  /~$/,
  /\.swp$/,
  /\.DS_Store$/i,
  /\.mp4$/i,
  /\.zip$/i,
  /\.tar$/i,
  /\.gz$/i,
  /\.rar$/i,
  /\.7z$/i,
  /\.exe$/i,
  /\.bin$/i,
  /\.dat$/i,
  /\.db$/i,
  /\.sqlite$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.png$/i,
  /\.gif$/i,
  /\.webp$/i,
  /\.bmp$/i,
  /\.mp3$/i,
  /\.wav$/i,
  /\.ogg$/i,
  /\.aac$/i
];

// 二进制扩展名（额外保险）
const BINARY_EXTS = [
  '.mp4', '.avi', '.mov', '.mkv',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.bin', '.dat', '.db', '.sqlite',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.mp3', '.wav', '.ogg', '.aac'
];

function shouldExclude(relPath) {
  const parts = relPath.split(path.sep);
  if (parts.some(p => EXCLUDE_DIRS.includes(p))) return true;
  
  const basename = path.basename(relPath);
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(basename)) return true;
  }
  
  const ext = path.extname(relPath).toLowerCase();
  if (BINARY_EXTS.includes(ext)) return true;
  
  return false;
}

function listFiles(dir, baseDir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const relPath = path.relative(baseDir, fullPath);
    
    if (shouldExclude(relPath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...listFiles(fullPath, baseDir));
    } else {
      results.push({ relPath, fullPath, size: stat.size });
    }
  }
  return results;
}

function main() {
  console.log('🔍 扫描工作空间，打包所有代码文件...');
  
  const files = listFiles(WORKSPACE, WORKSPACE);
  console.log(`📁 找到 ${files.length} 个文件待打包`);
  
  let md = '# Nirath 视频生成系统 - 全量代码备份\n\n';
  md += '> **版本**: ' + getVersion() + '\n';
  md += '> **生成时间**: ' + new Date().toISOString() + '\n';
  md += '> **文件总数**: ' + files.length + '\n';
  md += '> **用途**: OpenClaw 一键安装部署\n';
  md += '> **说明**: 本备份包含所有系统代码、配置、Agent、脚本\n\n';
  md += '---\n\n';
  
  let totalRawSize = 0;
  let totalContentChars = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalRawSize += file.size;
    
    let content;
    try {
      content = fs.readFileSync(file.fullPath, 'utf8');
    } catch (e) {
      content = `// [读取文件错误: ${e.message}]`;
    }
    totalContentChars += content.length;
    
    // 确定代码块语言
    const ext = path.extname(file.relPath).slice(1).toLowerCase();
    let lang = 'text';
    if (ext === 'js') lang = 'javascript';
    else if (ext === 'json') lang = 'json';
    else if (ext === 'md') lang = 'markdown';
    else if (ext === 'yaml' || ext === 'yml') lang = 'yaml';
    else if (ext === 'html') lang = 'html';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'sh') lang = 'bash';
    else if (ext === 'py') lang = 'python';
    else if (ext === 'sql') lang = 'sql';
    
    md += `## ${file.relPath}\n\n`;
    md += `\`\`\`${lang}\n`;
    md += content;
    md += `\n\`\`\`\n\n`;
    
    if ((i + 1) % 50 === 0) {
      console.log(`  进度: ${i + 1}/${files.length} 文件已处理`);
    }
  }
  
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const outputPath = path.join(OUTPUT_DIR, 'nirath-full-system-backup-v6.5.11.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  
  const mdSizeMB = (md.length / 1024 / 1024).toFixed(1);
  const rawSizeMB = (totalRawSize / 1024 / 1024).toFixed(1);
  
  console.log(`\n✅ 备份完成！`);
  console.log(`   文件数: ${files.length}`);
  console.log(`   原始大小: ${rawSizeMB} MB`);
  console.log(`   Markdown 大小: ${mdSizeMB} MB`);
  console.log(`   输出路径: ${outputPath}`);
}

function getVersion() {
  try {
    return fs.readFileSync(path.join(WORKSPACE, '.current-version'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

main();