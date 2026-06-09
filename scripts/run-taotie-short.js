/** =============
 * 超短裙系统 — 15秒饕餮小故事测试
 * 入口文件在 short-video-system/scripts/ 内运行
 ============= */

const { NirathMasterPipeline } = require('../systems/nirath-master-pipeline.js');
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..');
const OUTPUT = path.join(WORKSPACE, 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

// ====== 15秒饕餮小故事输入 ======
const input = {
  projectName: 'taotie-short-15s',
  videoType: 'short-fantasy', // 超短视频奇幻
  targetDuration: 15, // 15秒！
  style: 'Nirath异世界黑暗奇幻，超写实，电影级，史诗质感',
  mode: 'nirath', // 山海经模式

  // Nirath世界观设定
  world: {
    setting: 'nirath-dark-fantasy',
    name: 'Nirath星球',
    style: '远古异世界，黑暗奇幻，超写实',
    location: '熔岩深渊',
    lighting: '熔岩红+幽灵蓝+暗紫',
    atmosphere: '压迫、史诗、神秘'
  },

  // 3幕场景（3个镜头 = 15秒）
  scenes: [
    {
      id: 'S01',
      name: '钩子：眼睛睁开',
      type: 'hook',
      duration: 3, // 3秒
      description: '极端特写：黑暗中一双燃烧的眼睛缓缓睁开。瞳孔中倒映着远古的饥饿。熔岩红从底部照亮瞳孔，幽灵蓝在边缘勾勒。' +
                   '镜头：微距推进 → 瞳孔中反射出深渊熔岩。运镜：3段（slow_push_in + micro_orbit + eye_lock）。' +
                   '光影：高对比 Chiaroscuro，只有眼睛在发光。'
    },
    {
      id: 'S02',
      name: '展开：饕餮升起',
      type: 'climax',
      duration: 7, // 7秒
      description: '宏推拉：深渊裂开。巨兽饕餮从熔岩中升起。镜头从微距（獠牙纹理）推至全景（巨兽全貌）。' +
                   '饕餮的嘴吞噬着火焰、岩石、天空。每一次呼吸都是毁灭。世界在它口中化为虚无。' +
                   '镜头：7秒，从微距到全景。运镜：3段（macro_push + whip_tilt + crane_surge）。' +
                   '光影：Rembrandt 过渡到 Silhouette，最后逆光。'
    },
    {
      id: 'S03',
      name: '收束：仰天长啸',
      type: 'resolution',
      duration: 5, // 5秒
      description: '慢推锁定：饕餮仰天长啸。声波震碎云层。镜头缓慢推向面部，锁定那双燃烧的眼睛。' +
                   '它不是怪物，是永恒的饥饿本身。那双眼睛望向观众——下一个，会是你吗？' +
                   '镜头：5秒，慢推特写。运镜：3段（slow_float + push_in + eye_lock）。' +
                   '光影：Golden Hour 暖调，但眼睛是冰冷的幽灵蓝。'
    }
  ],

  // 角色：饕餮（异兽）
  characters: {
    'taotie': {
      id: 'taotie',
      name: '饕餮',
      role: 'protagonist',
      roleType: 'beast',
      description: '山海经异兽，深渊巨兽，永恒的饥饿化身。特征：燃烧的眼睛、深渊巨口、熔岩皮肤、远古獠牙、饥饿凝视。',
      isProtagonist: true
    }
  },

  // 叙事要求
  narrative: {
    tone: '史诗、压迫、神秘',
    avoid: ['旁白', '预告', '解释性内容'],
    focus: '15秒情绪爆点：恐惧→敬畏→震撼',
    language: '中文，无台词（纯视觉叙事）'
  },

  // 超短裙约束
  constraints: {
    noTrailer: true,
    maxDuration: 15,
    minDuration: 15,
    noVoiceover: true, // 无旁白！
    visualOnly: true, // 纯视觉
    shotCount: 3 // 3个镜头
  },

  // 超短裙运镜策略（暴力美学）
  cameraStrategy: {
    type: 'short-brutalism',
    movementDensity: 3, // 每镜头3段运镜
    allowStatic: false, // 禁止静态
    combos: ['hook_blast', 'detail_porn', 'emotion_lock'] // 3个镜头各用一种
  },

  // 光影方案（情绪雕刻）
  lightingStrategy: {
    type: 'emotion-sculpt',
    matrix: ['chiaroscuro', 'rembrandt-silhouette', 'golden-hour'],
    keyLight: '熔岩红（从底部照亮）',
    rimLight: '幽灵蓝（勾勒轮廓）',
    fillLight: '暗紫（深渊环境）'
  },

  // 质感
  texture: 'wallpaper' // 壁纸级
};

// ====== 启动超短裙预生产 ======
async function runShortVideo() {
  const startTime = Date.now();
  console.log('🩲 [超短裙系统 v0.1.0] 15秒饕餮小故事');
  console.log('');
  console.log(`🎬 项目: ${input.projectName}`);
  console.log(`   标题: 饕餮·觉醒`);
  console.log(`   时长: ${input.targetDuration}秒`);
  console.log(`   模式: ${input.mode}`);
  console.log(`   镜头: ${input.constraints.shotCount}个`);
  console.log(`   质检: 80分及格`);
  console.log(`   时间: ${new Date().toISOString()}`);
  console.log('');

  console.log('🎬 15秒3幕结构：');
  for (const scene of input.scenes) {
    console.log(`   ${scene.id} (${scene.duration}s): ${scene.name}`);
  }
  console.log('');

  console.log('🎥 运镜策略：暴力美学');
  console.log(`   每镜头: ${input.cameraStrategy.movementDensity}段运镜`);
  console.log(`   禁止静态: ${input.cameraStrategy.allowStatic ? '否' : '是'}`);
  console.log('');

  console.log('💡 光影策略：情绪雕刻');
  console.log(`   矩阵: ${input.lightingStrategy.matrix.join(' → ')}`);
  console.log('');

  const pipeline = new NirathMasterPipeline({
    workspace: WORKSPACE,
    outputDir: OUTPUT,
    mode: input.mode,
    projectConfig: input
  });

  try {
    // 前置检查：定妆照
    console.log('🔍 前置检查：角色定妆照...');
    const preflight = await pipeline.preFlightCheck(input);

    if (!preflight.canProceed) {
      console.error('⛔ 前置检查失败:');
      for (const issue of preflight.issues) {
        console.error(`   - ${issue.message}`);
      }
      // 超短裙系统：如果没有定妆照，继续生成（测试模式）
      console.log('⚠️ 超短裙测试模式：继续执行（无定妆照）');
    } else {
      console.log(`✅ 前置检查通过 | 角色数: ${preflight.characterCount}`);
    }
    console.log('');

    // 执行完整链路
    console.log('🚀 启动超短裙完整链路...');
    console.log('   模式: 15秒极致化');
    console.log('   链路: 3镜头 × 3运镜 × 情绪雕刻');
    console.log('');

    const result = await pipeline.execute(input);

    // 保存结果
    const outputFile = path.join(OUTPUT, `${input.projectName}-preproduction.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log('✅ 超短裙预生产完成！');
    console.log(`   输出文件: ${outputFile}`);
    console.log(`   总耗时: ${duration.toFixed(1)}秒`);
    console.log(`   成功: ${result.success}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`   错误数: ${result.errors.length}`);
      for (const err of result.errors.slice(0, 5)) {
        console.log(`   ⚠️ ${err.message || err}`);
      }
    }

    // 输出镜头信息
    const prompts = result.stages?.output?.prompts || [];
    console.log('');
    console.log(`📋 生成镜头数: ${prompts.length}`);
    for (const p of prompts.slice(0, 10)) {
      console.log(`   ${p.shotId || p.scene}: ${(p.prompt || '').substring(0, 60)}...`);
    }

    // 输出质量分
    if (result.qualityScore) {
      console.log('');
      console.log(`🏆 质量分: ${result.qualityScore}`);
      if (result.qualityScore >= 80) {
        console.log('   ✅ 超短裙质检通过！');
      } else {
        console.log('   ⚠️ 未达80分及格线，需优化');
      }
    }

    // 保存Markdown报告
    const mdFile = path.join(OUTPUT, `${input.projectName}-report.md`);
    const mdContent = `# 超短裙系统 — 15秒《饕餮·觉醒》预生产报告

## 系统信息
- 系统: 超短裙系统 (Super Short Video System)
- 版本: v0.1.0
- 日期: 2026-06-09
- 时长: 15秒
- 质检标准: 80分及格

## 视频信息
- 系列: 山海经：异兽志
- 集数: EP01-Short
- 标题: 饕餮·觉醒
- 主角: 饕餮（异兽）
- 模式: ${input.mode}

## 15秒3幕结构

### 第1幕（0-3秒）：钩子
${input.scenes[0].description}

### 第2幕（3-10秒）：展开
${input.scenes[1].description}

### 第3幕（10-15秒）：收束
${input.scenes[2].description}

## 运镜策略
- 类型: ${input.cameraStrategy.type}
- 每镜头运镜段数: ${input.cameraStrategy.movementDensity}
- 禁止静态: ${!input.cameraStrategy.allowStatic}
- 组合: ${input.cameraStrategy.combos.join(', ')}

## 光影策略
- 类型: ${input.lightingStrategy.type}
- 矩阵: ${input.lightingStrategy.matrix.join(' → ')}
- Key: ${input.lightingStrategy.keyLight}
- Rim: ${input.lightingStrategy.rimLight}
- Fill: ${input.lightingStrategy.fillLight}

## 运行结果
- 成功: ${result.success}
- 耗时: ${duration.toFixed(1)}秒
- 质量分: ${result.qualityScore || 'N/A'}
- 镜头数: ${prompts.length}

## 镜头详情
${prompts.map((p, i) => `### 镜头 ${i+1}: ${p.shotId || p.scene}
\`\`\`
${p.prompt || 'N/A'}
\`\`\`
`).join('\n')}

---
*超短裙系统 v0.1.0 | 短的才精悍*
`;
    fs.writeFileSync(mdFile, mdContent);
    console.log(`\n📄 Markdown报告: ${mdFile}`);

  } catch (error) {
    console.error('❌ 超短裙运行失败:', error.message);
    console.error(error.stack);

    // 保存错误报告
    const errorFile = path.join(OUTPUT, `${input.projectName}-error.log`);
    fs.writeFileSync(errorFile, `Error: ${error.message}\n\nStack:\n${error.stack}`);
    console.log(`\n📄 错误日志: ${errorFile}`);

    process.exit(1);
  }
}

runShortVideo();
