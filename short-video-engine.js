/**
 * 超短裙系统主链路引擎 (Short Video Engine)
 * 版本: v0.7.0-xtreme-integrated
 * 
 * 核心能力：
 * 1. 极限运动镜头库 (Xtreme Shot Library) - 肾上腺素飙升镜头
 * 2. 社媒营销短片生成 (Social Media Short Video)
 * 3. 商品植入引擎 (Product Placement)
 * 4. 角色一致性管理 (Character Consistency)
 * 
 * 使用方式：
 * const engine = require('./short-video-engine');
 * engine.generateXtremeShort({ sport: 'alpine', duration: 15 });
 */

'use strict';

const { XtremeShotLibrary, XTREME_SHOTS, ANGLE_TYPES, COMBO_SEQUENCES } = require('./systems/xtreme-shot-library');

// ==================== 版本信息 ====================

const VERSION = {
  major: 0,
  minor: 7,
  patch: 0,
  codename: 'xtreme-integrated',
  full: 'SHORT-VIDEO-0.7.0-xtreme-integrated',
  releaseDate: '2026-06-10',
  features: [
    '极限运动镜头库集成 (Xtreme Shot Library v1.0.0)',
    '8种极限运动 × 5种视角 = 40+ 镜头',
    '5种组合序列：经典三段式 / 肾上腺素爆发 / 慢动作 / 沉浸式 / 电影感',
    '社媒营销短片生成',
    '商品植入引擎',
    '角色一致性管理'
  ]
};

// ==================== 主链路引擎 ====================

class ShortVideoEngine {
  constructor() {
    this.version = VERSION;
    this.xtremeLibrary = new XtremeShotLibrary();
    this.config = {
      defaultDuration: 15,
      defaultSport: 'alpine',
      defaultSequence: 'adrenaline',
      maxIntensity: 10,
      minIntensity: 7
    };
  }

  // 获取版本信息
  getVersion() {
    return this.version;
  }

  // 获取引擎状态
  getStatus() {
    return {
      version: this.version.full,
      features: this.version.features,
      xtremeSports: this.xtremeLibrary.getSports().map(s => s.name),
      angles: this.xtremeLibrary.getAngles().map(a => a.name),
      sequences: Object.keys(COMBO_SEQUENCES),
      totalShots: Object.values(XTREME_SHOTS).reduce((sum, sport) => sum + sport.shots.length, 0),
      config: this.config
    };
  }

  // ==================== 极限运动短片生成 ====================

  /**
   * 生成极限运动短片配置
   * @param {Object} options - 配置选项
   * @param {string} options.sport - 运动类型 (alpine, skydiving, surfing, skateboarding, bmx, climbing, motocross, parkour)
   * @param {string} options.sequence - 组合序列 (classic, adrenaline, slowmo, immersive, cinematic)
   * @param {number} options.duration - 目标时长 (秒)
   * @param {string} options.angle - 指定视角 (pov, follow, side, top, low)
   * @param {number} options.intensity - 最低强度 (1-10)
   * @returns {Object} 完整短片配置
   */
  generateXtremeShort(options = {}) {
    const {
      sport = this.config.defaultSport,
      sequence = this.config.defaultSequence,
      duration = this.config.defaultDuration,
      angle = null,
      intensity = this.config.minIntensity
    } = options;

    console.log(`🎬 生成极限运动短片: ${sport} | ${sequence} | ${duration}秒`);

    // 如果指定了视角，生成单视角短片
    if (angle) {
      return this.generateSingleAngleShort({ sport, angle, duration, intensity });
    }

    // 生成组合序列短片
    const sequenceConfig = this.xtremeLibrary.generateShortVideoShots({
      sport,
      sequence,
      totalDuration: duration
    });

    return {
      type: 'xtreme-sequence',
      version: this.version.full,
      generatedAt: new Date().toISOString(),
      ...sequenceConfig,
      totalShots: sequenceConfig.shots.length,
      avgIntensity: sequenceConfig.shots.reduce((sum, s) => sum + s.intensity, 0) / sequenceConfig.shots.length,
      prompts: sequenceConfig.shots.map(s => s.prompt)
    };
  }

  /**
   * 生成单视角短片
   */
  generateSingleAngleShort(options = {}) {
    const {
      sport = this.config.defaultSport,
      angle = 'pov',
      duration = this.config.defaultDuration,
      intensity = this.config.minIntensity
    } = options;

    const shots = this.xtremeLibrary.getShotsBySport(sport)
      .filter(s => s.angle === angle && s.intensity >= intensity);

    if (shots.length === 0) {
      return { error: `没有找到 ${sport} 的 ${angle} 视角镜头` };
    }

    // 按强度排序，取前几个填满时长
    const selected = [];
    let currentTime = 0;
    
    for (const shot of shots.sort((a, b) => b.intensity - a.intensity)) {
      if (currentTime >= duration) break;
      selected.push({
        ...shot,
        startTime: currentTime,
        duration: shot.duration
      });
      currentTime += shot.duration;
    }

    return {
      type: 'xtreme-single-angle',
      version: this.version.full,
      generatedAt: new Date().toISOString(),
      sport: XTREME_SHOTS[sport]?.name || sport,
      angle: ANGLE_TYPES[angle]?.name || angle,
      totalDuration: currentTime,
      shots: selected,
      totalShots: selected.length,
      avgIntensity: selected.reduce((sum, s) => sum + s.intensity, 0) / selected.length,
      prompts: selected.map(s => s.prompt)
    };
  }

