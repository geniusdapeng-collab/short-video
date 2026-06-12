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
      
      // v6.37-P0: 构建标准输出结构（meta + opening + shots）
      result.meta = this._buildMeta(adaptedBlueprint);
      result.opening = result.stages.opening?.openingData || null;
      
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
   * v6.37-P0: 构建 Meta 元信息
   */
  _buildMeta(adaptedBlueprint) {
    const worldSetting = adaptedBlueprint.worldSetting || {};
    const config = adaptedBlueprint.config || {};
    
    return {
      title: config.title || '未命名短片',
      worldview: worldSetting.world_id || 'default',
      totalDuration: this._calculateTotalDuration(adaptedBlueprint.scenes),
      openingDuration: config.opening_duration || 10,
      fps: 24,
      resolution: '1920x1080',
      styleNotes: config.style_notes || 'cinematic, hyperrealistic'
    };
  }
  
  _calculateTotalDuration(scenes) {
    if (!scenes || scenes.length === 0) return 0;
    return scenes.reduce((sum, scene) => sum + (scene.timing?.duration || 20), 0);
  }

  /**
   * Stage 1: 从适配蓝图提取场景，转换为内部镜头结构
   * v6.37-P0: 改造为符合参考文档的字段格式
   */
  _extractScenes(adaptedBlueprint) {
    const scenes = adaptedBlueprint.scenes || [];
    const characters = adaptedBlueprint.characters || [];
    const worldSetting = adaptedBlueprint.worldSetting || {};
    
    const shots = scenes.map((scene, index) => {
      // 构建角色描述（v6.37-P0: 改为极简锚点格式）
      const characterAnchors = (scene.characters || []).map(cid => {
        const char = characters.find(c => c.character_id === cid);
        if (!char) return `${cid}: unknown`;
        
        const race = char.species || char.race || 'unknown';
        const features = char.visual_anchor?.core_features || [];
        // 取3-5个核心特征
        const keywords = features.slice(0, 5).join(', ');
        return `${char.name}: ${race}, ${keywords}`;
      });
      
      // 构建对话（v6.37-P0: 统一格式 SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES）
      const dialogueLines = (scene.dialogue?.lines || []).map(line => {
        const speaker = line.speaker || '角色';
        const type = line.type || '独白';
        const emotion = line.emotion || '平静';
        const text = line.text || '';
        return `${speaker}|${type}|${emotion}|${text}|LIP_SYNC:YES`;
      });
      
      // v6.37-P0: 构建五维空间描述（scene字段）
      const sceneDescription = this._buildFiveDimensionScene(scene, worldSetting);
      
      // v6.37-P0: 构建 mood（3-5情绪关键词）
      const mood = this._buildMood(scene);
      
      // v6.37-P0: 构建 action（核心动词+交互目标）
      const action = this._buildAction(scene);
      
      return {
        shotId: scene.scene_id || `S${String(index + 1).padStart(2, '0')}`,
        sceneType: scene.scene_type || 'establishing',
        sceneFunction: scene.scene_function || 'establish',
        
        // v6.37-P0: 时序（保留对象，后续转为字符串）
        timing: {
          start: scene.timing?.start || 0,
          duration: scene.timing?.duration || 20,
          end: scene.timing?.end || 20
        },
        
        // v6.37-P0: 场景（五维空间描述法）
        scene: sceneDescription,
        
        // v6.37-P0: 情绪
        mood: mood,
        
        // v6.37-P0: 角色（极简锚点）
        character: characterAnchors.join(' | '),
        characterRef: this._buildCharacterRef(scene, characters),
        
        // v6.37-P0: 动作
        action: action,
        
        // v6.37-P0: 对话（统一格式）
        dialogue: dialogueLines.join(' || '),
        
        // 保留原始数据（供内部使用）
        characters: scene.characters || [],
        characterDescs: characterAnchors.join(' | '),
        dialogueText: (scene.dialogue?.lines || []).map(l => l.text).join('；'),
        
        // 情感
        emotionalTarget: scene.emotional_target || { valence: 0, arousal: 0.5 },
        
        // 视觉方向
        visualDirection: scene.visual_direction || {},
        
        // Prompt 基础
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
   * v6.37-P0: 构建五维空间描述
   */
  _buildFiveDimensionScene(scene, worldSetting) {
    const dimensions = [];
    
    // 1. 宏观地理：星球/大陆/区域
    const worldName = worldSetting.name || worldSetting.world_id || '未知世界';
    dimensions.push(worldName);
    
    // 2. 中观地貌：地形/地貌
    const setting = scene.setting || '';
    if (setting) dimensions.push(setting);
    
    // 3. 微观材质：表面材质/纹理
    const materials = scene.materials || scene.surface_details || '';
    if (materials) dimensions.push(materials);
    
    // 4. 天气时间：时间/天气/光照
    const timeOfDay = scene.time_of_day || scene.lighting?.time_of_day || '';
    if (timeOfDay) dimensions.push(timeOfDay);
    
    // 5. 空间深度：前景/中景/背景层次
    const depth = scene.depth_layers || scene.spatial_depth || 'atmospheric perspective';
    dimensions.push(`spatial depth: ${depth}`);
    
    return dimensions.join(', ');
  }
  
  /**
   * v6.37-P0: 构建 mood（3-5情绪关键词）
   */
  _buildMood(scene) {
    const moodMap = {
      'opening': 'epic, mysterious, awe-inspiring',
      'establishing': 'mysterious, anticipation, wonder',
      'conflict': 'tense, determined, brave, confrontational',
      'emotional_climax': 'epic, emotional, powerful, cathartic',
      'resolution': 'peaceful, warm, nostalgic, hopeful',
      'discovery': 'curious, excited, surprised, wondrous',
      'transition': 'flowing, continuous, seamless'
    };
    
    return moodMap[scene.scene_type] || 'neutral, calm, steady';
  }
  
  /**
   * v6.37-P0: 构建 action（核心动词+交互目标）
   */
  _buildAction(scene) {
    const actionMap = {
      'opening': 'establishing shot, camera slowly descending through atmospheric layers',
      'establishing': 'protagonist steps forward, observing surroundings with focused gaze',
      'conflict': 'confrontation stance, direct eye contact, tension building in posture',
      'emotional_climax': 'dramatic gesture, emotional peak, decisive movement',
      'resolution': 'gentle release, returning to calm, peaceful closure',
      'discovery': 'leaning forward, reaching out, examining with curiosity'
    };
    
    return actionMap[scene.scene_type] || 'neutral stance, steady breathing';
  }
  
  /**
   * v6.37-P0: 构建 characterRef（image://格式）
   */
  _buildCharacterRef(scene, characters) {
    const refs = (scene.characters || []).map(cid => {
      const char = characters.find(c => c.character_id === cid);
      if (!char) return null;
      
      // 构建 image:// 路径
      const paths = [];
      const angles = ['front', 'profile', 'three-quarter', 'closeup', 'detail'];
      angles.forEach(angle => {
        paths.push(`image://characters/${cid}-${angle}.png`);
      });
      
      return `${char.name}: ${paths.join(', ')}`;
    }).filter(Boolean);
    
    return refs.join(' | ') || 'NONE';
  }

  /**
   * Stage 2: 时长分配（精细化）
   * v6.37-P0: 新增 timeline 字段
   */
  _allocateDuration(shots) {
    const allocator = this.modules.shotDurationAllocator;
    if (!allocator) {
      // 回退：使用剧本引擎的时长
      return { shots };
    }
    
    // 基于内容重要性、台词长度、视觉复杂度三维度重新分配
    const allocatedShots = shots.map((shot, index) => {
      // 台词越长，时长越长
      const dialogueLength = shot.dialogue?.length || 0;
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
      
      // v6.37-P0: 构建 timeline 字段
      const timeline = this._buildTimeline(shot, index, finalDuration);
      
      return {
        ...shot,
        timing: {
          ...shot.timing,
          duration: finalDuration,
          end: shot.timing.start + finalDuration
        },
        // v6.37-P0: timeline 字段
        timeline: timeline,
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
   * v6.37-P0: 构建 timeline 字段
   * 格式：T00:XX-T00:XX / duration: Xs / type: XXX / mood: XXX
   */
  _buildTimeline(shot, index, duration) {
    const startTime = shot.timing.start || 0;
    const endTime = startTime + duration;
    const type = shot.sceneType || 'normal';
    const mood = shot.mood || 'neutral';
    
    return `T${String(Math.floor(startTime/60)).padStart(2, '0')}:${String(startTime%60).padStart(2, '0')}-T${String(Math.floor(endTime/60)).padStart(2, '0')}:${String(endTime%60).padStart(2, '0')} / duration: ${duration}s / type: ${type} / mood: ${mood}`;
  }

  /**
   * Stage 3: 运镜设计
   * v6.37-P0: 改造 camera 字段为字符串格式，新增 lighting 字段
   */
  _designCameraMovement(shots) {
    const cameraSystem = this.modules.cameraMovement;
    
    const designedShots = shots.map(shot => {
      // 基于场景类型推断运镜
      const cameraConfig = this._inferCameraConfig(shot);
      
      // v6.37-P0: 构建 camera 字段（字符串格式）
      const cameraString = this._buildCameraString(cameraConfig, shot);
      
      // v6.37-P0: 构建 lighting 字段
      const lighting = this._buildLighting(shot, cameraConfig);
      
      return {
        ...shot,
        camera: cameraString,
        lighting: lighting,
        cameraMovement: {
          ...cameraConfig,
          // 4段式运镜时间轴
          timeline: this._generateCameraTimeline(shot.timing.duration, cameraConfig)
        }
      };
    });
    
    return { shots: designedShots };
  }
  
  /**
   * v6.37-P0: 构建 camera 字符串（12级机位+14运镜+焦距+速度）
   */
  _buildCameraString(cameraConfig, shot) {
    const shotSizeMap = {
      'wide': 'wide shot',
      'medium': 'medium shot',
      'close_up': 'close-up',
      'extreme_close_up': 'extreme close-up',
      'establishing': 'establishing shot'
    };
    
    const movementMap = {
      '缓慢推进': 'slow dolly in',
      '稳定机位': 'static hold',
      '手持晃动': 'handheld shake',
      '快速推近': 'fast push in',
      '缓慢后拉': 'slow pull back'
    };
    
    const focalMap = {
      'slow': '24mm wide',
      'normal': '35mm standard',
      'fast': '85mm portrait',
      'dynamic': '50mm standard'
    };
    
    const shotSize = shotSizeMap[cameraConfig.shotType] || 'medium shot';
    const movement = movementMap[cameraConfig.movement] || 'static';
    const focal = focalMap[cameraConfig.speed] || '35mm';
    const speed = cameraConfig.speed || 'normal';
    
    return `${shotSize}, ${movement}, ${focal} lens, ${speed} speed`;
  }
  
  /**
   * v6.37-P0: 构建 lighting 字段（主光方向+色温K值+特效光）
   */
  _buildLighting(shot, cameraConfig) {
    const lightingMap = {
      'opening': 'backlight 3200K, golden hour rim, volumetric god rays',
      'establishing': 'front light 4500K, neutral balanced, soft fill',
      'conflict': 'top light 5600K, harsh shadows, dramatic contrast',
      'emotional_climax': 'omni light 8000K, bright key, volumetric glow',
      'resolution': 'backlight 2800K, warm sunset, soft diffusion',
      'discovery': 'side light 4500K, cool blue accent, practical source'
    };
    
    return lightingMap[shot.sceneType] || 'front light 4500K, neutral balanced';
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
   * v6.37-P0: 按参考文档融合顺序构建 Prompt，产出标准字段格式
   * 保留卓越系统特有字段：mouthAction, importance, visualComplexity, qualityScore, enhanced
   */
  _engineerPrompts(shots, blueprint) {
    const prompts = [];
    const engineeredShots = [];
    
    for (const shot of shots) {
      // 构建 Prompt 各部分（按融合顺序）
      const prompt = this._buildShotPrompt(shot, blueprint);
      
      // 字符计数
      const promptLength = this._countChars(prompt.fullPrompt);
      
      // v6.37-P0: 构建标准输出对象（参考文档格式 + 卓越系统保留字段）
      const standardOutput = {
        // === 核心字段（参考文档 v6.37-Peng）===
        shotId: shot.shotId,
        duration: shot.timing.duration,
        scene: shot.scene,
        mood: shot.mood,
        camera: shot.camera,
        lighting: shot.lighting,
        characterRef: shot.characterRef,
        character: shot.character,
        action: shot.action,
        dialogue: shot.dialogue,
        timeline: shot.timeline,
        backgroundSound: this._buildBackgroundSound(shot),
        prompt: prompt.fullPrompt,
        promptCharCount: promptLength,
        
        // === 卓越系统保留字段 ===
        mouthAction: shot.mouthAction || this._buildMouthAction(shot),
        importance: shot.importance || 5,
        visualComplexity: shot.visualComplexity || 5,
        qualityScore: shot.qualityScore || { totalScore: 75 },
        enhanced: true,
        
        // === 内部字段（扩展接口）===
        physicsLayer: shot.physicsLayer || '',
        colorScience: shot.colorScience || '',
        negativePrompt: shot.negativePrompt || '',
        renderStyle: shot.renderStyle || '',
        directorStyle: shot.directorStyle || '',
        
        // === 兼容性字段 ===
        length: promptLength,
        utilization: Math.round(promptLength / 1500 * 100),
        utilizationStatus: promptLength >= 970 && promptLength <= 1500 ? '🔥理想' : (promptLength > 1500 ? '❌超标' : '⚠️空间浪费')
      };
      
      // 片头专属字段
      if (shot.sceneType === 'opening') {
        standardOutput.audioLayer = this._buildAudioLayer(shot);
        standardOutput.titleOverlay = this._buildTitleOverlay(blueprint);
      }
      
      engineeredShots.push(standardOutput);
      prompts.push(standardOutput);
    }
    
    return { shots: engineeredShots, prompts };
  }
  
  /**
   * v6.37-P0: 构建 mouthAction 字段（供Seedance对口型）
   */
  _buildMouthAction(shot) {
    const actionMap = {
      'opening': '嘴部自然闭合，面对镜头，准备开口',
      'establishing': '嘴部微张，观察时自然呼吸',
      'conflict': '嘴部紧闭，紧张时咬紧牙关',
      'emotional_climax': '嘴部张大，情感爆发时大声呼喊',
      'resolution': '嘴部放松，微笑，平静呼吸'
    };
    
    return actionMap[shot.sceneType] || '嘴部自然闭合';
  }
  
  /**
   * v6.37-P0: 构建 backgroundSound 字段（三段式）
   */
  _buildBackgroundSound(shot) {
    const type = shot.sceneType || 'normal';
    
    const soundMap = {
      'opening': 'AMBIENT: epic atmosphere, deep earth rumble 20-60Hz | SPATIAL: 3D audio pan synchronized with camera movement | INTENSITY: crescendo 0-3s, peak 3-7s, decay 7-10s',
      'establishing': 'AMBIENT: natural environment, wind and distant sounds | SPATIAL: ambient stereo field | INTENSITY: steady state, subtle variations',
      'conflict': 'AMBIENT: tension building, low frequency rumble | SPATIAL: directional audio pan | INTENSITY: building 0-5s, peak 5-8s',
      'emotional_climax': 'AMBIENT: full frequency spectrum, rich harmonics | SPATIAL: immersive surround | INTENSITY: maximum 0-3s, sustain 3-10s',
      'resolution': 'AMBIENT: gentle atmosphere, soft reverb | SPATIAL: wide stereo field | INTENSITY: fading 0-5s, quiet 5-10s'
    };
    
    return soundMap[type] || 'AMBIENT: neutral atmosphere | SPATIAL: centered mono | INTENSITY: steady';
  }
  
  /**
   * v6.37-P0: 构建 audioLayer 字段（片头专属）
   */
  _buildAudioLayer(shot) {
    return 'Sub-bass earth rumble fade in 3s, distant wind and environmental sounds, string section long note at 5s, timpani strike at 8s';
  }
  
  /**
   * v6.37-P0: 构建 titleOverlay 字段（片头专属）
   */
  _buildTitleOverlay(blueprint) {
    const config = blueprint.config || {};
    const worldSetting = blueprint.worldSetting || {};
    
    return `MAIN_TITLE: "${config.title || '未命名'}" | SUBTITLE: "${worldSetting.name || '系列作品'}" | PRODUCER: "by ${config.producer || 'Genius'}" | TITLE_ANIM: light-vein carving growth 3.0-5.0s`;
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
   * 构建单个镜头的完整 Prompt（v2.0-B+: 七层架构 + 极致视听融合 + v6.37-P0 字段对齐）
   * 
   * 融合顺序（按参考文档 v6.37-Peng）：
   * CharacterRef → Timeline → Dialogue → AudioLayer(片头) → TitleOverlay(片头) → 
   * BackgroundSound → Character → Action → Scene → Mood → Camera → Lighting → 
   * PhysicsLayer → ColorScience → NegativePrompt → RenderStyle → DirectorStyle
   * 
   * 七层结构：
   * L1: 约束层（P0必加）- 画幅/帧率/无字幕
   * L2: 基础层（P0必加）- 写实度/HDR/胶片质感
   * L3: 空间层（P1防平庸）- scene字段（五维空间）
   * L4: 主体层（P2防漂移）- character/action/dialogue
   * L5: 动态层（P1防平庸）- camera/timeline
   * L6: 风格层（P2防漂移）- mood/lighting
   * L7: 音频层（🔊 新增）- backgroundSound/audioLayer
   * L8: 内部层（扩展）- PhysicsLayer/ColorScience/NegativePrompt/RenderStyle/DirectorStyle
   * L9: 质控层（P0必加）- 负面约束/角色一致性
   */
  _buildShotPrompt(shot, blueprint) {
    const parts = [];
    
    // === L1: 约束层（P0必加）===
    const ratio = blueprint.aspectRatio || shot.ratio || '16:9';
    parts.push(`${ratio} cinematic, no text, no subtitle, no caption, no watermark, 24fps cinematic`);
    
    // === L2: 基础层（P0必加）===
    parts.push('hyperrealistic, ultra-detailed, high dynamic range, detail in highlights and shadows, film grain, 35mm texture, cinematic film');
    
    // === L3: 空间层（P1防平庸）===
    // v6.37-P0: scene 字段（五维空间描述）
    if (shot.scene) {
      parts.push(shot.scene);
    }
    
    // === L4: 主体层（P2防漂移）===
    // v6.37-P0: character 字段（极简锚点）
    if (shot.character && shot.character !== 'NONE') {
      parts.push(shot.character);
    }
    
    // v6.37-P0: action 字段（核心动词+交互目标）
    if (shot.action) {
      parts.push(shot.action);
    }
    
    // v6.37-P0: dialogue 字段（统一格式）
    if (shot.dialogue && shot.dialogue !== '') {
      parts.push(`dialogue: ${shot.dialogue}`);
    }
    
    // === L5: 动态层（P1防平庸）===
    // v6.37-P0: camera 字段（12级机位+运镜+焦距+速度）
    if (shot.camera) {
      parts.push(shot.camera);
    }
    
    // v6.37-P0: timeline 字段
    if (shot.timeline) {
      parts.push(`timeline: ${shot.timeline}`);
    }
    
    // === L6: 风格层（P2防漂移）===
    // v6.37-P0: mood 字段（3-5情绪关键词）
    if (shot.mood) {
      parts.push(`mood: ${shot.mood}`);
    }
    
    // v6.37-P0: lighting 字段（主光方向+色温K值+特效光）
    if (shot.lighting) {
      parts.push(shot.lighting);
    }
    
    // === L7: 音频层（🔊 新增）===
    // v6.37-P0: backgroundSound 字段（三段式）
    if (shot.backgroundSound) {
      parts.push(`audio: ${shot.backgroundSound}`);
    }
    
    // v6.37-P0: audioLayer 字段（片头专属）
    if (shot.audioLayer && shot.audioLayer !== '') {
      parts.push(`audioLayer: ${shot.audioLayer}`);
    }
    
    // === L8: 内部层（扩展接口）===
    // PhysicsLayer
    if (shot.physicsLayer && shot.physicsLayer !== '') {
      parts.push(`physics: ${shot.physicsLayer}`);
    }
    
    // ColorScience
    if (shot.colorScience && shot.colorScience !== '') {
      parts.push(`color: ${shot.colorScience}`);
    }
    
    // RenderStyle
    if (shot.renderStyle && shot.renderStyle !== '') {
      parts.push(`style: ${shot.renderStyle}`);
    }
    
    // DirectorStyle
    if (shot.directorStyle && shot.directorStyle !== '') {
      parts.push(`director: ${shot.directorStyle}`);
    }
    
    // === L9: 质控层（P0必加）===
    // 世界设定（通用化，不硬编码）
    if (shot.worldId && shot.worldId !== 'default') {
      parts.push(`${shot.worldId} world`);
    }
    
    // 负面约束（NegativePrompt）
    const negativeConstraints = [
      'no watermark, no logo, no text overlay, no subtitle, no caption',
      'blurry, low resolution, pixelated, compression artifacts',
      'cartoon, anime, illustration, 3D render look, CGI appearance, plastic look',
      'distorted perspective, impossible geometry, floating objects',
      'flat lighting, overexposed, crushed blacks, double shadows',
      'unnatural physics, fake water, static water, cardboard texture, plastic foliage'
    ];
    
    // 人物专项（如果含角色）
    if (shot.characters?.length > 0 || shot.character) {
      negativeConstraints.push('distorted face, deformed face, extra fingers, plastic skin, waxy skin, unnatural pose');
    }
    
    // 世界专属（通用化）
    if (shot.worldId && shot.worldId !== 'default') {
      negativeConstraints.push('natural eye colors only, no metallic shine');
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
      audioIncluded: !!shot.backgroundSound
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
   * v6.37-P0: 字符计数
   */
  _countChars(text) {
    if (!text) return 0;
    // 计算字符数（包括中英文）
    let count = 0;
    for (const char of text) {
      count++;
    }
    return count;
  }

  /**
   * Stage 5: 质量门校验
   * v6.37-P2: 审核增强 - 检查新字段格式与完整性
   */
  _runQualityGate(prompts) {
    const checks = [];
    
    for (const p of prompts) {
      const check = {
        shotId: p.shotId,
        promptLength: p.promptCharCount || p.length || 0,
        
        // v6.37-P2: 核心字段检查
        hasScene: !!p.scene && p.scene.length > 10,
        hasMood: !!p.mood && p.mood.split(',').length >= 3,
        hasCamera: !!p.camera && p.camera.length > 10,
        hasLighting: !!p.lighting && p.lighting.includes('K'),
        hasCharacter: !!p.character && p.character !== 'NONE',
        hasAction: !!p.action && p.action.length > 5,
        hasDialogue: !!p.dialogue && p.dialogue !== 'NONE',
        hasTimeline: !!p.timeline && p.timeline.includes('T00:'),
        hasBackgroundSound: !!p.backgroundSound && p.backgroundSound.includes('AMBIENT:'),
        
        // 片头专属检查
        isOpening: p.shotId === 'S00',
        hasAudioLayer: p.shotId === 'S00' ? (!!p.audioLayer && p.audioLayer.length > 10) : true,
        hasTitleOverlay: p.shotId === 'S00' ? (!!p.titleOverlay && p.titleOverlay.includes('MAIN_TITLE:')) : true,
        
        // 字符数检查
        withinLimit: (p.promptCharCount || p.length || 0) <= this.config.maxPromptLength,
        
        // 格式检查
        characterRefFormat: p.characterRef === 'NONE' || p.characterRef.includes('image://'),
        dialogueFormat: p.dialogue === 'NONE' || p.dialogue.includes('|'),
        timelineFormat: p.timeline === 'NONE' || p.timeline.includes('T00:'),
        
        // 通用检查
        noForbidden: !p.prompt.includes('暗黑风') || p.prompt.includes('暗黑风') && p.prompt.indexOf('暗黑风') > p.prompt.length - 50
      };
      
      // v6.37-P2: 综合通过条件（更严格）
      check.passed = 
        check.hasScene && 
        check.hasMood && 
        check.hasCamera && 
        check.hasLighting &&
        check.hasAction &&
        check.hasTimeline &&
        check.hasBackgroundSound &&
        check.withinLimit &&
        check.characterRefFormat &&
        check.dialogueFormat &&
        check.timelineFormat &&
        check.hasAudioLayer &&
        check.hasTitleOverlay;
      
      checks.push(check);
    }
    
    const allPassed = checks.every(c => c.passed);
    
    return {
      passed: allPassed,
      checks,
      totalPrompts: prompts.length,
      passedCount: checks.filter(c => c.passed).length,
      failedFields: checks.filter(c => !c.passed).map(c => ({
        shotId: c.shotId,
        failed: Object.entries(c).filter(([k, v]) => k.startsWith('has') && !v).map(([k]) => k)
      }))
    };
  }

  /**
   * Stage 6: 片头生成
   * v6.37-P0: 产出符合片头结构（15字段）
   */
  _generateOpening(blueprint) {
    const config = blueprint.config || {};
    const worldSetting = blueprint.worldSetting || {};
    const beastId = config.featured_beast_id;
    
    if (!beastId) {
      return { generated: false, reason: '无 featured_beast_id' };
    }
    
    // v6.37-P0: 构建标准片头结构（15字段）
    const openingData = {
      shotId: 'S00',
      duration: config.opening_duration || 10,
      scene: this._buildOpeningScene(worldSetting),
      mood: 'epic, mysterious, awe-inspiring',
      camera: 'epic wide shot, slow descent through atmospheric layers, 24mm wide lens, slow speed',
      lighting: 'backlight 3200K, golden hour rim, volumetric god rays',
      characterRef: 'NONE',
      character: 'NONE',
      action: 'establishing shot, camera slowly descending through atmospheric layers',
      dialogue: 'NONE',
      timeline: 'T00:00-T00:10 / duration: 10s / type: opening / mood: epic',
      audioLayer: 'Sub-bass earth rumble fade in 3s, distant wind and environmental sounds, string section long note at 5s, timpani strike at 8s',
      titleOverlay: `MAIN_TITLE: "${config.title || '未命名'}" | SUBTITLE: "${worldSetting.name || '系列作品'}" | PRODUCER: "by ${config.producer || 'Genius'}" | TITLE_ANIM: light-vein carving growth 3.0-5.0s`,
      backgroundSound: 'AMBIENT: epic atmosphere, deep earth rumble 20-60Hz | SPATIAL: 3D audio pan synchronized with camera movement | INTENSITY: crescendo 0-3s, peak 3-7s, decay 7-10s',
      prompt: '', // 由 Prompt 工程构建
      promptCharCount: 0
    };
    
    // 构建片头 Prompt
    const prompt = this._buildShotPrompt(openingData, blueprint);
    openingData.prompt = prompt.fullPrompt;
    openingData.promptCharCount = this._countChars(prompt.fullPrompt);
    
    return { 
      generated: true,
      openingData,
      shotId: 'S00',
      type: 'opening',
      beastId
    };
  }
  
  _buildOpeningScene(worldSetting) {
    const worldName = worldSetting.name || worldSetting.world_id || 'Unknown World';
    const atmosphere = worldSetting.atmosphere || 'mysterious';
    const timeOfDay = worldSetting.time_of_day || 'golden hour';
    const depth = worldSetting.spatial_depth || 'atmospheric layers';
    
    return `${worldName}, ${atmosphere} atmosphere, ${timeOfDay} lighting, ${depth}, spatial depth: infinite`;
  }

  /**
   * Stage 7: 连续性检查
   * v6.37-P0: 适配新字段结构（characterRef 替代 imageRefs）
   */
  _checkContinuity(prompts) {
    const issues = [];
    
    // 检查角色连续性（从 characterRef 解析）
    const characterMentions = prompts.map((p, idx) => {
      const chars = this._parseCharacterRefForContinuity(p.characterRef);
      return { idx, chars };
    });
    
    // 检查时序连续性
    for (let i = 1; i < prompts.length; i++) {
      const prev = prompts[i - 1];
      const curr = prompts[i];
      
      const prevChars = this._parseCharacterRefForContinuity(prev.characterRef);
      const currChars = this._parseCharacterRefForContinuity(curr.characterRef);
      
      // 检查是否有共享角色
      const sharedChars = prevChars.filter(c => currChars.includes(c));
      
      if (sharedChars.length === 0 && prevChars.length > 0 && currChars.length > 0) {
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
   * v6.37-P0: 从 characterRef 解析角色名（用于连续性检查）
   */
  _parseCharacterRefForContinuity(characterRef) {
    if (!characterRef || characterRef === 'NONE') return [];
    
    const chars = [];
    const parts = characterRef.split(' | ');
    
    for (const part of parts) {
      const match = part.match(/(.+?):\s*/);
      if (match) {
        chars.push(match[1].trim());
      }
    }
    
    return chars;
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
