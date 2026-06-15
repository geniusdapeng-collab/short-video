const { NirathMasterPipeline } = require('./systems/nirath-master-pipeline');
const pipeline = new NirathMasterPipeline({
  mode: 'generic'
});

// 队长已确认，跳过需求确认，进入完整预生产链路
pipeline.execute({
  projectName: '陈卓健康科普-横纹肌溶解',
  videoType: 'EDU',
  creativeIntensity: 0.6,
  duration: { target: 62, min: 59, max: 65 },
  style: { primary: 'REAL', secondary: [] },
  characters: [{
    id: 'chenzhuo',
    name: '陈卓',
    description: '穿警服的女士，讲解健康护理知识',
    role: '讲解者/主持人'
  }],
  structure: {
    opening: { enabled: true, title: '什么是横纹肌溶解', subtitle: '症状以及实验室检查' },
    ending: { style: 'summary', previewNext: false }
  },
  series: { isSeries: true, totalEpisodes: 3, currentEpisode: 1, contentIsolation: true },
  platform: '抖音',
  aspectRatio: '9:16'
}, { 
  skipRequirementConfirmation: true  // 队长已确认，跳过需求确认
}).then(result => {
  console.log('✅ 预生产完成:', result.success ? '成功' : '失败');
  if (result.outputPath) console.log('输出路径:', result.outputPath);
}).catch(err => {
  console.error('❌ 错误:', err.message);
});
