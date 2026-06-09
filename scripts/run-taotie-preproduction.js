/**
 * 饕餮 EP01 预生产执行器 v6.4.0
 * 集成 runtime-standard + prompt-length 唯一真源 + 内存安全
 */
const { NirathMasterPipeline } = require('../systems/nirath-master-pipeline.js');
const { StatusReporter } = require('../systems/status-reporter.js');
const RUNTIME_STANDARD = require('../config/runtime-standard');
const PROMPT_LENGTH = require('../config/prompt-length');
const fs = require('fs');
const path = require('path');

// ========== 工具函数 ==========
function mem(label) {
  const m = process.memoryUsage();
  console.log(
    `[MEM] ${label} | rss=${(m.rss / 1024 / 1024).toFixed(1)}MB | heapUsed=${(m.heapUsed / 1024 / 1024).toFixed(1)}MB`
  );
}

function safeGetPromptText(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const candidates = [obj.render_prompt, obj.renderPrompt, obj.prompt, obj.visualPrompt];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) return item;
  }
  return '';
}

function slimPipelineResult(result) {
  const stages = result?.stages || {};
  const prompts = stages.output?.prompts || [];
  const storyboardShots = stages.storyboard?.shots || [];

  return {
    success: result?.success ?? false,
    errors: result?.errors || [],
    integrityReport: result?.integrityReport || null,
    stages: {
      output: {
        prompts: prompts.map(p => {
          const promptText = safeGetPromptText(p);
          const length = p.length || promptText.length;
          return {
            shotId: p.shotId,
            scene: p.scene,
            type: p.type,
            duration: p.duration,
            prompt: promptText,
            length,
            lengthStatus: PROMPT_LENGTH.getStatus(length),
            utilization: p.utilization,
            utilizationStatus: p.utilizationStatus,
            qualityScore: p.qualityScore,
            characters: p.characters,
            mouthAction: p.mouthAction,
            referenceImages: Array.isArray(p.referenceImages)
              ? p.referenceImages.map(r => ({ shotType: r.shotType || r.type || 'unknown' }))
              : []
          };
        })
      },
      storyboard: {
        shots: storyboardShots.map(s => ({
          id: s.id,
          scene: s.scene,
          type: s.type,
          duration: s.duration,
          timeline: s._timeline || s.cameraMovement?.timeline || null
        }))
      },
      stageList: Object.keys(stages)
    }
  };
}

function generateReviewReport(safeResult, totalDuration) {
  const stages = safeResult.stages || {};
  const prompts = stages.output?.prompts || [];

  let report = `# 饕餮 EP01 预生产审阅报告\n\n`;
  report += `**版本**: v6.4.0\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n`;
  report += `**总耗时**: ${(totalDuration / 1000).toFixed(1)}秒\n`;
  report += `**Prompt目标区间**: ${PROMPT_LENGTH.TARGET_MIN}-${PROMPT_LENGTH.TARGET_MAX}字符\n\n`;

  report += `## Stage执行状态\n\n`;
  (stages.stageList || []).forEach(name => {
    report += `- ✅ ${name}\n`;
  });
  report += `\n`;

  if (prompts.length > 0) {
    report += `## 镜头Prompt统计\n\n`;
    report += `| 镜头 | 字符数 | 状态 | 利用率 |\n`;
    report += `|------|--------|------|--------|\n`;
    prompts.forEach(p => {
      const statusIcon = p.lengthStatus === 'ideal' ? '✅' : p.lengthStatus === 'overflow' ? '⚠️超标' : '⚠️不足';
      report += `| ${p.shotId || '?'} | ${p.length} | ${statusIcon} | ${p.utilizationStatus || '-'} |\n`;
    });
    report += `\n`;

    report += `## 每镜完整Prompt\n\n`;
    prompts.forEach((p, i) => {
      const shotId = p.shotId || `S${String(i).padStart(2, '0')}`;
      report += `### ${shotId} (${p.length}字符 | ${p.lengthStatus})\n\n`;
      report += '```\n' + (p.prompt || '无Prompt') + '\n```\n\n';
    });
  }

  if (safeResult.errors && safeResult.errors.length > 0) {
    report += `## 错误与警告\n\n`;
    safeResult.errors.forEach(e => {
      report += `- **${e.stage || '未知'}**: ${e.message}\n`;
    });
  }

  return report;
}

