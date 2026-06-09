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
      maxPromptLength: 980,
      targetPromptLength: 960,
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
   * 构建单个镜头的完整 Prompt
   */
  _buildShotPrompt(shot, blueprint) {
    const parts = [];
    
    // 1. 风格声明（固定前缀）
    parts.push('电影级镜头，超写实');
    
    // 2. 世界设定（Nirath）
    if (shot.worldId === 'nirath') {
      parts.push('Nirath星球');
    }
    
    // 3. 场景设定
    if (shot.setting) {
      parts.push(shot.setting);
    }
    
    // 4. 角色描述
    if (shot.characterDescs) {
      parts.push(shot.characterDescs);
    }
    
    // 5. 运镜描述
    if (shot.camera?.movement) {
      parts.push(`${shot.camera.movement}，${shot.camera.shotType}`);
    }
    
    // 6. 时间轴（4段式）
    if (shot.camera?.timeline) {
      const timelineText = shot.camera.timeline.map(t => 
        `${t.timeRange} ${t.cameraMovement}`
      ).join(' → ');
      parts.push(`【镜头时间轴】${timelineText}`);
    }
    
    // 7. 视觉笔记
    if (shot.visualNotes) {
      parts.push(shot.visualNotes);
    }
    
    // 8. 对话（必须嵌入）
    if (shot.dialogueText) {
      parts.push(`台词：${shot.dialogueText}`);
    }
    
    // 9. 负面约束
    parts.push('暗黑风，金属光泽，非自然眼色');
    
    // 10. 角色一致性约束
    if (shot.characters?.length > 0) {
      parts.push(`【角色一致性】保持${shot.characters.join('、')}形象一致`);
    }
    
    const fullPrompt = parts.join('，');
    
    // 截断保护
    const truncated = this._truncatePrompt(fullPrompt, this.config.maxPromptLength);
    
    return {
      fullPrompt: truncated,
      rawPrompt: fullPrompt,
      parts,
      wasTruncated: fullPrompt.length !== truncated.length
    };
  }

  /**
   * 字符计数
   */
  _countChars(text) {
    if (this.modules.charCounter) {
      return this.modules.charCounter.count(text);
    }
    // 回退：简单计数
    return text.length;
  }

  /**
   * 截断 Prompt（保护末尾标签）
   */
  _truncatePrompt(prompt, maxLength) {
    if (prompt.length <= maxLength) return prompt;
    
    // 保留最后一段（通常是角色一致性约束）
    const lastPart = '【角色一致性】保持形象一致，杜绝分身重影';
    const availableLength = maxLength - lastPart.length - 2;
    
    if (availableLength > 50) {
      return prompt.substring(0, availableLength) + '，' + lastPart;
    }
    
    return prompt.substring(0, maxLength);
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
