/**
 * 宝宝洗澡座椅营销短片预生产启动器 v2
 * 项目：baby-bath-seat-promo-01
 * 模式：generic（温馨家庭纪实风格）
 * 卓越系统 v6.37-Peng-optimized
 * 
 * 更新：注入完整商品档案 + 重新设计剧情场景
 */

const fs = require('fs');
const path = require('path');
const { NirathMasterPipeline } = require('./zhuoyue-system/core/nirath-master-pipeline.js');

const WORKSPACE = '/root/.openclaw/workspace';
const OUTPUT = path.join(WORKSPACE, 'output', 'baby-bath-seat');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT)) {
  fs.mkdirSync(OUTPUT, { recursive: true });
}

// ====== 完整商品档案（注入链路）======
const PRODUCT_PROFILE = {
  brand: 'YUNWEI 孕味妈咪',
  model: 'NO.1',
  fullName: 'YUNWEI 孕味妈咪 多功能四合一宝宝座椅',
  positioning: '婴幼儿多功能护理座椅',
  tagline: '一椅四用，从洗澡到滑行，360°全包围守护，赛车造型让宝宝爱上坐定',
  oneSentence: '不只是洗澡，更是哄娃神器',
  targetAudience: '0-3岁婴幼儿家长（尤其是新手妈妈）',
  coreScenes: ['洗澡', '学坐', '室内移动', '用餐'],
  color: '柔灰蓝（白+深蓝底座+黄色护栏）',
  design: '赛车造型工业设计，撞色设计',
  
  features: [
    '多功能四合一（洗澡椅+学坐椅+溜溜车+餐椅）',
    '360°全包围安全座舱，环形护栏防侧翻',
    '赛车造型工业设计，NO.1/06标识',
    '可翻转护栏，按压解锁，宝宝进出不卡腿',
    '可更换把手（T型/圆环型）',
    '可拆卸底座（深蓝底座+白色吸盘）',
    '可拆卸万向轮，安装即变溜溜车',
    '丝滑万向轮，化身室内小跑车',
    '加高设计，辅助宝宝练习坐立',
    '防滑吸盘底座，双重安全保障',
    '升级Pro全包围款',
    '经典撞色：白+深蓝+黄'
  ],
  
  marketingKeywords: {
    functional: '四合一、多功能、全包围、可拆卸、模块化',
    emotional: '解放妈妈双手、哄娃神器、宝宝的移动乐园',
    safety: '360°环抱、防侧翻、防滑吸盘、不卡腿',
    visual: '赛车造型、NO.1、撞色设计、工业感'
  },
  
  accessories: '海洋球×3、洗头刷×1、吸盘×4、可更换T型把手',
  
  productImages: [
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-main.jpg'),
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-flip-feature.jpg'),
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-multi-function.jpg'),
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-brand-positioning.jpg'),
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-four-in-one.jpg'),
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-360-cockpit.jpg'),
    path.join(WORKSPACE, 'marketing/baby-bath-seat/product/product-walker-mode.jpg')
  ]
};