// ========== 主流程 ==========
async function runPreProduction() {
  const reporter = new StatusReporter({ projectName: input.projectName });
  reporter.init();

  // 信号处理
  process.on('SIGTERM', () => { reporter.killed('SIGTERM', reporter.currentStage); process.exit(143); });
  process.on('SIGINT', () => { reporter.killed('SIGINT', reporter.currentStage); process.exit(130); });
  process.on('uncaughtException', (err) => { console.error('[uncaughtException]', err); reporter.fail(err, reporter.currentStage); process.exit(1); });
  process.on('unhandledRejection', (err) => { console.error('[unhandledRejection]', err); reporter.fail(err, reporter.currentStage); process.exit(1); });

  // 清理旧输出
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  mem('启动前');
  reporter.message(`🎬 预生产启动 v6.4.0\n项目：${input.projectName}\nPrompt目标：${PROMPT_LENGTH.TARGET_MIN}-${PROMPT_LENGTH.TARGET_MAX}字符`, true);

  const pipelineStart = Date.now();

  // 使用 runtime-standard 配置
  let pipeline = new NirathMasterPipeline({
    mode: 'nirath',
    useLLM: RUNTIME_STANDARD.pipeline.useLLM,
    skipDirectorReview: RUNTIME_STANDARD.pipeline.skipDirectorReview,
    skipScreenwriterOptimization: RUNTIME_STANDARD.pipeline.skipScreenwriterOptimization,
    projectConfig: {
      requiredCharacters: ['xiaoG', 'tao-tie'],
      isPreProduction: true,
      ownerApproved: true
    },
    statusReporter: reporter
  });

  try {
    reporter.stage('主链路执行', 10, '剧本生成 → 镜头生成 → 时间轴');
    mem('Pipeline初始化后');

    let result = await pipeline.execute(input);
    mem('Pipeline执行后');

    // 异步任务收尾
    reporter.stage('异步任务收尾', 85, '等待pending LLM任务');
    const pendingTasks = pipeline.getPendingAsyncTasks ? pipeline.getPendingAsyncTasks() : [];
    if (pendingTasks.length > 0) {
      try {
        await Promise.race([
          Promise.allSettled(pendingTasks),
          new Promise((_, reject) => setTimeout(() => reject(new Error('LLM任务超时')), 300000))
        ]);
      } catch (err) {
        console.log(`[异步等待] ${err.message}，继续保存当前结果`);
      }
    }

    const totalDuration = Date.now() - pipelineStart;

    // 瘦身结果
    const safeResult = slimPipelineResult(result);
    mem('结果瘦身后');

    // 写盘
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultPath = path.join(outputDir, `taotie-ep01-preproduction-${timestamp}.json`);
    const reportPath = path.join(outputDir, `taotie-ep01-preproduction-report-${timestamp}.md`);

    fs.writeFileSync(resultPath, JSON.stringify(safeResult, null, 2), 'utf8');
    mem('JSON写盘后');

    const report = generateReviewReport(safeResult, totalDuration);
    fs.writeFileSync(reportPath, report, 'utf8');
    mem('报告写盘后');

    // 释放大对象
    result = null;
    pipeline = null;
    if (global.gc) { global.gc(); mem('GC后'); }

    // 摘要
    const prompts = safeResult.stages.output.prompts;
    const promptStats = prompts.map(p => {
      const icon = p.lengthStatus === 'ideal' ? '✅' : p.lengthStatus === 'overflow' ? '⚠️超标' : '⚠️不足';
      return `${p.shotId}:${p.length}字${icon}`;
    }).join(' | ');

    const summary = `总耗时：${(totalDuration / 1000).toFixed(1)}秒\n镜头：${prompts.length}个\n${promptStats}\n错误：${safeResult.errors.length}个`;
    reporter.success(safeResult, summary);

    console.log(`\n📁 结果: ${resultPath}`);
    console.log(`📄 报告: ${reportPath}`);
    return { reportPath, resultPath };

  } catch (err) {
    reporter.fail(err, reporter.currentStage);
    console.error('\n❌ 预生产失败:', err.message);
    throw err;
  }
}

