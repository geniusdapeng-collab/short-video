const fs = require('fs');
const path = require('path');

const WORKSPACE = '/root/.openclaw/workspace';
const OUTPUT = path.join(WORKSPACE, 'output/nirath-full-system-backup-v6.3-patch11.md');

// 排除规则
const EXCLUDE = [
  'node_modules',
  'output',
  'audit-logs',
  '.git',
  '.trash',
  'memorized_diary',
  'memorized_media',
];

const EXCLUDE_FILES = [
  '.mp4', '.png', '.jpeg', '.jpg', '.gif', '.webp',
  '.zip', '.tar', '.gz',
  '.wav', '.mp3', '.aac',
  '.log', '.jsonl',
];

function shouldInclude(filePath) {
  const parts = filePath.split('/');
  for (const part of parts) {
    if (EXCLUDE.includes(part)) return false;
  }
  // 排除 .openclaw 中的敏感配置文件（包含 API 密钥）
  if (filePath.includes('.openclaw/config/volcengine.json')) return false;
  for (const ext of EXCLUDE_FILES) {
    if (filePath.endsWith(ext)) return false;
  }
  return true;
}

function getFileCategory(filePath) {
  if (filePath.includes('systems/')) return '核心系统';
  if (filePath.includes('data/')) return '数据与配置';
  if (filePath.includes('characters/')) return '角色配置';
  if (filePath.includes('scripts/')) return '脚本工具';
  if (filePath.includes('docs/')) return '设计文档';
  if (filePath.includes('shanhaijing-')) return '山海经子系统';
  if (filePath.includes('seedance-')) return 'Seedance子系统';
  if (filePath.includes('projects/')) return '项目实例';
  if (filePath.includes('stories/')) return '故事配置';
  if (filePath.includes('skills/')) return '技能模块';
  if (filePath.includes('versions/')) return '版本记录';
  if (filePath.includes('RELEASE')) return '版本发布';
  if (filePath.includes('productions/')) return '发布记录';
  if (filePath.includes('memory/')) return '工作日志';
  return '其他';
}

