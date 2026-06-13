/**
 * 通用片头系统 v1.0 (v6.5.63-P4)
 * 
 * 系统级设计：提取通用三幕结构，支持任意类型视频片头
 * - 非Nirath专属，支持健康科普、纪录片、广告等所有generic模式
 * 
 * 三幕结构：
 * 1. 钩子(0-25%): 吸引注意力的开场画面/动作
 * 2. 展开(25-75%): 主题信息展示（标题/角色/场景）
 * 3. 定格(75-100%): 片头收尾，过渡到正片
 * 
 * 可配置元素：
 * - 主标题、副标题、出品人/机构
 * - 角色展示（可选）
 * - 场景氛围（根据world配置）
 * - 时长：3-15秒（可配置）
 */

const path = require('path');

class GenericOpeningSystem {
  constructor(options = {}) {
    this.duration = options.duration || 8; // 默认8秒
    this.mode = options.mode || 'generic';
  }

  /**
   * 生成通用片头
   * @param {Object} input - 项目输入
   * @param {Object} storyboard - 故事板数据
   * @param {Object} characters - 角色数据
   * @returns {Object} 片头结果
   */
  generateOpening(input, storyboard, characters) {
    const world = input.world || {};
    const meta = input.projectName || '未命名项目';
    const mainTitle = this._extractMainTitle(input);
    const subTitle = this._extractSubTitle(input);
    const creator = input.creator || input.world?.creator || '';
    
    // 三幕结构构建
    const hook = this._buildHook(world, characters);
    const reveal = this._buildReveal(mainTitle, subTitle, creator, world);
    const freeze = this._buildFreeze(world);
    
    // 合并为完整prompt（按1500字符预算优化）
    const prompt = this._assemblePrompt(hook, reveal, freeze, world, characters);
    
    return {
      id: 'S00',
      shotId: 'S00',
      type: 'opening',
      isOpening: true,
      duration: this.duration,
      prompt: prompt,
      length: prompt.length,
      utilization: Math.min(100, Math.round(prompt.length / 1500 * 100)),
      utilizationStatus: prompt.length >= 1400 ? 'ideal' : (prompt.length >= 1000 ? 'good' : 'insufficient'),
      title: {
        main: mainTitle,
        sub: subTitle,
        creator: creator,
        displayTiming: 'T02:00-T06:00',
        position: 'center-bottom',
        style: 'clean-modern-sans-serif'
      },
      scene: '片头-开场',
      shotType: 'opening',
      mouthAction: '', // 片头无口播
      emotionPhase: 'curiosity',
      ratio: '16:9',
      referenceImages: this._extractReferenceImages(characters),
      characters: Object.keys(characters || {}),
      cameraMovement: this._buildCameraMovement(),
      qualityScore: 75
    };
  }

  /**
   * 第一幕：钩子 - 吸引注意力的开场
   */
  _buildHook(world, characters) {
    const setting = world.setting || '专业环境';
    const atmosphere = world.atmosphere || '专业、可信';
    const charList = Object.values(characters || {}).map(c => c.name).filter(Boolean);
    
    let hook = '';
    
    if (charList.length > 0) {
      // 有角色：角色出场动作
      hook = `${charList[0]}面向镜头，自然微笑，专业姿态，背景${setting}，${atmosphere}氛围`;
    } else {
      // 无角色：场景氛围
      hook = `专业${setting}全景，${atmosphere}，自然光线，画面稳定`;
    }
    
    return {
      phase: 'hook',
      duration: Math.floor(this.duration * 0.25), // 25%
      content: hook,
      timing: `T00:00-T00:${Math.floor(this.duration * 0.25)}`
    };
  }

  /**
   * 第二幕：展开 - 标题信息展示
   */
  _buildReveal(mainTitle, subTitle, creator, world) {
    const setting = world.setting || '专业环境';
    const lighting = world.lighting || '自然光';
    
    let titleBlock = `主标题"${mainTitle}"大字居中展示`;
    if (subTitle) titleBlock += `，副标题"${subTitle}"`;
    if (creator) titleBlock += `，出品人/机构"${creator}"`;
    
    return {
      phase: 'reveal',
      duration: Math.floor(this.duration * 0.50), // 50%
      content: `${titleBlock}，背景${setting}，${lighting}，标题字体清晰现代，层次分明`,
      timing: `T00:${Math.floor(this.duration * 0.25)}-T00:${Math.floor(this.duration * 0.75)}`
    };
  }

