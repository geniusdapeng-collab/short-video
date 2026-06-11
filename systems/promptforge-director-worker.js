/**
 * PromptForge Director Worker v6.5.46
 * 子进程隔离运行三阶 LLM 流水线
 * 修复：增加内存保护、异常捕获、强制GC
 */

const fs = require('fs');
const path = require('path');

// ========== v6.5.46-fix: 内存保护与异常捕获 ==========
process.on('uncaughtException', (err) => {
  console.error('[WORKER] ❌ 未捕获异常:', err.message);
  console.error('[WORKER] 堆栈:', err.stack);
  try {
    const outputPath = process.argv[3];
    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack,
        stage: 'uncaughtException'
      }));
    }
  } catch (e) {}
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[WORKER] ❌ 未处理Promise拒绝:', reason);
  try {
    const outputPath = process.argv[3];
    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify({
        success: false,
        error: String(reason),
        stage: 'unhandledRejection'
      }));
    }
  } catch (e) {}
  process.exit(1);
});

// 强制GC配置（主进程已通过 --expose-gc 传递）
const gcInterval = global.gc ? setInterval(() => {
  try {
    global.gc();
  } catch (e) {}
}, 60000) : null; // 每60秒强制GC

// 解析命令行参数
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('用法: node promptforge-director-worker.js <input.json> <output.json>');
  process.exit(1);
}

// 读取输入
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const { rawReport, projectConfig } = input;

// ========== Mock 依赖实现 ==========

const BeastArchive = {
  async get(beastId) {
    // 从本地文件或 rawReport 中读取神兽档案
    const beastPath = path.join(process.cwd(), 'systems', 'beast-database', 'beasts', `${beastId}.json`);
    try {
      if (fs.existsSync(beastPath)) {
        return JSON.parse(fs.readFileSync(beastPath, 'utf8'));
      }
    } catch (e) {}
    
    // 回退：从 rawReport 中提取
    return {
      id: beastId,
      name: beastId,
      appearance: '神话异兽形态',
      abilities: ['吞噬', '变形'],
      habitat: 'Nirath异世界'
    };
  }
};

const NirathArchive = {
  async getVisual(emotion) {
    return {
      dualStar: 'Aurelius 5800K + Silvana 6500K',
      magneticField: '3.2 Tesla',
      gravity: '0.82G',
      elements: ['双恒星光照', '磁场可见', '低重力飘浮', '能量孢子', '磁丝树', '地脉光']
    };
  }
};

const DirectorStyleLib = {
  async select(emotion, count) {
    return [
      { name: 'Cameron', signature: '史诗级视觉奇观' },
      { name: 'Villeneuve', signature: '克制氛围与宏大尺度' },
      { name: 'Spielberg', signature: '情感共鸣与奇观平衡' }
    ].slice(0, count);
  }
};

const NarrativePrinciples = {
  core: '心灵碰撞——两个生命体的相遇与理解',
  perspective: '异兽视角',
  humanRole: '闯入者'
};

const DialogueLib = {
  getReferences(emotion) {
    return [
      '你是谁？为何闯入我的领域？',
      '我能感受到你的记忆……如此沉重。',
      '在这个世界，饥饿不是欲望，而是存在本身。'
    ];
  }
};

const CameraMovementLib = {
  getForScene(scene, emotion) {
    return [
      { movement: 'extreme_wide', speed: 0.3, desc: '建立环境尺度' },
      { movement: 'dolly_in', speed: 0.5, desc: '推近主体' },
      { movement: 'orbit', speed: 0.4, desc: '环绕观察' },
      { movement: 'drift', speed: 0.2, desc: '缓慢漂移' }
    ];
  }
};

const MicroExpressionLib = {
  getForEmotion(emotion) {
    return [
      '瞳孔微微收缩',
      '呼吸节奏变化',
      '手指无意识颤抖',
      '嘴角轻微抽动'
    ];
  }
};

const LightingLib = {
  getForScene(scene, emotion) {
    return {
      keyLight: 'Aurelius 5800K 暖金主光',
      fillLight: 'Silvana 6500K 银白辅光',
      ambient: '地脉光幽蓝氛围',
      colorTemp: '5800K+6500K双色'
    };
  }
};

