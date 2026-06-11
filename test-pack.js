const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const CODE_EXTS = ['.js', '.json', '.md', '.ts', '.py', '.html', '.css', '.yaml', '.yml', '.sh', '.txt'];

const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.openclaw',
  '.trash',
  'output',
  'videos',
  'memorized_diary',
  'memory',
  'memory_consolidation',
  'backup',
  'audit-logs',
  'debug_llm',
  'versions',
  'skills',
  'architecture-v2',
  'app/commands',
];

const EXCLUDE_FILE_PATTERNS = [
  '.mp4', '.mov', '.avi', '.mkv', '.flv',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg',
  '.mp3', '.wav', '.ogg', '.aac', '.flac',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.exe', '.dll', '.so', '.dylib',
  '.log', '.tmp', '.temp', '.cache',
  '.DS_Store', 'Thumbs.db',
  'package-lock.json', 'yarn.lock', '.pnpm-lock.yaml',
];

function shouldExcludeFile(filename) {
  for (const pattern of EXCLUDE_FILE_PATTERNS) {
    if (filename.toLowerCase().endsWith(pattern)) return true;
  }
  return false;
}

function shouldExcludeDir(dirPath) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (dirPath.includes('/' + pattern + '/') || dirPath.endsWith('/' + pattern)) {
      console.log('  匹配模式:', pattern, '路径:', dirPath);
      return true;
    }
  }
  return false;
}

function collectFiles(dir, base = '') {
  let files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = base ? path.join(base, entry.name) : entry.name;
      
      if (entry.isDirectory()) {
        if (shouldExcludeDir(fullPath)) {
          console.log('  排除目录:', fullPath);
          continue;
        }
        files.push(...collectFiles(fullPath, relativePath));
      } else if (CODE_EXTS.some(ext => entry.name.toLowerCase().endsWith(ext))) {
        if (!shouldExcludeFile(entry.name)) {
          files.push({ fullPath, relativePath });
        }
      }
    }
  } catch (e) {
    console.log('  读取失败:', dir, e.message);
  }
  return files;
}

const testDirs = ['characters', 'shared-kernel', 'domain', 'analysis', 'stories', 'projects'];

for (const dir of testDirs) {
  const fullDir = path.join(WORKSPACE, dir);
  console.log(`\n检查 ${dir}:`);
  if (!fs.existsSync(fullDir)) {
    console.log('  目录不存在');
    continue;
  }
  const files = collectFiles(fullDir);
  console.log(`  找到 ${files.length} 个文件`);
  if (files.length > 0) {
    console.log('  前5个:', files.slice(0, 5).map(f => f.relativePath));
  }
}