// ====== 任务输入定义（带剧情设计）======
const input = {
  projectName: 'baby-bath-seat-promo-01',
  videoType: 'marketing',
  targetDuration: 60,
  style: '温馨家庭纪实风格，自然光浴室场景，柔和色调，温暖亲切',
  mode: 'generic',
  
  // 商品档案注入
  product: PRODUCT_PROFILE,

  // 世界观设定
  world: {
    setting: 'modern-home',
    name: '温馨家庭',
    style: '温馨家庭纪实风格，真实生活场景',
    location: '家庭浴室/客厅',
    lighting: '自然光+暖白灯光，柔和明亮',
    atmosphere: '温暖、亲切、安全、舒适、轻松'
  },

  // ====== 场景设计：带剧情的营销短片（60秒）======
  // 剧情主线：妈妈给香香洗澡遇到痛点 → YUNWEI座椅解决 → 展示多功能 → 情感升华
  scenes: [
    {
      id: 'S01',
      name: '开场-洗澡焦虑',
      type: 'hook',
      duration: 10,
      description: '浴室场景。陈卓（妈妈）给香香准备洗澡，香香在浴室地板上爬来爬去，不安分。妈妈看着浴缸发愁，担心宝宝洗澡不安全。',
      characters: ['xiangXiang', 'chen-nurse'],
      emotionPhase: 'tension',
      importance: 8,
      visualComplexity: 5
    },
    {
      id: 'S02',
      name: '冲突-手忙脚乱',
      type: 'pain-point',
      duration: 8,
      description: '没有座椅，妈妈一手扶着香香一手洗，香香扭动不安，小脚乱蹬，水花溅到妈妈脸上。妈妈额头冒汗，手忙脚乱。',
      characters: ['xiangXiang', 'chen-nurse'],
      emotionPhase: 'frustration',
      importance: 9,
      visualComplexity: 6
    },
    {
      id: 'S03',
      name: '转折-产品亮相',
      type: 'product-reveal',
      duration: 10,
      description: 'YUNWEI 孕味妈咪 NO.1 多功能四合一宝宝座椅入镜。360°全包围黄色护栏，赛车造型流线底座，白色软垫座垫。特写展示防滑纹理、吸盘底座、NO.1标识。',
      characters: ['xiangXiang'],
      emotionPhase: 'curiosity',
      importance: 10,
      visualComplexity: 7
    },
    {
      id: 'S04',
      name: '解决-安心洗澡',
      type: 'solution',
      duration: 15,
      description: '香香稳稳坐在YUNWEI座椅中，360°环抱护栏保护。妈妈轻松给宝宝洗头、擦身，香香开心拍水。按压解锁护栏翻转，宝宝进出不卡腿。展示可拆卸底座、吸盘防滑。',
      characters: ['xiangXiang', 'chen-nurse'],
      emotionPhase: 'relief',
      importance: 9,
      visualComplexity: 6
    },
    {
      id: 'S05',
      name: '升级-多功能展示',
      type: 'feature-demo',
      duration: 10,
      description: '快速切换展示：座椅装上底座→学坐椅模式；装上底座+万向轮→溜溜车模式（丝滑万向轮，化身室内小跑车）。宝宝开心滑行，妈妈轻松推着。一椅四用，不只是洗澡更是哄娃神器。',
      characters: ['xiangXiang', 'chen-nurse'],
      emotionPhase: 'joy',
      importance: 8,
      visualComplexity: 7
    },
    {
      id: 'S06',
      name: '情感-温馨时刻',
      type: 'emotional',
      duration: 7,
      description: '妈妈温柔看着香香，香香仰脸对妈妈笑。妈妈握住宝宝小手。水珠晶莹剔透。温馨氛围。',
      characters: ['xiangXiang', 'chen-nurse'],
      emotionPhase: 'warmth',
      importance: 7,
      visualComplexity: 5
    },
    {
      id: 'S07',
      name: '收尾-品牌定格',
      type: 'closing',
      duration: 10,
      description: 'YUNWEI 孕味妈咪 NO.1 座椅特写，360°全包围座舱，赛车造型。品牌Logo+NO.1标识。字幕：一椅四用，从洗澡到滑行。不只是洗澡，更是哄娃神器。解放妈妈双手。',
      characters: [],
      emotionPhase: 'pride',
      importance: 6,
      visualComplexity: 4
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
      portraits: {
        frontal: path.join(WORKSPACE, 'characters/chen-nurse/portraits/chen-nurse-v4.1-front.png'),
        side: path.join(WORKSPACE, 'characters/chen-nurse/portraits/chen-nurse-v4.1-side.png'),
        threeQuarter: path.join(WORKSPACE, 'characters/chen-nurse/portraits/chen-nurse-v4.1-threeQuarter.png'),
        closeup: path.join(WORKSPACE, 'characters/chen-nurse/portraits/chen-nurse-v4.1-closeup.png')
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
  console.log('🎬 镜头:', input.scenes.length, '个');
  console.log('🎬 角色: 香香(7个月) + 陈卓(妈妈)');
  console.log('🎬 商品: YUNWEI 孕味妈咪 NO.1');
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
    const outputPath = path.join(OUTPUT, 'preproduction-result-v2.json');
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
