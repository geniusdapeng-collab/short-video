/** =============
 * 社媒营销短片Prompt增强器（抖音/短视频/转化率导向）
 * 短描述 → 含时间轴细分的爆发力Prompt
 * 版本: v1.0.0-social
 * 定位：干的就是转化率，咔咔咔节奏快，视觉炸裂
 ============= */

class SocialMediaPromptEnhancer {
  constructor(options = {}) {
    this.maxPromptLength = options.maxPromptLength || 980;
    this.targetLength = options.targetLength || 950;
    this.mode = options.mode || 'social-brutalism';
  }

  enhanceDescription(description, shot = {}) {
    if (!description || description.length < 50) {
      return this.expandShortDescription(description, shot);
    }
    return this.injectTimelineAndImpact(description, shot);
  }

  /**
   * 核心：给已有描述注入时间轴细分 + 爆发力 + 音效节奏
   */
  injectTimelineAndImpact(description, shot) {
    const { id = '', name = '', duration = 5, type = 'standard' } = shot;
    
    // 根据镜头类型和时长生成时间轴细分
    const timeline = this._generateTimeline(duration, type, description);
    const impact = this._generateImpactBlocks(duration, type, description);
    const sound = this._generateSoundDesign(duration, type);
    const cameraWork = this._generateCameraWork(duration, type);
    const emotionCurve = this._generateEmotionCurve(duration, type);
    
    return `${description}

【镜头时间轴·咔咔咔节奏】${duration}秒信息轰炸：
${timeline}

${impact}

${sound}

${cameraWork}

${emotionCurve}

【质感锚定】超写实，8K，电影级。每一帧都是截图帧。壁纸级。`;
  }

  _generateTimeline(duration, type, description) {
    const segments = [];
    const segDuration = duration / 3;
    
    // 第1段：0.0 - segDuration秒 → 钩子/爆发/快速建立
    segments.push(`${this._fmt(0)}-${this._fmt(segDuration)}秒【第一炸·画面炸裂】画面瞬间填满信息，不给观众眨眼机会。主体直接怼脸，景别快速切换，动态瞬间抓取。`);
    
    // 第2段：segDuration - 2*segDuration秒 → 推进/情绪峰值/张力拉升
    segments.push(`${this._fmt(segDuration)}-${this._fmt(2*segDuration)}秒【第二炸·张力拉升】镜头急速推进冲击视网膜，人物表情骤变，光影瞬间切换，情绪在此刻达到顶点。`);
    
    // 第3段：2*segDuration - duration秒 → 定格/钩子/记忆锚点
    segments.push(`${this._fmt(2*segDuration)}-${this._fmt(duration)}秒【第三炸·记忆定格】画面骤然冻结，最后一帧必须是截图帧。瞳孔特写、表情巅峰、光影巅峰——观众离开后唯一记得的画面。`);
    
    return segments.join('\n');
  }

  _fmt(n) {
    return n.toFixed(1);
  }

  _generateImpactBlocks(duration, type, description) {
    return `【视觉暴力·信息密度叠满】
画面必须满到溢出。没有空白，没有呼吸，只有信息轰炸。主体占画面60%以上，压迫感扑面而来。景别切换：0.0-1.0秒广角全景→1.0-2.5秒中景冲击→2.5-${duration}秒特写定格。每个景别停留不超过1.5秒，咔咔咔节奏切换。

【人物表情·逐秒炸裂】
第1秒：表情启动，微表情启动（眉毛微挑、瞳孔放大）
第2秒：情绪峰值，表情炸裂（大笑/大哭/震惊/愤怒）
第3秒：表情定格，记忆锚点（嘴角弧度、眼角纹路、瞳孔倒影）
表情变化必须在2秒内完成，不给观众反应时间。

【光影雕刻·刀切明暗】
高对比度Chiaroscuro，Key Light从极低角度打亮，创造压迫感。冷色Rim光刀切轮廓，无Fill光，绝对黑暗。光影切换如闪电——不是渐变，是刀切。`; 
  }

  _generateSoundDesign(duration, type) {
    const sounds = {
      hook: `【音效设计·心跳加速】
0.0-0.5秒：纯黑中的心跳声（低频咚咚，越来越快）→ 0.5-1.5秒：撕裂瞬间的轰鸣（能量释放，炸裂感）→ 1.5-${duration}秒：高潮音效（咔咔咔节奏打击，越来越急）→ 最后0.5秒：突然寂静（只有呼吸）。音效比画面更恐怖。`,
      climax: `【音效设计·声浪席卷】
0.0-1.0秒：低频轰鸣（地面震动，心跳同步）→ 1.0-2.0秒：高频尖啸（情绪拉升，弦乐紧绷）→ 2.0-${duration-0.5}秒：声浪爆发（打击乐+电子合成，咔咔咔节奏）→ 最后0.5秒：回声渐弱（余波荡漾）。音画同步炸裂。`,
      resolution: `【音效设计·余韵绕梁】
0.0-1.0秒：声浪回声（余波未消）→ 1.0-2.0秒：心跳回归（慢速，沉重，观众自己的心跳）→ 2.0-${duration}秒：留白寂静（只有环境音，声音消散记忆永存）。最后1秒完全静音，截图时刻。`,
      standard: `【音效设计·咔咔咔节奏】
0.0-1.0秒：节奏启动（打击乐引入，心跳加速）→ 1.0-2.5秒：情绪拉升（弦乐+电子合成，越来越急）→ 2.5-${duration}秒：节奏定格（最后一声重击，然后回声）。咔咔咔，每一秒都有音效标记。`
    };
    return sounds[type] || sounds.standard;
  }

