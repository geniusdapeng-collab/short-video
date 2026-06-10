const path = require('path');

async function main() {
  try {
    // 使用预生产服务
    delete require.cache[require.resolve('./systems/preproduction-service')];
    const { runPreproduction } = require('./systems/preproduction-service');
    
    const inputPath = path.join(__dirname, 'stories', 'xiangxiang-maldives-input.json');
    const input = require(inputPath);
    
    // v0.7.3-fix: 增强镜头质感——为每个场景增加运镜和光影描述
    input.scenes = input.scenes.map((scene, idx) => ({
      ...scene,
      cameraMovement: generateCameraMovement(scene.type, idx),
      lighting: generateLighting(scene.type, scene.name)
    }));
    
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

/**
 * 生成运镜指令（增强镜头质感）
 */
function generateCameraMovement(shotType, index) {
  const movements = {
    hook: {
      type: 'dynamic_push',
      description: '【镜头时间轴】0.0s-1.5s 远景缓慢推近 → 1.5s-3.0s 中景环绕跟拍 → 3.0s-4.5s 近景低角度仰拍 → 4.5s-5.0s 特写定格',
      segments: 4,
      speed: 'smooth'
    },
    climax: {
      type: 'follow_pan',
      description: '【镜头时间轴】0.0s-1.5s 侧面平移跟拍 → 1.5s-3.0s 手持微晃贴近主体 → 3.0s-4.5s 快速横摇捕捉互动 → 4.5s-5.0s 稳定特写',
      segments: 4,
      speed: 'dynamic'
    },
    resolution: {
      type: 'golden_orbit',
      description: '【镜头时间轴】0.0s-1.5s 全景逆光剪影 → 1.5s-3.0s 中景环绕母女 → 3.0s-4.5s 近景捕捉表情 → 4.5s-5.0s 夕阳特写定格',
      segments: 4,
      speed: 'slow'
    }
  };
  return movements[shotType] || movements.hook;
}

/**
 * 生成光影方案（增强镜头质感）
 */
function generateLighting(shotType, sceneName) {
  const isGoldenHour = sceneName.includes('夕阳') || sceneName.includes('夕阳');
  
  if (isGoldenHour) {
    return {
      keyLight: '夕阳侧逆光 3200K暖金 主光源从画面左上方45°照射',
      fillLight: '海面反射光 4500K柔和蓝 填充阴影保留细节',
      rimLight: '夕阳边缘光 2800K橙红 勾勒人物轮廓形成金色光晕',
      ratio: '4:1',
      progression: '从明亮暖金渐变为柔和橙红'
    };
  }
  
  return {
    keyLight: '热带正午阳光 5600K明亮自然 从画面顶部30°照射',
    fillLight: '椰树间隙散射光 4800K柔和 填充面部阴影',
    rimLight: '海面反射光 6000K微蓝 勾勒人物边缘',
    ratio: '3:1',
    progression: '明亮稳定自然光'
  };
}

main();
