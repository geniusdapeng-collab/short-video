/**
 * 超短裙系统 + 极限运动镜头库 示例
 * 版本: v0.7.0-xtreme-preview
 * 
 * 使用方式：
 * node scripts/short-video-xtreme-demo.js [运动类型] [视角] [时长]
 * 
 * 示例：
 * node scripts/short-video-xtreme-demo.js alpine pov 15
 * node scripts/short-video-xtreme-demo.js surfing follow 10
 * node scripts/short-video-xtreme-demo.js motocross combo 15
 */

'use strict';

const { XtremeShotLibrary } = require('../systems/xtreme-shot-library');

async function main() {
  const sport = process.argv[2] || 'alpine';
  const angle = process.argv[3] || 'pov';
  const duration = parseInt(process.argv[4]) || 15;

  const lib = new XtremeShotLibrary();

  console.log('🩲 超短裙系统 + 🎬 极限运动镜头库');
  console.log('='.repeat(60));
  console.log(`运动类型: ${lib.getSports().find(s => s.id === sport)?.name || sport}`);
  console.log(`视角: ${angle}`);
  console.log(`目标时长: ${duration}秒`);
  console.log('='.repeat(60));

  if (angle === 'combo') {
    // 组合模式
    console.log('\n🎬 组合模式 - 肾上腺素爆发序列');
    const result = lib.generateShortVideoShots({ 
      sport, 
      sequence: 'adrenaline', 
      totalDuration: duration 
    });
    
    console.log(`\n总时长: ${result.totalDuration}秒`);
    console.log(`运动: ${result.sport}`);
    console.log(`序列: ${result.sequence}`);
    console.log('\n镜头列表:');
    
    for (const shot of result.shots) {
      console.log(`\n  🎥 ${shot.name} (${shot.duration}秒)`);
      console.log(`     角度: ${shot.angle} | 强度: ${shot.intensity}/10`);
      console.log(`     目的: ${shot.purpose}`);
      console.log(`     提示词: ${shot.prompt.substring(0, 80)}...`);
    }

  } else {
    // 单镜头模式
    console.log(`\n📷 单镜头模式 - ${angle}视角`);
    
    if (angle === 'pov') {
      console.log('👁️ 第一视角 = 身临其境，代入感拉满');
    } else if (angle === 'follow') {
      console.log('📹 跟拍 = 专业赛事感，动作完整');
    } else if (angle === 'side') {
      console.log('📐 侧拍 = 速度线，力量感');
    } else if (angle === 'top') {
      console.log('🚁 俯拍 = 上帝视角，宏大壮观');
    } else if (angle === 'low') {
      console.log('⬆️ 仰拍 = 腾空感，视觉冲击力');
    }

    const shots = lib.getShotsBySport(sport).filter(s => s.angle === angle);
    
    if (shots.length === 0) {
      console.log('⚠️ 没有找到该组合，使用随机镜头');
      console.log(lib.getRandomShot());
      return;
    }

    console.log(`\n找到 ${shots.length} 个镜头:`);
    for (const shot of shots) {
      console.log(`\n  🎥 ${shot.name} (${shot.duration}秒)`);
      console.log(`     强度: ${shot.intensity}/10`);
      console.log(`     提示词: ${shot.prompt.substring(0, 100)}...`);
    }

    // 推荐最佳镜头
    const best = shots.sort((a, b) => b.intensity - a.intensity)[0];
    console.log(`\n🏆 推荐镜头: ${best.name} (强度 ${best.intensity}/10)`);
    console.log(`   完整提示词:`);
    console.log(`   ${best.prompt}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 超短裙极限运动镜头库已就绪！');
  console.log('💡 提示：这些镜头可以直接用于 AI 视频生成提示词');
}

main().catch(console.error);