  _generateCameraWork(duration, type) {
    const cameras = {
      hook: `【运镜组合·子弹出膛】
0.0-0.5秒：极速环绕推进（如子弹出膛，瞬间击穿画面）→ 0.5-1.5秒：急拉俯冲透视（从高空猛然坠落，心跳失重）→ 1.5-2.5秒：瞳孔锁定凝视（突然静止，所有运动戛然而止）→ 2.5-${duration}秒：微距急速推进（推向细节，推向毛孔）。0.5秒内完成视角切换，不给观众眨眼机会。`,
      climax: `【运镜组合·巨浪海啸】
0.0-1.0秒：微距急速推进（推向毛孔，推向纹理）→ 1.0-2.0秒：仰冲升空揭示（从地面猛然拉升，俯瞰全景）→ 2.0-3.0秒：悬浮凝视环绕（环绕主体，缓慢旋转，时间凝固）→ 3.0-${duration}秒：定格冻结记忆（骤然停止，最后一帧）。镜头如巨浪般推进，又如海啸般席卷。`,
      resolution: `【运镜组合·余韵定格】
0.0-1.0秒：缓推逼近核心（缓慢但坚定，不可逆转）→ 1.0-2.0秒：微距环绕旋转（围绕细节，旋转凝视）→ 2.0-${duration}秒：定格冻结时间（时间停止，画面永恒）。最后一帧是壁纸，是截图，是朋友圈。`,
      standard: `【运镜组合·咔咔咔切换】
0.0-1.0秒：快速推进抓取（冲向主体，毫不犹豫）→ 1.0-2.5秒：环绕扫视环境（360度环绕，信息铺满）→ 2.5-${duration}秒：定格聚焦核心（骤然停止，推向特写）。至少3段运镜变化，静态是犯罪。`
    };
    return cameras[type] || cameras.standard;
  }

  _generateEmotionCurve(duration, type) {
    const curves = {
      hook: `【情绪曲线·0→100瞬间】
0.0-0.5秒：平静（假平静，暴风雨前的宁静）→ 0.5-1.5秒：炸裂（情绪瞬间爆炸，没有任何铺垫）→ 1.5-2.5秒：峰值（情绪最高点，观众窒息）→ 2.5-${duration}秒：钩子（不结束，留下悬念）。情绪必须在1秒内从0拉到100，不给观众准备。`,
      climax: `【情绪曲线·碾压→升华】
0.0-1.0秒：压迫（渺小感，被碾压）→ 1.0-2.0秒：震撼（视觉冲击，情绪峰值）→ 2.0-3.0秒：敬畏（感到神圣，感到升华）→ 3.0-${duration}秒：余韵（情绪回落但记忆永存）。情绪像海啸，先碾压，再升华。`,
      resolution: `【情绪曲线·温暖定格】
0.0-1.0秒：温暖（Golden Hour包裹）→ 1.0-2.0秒：感动（细节触达，眼角湿润）→ 2.0-${duration}秒：定格（情绪在此刻凝固，成为永恒）。最后一秒是观众想截图的那一秒。`,
      standard: `【情绪曲线·单情绪极致】
15秒只有一个情绪，但这个情绪必须做到极致。从第一秒到最后一秒，情绪不回落，只拉升。峰值在最后1秒，截图时刻。`
    };
    return curves[type] || curves.standard;
  }

  expandShortDescription(description, shot) {
    return this.injectTimelineAndImpact(description, shot);
  }

  /**
   * 为社媒营销模式增强所有场景描述
   */
  enhanceScenes(scenes) {
    if (!Array.isArray(scenes)) return scenes;
    
    return scenes.map((scene, index) => {
      const shot = {
        id: scene.id || `S${String(index + 1).padStart(2, '0')}`,
        name: scene.name || `镜头${index + 1}`,
        duration: scene.duration || 5,
        type: scene.type || 'standard'
      };
      
      const rawDesc = scene.description || scene.narration || scene.dialogue || scene.scene || scene.visualPrompt || '';
      let enhanced = this.injectTimelineAndImpact(rawDesc, shot);
      
      // 截断保护，确保≤980字符
      if (enhanced.length > 980) {
        const originalLength = enhanced.length;
        enhanced = enhanced.substring(0, 980);
        const lastTag = enhanced.lastIndexOf('【');
        if (lastTag > 0 && enhanced.indexOf('】', lastTag) === -1) {
          enhanced = enhanced.substring(0, lastTag);
        }
        console.log(`📱 社媒截断保护: ${shot.id} ${originalLength}字符 → ${enhanced.length}字符`);
      }
      
      return {
        ...scene,
        description: enhanced,
        narration: enhanced,
        visualPrompt: enhanced,
        dialogue: enhanced,
        scene: enhanced,
        _socialMediaEnhanced: true,
        _originalLength: rawDesc.length,
        _enhancedLength: enhanced.length
      };
    });
  }
}

module.exports = { SocialMediaPromptEnhancer };
