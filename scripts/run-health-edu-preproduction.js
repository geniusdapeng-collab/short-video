/**
 * 健康科普视频预生产启动器
 * 项目：横纹肌溶解第一集 - 症状与实验室检查
 * 模式：generic（非Nirath世界观）
 */

const fs = require('fs');
const path = require('path');
const { NirathMasterPipeline } = require('../systems/nirath-master-pipeline.js');

const WORKSPACE = '/root/.openclaw/workspace';
const OUTPUT = path.join(WORKSPACE, 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT)) {
  fs.mkdirSync(OUTPUT, { recursive: true });
}

// ====== 任务输入定义 ======
const input = {
  projectName: 'rhabdomyolysis-ep01',
  videoType: 'health-education',
  targetDuration: 62, // 59-65秒，取中间值
  style: '超写实纪录片风格，真实医疗科普场景，自然光，专业医疗环境',
  mode: 'generic', // 明确使用generic模式

  // 世界观设定（generic模式使用现实世界观）
  world: {
    setting: 'modern-medical-education',
    name: '健康科普讲堂',
    style: '超写实纪录片风格，真实医疗科普场景',
    location: '社区健康讲座现场',
    lighting: '自然光+室内柔和补光',
    atmosphere: '专业、亲切、通俗易懂'
  },

  // 场景设计：第一集聚焦症状+实验室检查
  scenes: [
    {
      id: 'S01',
      name: '开场介绍',
      type: 'establishing',
      duration: 12,
      description: '陈女士开场自我介绍，介绍今天的主题——横纹肌溶解'
    },
    {
      id: 'S02',
      name: '症状讲解',
      type: 'explanation',
      duration: 18,
      description: '讲解横纹肌溶解的三大典型症状：肌肉疼痛/无力/肿胀、茶色尿/酱油色尿、全身乏力'
    },
    {
      id: 'S03',
      name: '实验室检查',
      type: 'explanation',
      duration: 18,
      description: '讲解关键实验室检查指标：肌酸激酶CK值、肌红蛋白、肾功能指标'
    },
    {
      id: 'S04',
      name: '案例展示',
      type: 'demonstration',
      duration: 10,
      description: '李明教练作为模特展示肌肉检查动作，小G在旁聆听互动'
    },
    {
      id: 'S05',
      name: '总结强调',
      type: 'closing',
      duration: 4,
      description: '陈女士总结第一集要点，强调出现症状及时就医'
    }
  ],

  // 角色定义（引用已有角色档案）
  characters: {
    'chen-nurse': {
      id: 'chen-nurse',
      name: '陈女士',
      role: 'host',
      roleType: 'health-educator',
      description: '穿警服的护士，主讲人，专业亲和',
      isProtagonist: true
    },
    'xiaoG': {
      id: 'xiaoG',
      name: '小G',
      role: 'audience',
      roleType: 'listener',
      description: '8岁男孩，现场听众，听得津津有味',
      isProtagonist: false
    },
    'coach-li': {
      id: 'coach-li',
      name: '李明教练',
      role: 'model',
      roleType: 'demonstrator',
      description: '运动康复专家，模特演员，展示案例',
      isProtagonist: false
    }
  },

  // 叙事要求
  narrative: {
    tone: '专业科普，通俗易懂，亲切温暖',
    avoid: ['预告下一集内容', '提及第二集或第三集'],
    focus: '第一集内容：横纹肌溶解的症状和实验室检查',
    language: '中文口语化，避免过于学术的术语，必要时用比喻解释'
  },

  // 制作约束
  constraints: {
    noTrailer: true, // 不预告下一集
    realisticOnly: true, // 全写实
    noFantasy: true, // 禁止奇幻元素
    maxDuration: 65,
    minDuration: 59
  }
};

// ====== 启动预生产 ======
async function runPreproduction() {
  const startTime = Date.now();
  console.log(`🎬 启动健康科普视频预生产`);
  console.log(`   项目: ${input.projectName}`);
  console.log(`   主题: 横纹肌溶解 - 症状与实验室检查`);
  console.log(`   时长: ${input.targetDuration}秒`);
  console.log(`   模式: ${input.mode || 'generic'}`);
  console.log(`   时间: ${new Date().toISOString()}`);
  console.log('');

  const pipeline = new NirathMasterPipeline({
    workspace: WORKSPACE,
    outputDir: OUTPUT,
    mode: input.mode || 'generic',
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
      process.exit(1);
    }

    console.log(`✅ 前置检查通过 | 角色数: ${preflight.characterCount}`);
    for (const p of preflight.portraits) {
      console.log(`   ✅ ${p.charId}: ${p.foundAngles?.length || 0}个角度`);
    }
    console.log('');

    // 执行完整链路
    console.log('🚀 启动完整预生产链路...');
    const result = await pipeline.execute(input);

    // 保存结果
    const outputFile = path.join(OUTPUT, `${input.projectName}-preproduction.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log('✅ 预生产完成！');
    console.log(`   输出文件: ${outputFile}`);
    console.log(`   总耗时: ${duration.toFixed(1)}秒`);
    console.log(`   成功: ${result.success}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`   错误数: ${result.errors.length}`);
      for (const err of result.errors.slice(0, 5)) {
        console.log(`   ⚠️ ${err.message || err}`);
      }
    }

    // 输出简化的镜头信息
    const prompts = result.stages?.output?.prompts || [];
    console.log('');
    console.log(`📋 生成镜头数: ${prompts.length}`);
    for (const p of prompts.slice(0, 10)) {
      console.log(`   ${p.shotId || p.scene}: ${(p.prompt || '').substring(0, 60)}...`);
    }

  } catch (error) {
    console.error('❌ 预生产失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runPreproduction();
