const path = require('path');

async function main() {
  try {
    // 使用预生产服务
    delete require.cache[require.resolve('./systems/preproduction-service')];
    const { runPreproduction } = require('./systems/preproduction-service');
    
    const inputPath = path.join(__dirname, 'stories', 'xiangxiang-maldives-input.json');
    const input = require(inputPath);
    
    console.log('[INFO] 香香马尔代夫海边预生产启动');
    console.log('[INFO] 项目:', input.projectName);
    console.log('[INFO] 类型:', input.videoType);
    console.log('[INFO] 场景:', input.settings?.location);
    
    const result = await runPreproduction(input, {
      mode: input.videoType,
      enableAudit: true
    });
    
    console.log('\n✅ 预生产完成!');
    console.log('  质量:', result.quality?.totalScore, '|', result.quality?.grade, '|', result.quality?.status);
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
