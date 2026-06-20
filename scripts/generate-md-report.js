const fs = require('fs');
const path = require('path');

// 读取预生产结果
const resultPath = process.argv[2] || './output/taotie-ep01-preproduction-2026-06-01T13-11-23-432Z.json';
const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));

// 生成MD报告
function generateMarkdownReport(result) {
  const storyboard = result.stages?.storyboard || {};
  const shots = storyboard.shots || [];
  
  let md = `# 山海经：饕餮 EP01 预生产报告

**项目**: 山海经：饕餮· hunger and armor EP01
**时间**: 2026-06-01
**总时长**: ${result.duration || 75}秒
**镜头数**: ${shots.length}
**状态**: ${result.success ? '✅ 成功' : '❌ 失败'}

---

## 故事概览

**主题**: 火山苏醒 → 巨口现世 → 饥饿真相 → 解封之跃 → 盟友之约
**反转**: 饕餮不是想吃小G，而是被远古封印困住
**情感弧线**: 恐惧 → 同情 → 合作 → 救赎

**世界观**: Nirath星球，双星系统，火山熔岩地带
**核心角色**: 小G（8岁探险者）+ 饕餮（羊身人面，巨口占面部三分之二）

---

## 每镜时长与Prompt统计

| 镜头 | 时长 | 类型 | 情绪 | Prompt字符 | 利用率 | 质感评分 |
|------|------|------|------|------------|--------|----------|
`;

  for (const shot of shots) {
    const prompt = shot.prompt?.text || shot.visualPrompt || '';
    const charCount = prompt.length;
    const utilization = shot.promptUtilization || Math.round((charCount / 980) * 100);
    const qualityScore = shot.qualityScore || 'N/A';
    md += `| ${shot.id || shot.shotId} | ${shot.duration || '?'}s | ${shot.type || 'unknown'} | ${shot.emotion || 'unknown'} | ${charCount} | ${utilization}% | ${qualityScore}分 |\n`;
  }

  md += `
---

## 每镜完整Prompt

`;

  for (const shot of shots) {
    const prompt = shot.prompt?.text || shot.visualPrompt || '（无Prompt）';
    const wrappedPrompt = wrapText(prompt, 60);
    md += `### ${shot.id || shot.shotId} (${shot.duration || '?'}s)

\`\`\`
${wrappedPrompt}
\`\`\`

**运镜**: ${shot.cameraMovement?.description || '无'}
**Narration**: ${shot.narration || '无'}
**角色**: ${(shot.characters || []).join(', ') || '无'}

---

`;
  }

  md += `## 问题汇总

### 严重问题（必须修复）
1. **所有场景narration为空** — 70秒叙事真空
2. **角色taotie未出现在任何Prompt中** — 角色系统→渲染链路断裂
3. **运镜输出未被下游消费** — buildPromptV3未正确读取运镜
4. **S05仅789字符** — 远低于800字符最低要求

### 警告（建议优化）
1. **5个Prompt空间未充分利用** (<950字符)
2. **4个镜头缺少超写实风格词**
3. **片头合规检查失败** — 缺少异兽开场白、震撼音效

---

## 定妆照状态

| 角色 | 状态 | 角度数 |
|------|------|--------|
| 小G | ✅ 通过 | 4个角度 |
| 饕餮 | ✅ 通过 | 8个角度（新v3.0格式） |

---

## 完整性验证

**总检查项**: 16
**通过**: 10 ✅
**失败**: 6 ❌
**错误**: 12 🔴
**警告**: 6 ⚠️

---

*报告生成时间: 2026-06-01*
*系统版本: v6.2-patch68*
`;

  return md;
}

function wrapText(text, maxWidth) {
  if (!text) return '';
  const lines = [];
  let currentLine = '';
  let currentWidth = 0;
  
  for (const char of text) {
    const charWidth = (char.charCodeAt(0) > 127) ? 2 : 1;
    if (currentWidth + charWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = char;
      currentWidth = charWidth;
    } else {
      currentLine += char;
      currentWidth += charWidth;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

const md = generateMarkdownReport(result);
const outputPath = './output/taotie-ep01-preproduction-report-2026-06-01.md';
fs.writeFileSync(outputPath, md);
console.log(`✅ MD报告已生成: ${outputPath}`);
console.log(`📊 字数: ${md.length}字符`);