// ========== 输入数据 ==========
const input = {
  projectName: '山海经：饕餮·永恒饥饿 EP01',
  videoType: 'nirath',
  targetDuration: 70,
  core: {
    theme: '永恒饥饿的寓言——贪欲的极致与克制之道',
    emotionalArc: ['curiosity', 'tension', 'awe', 'caution', 'warmth'],
    beastId: 'tao-tie',
    beastName: '饕餮'
  },
  characters: {
    xiaoG: {
      id: 'xiaoG', name: '小G', role: 'protagonist',
      appearance: '8岁男孩，蓝色条纹睡衣，赤脚，Nirath旧世界唯一幸存者',
      age: 8, gender: 'male'
    },
    'tao-tie': {
      id: 'tao-tie', name: '饕餮', role: 'beast',
      appearance: '羊身人面神兽，肩高30米，火山岩装甲覆盖全身，巨口占面部三分之二，双眼生于腋下呈硫磺黄色',
      species: '神兽', height: 30
    }
  },
  world: {
    setting: 'Nirath星球南半球·钩吾废墟',
    habitat: '被远古战争摧毁的城市遗迹，地下埋藏大量重金属矿藏，曾是繁荣的远古文明聚落',
    lighting: '暗红色熔岩光 + 灰烬黑阴影 + 硫磺黄能量光',
    atmosphere: '火山灰弥漫，空气中充满硫磺气息，地面有熔岩裂缝'
  },
  scenes: [
    { id: 'S01', scene: '钩吾废墟入口', narration: '小G站在钩吾废墟边缘，眼前是一片被远古战争摧毁的城市遗迹。暗红色的熔岩光从地裂缝中透出，空气中弥漫着硫磺的气息。远处，一座巨大的阴影在灰烬中缓缓移动。', type: 'opening', characters: ['xiaoG'], duration: 12 },
    { id: 'S02', scene: '废墟深处', narration: '小G小心翼翼地穿过断裂的石柱群。突然，地面震动起来——暗红色的光芒从裂缝中喷涌而出，照亮了一个庞大的身影。那是饕餮，羊身人面的巨兽正在吞噬一块巨大的金属残骸。', type: 'building', characters: ['xiaoG', 'tao-tie'], duration: 14 },
    { id: 'S03', scene: '饕餮现身', narration: '饕餮缓缓转过身来。它的面部是一张巨大的人脸，庄严而深沉。双眼生于腋下，两团硫磺黄色的眼球在腋窝里缓缓转动，透出温和却令人不安的光芒。那张占据面部三分之二的巨口永远张着，利齿如同白玉般交错排列。', type: 'reveal', characters: ['tao-tie'], duration: 16 },
    { id: 'S04', scene: '对视与警惕', narration: '小G与饕餮对视。饕餮的前肢是人的手掌，五指修长，正轻轻刨动着地面的火山岩。它没有攻击，只是用那双腋下的眼睛静静注视着小G，仿佛在审视这个小小的闯入者。小G感到一种前所未有的压迫感——这不是恶意，而是纯粹的饥饿，无尽的饥饿。', type: 'climax', characters: ['xiaoG', 'tao-tie'], duration: 16 },
    { id: 'S05', scene: '克制与觉悟', narration: '小G缓缓后退，理解了饕餮的本质——它不是邪恶，而是贪婪的极致化身。在这个物质过剩的时代，我们是否也在不知不觉中成为了现代版的饕餮？小G转身离开，废墟中传来饕餮婴儿般的啼哭声，既是诱惑，也是警示。', type: 'resolution', characters: ['xiaoG'], duration: 22 }
  ],
  style: {
    visualStyle: 'Nirath原生风格：暗红色火山岩质感 + 熔岩橙能量光 + 灰烬黑阴影',
    pacing: 'classic', ratio: '16:9', duration: 70
  }
};

// ========== 启动 ==========
runPreProduction()
  .then(({ reportPath }) => {
    console.log('\n✅ 预生产完成！');
    console.log(`📄 审阅报告: ${reportPath}`);
  })
  .catch(() => {
    console.error('\n❌ 预生产失败');
    process.exit(1);
  });
