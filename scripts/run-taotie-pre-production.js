const { NirathMasterPipeline } = require('../systems/nirath-master-pipeline.js');
const fs = require('fs');

async function main() {
  console.log('🐉 启动饕餮 EP01 预生产...');
  console.log('═══════════════════════════════════════');
  
  const input = {
    projectName: '山海经：饕餮· hunger and armor EP01',
    videoType: 'nirath-cinematic',
    mode: 'nirath',
    duration: 75,
    totalDuration: 75,
    targetDuration: 75,
    ratio: '16:9',
    resolution: '1080p',
    characters: [
      { id: 'xiaoG', name: '小G', role: 'protagonist' },
      { id: 'taotie', name: '饕餮', role: 'creature' }
    ],
    scenes: [
      {
        id: 'S01',
        name: '火山苏醒',
        description: '小G在Nirath火山熔岩地带探索，地面突然震动，火山岩裂开。',
        duration: 12,
        characters: ['xiaoG', 'taotie']
      },
      {
        id: 'S02',
        name: '巨口现世',
        description: '饕餮从火山岩中完全苏醒，巨口占面部三分之二，永远饥饿，硫磺黄色的腋下双眼锁定小G。',
        duration: 15,
        characters: ['xiaoG', 'taotie']
      },
      {
        id: 'S03',
        name: '饥饿真相',
        description: '小G发现饕餮不是想吃他，而是被火山岩中的远古封印困住，永远饥饿是诅咒。',
        duration: 18,
        characters: ['xiaoG', 'taotie']
      },
      {
        id: 'S04',
        name: '解封之跃',
        description: '小G利用智慧解开封印，饕餮的火山岩装甲裂开，露出真正的力量。',
        duration: 15,
        characters: ['xiaoG', 'taotie']
      },
      {
        id: 'S05',
        name: '盟友之约',
        description: '饕餮不再饥饿，成为小G的盟友。火山岩装甲重组，硫磺黄眼变成温暖的金色。',
        duration: 15,
        characters: ['xiaoG', 'taotie']
      }
    ],
    style: {
      genre: 'sci-fi-mythology',
      tone: 'epic-redemption',
      colorPalette: ['dark-grey-black', 'sulfur-yellow', 'volcanic-red', 'molten-orange']
    },
    beastDatabaseId: 'taotie'
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
    
    // 保存结果
    const outputPath = `./output/taotie-ep01-preproduction-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 结果已保存: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 预生产失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
