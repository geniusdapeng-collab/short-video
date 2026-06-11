/**
 * 白泽 EP01 预生产执行器 v6.5.43
 * 植入千问AI眼镜广告
 */
const { NirathMasterPipeline } = require('../systems/nirath-master-pipeline.js');
const { StatusReporter } = require('../systems/status-reporter.js');
const RUNTIME_STANDARD = require('../config/runtime-standard');
const PROMPT_LENGTH = require('../config/prompt-length');
const fs = require('fs');
const path = require('path');

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

  let report = `# 白泽 EP01 预生产审阅报告\n\n`;
  report += `**版本**: v6.5.43\n`;
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

async function runPreProduction() {
  const reporter = new StatusReporter({ projectName: input.projectName });
  reporter.init();

  process.on('SIGTERM', () => { reporter.killed('SIGTERM', reporter.currentStage); process.exit(143); });
  process.on('SIGINT', () => { reporter.killed('SIGINT', reporter.currentStage); process.exit(130); });
  process.on('uncaughtException', (err) => { console.error('[uncaughtException]', err); reporter.fail(err, reporter.currentStage); process.exit(1); });
  process.on('unhandledRejection', (err) => { console.error('[unhandledRejection]', err); reporter.fail(err, reporter.currentStage); process.exit(1); });

  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  mem('启动前');
  reporter.message(`🎬 预生产启动 v6.5.43\n项目：${input.projectName}\nPrompt目标：${PROMPT_LENGTH.TARGET_MIN}-${PROMPT_LENGTH.TARGET_MAX}字符`, true);

  const pipelineStart = Date.now();

  let pipeline = new NirathMasterPipeline({
    mode: 'nirath',
    useLLM: RUNTIME_STANDARD.pipeline.useLLM,
    skipDirectorReview: RUNTIME_STANDARD.pipeline.skipDirectorReview,
    skipScreenwriterOptimization: RUNTIME_STANDARD.pipeline.skipScreenwriterOptimization,
    projectConfig: {
      requiredCharacters: ['xiaoG', 'bai-ze'],
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

    const safeResult = slimPipelineResult(result);
    mem('结果瘦身后');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultPath = path.join(outputDir, `baize-ep01-preproduction-${timestamp}.json`);
    const reportPath = path.join(outputDir, `baize-ep01-preproduction-report-${timestamp}.md`);

    fs.writeFileSync(resultPath, JSON.stringify(safeResult, null, 2), 'utf8');
    mem('JSON写盘后');

    const report = generateReviewReport(safeResult, totalDuration);
    fs.writeFileSync(reportPath, report, 'utf8');
    mem('报告写盘后');

    result = null;
    pipeline = null;
    if (global.gc) { global.gc(); mem('GC后'); }

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

// ========== 输入数据：白泽的故事 + 千问AI眼镜广告 ==========
const input = {
  projectName: '山海经：白泽·万物之眼 EP01（千问AI眼镜植入）',
  videoType: 'nirath',
  targetDuration: 70,
  core: {
    theme: '万物有灵——智慧源于观察与敬畏',
    emotionalArc: ['curiosity', 'wonder', 'calm', 'understanding', 'warmth'],
    beastId: 'bai-ze',
    beastName: '白泽'
  },
  characters: {
    xiaoG: {
      id: 'xiaoG', name: '小G', role: 'protagonist',
      appearance: '8岁男孩，蓝色条纹睡衣，赤脚，Nirath旧世界唯一幸存者',
      age: 8, gender: 'male'
    },
    'bai-ze': {
      id: 'bai-ze', name: '白泽', role: 'beast',
      appearance: '通体雪白的神兽，狮身羊角，双目如琥珀般温润，能通晓万物语言，说话时会有淡淡的光晕从角尖散发',
      species: '神兽', height: 3
    }
  },
  world: {
    setting: 'Nirath星球北境·灵镜湖畔',
    habitat: '被永恒冰雪覆盖的湖畔，湖面如镜能映照万物，周围生长着发光的灵草，是白泽的栖息地',
    lighting: '冰蓝色天光 + 灵草淡绿荧光 + 白泽角尖温润金光',
    atmosphere: '宁静祥和，万物之声交织成自然的旋律，空气中带着清冽的雪香'
  },
  scenes: [
    { id: 'S01', scene: '灵镜湖畔', narration: '小G独自来到灵镜湖畔，湖面如镜，倒映着冰蓝色的天空。他蹲下身，好奇地触摸湖水，涟漪荡开，映出不一样的画面。远处，一双温润的琥珀色眼睛正在注视着他。', type: 'opening', characters: ['xiaoG'], duration: 12 },
    { id: 'S02', scene: '初遇白泽', narration: '小G抬起头，看到一只通体雪白的神兽从灵草丛中走出。它有着狮子的身体和弯曲的羊角，每一步都会让周围的灵草轻轻摇曳。白泽歪着头看他，目光中没有警惕，只有温和的好奇。', type: 'building', characters: ['xiaoG', 'bai-ze'], duration: 14 },
    { id: 'S03', scene: '万物之眼', narration: '白泽轻轻靠近小G，低下头，让他触摸自己的角。当小G的手指碰到羊角时，无数画面涌入他的脑海——他看到废墟中哭泣的婴儿、饕餮永恒的饥饿、应龙破碎的翅膀。白泽的眼睛里有着千年的智慧，它通晓万物，却从不评判。', type: 'reveal', characters: ['bai-ze'], duration: 16 },
    { id: 'S04', scene: '智慧对话', narration: '小G轻声问："你看到了我的过去？"白泽微微点头，角尖散发淡淡金光。它没有说话，但小G却听到了——声音直接在他心中响起，讲述着Nirath的历史，讲述着每个神兽的故事。这不是语言，而是记忆本身。', type: 'climax', characters: ['xiaoG', 'bai-ze'], duration: 16 },
    { id: 'S05', scene: '领悟与告别', narration: '小G理解了，白泽不是知识本身，而是通往知识的桥梁。真正的智慧不是知道一切，而是愿意倾听万物。他站起身，向白泽深深鞠躬。白泽用头轻轻蹭了蹭他的手心，然后转身消失在灵草丛中，只留下一缕金色的光痕。', type: 'resolution', characters: ['xiaoG'], duration: 22 }
  ],
  style: {
    visualStyle: 'Nirath原生风格：冰蓝色雪光 + 灵草淡绿荧光 + 白泽角尖温润金光',
    pacing: 'classic', ratio: '16:9', duration: 70
  },
  // ===== 千问AI眼镜广告植入 =====
  productPlacement: {
    brand: '千问AI眼镜',
    product: '千问AI眼镜S1',
    placement: {
      // S02: 小G佩戴千问AI眼镜记录白泽
      scene: 'S02',
      type: '自然使用场景',
      description: '小G佩戴千问AI眼镜S1，眼镜镜片上映出白泽的增强现实信息层——识别为"Nirath神兽·白泽·守护类"，显示古老的传说文字和实时翻译。小G轻声说："小镜，告诉我关于白泽的一切。"眼镜回应："白泽，通晓万物之兽，非语言，乃记忆之桥。"',
      visualDetail: '千问AI眼镜S1的钛合金镜框在冰蓝光线下反射柔和光泽，镜片显示淡金色的AR信息层，半透明UI不遮挡画面主体。镜腿上有"QWEN"字样，极简设计。',
      integration: '无缝融入叙事：眼镜作为小G探索Nirath世界的工具，自然记录和解读神兽信息，而非生硬打断。小G的疑问通过眼镜得到解答，推动剧情理解白泽。'
    }
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