function walk(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(WORKSPACE, fullPath);
    if (!shouldInclude(relPath)) continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walk(fullPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

console.log('🔍 扫描文件...');
const allFiles = walk(WORKSPACE);
console.log(`📁 找到 ${allFiles.length} 个文件`);

// 按类别分组
const byCategory = {};
for (const f of allFiles) {
  const cat = getFileCategory(f);
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(f);
}

// 生成 Markdown
let md = `# Nirath Master Pipeline 全系统备份

**版本**: v6.3-patch11  
**生成时间**: ${new Date().toISOString()}  
**文件总数**: ${allFiles.length}  
**总大小**: ~${(allFiles.reduce((sum, f) => sum + fs.statSync(path.join(WORKSPACE, f)).size, 0) / 1024 / 1024).toFixed(1)}MB  
**Git版本**: 8a77d1ad730e81d174cec765693cc963941e30fa

---

## 目录

`;

for (const [cat, files] of Object.entries(byCategory)) {
  md += `- [${cat}](#${cat.toLowerCase().replace(/\s+/g, '-')}) (${files.length} 文件)\n`;
}

md += `\n---\n\n`;

// 安装说明
md += `## 快速安装指南\n\n`;
md += `### 系统要求\n`;
md += `- Node.js 18+\n`;
md += `- 4GB+ RAM (推荐 8GB)\n`;
md += `- 火山引擎 Ark API 密钥\n\n`;
md += `### 一键安装\n\n`;
md += `\`\`\`bash\n`;
md += `# 1. 创建工作目录\n`;
md += `mkdir -p nirath-master-pipeline\n`;
md += `cd nirath-master-pipeline\n\n`;
md += `# 2. 创建目录结构\n`;
md += `mkdir -p systems/render-engines data characters scripts docs versions\n\n`;
md += `# 3. 复制本文件中的代码到对应位置 (见下方各章节)\n\n`;
md += `# 4. 安装依赖\n`;
md += `npm init -y\n`;
md += `npm install axios form-data\n\n`;
md += `# 5. 配置 API 密钥\n`;
md += `export VOLCENGINE_ARK_API_KEY=your_api_key_here\n\n`;
md += `# 6. 运行测试\n`;
md += `node scripts/run-taotie-preproduction.js\n`;
md += `\`\`\`\n\n`;
md += `### 核心依赖\n`;
md += `- \`axios\`: HTTP 请求\n`;
md += `- \`form-data\`: 文件上传\n\n`;
md += `### 最新变更 (v6.3-patch11)\n`;
md += `- 提示词利用率提升：目标 889-988 字符，稳定输出\n`;
md += `- 新增 char-counter.js 真实字符计数\n`;
md += `- 新增 prompt-dedupe.js 字段去重\n`;
md += `- 动态补齐 + 最终兜底补齐机制\n`;
md += `- PromptForge 三阶流水线稳定运行\n\n`;
md += `---\n\n`;

// 按类别输出代码
for (const [cat, files] of Object.entries(byCategory)) {
  md += `## ${cat}\n\n`;
  for (const f of files.sort()) {
    const fullPath = path.join(WORKSPACE, f);
    const size = fs.statSync(fullPath).size;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ext = path.extname(f).slice(1) || 'txt';
    
    md += `### ${f}\n\n`;
    md += `\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
  }
  md += `---\n\n`;
}

// 版本记录
md += `## 版本演进\n\n`;
md += `| 版本 | 时间 | 核心变更 |\n`;
md += `|------|------|----------|\n`;
md += `| v6.3-patch11 | 2026-06-06 | 提示词利用率提升(889-988字符)+char-counter+去重+补齐 |\n`;
md += `| v6.3-patch10 | 2026-06-06 | OOM内存限制修复(4096MB)+完整预生产跑通 |\n`;
md += `| v6.3-patch9 | 2026-06-06 | _cleanForgePrompt截断修复(正则Bug) |\n`;
md += `| v6.3-patch8 | 2026-06-05 | PromptForge提取修复(92分)+单镜头测试突破 |\n`;
md += `| v6.3-patch7 | 2026-06-05 | 外部专家7模块修复(合并+合成师+质量门) |\n`;
md += `| v6.3-patch6 | 2026-06-05 | 发布防错机制+子进程隔离+内存释放 |\n`;
md += `| v6.3-patch5 | 2026-06-04 | PromptForge导演编排系统+系统固化 |\n`;
md += `| v6.3-patch2 | 2026-06-03 | PromptForge语法修复+Seedance2.0绑定+闸机增强 |\n`;
md += `| v6.3-patch1 | 2026-06-02 | PromptForge导演编排系统+v3.0提示词标准 |\n`;
md += `| v6.2-patch107 | 2026-05-31 | 修复cameraVariety+S01重复ID |\n`;
md += `| v6.2-patch106 | 2026-05-30 | 修复S01/S04重复问题+强制索引ID分配 |\n`;
md += `| v6.2-patch105 | 2026-05-29 | 生产版本发布+修复灯光0分 |\n`;
md += `| v6.2-patch104 | 2026-05-28 | 修复Prompt输出缺失 |\n`;
md += `| v6.2-patch98 | 2026-05-24 | 8角度定妆照/恐怖谷二创/武器标准化 |\n`;
md += `| v6.2-patch97 | 2026-05-23 | 镜头时间轴注入+导演优化风格锚定 |\n`;
md += `| v6.2-patch91 | 2026-05-21 | 分辨率修正720p→1080p |\n`;
md += `| v6.2-patch89 | 2026-05-20 | LLM链路根治+旁白归零+导演Agent修复 |\n`;
md += `| v6.2-patch87 | 2026-05-19 | Prompt角色描述精简+核心视觉锚点保留 |\n`;
md += `| v6.0-patch40 | 2026-05-15 | 片头系统v3.0+音效设计 |\n`;
md += `| v6.0-patch35 | 2026-05-12 | 场景设计Agent+美术布景设计 |\n`;
md += `| v6.0-patch30 | 2026-05-10 | 微动作系统+角色一致性守卫 |\n`;
md += `| v5.0 | 2026-05-05 | 镜头时长分配v2+节奏优化 |\n`;
md += `| v4.0 | 2026-05-01 | 导演优化+情绪阶段标签 |\n`;
md += `| v3.0 | 2026-04-28 | Prompt标准v3+一镜到底智能判断 |\n`;
md += `| v2.0 | 2026-04-25 | 多Agent体系+运镜系统v3 |\n`;
md += `| v1.0 | 2026-04-20 | 基础预生产链路 |\n`;

md += `\n---\n`;
md += `\n**备份结束** | Nirath Master Pipeline v6.3-patch11 | ${new Date().toISOString()}\n`;

console.log('📝 写入文件...');
fs.writeFileSync(OUTPUT, md);
const outputSize = fs.statSync(OUTPUT).size;
console.log(`✅ 完成！文件: ${OUTPUT}`);
console.log(`📊 大小: ${(outputSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`📊 字符数: ${md.length.toLocaleString()}`);
