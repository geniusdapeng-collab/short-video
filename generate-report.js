const fs = require('fs');

const jsonPath = process.argv[2] || 'output/taotie-ep01-preproduction-2026-05-30T06-18-32-126Z.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const prompts = data.stages.output?.prompts || [];
const validation = data.stages.output?.validation || {};
const integrity = data.integrityReport || {};

function wrapText(text, maxWidth = 60) {
  if (!text) return '';
  const lines = [];
  let current = '';
  let width = 0;
  for (const char of text) {
    const charWidth = (char.charCodeAt(0) > 127) ? 2 : 1;
    if (width + charWidth > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
      width = charWidth;
    } else {
      current += char;
      width += charWidth;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}

function countChars(text) {
  if (!text) return { total: 0, cn: 0, en: 0 };
  let cn = 0, en = 0;
  for (const char of text) {
    if (/[\u4e00-\u9fff]/.test(char)) cn++;
    else if (/[a-zA-Z]/.test(char)) en++;
  }
  return { total: text.length, cn, en, words: text.split(/\s+/).filter(w => w).length };
}

let md = `# 饕餮 EP01 预生产审阅报告\n\n`;
md += `## 项目信息\n`;
md += `- **项目**: 山海经：饕餮·永恒饥饿 EP01\n`;
md += `- **模式**: nirath（预生产）\n`;
md += `- **目标时长**: 70秒（实际 81秒含片头）\n`;
md += `- **画幅**: 16:9\n`;
md += `- **生成时间**: 2026-05-30T06:18:32\n`;
md += `- **Pipeline版本**: v6.2-patch75\n\n`;

md += `---\n\n`;
md += `## 一、故事概览\n\n`;
md += `### 主题\n永恒饥饿的寓言——贪欲的极致与克制之道\n\n`;
md += `### 情绪弧线\n\`好奇 → 紧张 → 敬畏 → 警惕 → 温暖\`\n\n`;
md += `### 世界观设定\n`;
md += `- **星球**: Nirath（双恒星系统）\n`;
md += `- **场景**: 钩吾废墟（远古战争摧毁的城市遗迹）\n`;
md += `- **光照**: 5800K Aurelius 金色 + 6500K Silvana 银白\n`;
md += `- **重力**: 0.82G（低重力飘浮效果）\n`;
md += `- **磁场**: 3.2Tesla（可见磁场线）\n\n`;

md += `### 角色\n`;
md += `| 角色 | 身份 | 特征 |\n`;
md += `|------|------|------|\n`;
md += `| 小G | 主角 | 8岁男孩，蓝色条纹睡衣，Nirath旧世界唯一幸存者 |\n`;
md += `| 饕餮 | 神兽 | 羊身人面，肩高30米，火山岩装甲，巨口占面部2/3，双眼生于腋下 |\n\n`;

md += `---\n\n`;
md += `## 二、镜头统计\n\n`;
md += `| 镜号 | 场景 | 类型 | 时长 | 总字符 | 中文字 | 英文词 | 利用率 | 质感评分 | 角色 |\n`;
md += `|------|------|------|------|--------|--------|--------|--------|----------|------|\n`;

let totalChars = 0, totalCn = 0, totalEnWords = 0;
for (const p of prompts) {
  const c = countChars(p.render_prompt || p.renderPrompt || p.prompt || p.visualPrompt || '');
  totalChars += c.total;
  totalCn += c.cn;
  totalEnWords += c.words;
  const score = p.qualityScore?.totalScore || 0;
  const util = p.utilization || 0;
  const utilIcon = util >= 98 ? '🔥' : util >= 90 ? '✅' : '⚠️';
  md += `| ${p.shotId} | ${p.scene || '-'} | ${p.type || '-'} | ${p.duration || '-'}s | ${c.total} | ${c.cn} | ${c.words} | ${utilIcon}${util}% | ${score}分 | ${p.characters?.join('+') || '-'} |\n`;
}

md += `| **总计** | - | - | **${prompts.reduce((s,p)=>s+(p.duration||0),0)}s** | **${totalChars}** | **${totalCn}** | **${totalEnWords}** | - | - | - |\n\n`;

md += `---\n\n`;
md += `## 三、每镜完整Prompt\n\n`;

for (const p of prompts) {
  const c = countChars(p.render_prompt || p.renderPrompt || p.prompt || p.visualPrompt || '');
  md += `### ${p.shotId} ${p.scene || ''}（${p.duration || '-'}秒）${p.utilization < 90 ? '⚠️ 需优化' : ''}\n\n`;
  md += `\`\`\`\n${wrapText(p.render_prompt || p.renderPrompt || p.prompt || p.visualPrompt || '无内容', 58)}\n\`\`\`\n\n`;
  md += `- **总字符**: ${c.total} | **中文**: ${c.cn}字 | **英文词**: ${c.words}词\n`;
  md += `- **利用率**: ${p.utilizationStatus || '-'} (${p.utilization}%)\n`;
  md += `- **质感评分**: ${p.qualityScore?.totalScore || 0}分\n`;
  md += `- **口播动作**: ${p.mouthAction || '无'}\n`;
  md += `- **参考图**: ${p.referenceImages?.length ? p.referenceImages.map(r => r.shotType).join(', ') : '未绑定'}\n\n`;
}

md += `---\n\n`;
md += `## 四、问题清单\n\n`;

const errors = data.errors || [];
if (errors.length > 0) {
  md += `### ❌ 系统错误（${errors.length}项）\n\n`;
  for (const e of errors) {
    md += `- **${e.stage || '未知'}**: ${e.message}\n`;
  }
  md += `\n`;
}

const sbErrors = validation.storyboard?.errors || [];
if (sbErrors.length > 0) {
  md += `### ❌ 故事板校验错误（${sbErrors.length}项）\n\n`;
  for (const e of sbErrors) {
    md += `- **${e.shot || '未知'}**: ${e.message}\n`;
    if (e.suggestion) md += `  💡 ${e.suggestion}\n`;
  }
  md += `\n`;
}

const sbWarnings = validation.storyboard?.warnings || [];
if (sbWarnings.length > 0) {
  md += `### ⚠️ 故事板警告（${sbWarnings.length}项）\n\n`;
  for (const w of sbWarnings.slice(0, 10)) {
    md += `- **${w.shot || '未知'}**: ${w.message}\n`;
    if (w.suggestion) md += `  💡 ${w.suggestion}\n`;
  }
  md += `\n`;
}

md += `### 🔴 链路断裂（End-to-End）\n\n`;
md += `- S2 场景描述未流转到Prompt\n`;
md += `- S3 场景描述未流转到Prompt\n`;
md += `- S5 场景描述未流转到Prompt\n\n`;

md += `### ⚠️ 其他问题\n\n`;
md += `- **定妆照绑定**: 6/6镜头未绑定reference_image（文件存在但绑定逻辑有bug）\n`;
md += `- **FPV运镜**: S03推荐FPV但生成失败（fpvAgent.generateNirathMovement is not a function）\n`;
md += `- **时长-字数不匹配**: 5个镜头narration超长（S01-S05）\n`;
md += `- **片头合规**: S00缺少英文副标题\n\n`;

md += `---\n\n`;
md += `## 五、完整性验证\n\n`;
md += `- **执行审计ID**: ${integrity.executionId || '-'}\n`;
md += `- **Stage完成数**: ${integrity.stageCount || '-'}/17\n`;
md += `- **数据新鲜**: ${integrity.dataFresh ? '✅' : '❌'}\n`;
md += `- **完整性信任**: ${integrity.trusted ? '✅通过' : '❌未通过'}\n\n`;

md += `---\n\n`;
md += `## 六、队长审阅意见\n\n`;
md += `> 待队长填写：\n> \n> - [ ] Prompt内容OK\n> - [ ] 需要修改（请写明修改意见）\n> \n`;

fs.writeFileSync('output/taotie-ep01-preproduction-report-final.md', md, 'utf8');
console.log('报告已生成: output/taotie-ep01-preproduction-report-final.md');
