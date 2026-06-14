/**
 * 医疗科普 EP01 - 横纹肌溶解 v6.5.66
 * 卓越系统最新版 + 创意指数 0.6
 */

const { NirathMasterPipeline } = require('./zhuoyue-system/core/nirath-master-pipeline.js');
const path = require('path');

const input = {
  // 视频类型
  videoType: 'health_edu',
  type: 'health_edu',
  
  // 创意指数（用户指定）
  creativeIntensity: 0.6,
  
  // 主角信息
  character: {
    id: 'chen-nurse',
    name: '陈卓',
    role: 'nurse',
    description: '穿警服的护士小姐姐，30岁，讲解居民健康护理知识',
    portraitStyle: 'police-uniform-realistic',
    portraitPaths: {
      front: 'characters/chen-nurse/portraits/chen-nurse-police-front.png',
      threeQuarter: 'characters/chen-nurse/portraits/chen-nurse-police-threeQuarter.png',
      side: 'characters/chen-nurse/portraits/chen-nurse-police-side.png',
      closeup: 'characters/chen-nurse/portraits/chen-nurse-police-closeup.png',
      fullBody: 'characters/chen-nurse/portraits/chen-nurse-police-fullBody.png'
    }
  },
  
  // 视频内容
  title: '什么是横纹肌溶解——横纹肌溶解的症状以及实验室检查',
  subtitle: '全民健康科普第一集',
  episode: 1,
  totalEpisodes: 3,
  projectName: 'health-edu-ep01',
  
  // 角色定义（需求对齐闸机必需）
  characters: [
    {
      id: 'chen-nurse',
      name: '陈卓',
      role: 'host',
      description: '穿警服的护士小姐姐，30岁，讲解居民健康护理知识',
      portraitStyle: 'police-uniform-realistic',
      portraitPaths: {
        front: 'characters/chen-nurse/portraits/chen-nurse-police-front.png',
        threeQuarter: 'characters/chen-nurse/portraits/chen-nurse-police-threeQuarter.png',
        side: 'characters/chen-nurse/portraits/chen-nurse-police-side.png',
        closeup: 'characters/chen-nurse/portraits/chen-nurse-police-closeup.png',
        fullBody: 'characters/chen-nurse/portraits/chen-nurse-police-fullBody.png'
      }
    }
  ],
  
  // 场景定义（需求对齐闸机必需）
  scenes: [
    { id: 'S01', type: 'introduction', description: '陈卓介绍横纹肌溶解概念' },
    { id: 'S02', type: 'explanation', description: '横纹肌溶解的症状讲解' },
    { id: 'S03', type: 'demonstration', description: '实验室检查指标解读' },
    { id: 'S04', type: 'conclusion', description: '总结与注意事项' }
  ],
  
  // 内容描述
  core: {
    topic: '横纹肌溶解的症状以及实验室检查',
    description: '穿警服的护士小姐姐陈卓女士，讲解居民健康护理知识，进行全民健康科普。这是第一集，讲解横纹肌溶解的症状以及实验室检查。',
    targetAudience: '普通居民',
    tone: '专业但通俗易懂，生动形象'
  },
  
  // 制作要求
  targetDuration: 65, // 59-65秒，取上限
  minDuration: 59,
  maxDuration: 65,
  style: 'realistic',
  quality: 'high',
  
  // 片头设置
  opening: {
    enabled: true,
    title: '全民健康科普',
    subtitle: '什么是横纹肌溶解——横纹肌溶解的症状以及实验室检查',
    episode: '第一集',
    showEpisodeNumber: false // 不显示EP01
  },
  
  // 注意事项
  constraints: {
    noNextEpisodePreview: true, // 不预告下一集
    noMedicalMisinformation: true, // 医学事实准确
    singleHost: true, // 只有陈卓一个人讲解
    naturalBodyLanguage: true, // 自然肢体语言
    walkingPresentation: true // 边走边介绍
  },
  
  // 输出配置
  outputDir: 'output/health-edu-ep01-v6.5.66',
  
  // 模式
  mode: 'generic', // 通用模式（非Nirath）
  series: 'health-edu'
};

async function run() {
  console.log('🎬 ===========================================');
  console.log('🎬 医疗科普 EP01 - 横纹肌溶解 v6.5.66');
  console.log('🎬 创意指数: 0.6');
  console.log('🎬 ===========================================\n');
  
  const pipeline = new NirathMasterPipeline({
    outputDir: input.outputDir,
    mode: 'generic'
  });
  
  try {
    const result = await pipeline.execute(input);
    
    console.log('\n✅ 预生产完成！');
    console.log(`📊 版本: ${result.version}`);
    console.log(`📊 镜头数: ${result.stages?.render?.length || 0}`);
    console.log(`📊 渲染总字符: ${result.stages?.render?.reduce((sum, p) => sum + (p.prompt?.length || p.length || 0), 0) || 0}`);
    console.log(`📊 总时长: ${result.duration?.total || 'N/A'}秒`);
    console.log(`🎨 创意指数: ${result.creativeIntensity} (模块激活: ${result.creativeIntensityReport?.activeModules?.length || 0}/14)`);
    console.log(`📁 输出目录: ${input.outputDir}`);
    
    // 保存结果
    const fs = require('fs').promises;
    await fs.mkdir(input.outputDir, { recursive: true });
    await fs.writeFile(
      path.join(input.outputDir, 'preproduction-result.json'),
      JSON.stringify(result, null, 2),
      'utf8'
    );
    
    console.log(`💾 结果已保存: ${path.join(input.outputDir, 'preproduction-result.json')}`);
    
  } catch (error) {
    console.error('❌ 预生产失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();
