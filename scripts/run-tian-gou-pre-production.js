const { NirathMasterPipeline } = require('../systems/nirath-master-pipeline.js');
const fs = require('fs');

async function main() {
  console.log('🐕 启动天狗 EP01 预生产...');
  console.log('═══════════════════════════════════════');
  
  const input = {
    projectName: '山海经：天狗·双月守护者 EP01',
    videoType: 'nirath-cinematic',
    mode: 'nirath',
    duration: 75,
    totalDuration: 75,
    targetDuration: 75,
    ratio: '16:9',
    resolution: '1080p',
    characters: [
      { id: 'xiaoG', name: 'AgentX', role: 'protagonist' },
      { id: 'tian-gou', name: '天狗', role: 'creature' }
    ],
    scenes: [
      {
        id: 'S01',
        name: '双月迷途',
        description: 'AgentX在Nirath双月生态区迷路，银灰色植被在双月照耀下发出荧光。',
        duration: 12
      },
      {
        id: 'S02',
        name: '天狗现身',
        description: '天狗从银灰色植被中跃出，三纵纹白头盔在双月光下闪烁。',
        duration: 15
      },
      {
        id: 'S03',
        name: '引力风暴',
        description: '双月引力失衡，潮汐风暴席卷。天狗背部储能囊发光，帮助AgentX抵御引力。',
        duration: 18
      },
      {
        id: 'S04',
        name: '守护者之跃',
        description: '天狗用蓬松松鼠尾平衡身体，跃过AgentX头顶，形成保护屏障。',
        duration: 15
      },
      {
        id: 'S05',
        name: '双月齐照',
        description: '风暴平息，双月齐照。AgentX与天狗并肩，尾尖发光器官与双月共鸣。',
        duration: 15
      }
    ],
    style: {
      genre: 'sci-fi-mythology',
      tone: 'mysterious-epic',
      colorPalette: ['silver-gray', 'bioluminescent-blue', 'amber-moonlight']
    },
    beastDatabaseId: 'tian-gou'
  };
  
  const pipeline = new NirathMasterPipeline({
    mode: 'nirath',
    projectConfig: input,
    useLLM: true
  });
  
  try {
    const result = await pipeline.execute(input);
    
    console.log('\n📊 预生产结果');
    console.log('═══════════════════════════════════════');
    console.log(`✅ 状态: ${result.success ? '成功' : '失败'}`);
    console.log(`🎬 完成Stage数: ${Object.keys(result.stages).length}`);
    
    if (result.stages.storyboard) {
      const shots = result.stages.storyboard.shots || [];
      console.log(`📷 镜头数: ${shots.length}`);
      for (const shot of shots) {
        console.log(`  ${shot.id || shot.shotId}: ${shot.duration || '?'}s`);
      }
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`\n❌ 错误: ${result.errors.length}个`);
      for (const err of result.errors.slice(0, 5)) {
        console.log(`  - ${err.message}`);
      }
    }
    
    // 保存记录
    const recordPath = '/root/.openclaw/workspace/output/tian-gou-ep01-pre-production-record.json';
    fs.writeFileSync(recordPath, JSON.stringify({
      success: result.success,
      stages: Object.keys(result.stages),
      errors: result.errors?.map(e => e.message) || [],
      logs: result.logs?.slice(-50) || []
    }, null, 2));
    console.log(`\n💾 记录已保存: ${recordPath}`);
    
  } catch (e) {
    console.error('❌ 预生产失败:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('❌ 失败:', e);
  process.exit(1);
});
