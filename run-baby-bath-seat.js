/**
 * 宝宝洗澡座椅营销短片预生产启动器
 * 项目：baby-bath-seat-promo-01
 * 模式：generic（温馨家庭纪实风格）
 * 卓越系统 v6.37-Peng-optimized
 */

const fs = require('fs');
const path = require('path');
const { NirathMasterPipeline } = require('./zhuoyue-system/core/nirath-master-pipeline.js');
const PortraitSelector = require('./characters/portrait-selector.js');

const WORKSPACE = '/root/.openclaw/workspace';
const OUTPUT = path.join(WORKSPACE, 'output', 'baby-bath-seat');

// 初始化定妆照选择器
const portraitSelector = new PortraitSelector();

// 确保输出目录存在
if (!fs.existsSync(OUTPUT)) {
  fs.mkdirSync(OUTPUT, { recursive: true });
}

// ====== 任务输入定义 ======
const input = {
  projectName: 'baby-bath-seat-promo-01',
  videoType: 'marketing',
  targetDuration: 60,
  style: '温馨家庭纪实风格，自然光浴室场景，柔和色调，温暖亲切',
  mode: 'generic',

  // 世界观设定
  world: {
    setting: 'modern-home',
    name: '温馨家庭浴室',
    style: '温馨家庭纪实风格，真实生活场景',
    location: '家庭浴室',
    lighting: '自然光+浴室暖白灯光，柔和明亮',
    atmosphere: '温暖、亲切、安全、舒适'
  },

  // 场景设计：带剧情的营销短片
  scenes: [
    {
      id: 'S01',
      name: '开场-焦虑准备',
      type: 'hook',
      duration: 10,
      description: '陈卓妈妈在浴室准备给香香洗澡，表情略显疲惫和担忧，看着浴缸发愁。香香在地上爬着玩，天真无邪。'
    },
    {
      id: 'S02',
      name: '痛点-手忙脚乱',
      type: 'pain-point',
      duration: 12,
      description: '没有洗澡座椅时，陈卓一手托着香香一手洗，香香在水里不安扭动，小手乱抓，水花四溅，妈妈手忙脚乱，额头冒汗。'
    },
    {
      id: 'S03',
      name: '转折-产品亮相',
      type: 'product-reveal',
      duration: 8,
      description: '宝宝专用洗澡座椅入镜，特写展示防滑底垫、柔软靠垫、可调节卡扣等安全设计，产品质感精致。'
    },
    {
      id: 'S04',
      name: '解决-安心洗浴',
      type: 'solution',
      duration: 15,
      description: '香香稳稳坐在洗澡座椅中，小背靠在柔软靠垫上，小腿自然垂在水中。陈卓轻松地用手给香香洗头、擦身，香香开心地拍水玩耍，咯咯笑。'
    },
    {
      id: 'S05',
      name: '情感升华-温馨时刻',
      type: 'emotional',
      duration: 10,
      description: '陈卓温柔地看着香香，香香仰起小脸对妈妈笑，小手伸向妈妈。妈妈握住宝宝小手，眼中充满爱意。水珠晶莹剔透，温馨氛围拉满。'
    },
    {
      id: 'S06',
      name: '收尾-产品定格',
      type: 'closing',
      duration: 5,
      description: '洗澡座椅特写，品牌Logo区域展示。画面柔和，温馨收尾。字幕：让宝宝爱上洗澡，让妈妈轻松安心。'
    }
  ],

  // 角色定义
  characters: {
    'xiangXiang': {
      id: 'xiangXiang',
      name: '香香',
      role: 'baby',
      species: 'human',
      origin: 'Earth',
      visual: {
        age: '7个月',
        gender: 'boy',
        build: 'average',
        height: 'medium',
        skinTone: 'warm',
        hair: 'black',
        eyes: 'brown',
        facialFeatures: 'asian'
      },
      personality: {
        core: 'warm',
        traits: ['kind', 'brave', 'curious', 'playful']
      },
      portraits: {
        frontal: path.join(WORKSPACE, 'characters/xiangXiang/portraits/xiangXiang-front.png'),
        side: path.join(WORKSPACE, 'characters/xiangXiang/portraits/xiangXiang-side.png'),
        threeQuarter: path.join(WORKSPACE, 'characters/xiangXiang/portraits/xiangXiang-threeQuarter.png'),
        closeup: path.join(WORKSPACE, 'characters/xiangXiang/portraits/xiangXiang-closeup.png')
      }
    },
    'chen-nurse': {
      id: 'chen-nurse',
      name: '陈卓',
      role: 'mother',
      species: 'human',
      origin: 'Earth',
      visual: {
        age: 30,
        gender: 'female',
        build: 'average',
        height: 'medium',
        skinTone: 'warm',
        hair: 'black',
        eyes: 'brown',
        facialFeatures: 'asian'
      },
      personality: {
        core: 'warm',
        traits: ['kind', 'patient', 'loving', 'nurturing']
      },
      // v6.6: 使用 PortraitSelector 动态选择定妆照
      // 场景→风格自动映射: 家庭→life-summer, 警局→police
      // 角度自动选择: front/closeup/fullBody/sitting/walking
      portraits: {
        front: portraitSelector.selectPortrait('chen-nurse', '客厅', 'front'),
        threeQuarter: portraitSelector.selectPortrait('chen-nurse', '客厅', 'threeQuarter'),
        side: portraitSelector.selectPortrait('chen-nurse', '客厅', 'side'),
        closeup: portraitSelector.selectPortrait('chen-nurse', '客厅', 'closeup'),
        fullBody: portraitSelector.selectPortrait('chen-nurse', '客厅', 'fullBody'),
        sitting: portraitSelector.selectPortrait('chen-nurse', '客厅', 'sitting')
      }
    }
  }
};

// ====== 执行预生产 ======
async function run() {
  console.log('🎬 =========================================');
  console.log('🎬 卓越系统 v6.37 - 宝宝洗澡座椅营销短片');
  console.log('🎬 项目:', input.projectName);
  console.log('🎬 模式:', input.mode);
  console.log('🎬 时长:', input.targetDuration, '秒');
  console.log('🎬 角色: 香香(7个月) + 陈卓(妈妈)');
  console.log('🎬 =========================================');
  console.log('');

  const pipeline = new NirathMasterPipeline({
    mode: 'generic',
    useLLM: true,
    skipDirectorReview: false,
    skipScreenwriterOptimization: false,
    projectConfig: {
      requiredCharacters: ['xiangXiang', 'chen-nurse'],
      isPreProduction: true,
      ownerApproved: true
    },
    outputDir: OUTPUT
  });

  try {
    const result = await pipeline.execute(input);

    console.log('');
    console.log('✅ 预生产完成!');
    console.log('  结果:', result.success ? '成功' : '失败');
    console.log('  阶段:', Object.keys(result.stages || {}).join(', '));

    // 保存结果
    const outputPath = path.join(OUTPUT, 'preproduction-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log('  输出:', outputPath);

    return result;
  } catch (err) {
    console.error('');
    console.error('❌ 预生产失败:', err.message);
    console.error(err.stack);
    throw err;
  }
}

run().catch(() => process.exit(1));