  /**
   * 生成高肾上腺素短片（强度 >= 9）
   */
  generateAdrenalineRush(options = {}) {
    const { duration = 15 } = options;
    
    const highIntensityShots = this.xtremeLibrary.getShotsByIntensity(9);
    
    const selected = [];
    let currentTime = 0;
    
    // 随机打乱，确保多样性
    const shuffled = highIntensityShots.sort(() => Math.random() - 0.5);
    
    for (const shot of shuffled) {
      if (currentTime >= duration) break;
      selected.push({
        ...shot,
        startTime: currentTime,
        duration: shot.duration
      });
      currentTime += shot.duration;
    }

    return {
      type: 'adrenaline-rush',
      version: this.version.full,
      generatedAt: new Date().toISOString(),
      totalDuration: currentTime,
      shots: selected,
      totalShots: selected.length,
      avgIntensity: selected.reduce((sum, s) => sum + s.intensity, 0) / selected.length,
      prompts: selected.map(s => s.prompt),
      note: '🔥 高强度肾上腺素短片 - 所有镜头强度 >= 9/10'
    };
  }

  // ==================== 社媒营销短片生成 ====================

  /**
   * 生成社媒营销短片
   * @param {Object} options - 配置
   * @param {string} options.product - 产品名称
   * @param {string} options.scene - 场景 (极限运动/日常生活/旅行等)
   * @param {number} options.duration - 时长
   */
  generateSocialMediaShort(options = {}) {
    const { product, scene = 'xtreme', duration = 15 } = options;

    // 如果是极限运动场景，使用镜头库
    if (scene === 'xtreme' || scene === '极限运动') {
      const xtremeConfig = this.generateXtremeShort({ duration });
      
      return {
        type: 'social-media-xtreme',
        version: this.version.full,
        product: product || '未指定产品',
        scene: '极限运动',
        ...xtremeConfig,
        marketingNote: product ? `🏂 将 ${product} 融入极限运动场景` : '请指定产品名称'
      };
    }

    // 其他场景暂用默认
    return {
      type: 'social-media',
      version: this.version.full,
      product: product || '未指定产品',
      scene,
      duration,
      note: '社媒短片生成 - 其他场景开发中'
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 获取所有可用镜头
   */
  getAllShots() {
    return this.xtremeLibrary.getShotsByIntensity(1);
  }

  /**
   * 获取指定运动类型的镜头
   */
  getShotsBySport(sport) {
    return this.xtremeLibrary.getShotsBySport(sport);
  }

  /**
   * 获取指定视角的镜头
   */
  getShotsByAngle(angle) {
    return this.xtremeLibrary.getShotsByAngle(angle);
  }

  /**
   * 导出为 AI 视频生成提示词列表
   */
  exportPrompts(config) {
    if (!config || !config.shots) {
      return { error: '无效的短片配置' };
    }

    return config.shots.map((shot, index) => ({
      shotIndex: index + 1,
      duration: shot.duration,
      prompt: shot.prompt,
      intensity: shot.intensity,
      angle: shot.angle,
      sport: shot.sportName || config.sport
    }));
  }

  /**
   * 打印短片配置（用于调试）
   */
  printShort(config) {
    console.log('\n' + '='.repeat(60));
    console.log(`🎬 ${config.type?.toUpperCase() || 'SHORT'} VIDEO CONFIG`);
    console.log('='.repeat(60));
    console.log(`版本: ${config.version}`);
    console.log(`生成时间: ${config.generatedAt}`);
    console.log(`运动: ${config.sport || '混合'}`);
    console.log(`序列: ${config.sequence || '单视角'}`);
    console.log(`总时长: ${config.totalDuration}秒`);
    console.log(`镜头数: ${config.totalShots}`);
    console.log(`平均强度: ${config.avgIntensity?.toFixed(1)}/10`);
    console.log('-'.repeat(60));
    
    for (const shot of config.shots || []) {
      console.log(`\n🎥 ${shot.name || shot.id}`);
      console.log(`   时间: ${shot.startTime}s - ${shot.startTime + shot.duration}s`);
      console.log(`   视角: ${shot.angle} | 强度: ${shot.intensity}/10`);
      console.log(`   目的: ${shot.purpose || 'N/A'}`);
      console.log(`   提示词: ${shot.prompt.substring(0, 80)}...`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// ==================== 导出 ====================

module.exports = {
  ShortVideoEngine,
  VERSION,
  XtremeShotLibrary,
  XTREME_SHOTS,
  ANGLE_TYPES,
  COMBO_SEQUENCES
};

// 如果是直接运行，演示主链路
if (require.main === module) {
  const engine = new ShortVideoEngine();
  
  console.log('🩲 超短裙系统主链路引擎');
  console.log('='.repeat(60));
  console.log(`版本: ${engine.version.full}`);
  console.log(`发布日期: ${engine.version.releaseDate}`);
  console.log('\n核心特性:');
  engine.version.features.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 引擎状态:');
  const status = engine.getStatus();
  console.log(`  极限运动: ${status.xtremeSports.join(' | ')}`);
  console.log(`  视角类型: ${status.angles.join(' | ')}`);
  console.log(`  组合序列: ${status.sequences.join(' | ')}`);
  console.log(`  总镜头数: ${status.totalShots}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎬 演示: 生成 15秒 高山滑雪肾上腺素短片');
  const short = engine.generateXtremeShort({ 
    sport: 'alpine', 
    sequence: 'adrenaline', 
    duration: 15 
  });
  engine.printShort(short);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔥 演示: 生成高肾上腺素短片 (强度>=9)');
  const rush = engine.generateAdrenalineRush({ duration: 10 });
  engine.printShort(rush);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 超短裙系统 v0.7.0-xtreme-integrated 就绪！');
  console.log('💡 使用: const engine = require("./short-video-engine");');
}