const QualityStandard = {
  version: 'v3.0',
  requiredBlocks: ['视觉', '镜头时间轴', '环境音效']
};

// 导入 LLMEngine
const { LLMEngine } = require('./llm-reasoning-engine');

// 创建 LLM 客户端（使用 LLMEngine，统一配置）
const LLMClient = {
  async complete(prompt, options = {}) {
    const maxTokens = options.maxTokens || 4096;
    const llm = new LLMEngine({
      model: 'kimi-k2p6',
      mode: 'production',
      maxRetries: 3,
      maxTokens: maxTokens,
      temperature: 1,
      topP: 0.95
    });
    
    const result = await llm.reason(prompt, { 
      systemPrompt: '你是 PromptForge 导演编排系统，负责三阶流水线创作。',
      timeoutMs: 180000 
    });
    
    return { text: result.text, content: result.text };
  }
};

// 导入 PromptForge
const { PromptForge } = require('./promptforge-director.js');

// 创建 PromptForge 实例（完整依赖注入）
const forge = new PromptForge({
  llmClient: LLMClient,
  log: (tag, msg) => console.log(`[${tag}] ${msg}`),
  beastArchive: BeastArchive,
  nirathArchive: NirathArchive,
  directorStyleLib: DirectorStyleLib,
  narrativePrinciples: NarrativePrinciples,
  dialogueLib: DialogueLib,
  cameraMovementLib: CameraMovementLib,
  microExpressionLib: MicroExpressionLib,
  lightingLib: LightingLib,
  qualityStandard: QualityStandard
});

// 运行三阶流水线
async function run() {
  let stage = 'init';
  try {
    console.log('[WORKER] 🎬 PromptForge 三阶流水线启动 v6.5.46');
    console.log('[WORKER] 📊 输入镜头数:', rawReport.shots?.length || 0);
    
    // 打印初始内存状态
    if (global.gc) {
      global.gc();
      const mem = process.memoryUsage();
      console.log(`[WORKER] 💾 初始内存 | heapUsed=${Math.round(mem.heapUsed/1024/1024)}MB rss=${Math.round(mem.rss/1024/1024)}MB`);
    }
    
    stage = 'orchestrate';
    const result = await forge.orchestrate(rawReport, projectConfig);
    
    // 完成后强制GC
    if (global.gc) {
      global.gc();
      const mem = process.memoryUsage();
      console.log(`[WORKER] 💾 完成后内存 | heapUsed=${Math.round(mem.heapUsed/1024/1024)}MB rss=${Math.round(mem.rss/1024/1024)}MB`);
    }
    
    console.log('[WORKER] ✅ 三阶流水线完成');
    console.log('[WORKER] 📊 质量分:', result.qualityReport?.overallScore);
    console.log('[WORKER] 📊 通过状态:', result.qualityReport?.overallPassed);
    
    // 写入输出
    const output = {
      success: true,
      shots: result.shots.map(s => ({
        id: s.id || s.shotId || 'unknown',
        finalPrompt: s.finalPrompt || s.prompt || ''
      })),
      qualityReport: result.qualityReport,
      vision: result.vision,
      mode: 'three-stage-pipeline',
      version: 'v6.5.46'
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log('[WORKER] 💾 输出已写入:', outputPath);
    
    // 清理定时器
    if (gcInterval) clearInterval(gcInterval);
    
  } catch (e) {
    console.error(`[WORKER] ❌ 三阶流水线失败(阶段=${stage}):`, e.message);
    console.error(e.stack);
    
    // 写入失败输出
    const fallback = {
      success: false,
      error: e.message,
      stack: e.stack,
      stage: stage,
      mode: 'three-stage-fallback',
      shots: (rawReport.shots || []).map(s => ({
        id: s.id,
        finalPrompt: s.prompt || ''
      }))
    };
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
    } catch (writeErr) {
      console.error('[WORKER] ❌ 写入失败输出也失败:', writeErr.message);
    }
    
    if (gcInterval) clearInterval(gcInterval);
    process.exit(1);
  }
}

run();
