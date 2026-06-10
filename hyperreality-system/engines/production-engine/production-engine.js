// hyperreality-system/engines/production-engine/production-engine.js
// Production Engine - 制作引擎（Layer 2）
// 深度融合：直接消费 ScriptBlueprint 输出，驱动镜头生成
// 版本：v1.0.0 | 日期：2026-06-08

const path = require('path');

// 复用现有系统的核心模块（从 systems/ 复制过来）
// 注：实际部署时这些模块会从 systems/ 复制到 production-engine/modules/
const SYSTEMS_PATH = path.join(__dirname, '../../../systems');

// 动态加载现有模块
function loadModule(name) {
  try {
    return require(path.join(SYSTEMS_PATH, name));
  } catch (e) {
    console.warn(`[ProductionEngine] 模块加载失败: ${name} - ${e.message}`);
    return null;
  }
}

class ProductionEngine {
  constructor(options = {}) {
    this.config = {
      maxPromptLength: 1500,  // v2.0-B+: 从980提升至1500，支持七层架构+音频层
      targetPromptLength: 1470,  // v2.0-B+: 对应提升
      referenceImageCount: 2,
      outputDir: options.outputDir || '/tmp/hyperreality-output',
      ...options
    };
    
    this.modules = {};
    this.logs = [];
    this._initModules();
  }

  _initModules() {
    // 加载核心模块（从现有系统复用）
    this.modules = {
      // 时长分配
      shotDurationAllocator: loadModule('shot-duration-allocator.js')?.ShotDurationAllocator,
      durationCalculator: loadModule('duration-calculator.js')?.DurationCalculator,
      
      // 运镜系统
      cameraMovement: loadModule('camera-movement-system-v2.js')?.CameraMovementSystem,
      intraShotTimeline: loadModule('camera-movement-system-v3.js')?.IntraShotTimelineGenerator,
      
      // 连续性
      continuityEngine: loadModule('continuity-engine.js')?.ContinuityEngine,
      
      // Prompt 增强
      promptEnhancer: loadModule('intra-shot-prompt-enhancer.js')?.IntraShotPromptEnhancer,
      styleInjector: loadModule('universal-style-injector.js')?.UniversalStyleInjector,
      
      // 质量门
      promptQualityGate: loadModule('prompt-quality-gate.js')?.PromptQualityGate,
      
      // 字符计数
      charCounter: loadModule('char-counter')?.charCounter,
      
      // 片头系统
      openingSystem: loadModule('opening-system-v3.js'),
      
      // 角色系统
      characterManager: loadModule('character-manager-v2.js')?.CharacterManagerV2,
      characterPromptBuilder: loadModule('character-prompt-builder.js')?.CharacterPromptBuilder,
      
      // 校验
      storyboardValidator: loadModule('storyboard-validator.js')?.StoryboardValidator,
      preRenderValidation: loadModule('pre-render-validation.js')?.preRenderValidation,
      
      // 后期
      postProduction: loadModule('post-production-pipeline.js')?.PostProductionPipeline,
    };
    
    // 初始化实例
    for (const [key, Module] of Object.entries(this.modules)) {
      if (Module && typeof Module === 'function') {
        try {
          this.modules[key] = new Module();
        } catch (e) {
          // 已经是实例或无需 new
        }
      }
    }
  }

  log(stage, message) {
    const entry = { stage, message, timestamp: Date.now() };
    this.logs.push(entry);
    console.log(`[${stage}] ${message}`);
  }