  /**
   * 第三幕：定格 - 片头收尾
   */
  _buildFreeze(world) {
    const atmosphere = world.atmosphere || '专业';
    
    return {
      phase: 'freeze',
      duration: this.duration - Math.floor(this.duration * 0.75), // 剩余25%
      content: `画面稳定定格，${atmosphere}，淡入正片过渡，无突兀切换`,
      timing: `T00:${Math.floor(this.duration * 0.75)}-T00:${this.duration}`
    };
  }

  /**
   * 组装完整Prompt（1500字符预算）
   */
  _assemblePrompt(hook, reveal, freeze, world, characters) {
    const parts = [];
    
    // L1: 约束层
    parts.push(`NEGATIVE: no text, no anime, no cartoon, no deformed hands, no extra fingers, no watermark, 16:9 cinematic, no subtitle, no caption, 24fps cinematic, hyperrealistic, ultra-detailed, HDR, film grain, 35mm texture, photorealistic with filmic treatment`);
    
    // L2: 基础层
    const charNames = Object.values(characters || {}).map(c => c.name).filter(Boolean).join(', ');
    parts.push(`CHARACTER: ${charNames || '无角色'}`);
    
    // L3: 场景层
    parts.push(`SCENE: ${world.name || '片头'} | ${world.setting || '专业环境'} | ${world.lighting || '自然光'} | ${world.atmosphere || '专业氛围'}`);
    
    // L4: 主体层（三幕）
    parts.push(`ACTION: ${hook.content} | ${reveal.content} | ${freeze.content}`);
    
    // L5: 动态层
    parts.push(`CAMERA: 稳定开场，缓慢推进，标题区域聚焦，适度景深，专业纪录片运镜`);
    parts.push(`TIMELINE: T00:00-T00:${this.duration} / duration: ${this.duration}s / type: opening / mood: curiosity`);
    
    // L6: 风格层
    parts.push(`MOOD: 专业开场 | 清晰 | 可信 | 现代`);
    parts.push(`LIGHTING: ${world.lighting || '自然光，柔和明亮，均匀照明'}`);
    
    // L7: 音频层
    parts.push(`AUDIO: L1:舒缓背景音，-20LUFS | L2:自然环境音 | L3:温暖氛围，72BPM | 避让:标题出现时背景音乐降低3dB`);
    
    // L8: 内部层
    parts.push(`RENDER: hyperrealistic cinematic quality, 35mm film grain, HDR, photorealistic, 16:9 cinematic, documentary realistic style`);
    parts.push(`DIRECTOR: 通用纪录片风格，开场稳重，信息清晰，现代感`);
    
    // 定妆照引用（如果有角色）
    const charKeys = Object.keys(characters || {});
    if (charKeys.length > 0) {
      parts.push(`@image1 ${charKeys[0]}近景，核心特征，超写实`);
    }
    
    return parts.join(' | ');
  }

  _extractMainTitle(input) {
    return input.title?.main || input.world?.name || input.projectName || '未命名项目';
  }

  _extractSubTitle(input) {
    return input.title?.sub || input.world?.subtitle || input.subtitle || '';
  }

  _extractReferenceImages(characters) {
    const refs = [];
    for (const [id, char] of Object.entries(characters || {})) {
      if (char.portraits?.front) {
        refs.push({ id: `${id}-front`, path: char.portraits.front });
      }
    }
    return refs;
  }

  _buildCameraMovement() {
    return {
      scene: '片头',
      primaryMovement: '稳定开场-缓慢推进-定格',
      speed: 'slow',
      shotSize: 'wide-to-medium',
      timeline: `T00:00-T00:${this.duration}`
    };
  }
}

module.exports = GenericOpeningSystem;