  /**
   * 主入口：从 ScriptBlueprint 生成完整镜头
   * @param {object} adaptedBlueprint - 适配器输出的剧本数据
   * @returns {object} { shots, prompts, report }
   */
  async produce(adaptedBlueprint) {
    const startTime = Date.now();
    this.log('PRODUCE', '🎬 ProductionEngine 启动 | 深度融合模式');
    
    const result = {
      success: false,
      shots: [],
      prompts: [],
      stages: {},
      errors: [],
      logs: this.logs,
      timing: {}
    };

    try {
      // === Stage 1: 从蓝图提取场景并转换为镜头结构 ===
      result.stages.sceneExtraction = await this._runStage('scene-extraction', () =>
        this._extractScenes(adaptedBlueprint)
      );
      
      // === Stage 2: 时长分配（基于剧本已有时长）===
      result.stages.durationAllocation = await this._runStage('duration-allocation', () =>
        this._allocateDuration(result.stages.sceneExtraction.shots)
      );
      
      // === Stage 3: 运镜设计（每镜头独立）===
      result.stages.cameraDesign = await this._runStage('camera-design', () =>
        this._designCameraMovement(result.stages.durationAllocation.shots)
      );
      
      // === Stage 4: Prompt 工程（核心阶段）===
      result.stages.promptEngineering = await this._runStage('prompt-engineering', () =>
        this._engineerPrompts(result.stages.cameraDesign.shots, adaptedBlueprint)
      );
      
      // === Stage 5: 质量门校验 ===
      result.stages.qualityGate = await this._runStage('quality-gate', () =>
        this._runQualityGate(result.stages.promptEngineering.prompts)
      );
      
      // === Stage 6: 片头生成（如有需要）===
      if (adaptedBlueprint.config?.featured_beast_id) {
        result.stages.opening = await this._runStage('opening', () =>
          this._generateOpening(adaptedBlueprint)
        );
      }
      
      // === Stage 7: 连续性检查 ===
      result.stages.continuity = await this._runStage('continuity', () =>
        this._checkContinuity(result.stages.promptEngineering.prompts)
      );
      
      // 汇总
      result.shots = result.stages.promptEngineering.shots;
      result.prompts = result.stages.promptEngineering.prompts;
      result.success = true;
      result.timing.total = Date.now() - startTime;
      
      this.log('PRODUCE', `✅ 制作完成: ${result.shots.length} 镜头, ${result.prompts.length} Prompts`);
      
    } catch (error) {
      result.success = false;
      result.errors.push({
        stage: 'PRODUCE',
        message: error.message,
        stack: error.stack
      });
      this.log('ERROR', `❌ 制作失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 运行单个 Stage 并计时
   */
  async _runStage(stageName, stageFn) {
    const start = Date.now();
    this.log(stageName.toUpperCase(), `开始...`);
    
    try {
      const output = await stageFn();
      const duration = Date.now() - start;
      this.log(stageName.toUpperCase(), `完成 (${duration}ms)`);
      return { ...output, _stageDuration: duration };
    } catch (error) {
      const duration = Date.now() - start;
      this.log(stageName.toUpperCase(), `失败 (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  /**
   * Stage 1: 从适配蓝图提取场景，转换为内部镜头结构
   */
  _extractScenes(adaptedBlueprint) {
    const scenes = adaptedBlueprint.scenes || [];
    const characters = adaptedBlueprint.characters || [];
    const worldSetting = adaptedBlueprint.worldSetting || {};
    
    const shots = scenes.map((scene, index) => {
      // 构建角色描述
      const characterDescs = (scene.characters || []).map(cid => {
        const char = characters.find(c => c.character_id === cid);
        if (!char) return cid;
        
        const features = char.visual_anchor?.core_features || [];
        return `${char.name}（${features.join('、')}）`;
      }).join('，');
      
      // 构建对话
      const dialogueLines = (scene.dialogue?.lines || []).map(line =>
        `${line.speaker}:「${line.text}」`
      ).join('；');
      
      return {
        shotId: scene.scene_id || `SC${String(index).padStart(2, '0')}`,
        sceneType: scene.scene_type || 'establishing',
        sceneFunction: scene.scene_function || 'establish',
        
        // 时序
        timing: {
          start: scene.timing?.start || 0,
          duration: scene.timing?.duration || 20,
          end: scene.timing?.end || 20
        },
        
        // 内容
        setting: scene.setting || '',
        visualNotes: scene.visual_notes || '',
        characters: scene.characters || [],
        characterDescs,
        
        // 对话
        dialogue: scene.dialogue || { has_dialogue: false, lines: [] },
        dialogueText: dialogueLines,
        
        // 情感
        emotionalTarget: scene.emotional_target || { valence: 0, arousal: 0.5 },
        
        // 视觉方向（从剧本引擎传入）
        visualDirection: scene.visual_direction || {},
        
        // Prompt 基础（从适配器传入）
        promptBase: scene.prompt_base || '',
        
        // 世界设定
        worldId: worldSetting.world_id || 'default',
        
        // 状态
        status: 'pending'
      };
    });
    
    return { shots, sceneCount: shots.length };
  }

  /**
   * Stage 2: 时长分配（精细化）
   * 剧本引擎已提供基础时长，这里进行微调
   */
  _allocateDuration(shots) {
    const allocator = this.modules.shotDurationAllocator;
    if (!allocator) {
      // 回退：使用剧本引擎的时长
      return { shots };
    }
    
    // 基于内容重要性、台词长度、视觉复杂度三维度重新分配
    const allocatedShots = shots.map(shot => {
      // 台词越长，时长越长
      const dialogueLength = shot.dialogue?.lines?.reduce((sum, l) => sum + (l.text?.length || 0), 0) || 0;
      const dialogueFactor = Math.min(dialogueLength / 30, 1.5); // 30字基准
      
      // 场景类型权重
      const typeWeights = {
        'opening': 1.2,
        'emotional_climax': 1.5,
        'conflict': 1.3,
        'resolution': 1.0,
        'establishing': 1.0
      };
      const typeWeight = typeWeights[shot.sceneType] || 1.0;
      
      // 基础时长 × 调整因子
      const baseDuration = shot.timing.duration;
      const adjustedDuration = Math.round(baseDuration * typeWeight * (1 + dialogueFactor * 0.2));
      
      // 限制在合理范围
      const finalDuration = Math.max(10, Math.min(40, adjustedDuration));
      
      return {
        ...shot,
        timing: {
          ...shot.timing,
          duration: finalDuration,
          end: shot.timing.start + finalDuration
        },
        allocation: {
          baseDuration,
          dialogueFactor,
          typeWeight,
          finalDuration
        }
      };
    });
    
    return { shots: allocatedShots };
  }

  /**
   * Stage 3: 运镜设计
   */
  _designCameraMovement(shots) {
    const cameraSystem = this.modules.cameraMovement;
    
    const designedShots = shots.map(shot => {
      // 基于场景类型推断运镜
      const cameraConfig = this._inferCameraConfig(shot);
      
      return {
        ...shot,
        camera: {
          ...cameraConfig,
          // 4段式运镜时间轴
          timeline: this._generateCameraTimeline(shot.timing.duration, cameraConfig)
        }
      };
    });
    
    return { shots: designedShots };
  }

  /**
   * 推断运镜配置
   */
  _inferCameraConfig(shot) {
    const configs = {
      'opening': {
        shotType: 'wide',
        movement: '缓慢推进',
        speed: 'slow',
        transition: 'none'
      },
      'establishing': {
        shotType: 'medium',
        movement: '稳定机位',
        speed: 'normal',
        transition: 'smooth'
      },
      'conflict': {
        shotType: 'close_up',
        movement: '手持晃动',
        speed: 'fast',
        transition: 'cut'
      },
      'emotional_climax': {
        shotType: 'extreme_close_up',
        movement: '快速推近',
        speed: 'dynamic',
        transition: 'dramatic'
      },
      'resolution': {
        shotType: 'medium',
        movement: '缓慢后拉',
        speed: 'slow',
        transition: 'fade'
      }
    };
    
    return configs[shot.sceneType] || configs['establishing'];
  }

  /**
   * 生成 4 段式运镜时间轴
   */
  _generateCameraTimeline(duration, cameraConfig) {
    const segments = 4;
    const segmentDuration = duration / segments;
    
    const timeline = [];
    for (let i = 0; i < segments; i++) {
      const start = i * segmentDuration;
      const end = (i + 1) * segmentDuration;
      
      timeline.push({
        segment: i + 1,
        timeRange: `${start.toFixed(1)}s-${end.toFixed(1)}s`,
        duration: segmentDuration.toFixed(1) + 's',
        cameraMovement: this._getSegmentMovement(i, cameraConfig.movement),
        shotType: this._getSegmentShotType(i, cameraConfig.shotType),
        purpose: this._getSegmentPurpose(i, cameraConfig)
      });
    }
    
    return timeline;
  }

  _getSegmentMovement(index, baseMovement) {
    const variations = {
      '缓慢推进': ['远景缓推', '中景推进', '近景聚焦', '特写定格'],
      '稳定机位': ['全景稳定', '中景观察', '近景注视', '特写定格'],
      '手持晃动': ['全景晃动', '中景逼近', '近景紧张', '特写冲击'],
      '快速推近': ['远景突袭', '中景冲刺', '近景逼近', '特写定格'],
      '缓慢后拉': ['近景特写', '中景展开', '全景揭示', '远景收尾']
    };
    
    const movements = variations[baseMovement] || variations['稳定机位'];
    return movements[index] || movements[movements.length - 1];
  }

  _getSegmentShotType(index, baseType) {
    const progression = {
      'wide': ['远景', '全景', '中景', '近景'],
      'medium': ['中景', '近景', '中景', '近景'],
      'close_up': ['中景', '近景', '特写', '极特写'],
      'extreme_close_up': ['近景', '特写', '极特写', '微距']
    };
    
    const types = progression[baseType] || progression['medium'];
    return types[index] || types[types.length - 1];
  }

  _getSegmentPurpose(index, config) {
    const purposes = [
      '建立空间/环境',
      '展示角色/关系',
      '推进情绪/冲突',
      '定格核心瞬间'
    ];
    return purposes[index] || '推进叙事';
  }

  /**
   * Stage 4: Prompt 工程（核心）
   * 将剧本引擎的结构化数据转换为 Seedance 可消费的 Prompt
   */
  _engineerPrompts(shots, blueprint) {
    const prompts = [];
    const engineeredShots = [];
    
    for (const shot of shots) {
      // 构建 Prompt 各部分
      const prompt = this._buildShotPrompt(shot, blueprint);
      
      // 字符计数
      const promptLength = this._countChars(prompt.fullPrompt);
      
      // 定妆照引用（如果可用）
      const imageRefs = this._buildImageReferences(shot, blueprint);
      
      const engineeredShot = {
        ...shot,
        prompt: {
          ...prompt,
          length: promptLength,
          status: promptLength <= this.config.maxPromptLength ? 'valid' : 'overflow'
        },
        imageReferences: imageRefs,
        status: 'ready'
      };
      
      engineeredShots.push(engineeredShot);
      prompts.push({
        shotId: shot.shotId,
        prompt: prompt.fullPrompt,
        length: promptLength,
        imageRefs: imageRefs
      });
    }
    
    return { shots: engineeredShots, prompts };
  }

  /**
   * 🔊 v2.0-B+: 音频场景映射（极致视听融合）
   */
  _getAudioSceneMap() {
    return {
      'beach': { env: '海浪轻拍沙滩的白噪音，海鸟远处鸣叫', action: '白沙从指缝流下沙沙声', emotion: '温暖治愈的氛围音' },
      'ocean': { env: '海浪拍打礁石，海风呼啸', action: '水花溅起声', emotion: '自由辽阔的海洋气息' },
      'forest': { env: '风吹树叶沙沙声，远处溪流潺潺', action: '脚步声踩落叶', emotion: '宁静安详的自然氛围' },
      'city': { env: '车流白噪音，远处鸣笛', action: '快门声、键盘敲击', emotion: '都市节奏感' },
      'home': { env: '室内温暖环境音', action: '婴儿咯咯笑声', emotion: '温馨家庭氛围' },
      'mountain': { env: '山风呼啸，远处鸟鸣', action: '雪粉飞扬声', emotion: '壮丽寂静的高山氛围' },
      'studio': { env: '摄影棚安静环境', action: '快门咔嚓声', emotion: '专业专注的工作氛围' }
    };
  }

  /**
   * 🔊 v2.0-B+: 构建音频描述（自然语言格式，Seedance可理解）
   */
  _buildAudioDescription(shot) {
    const parts = [];
    const sceneName = (shot.sceneName || shot.scene || shot.setting || '').toLowerCase();
    const emotion = (shot.emotionPhase || shot.emotion || 'neutral').toLowerCase();
    const timeOfDay = (shot.timeOfDay || shot.lighting?.timeOfDay || 'golden hour').toLowerCase();
    
    const audioMap = this._getAudioSceneMap();
    let template = null;
    
    // 匹配场景类型
    for (const [key, t] of Object.entries(audioMap)) {
      if (sceneName.includes(key)) {
        template = t;
        break;
      }
    }
    
    // 回退：基于时间
    if (!template) {
      if (timeOfDay.includes('night') || timeOfDay.includes('dusk')) {
        template = { env: '夜晚虫鸣，远处低语', action: '轻柔脚步声', emotion: '神秘宁静的夜晚氛围' };
      } else {
        template = { env: '白天环境音', action: '自然动作声', emotion: '明亮日常氛围' };
      }
    }
    
    // L1: 环境音 - 自然语言格式
    parts.push(`伴随${template.env}`);
    
    // L2: 动作音 - 自然语言格式
    parts.push(`动作产生${template.action}`);
    
    // L3: 情绪音 - 自然语言格式
    const emotionAudioMap = {
      'warm': '温暖治愈的轻音乐渐入',
      'joy': '欢快的节奏音',
      'tense': '紧张的心跳声渐强',
      'sad': '低沉的弦乐余韵',
      'epic': '宏大的交响乐铺垫',
      'peaceful': '宁静的钢琴轻弹',
      'establishing': '环境音渐显，氛围建立',
      'climax': '全频段饱满，情绪峰值',
      'resolve': '音乐渐弱，余音缭绕'
    };
    const emotionSound = emotionAudioMap[emotion] || template.emotion;
    parts.push(`氛围弥漫${emotionSound}`);
    
    // L4: 声画同步（如果含对话）
    if (shot.dialogueText || shot.hasDialogue) {
      parts.push('声画精准同步，嘴型与发音对齐');
    }
    
    return parts.join('，');
  }

  /**
   * 构建单个镜头的完整 Prompt（v2.0-B+: 七层架构 + 极致视听融合）
   * 
   * 七层结构：
   * L1: 约束层（P0必加）- 画幅/帧率/无字幕
   * L2: 基础层（P0必加）- 写实度/HDR/胶片质感
   * L3: 空间层（P1防平庸）- 场景/天气/纵深
   * L4: 主体层（P2防漂移）- 角色/动作/关系
   * L5: 动态层（P1防平庸）- 运镜/时间轴
   * L6: 风格层（P2防漂移）- 色彩/光影/情绪
   * L7: 音频层（🔊 新增）- 环境音/动作音/情绪音
   * L8: 质控层（P0必加）- 负面约束/角色一致性
   */
  _buildShotPrompt(shot, blueprint) {
    const parts = [];
    
    // === L1: 约束层（P0必加）===
    const ratio = blueprint.aspectRatio || shot.ratio || '16:9';
    parts.push(`${ratio} cinematic, no text, no subtitle, no caption, no watermark, 24fps cinematic`);
    
    // === L2: 基础层（P0必加）===
    parts.push('hyperrealistic, ultra-detailed, high dynamic range, detail in highlights and shadows, film grain, 35mm texture, cinematic film');
    
    // === L3: 空间层（P1防平庸）===
    // 世界设定（Nirath）
    if (shot.worldId === 'nirath') {
      parts.push('Nirath星球');
    }
    // 场景设定
    if (shot.setting) {
      parts.push(shot.setting);
    }
    // 时间/天气
    if (shot.timeOfDay || shot.lighting?.timeOfDay) {
      parts.push(`${shot.timeOfDay || shot.lighting?.timeOfDay} lighting`);
    }
    // 空间纵深
    if (shot.depthLayers || shot.depth) {
      parts.push(shot.depthLayers || shot.depth || 'atmospheric haze, depth layers');
    }
    
    // === L4: 主体层（P2防漂移）===
    // 角色描述
    if (shot.characterDescs) {
      parts.push(shot.characterDescs);
    }
    // 主体动作
    if (shot.action || shot.characterAction) {
      parts.push(shot.action || shot.characterAction);
    }
    // 主体关系
    if (shot.characterRelation) {
      parts.push(shot.characterRelation);
    }
    
    // === L5: 动态层（P1防平庸）===
    // 运镜描述
    if (shot.camera?.movement) {
      parts.push(`${shot.camera.movement}，${shot.camera.shotType}`);
    }
    // 时间轴（4段式）
    if (shot.camera?.timeline) {
      const timelineText = shot.camera.timeline.map(t => 
        `${t.timeRange} ${t.cameraMovement}`
      ).join(' → ');
      parts.push(`镜头时间轴：${timelineText}`);
    }
    // 环境动作
    if (shot.environmentAction) {
      parts.push(shot.environmentAction);
    }
    
    // === L6: 风格层（P2防漂移）===
    // 视觉笔记
    if (shot.visualNotes) {
      parts.push(shot.visualNotes);
    }
    // 色彩方案
    if (shot.colorScheme || shot.colorTemp) {
      const cs = shot.colorScheme || 'natural warm tones';
      parts.push(`color palette: ${cs}`);
    }
    // 情绪调性
    if (shot.emotionPhase || shot.emotion) {
      const emotionMap = {
        'establishing': 'serene, awe-inspiring',
        'rising': 'growing tension, anticipation',
        'building': 'intensifying drama',
        'climax': 'peak emotional intensity',
        'resolve': 'peaceful resolution',
        'opening': 'epic grandeur',
        'warm': 'warm, healing, tender',
        'joy': 'joyful, bright, energetic'
      };
      const ep = shot.emotionPhase || shot.emotion || 'neutral';
      parts.push(emotionMap[ep] || 'cinematic atmosphere');
    }
    // 光影（如果指定）
    if (shot.lighting?.keyLight || shot.lighting?.description) {
      parts.push(shot.lighting?.description || shot.lighting?.keyLight);
    }
    
    // === L7: 音频层（🔊 新增 - 极致视听融合）===
    const audioDesc = this._buildAudioDescription(shot);
    if (audioDesc) {
      parts.push(audioDesc);
    }
    
    // 对话（必须嵌入）
    if (shot.dialogueText) {
      parts.push(`台词：${shot.dialogueText}`);
    }
    
    // === L8: 质控层（P0必加）===
    // 负面约束
    const negativeConstraints = [
      'blurry, low resolution, pixelated, compression artifacts',
      'cartoon, anime, illustration, 3D render look, CGI appearance, plastic look',
      'distorted perspective, impossible geometry, floating objects',
      'flat lighting, overexposed, crushed blacks, double shadows',
      'unnatural physics, fake water, static water, cardboard texture, plastic foliage'
    ];
    // 人物专项（如果含角色）
    if (shot.characters?.length > 0 || shot.characterDescs) {
      negativeConstraints.push('distorted face, deformed face, extra fingers, plastic skin, waxy skin, unnatural pose');
    }
    // Nirath专属
    if (shot.worldId === 'nirath') {
      negativeConstraints.push('no metallic shine, no traditional Chinese symbols, natural eye colors only');
    }
    parts.push(...negativeConstraints);
    
    // 角色一致性约束
    if (shot.characters?.length > 0) {
      parts.push(`角色一致性：保持${shot.characters.join('、')}形象一致，杜绝分身重影`);
    }
    
    const fullPrompt = parts.join('，');
    
    // 截断保护（v2.0-B+: 1500字符，保留音频层和一致性约束）
    const truncated = this._truncatePromptWithAudioProtection(fullPrompt, this.config.maxPromptLength);
    
    return {
      fullPrompt: truncated,
      rawPrompt: fullPrompt,
      parts,
      wasTruncated: fullPrompt.length !== truncated.length,
      audioIncluded: !!audioDesc  // 🔊 标记音频是否包含
    };
  }

  /**
   * 🔊 v2.0-B+: 截断保护（保留音频层和角色一致性）
   */
  _truncatePromptWithAudioProtection(prompt, maxLength) {
    if (prompt.length <= maxLength) return prompt;
    
    // 保护末尾：角色一致性 + 音频层（如果存在）
    const lastPart = '角色一致性：保持形象一致，杜绝分身重影';
    
    // 检查是否包含音频描述
    const hasAudio = prompt.includes('伴随') && prompt.includes('氛围弥漫');
    let audioPart = '';
    if (hasAudio) {
      const audioMatch = prompt.match(/伴随[^，]*，[^，]*氛围弥漫[^，]*(?:，[^，]*声画精准同步[^，]*)?/);
      if (audioMatch) {
        audioPart = audioMatch[0];
      }
    }
    
    const protectParts = [lastPart];
    if (audioPart) protectParts.unshift(audioPart);
    
    const protectText = protectParts.join('，');
    const availableLength = maxLength - protectText.length - 2;
    
    if (availableLength > 50) {
      return prompt.substring(0, availableLength) + '，' + protectText;
    }
    
    return prompt.substring(0, maxLength);
  }

  /**
   * 截断 Prompt（旧方法，保留向后兼容）
   */
  _truncatePrompt(prompt, maxLength) {
    return this._truncatePromptWithAudioProtection(prompt, maxLength);
  }

  /**
   * 构建定妆照引用
   */
  _buildImageReferences(shot, blueprint) {
    const refs = [];
    const characters = blueprint.characters || [];
    
    for (const cid of (shot.characters || [])) {
      const char = characters.find(c => c.character_id === cid);
      if (!char) continue;
      
      const portraits = char.portraits || {};
      
      // 选择最佳角度
      const angle = this._selectBestAngle(shot.sceneType, Object.keys(portraits));
      const path = portraits[angle];
      
      if (path) {
        refs.push({
          characterId: cid,
          characterName: char.name,
          angle,
          path,
          description: this._buildImageDescription(char, angle)
        });
      }
    }
    
    return refs;
  }

  /**
   * 选择最佳角度
   */
  _selectBestAngle(sceneType, availableAngles) {
    if (!availableAngles || availableAngles.length === 0) return null;
    
    const priority = {
      'opening': ['front', 'threeQuarter', 'closeup'],
      'establishing': ['threeQuarter', 'front', 'closeup'],
      'conflict': ['closeup', 'threeQuarter', 'front'],
      'emotional_climax': ['closeup', 'front', 'threeQuarter'],
      'resolution': ['threeQuarter', 'front', 'closeup']
    };
    
    const preferred = priority[sceneType] || ['threeQuarter', 'front', 'closeup'];
    
    for (const angle of preferred) {
      if (availableAngles.includes(angle)) return angle;
    }
    
    return availableAngles[0];
  }

  /**
   * 构建定妆照描述
   */
  _buildImageDescription(character, angle) {
    const angleDesc = {
      'front': '正面',
      'threeQuarter': '侧面',
      'closeup': '近景',
      'side': '另一侧面'
    };
    
    const features = character.visual_anchor?.core_features || [];
    return `${character.name}${angleDesc[angle] || angle}，${features.join('，')}，超写实`;
  }

  /**
   * Stage 5: 质量门校验
   */
  _runQualityGate(prompts) {
    const checks = [];
    
    for (const p of prompts) {
      const check = {
        shotId: p.shotId,
        promptLength: p.length,
        hasTimeline: p.prompt.includes('【镜头时间轴】'),
        hasCharacters: p.prompt.includes('【角色一致性】') || p.imageRefs.length > 0,
        noForbidden: !p.prompt.includes('暗黑风') || p.prompt.includes('暗黑风') && p.prompt.indexOf('暗黑风') > p.prompt.length - 50,
        withinLimit: p.length <= this.config.maxPromptLength
      };
      
      check.passed = check.hasTimeline && check.hasCharacters && check.withinLimit;
      checks.push(check);
    }
    
    const allPassed = checks.every(c => c.passed);
    
    return {
      passed: allPassed,
      checks,
      totalPrompts: prompts.length,
      passedCount: checks.filter(c => c.passed).length
    };
  }

  /**
   * Stage 6: 片头生成
   */
  _generateOpening(blueprint) {
    const config = blueprint.config || {};
    const beastId = config.featured_beast_id;
    
    if (!beastId) {
      return { generated: false, reason: '无 featured_beast_id' };
    }
    
    // 使用现有片头系统（如果可用）
    const openingSystem = this.modules.openingSystem;
    if (openingSystem) {
      try {
        // 简化的片头生成
        return {
          generated: true,
          shotId: 'S00',
          type: 'opening',
          beastId
        };
      } catch (e) {
        return { generated: false, error: e.message };
      }
    }
    
    return { generated: false, reason: '片头系统不可用' };
  }

  /**
   * Stage 7: 连续性检查
   */
  _checkContinuity(prompts) {
    const issues = [];
    
    // 检查角色连续性
    const characterMentions = prompts.map((p, idx) => {
      const chars = p.imageRefs.map(r => r.characterId);
      return { idx, chars };
    });
    
    // 检查时序连续性
    for (let i = 1; i < prompts.length; i++) {
      const prev = prompts[i - 1];
      const curr = prompts[i];
      
      // 检查是否有共享角色
      const sharedChars = prev.imageRefs.filter(r => 
        curr.imageRefs.some(c => c.characterId === r.characterId)
      );
      
      if (sharedChars.length === 0 && prev.imageRefs.length > 0 && curr.imageRefs.length > 0) {
        issues.push({
          type: 'character_gap',
          between: [prev.shotId, curr.shotId],
          message: '相邻镜头无共享角色，可能导致叙事断裂'
        });
      }
    }
    
    return {
      passed: issues.length === 0,
      issues,
      promptCount: prompts.length
    };
  }

  /**
   * 生成生产报告
   */
  generateReport(result) {
    return {
      engine: 'ProductionEngine',
      version: '1.0.0',
      success: result.success,
      summary: {
        totalShots: result.shots.length,
        totalPrompts: result.prompts.length,
        totalDuration: result.shots.reduce((sum, s) => sum + s.timing.duration, 0),
        avgPromptLength: result.prompts.reduce((sum, p) => sum + p.length, 0) / result.prompts.length
      },
      stages: Object.fromEntries(
        Object.entries(result.stages).map(([k, v]) => [k, {
          duration: v._stageDuration || 0,
          success: !v.error
        }])
      ),
      errors: result.errors,
      timing: result.timing
    };
  }
}

module.exports = { ProductionEngine };
