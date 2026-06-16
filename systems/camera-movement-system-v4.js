/**
 * Camera Movement System v4.0 — 镜头内时间轴系统v2.0
 * 
 * 核心升级：LLM驱动的个性化时间轴
 * - 告别固定模板，每个镜头根据内容独特设计
 * - 四层架构：场景分析 → LLM生成 → 连续性检查 → 可选开关
 * 
 * 版本: v4.0
 * 日期: 2026-06-16
 */

const { IntraShotTimelineGenerator } = require('./camera-movement-system-v3.js');
const { LLMEngine } = require('./llm-reasoning-engine');

// ========== Layer 1: 场景分析器 ==========
class SceneAnalyzer {
  constructor() {
    this.spaceKeywords = {
      small: ['室内', '房间', '诊室', '办公室', '车内', '电梯', '走廊'],
      medium: ['教室', '会议室', '客厅', '餐厅', '实验室'],
      large: ['室外', '操场', '广场', '街道', '公园', '野外', '天空'],
      unlimited: ['宇宙', '太空', '梦境', '抽象', '虚拟']
    };
    
    this.sceneTypeMap = {
      dialogue: { name: '对话', movement: 'stable', preferredSizes: ['medium', 'close_up'], maxSegments: 3 },
      monologue: { name: '独白/讲解', movement: 'stable', preferredSizes: ['medium', 'close_up'], maxSegments: 3 },
      action: { name: '动作', movement: 'dynamic', preferredSizes: ['wide', 'full', 'medium'], maxSegments: 5 },
      chase: { name: '追逐', movement: 'dynamic', preferredSizes: ['wide', 'full'], maxSegments: 5 },
      discovery: { name: '发现', movement: 'explore', preferredSizes: ['wide', 'medium', 'close_up'], maxSegments: 4 },
      emotional: { name: '情感', movement: 'intimate', preferredSizes: ['close_up', 'extreme_close'], maxSegments: 2 },
      establishing: { name: '建立', movement: 'reveal', preferredSizes: ['extreme_wide', 'wide', 'medium'], maxSegments: 4 },
      transition: { name: '过渡', movement: 'smooth', preferredSizes: ['medium'], maxSegments: 2 }
    };
  }

  /**
   * 分析场景约束
   */
  analyze(sceneName, sceneDescription, duration, characters = []) {
    const desc = (sceneDescription || sceneName || '').toLowerCase();
    const name = (sceneName || '').toLowerCase();
    const combined = desc + ' ' + name;
    
    // 1. 推断空间大小
    let spaceSize = 'medium';
    if (this.spaceKeywords.small.some(k => combined.includes(k))) spaceSize = 'small';
    else if (this.spaceKeywords.large.some(k => combined.includes(k))) spaceSize = 'large';
    else if (this.spaceKeywords.unlimited.some(k => combined.includes(k))) spaceSize = 'unlimited';
    
    // 2. 推断场景类型
    let sceneType = 'dialogue';
    if (combined.includes('讲解') || combined.includes('介绍') || combined.includes('说明')) sceneType = 'monologue';
    else if (combined.includes('动作') || combined.includes('运动') || combined.includes('操作')) sceneType = 'action';
    else if (combined.includes('发现') || combined.includes('揭示') || combined.includes('展示')) sceneType = 'discovery';
    else if (combined.includes('情感') || combined.includes('悲伤') || combined.includes('喜悦')) sceneType = 'emotional';
    else if (combined.includes('开场') || combined.includes('建立') || combined.includes('环境')) sceneType = 'establishing';
    else if (combined.includes('过渡') || combined.includes('转场')) sceneType = 'transition';
    
    // 3. 计算段数（基于时长）
    const segmentCount = this._calculateSegmentCount(duration, sceneType);
    
    // 4. 景别约束
    const constraints = this._getShotSizeConstraints(spaceSize, sceneType);
    
    // 5. 运镜风格
    const typeInfo = this.sceneTypeMap[sceneType] || this.sceneTypeMap.dialogue;
    
    return {
      spaceSize,
      sceneType,
      sceneTypeName: typeInfo.name,
      segmentCount,
      constraints,
      movementStyle: typeInfo.movement,
      characterCount: characters.length,
      duration
    };
  }
  
  _calculateSegmentCount(duration, sceneType) {
    const base = duration < 5 ? 2 : duration < 10 ? 3 : duration < 15 ? 4 : 5;
    const typeInfo = this.sceneTypeMap[sceneType] || this.sceneTypeMap.dialogue;
    return Math.min(base, typeInfo.maxSegments);
  }
  
  _getShotSizeConstraints(spaceSize, sceneType) {
    const typeInfo = this.sceneTypeMap[sceneType] || this.sceneTypeMap.dialogue;
    
    // 空间约束
    const spaceLimits = {
      small: { min: 'close_up', max: 'medium', forbidden: ['wide', 'extreme_wide'] },
      medium: { min: 'medium', max: 'wide', forbidden: ['extreme_wide'] },
      large: { min: 'medium', max: 'extreme_wide', forbidden: [] },
      unlimited: { min: 'extreme_close', max: 'extreme_wide', forbidden: [] }
    };
    
    const space = spaceLimits[spaceSize] || spaceLimits.medium;
    
    // 结合场景类型偏好
    const preferred = typeInfo.preferredSizes.filter(s => !space.forbidden.includes(s));
    
    return {
      minSize: space.min,
      maxSize: space.max,
      forbidden: space.forbidden,
      preferred: preferred.length > 0 ? preferred : ['medium'],
      defaultSize: preferred[0] || 'medium'
    };
  }
}

// ========== Layer 2: LLM时间轴生成器 ==========
class LLMTimelineGenerator {
  constructor(options = {}) {
    this.model = options.model || 'kimi-k2p6';
    this.maxTokens = options.maxTokens || 2048;
    this.temperature = 1; // v6.5.11: kimi-k2p6 固定 temperature=1
    
    // 🔥 初始化真实LLM引擎
    this.llm = new LLMEngine({
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      mode: 'production',
      maxRetries: 3
    });
  }
  
  /**
   * 生成个性化时间轴Prompt（精简版）
   */
  _buildPrompt(sceneAnalysis, shotInfo, previousShotEnd = null) {
    const { sceneTypeName, segmentCount, constraints, movementStyle, duration } = sceneAnalysis;
    const { sceneName, sceneDescription, emotionPhase, characters, dialogue } = shotInfo;
    
    let prompt = `为以下镜头设计${segmentCount}段式运镜时间轴，直接输出JSON：

场景：${sceneName}（${sceneDescription || sceneName}）
类型：${sceneTypeName}
时长：${duration}秒
情绪：${emotionPhase || 'neutral'}
人物：${characters.map(c => c.name || c).join(', ') || '无'}
`;

    if (dialogue) {
      prompt += `台词："${dialogue.substring(0, 80)}..."\n`;
    }
    
    prompt += `
约束：${segmentCount}段，景别可用[${constraints.preferred.join(', ')}]，禁用[${constraints.forbidden.join(', ') || '无'}]
`;

    if (previousShotEnd) {
      prompt += `连续性：上一个镜头结束为${previousShotEnd.shotSizeDesc}，本镜头开始避免视觉跳跃\n`;
    }
    
    prompt += `
要求：
1. 每段时间范围格式如"0-3.5"
2. 运镜动作要具体独特（含具体数字：厘米、度、秒）
3. 根据台词重点调整景别和运镜
4. 讲解类以稳定中景/近景为主

必须输出JSON格式：
{"strategy":"策略名","reasoning":"设计理由","segments":[{"timeRange":"0-5","shotSize":"medium","movement":"具体运镜","speed":"极慢","reason":"理由"}]}`;

    return prompt;
  }
  
  /**
   * 调用LLM生成时间轴
   */
  async generateTimeline(sceneAnalysis, shotInfo, previousShotEnd = null) {
    const prompt = this._buildPrompt(sceneAnalysis, shotInfo, previousShotEnd);
    
    try {
      console.log('[LLMTimelineGenerator] 🚀 调用LLM生成个性化时间轴...');
      const startedAt = Date.now();
      
      // 🔥 v6.6.5-fix: 使用JSON模式 + allowReasoningFallback
      // 强制API返回JSON，同时允许在content=0时从reasoning兜底提取
      const result = await this.llm.generate(prompt, {
        systemPrompt: '你是一位专业的电影摄影师，擅长为每个镜头设计独特的内部时间轴。请直接输出JSON，不要有任何思考过程或解释。',
        temperature: 1,
        maxTokens: this.maxTokens,
        responseFormat: { type: 'json_object' },  // 强制API返回JSON
        allowReasoningFallback: true  // ✅ 允许从reasoning_content兜底提取
      });
      
      const duration = Date.now() - startedAt;
      
      // 检查LLMEngine返回状态
      if (!result || !result.success) {
        throw new Error(result?.error || 'LLM调用失败');
      }
      
      // v6.6.5-fix: 同时尝试content和raw.reasoning，哪个能提取出JSON就用哪个
      let text = '';
      let rawReasoning = '';
      let source = '';
      
      const apiReasoning = result.raw?.choices?.[0]?.message?.reasoning_content || '';
      if (apiReasoning?.trim()) {
        rawReasoning = apiReasoning.trim();
      }
      
      const content = result.content?.trim() || '';
      
      // 先尝试从content提取JSON
      if (content) {
        const testParse = this._tryExtractJSON(content);
        if (testParse) {
          text = content;
          source = 'content';
        }
      }
      
      // 如果content没有有效JSON，尝试raw.reasoning
      if (!text && rawReasoning) {
        const testParse = this._tryExtractJSON(rawReasoning);
        if (testParse) {
          text = rawReasoning;
          source = 'raw.reasoning';
        }
      }
      
      // 如果都没有，fallback到content（即使可能不是JSON，让后续处理）
      if (!text) {
        if (content) {
          text = content;
          source = 'content-fallback';
        } else if (rawReasoning) {
          text = rawReasoning;
          source = 'raw.reasoning-fallback';
        } else if (result.reasoning_content?.trim()) {
          text = result.reasoning_content.trim();
          source = 'reasoning_content';
        }
      }
      
      if (!text) {
        throw new Error('LLM返回为空');
      }
      
      console.log(`[LLMTimelineGenerator] ✅ LLM完成 | 耗时: ${duration}ms | 来源: ${source}`);
      console.log('[LLMTimelineGenerator] 文本长度:', text.length);
      console.log('[LLMTimelineGenerator] 文本前300:', text.substring(0, 300));
      
      // 提取JSON（同时传入原始reasoning作为fallback）
      const timeline = this._extractTimelineFromText(text, sceneAnalysis, rawReasoning);
      return timeline;
      
    } catch (e) {
      console.error('[LLMTimelineGenerator] LLM调用失败:', e.message);
      // 降级到规则生成
      return this._fallbackToRules(sceneAnalysis, shotInfo);
    }
  }
  
  /**
   * 从文本中提取时间轴JSON（增强版）
   */
  _extractTimelineFromText(text, sceneAnalysis, reasoningText) {
    // 尝试从text(content)解析
    let parsed = this._tryExtractJSON(text);
    if (parsed) {
      return this._convertToTimeline(parsed, sceneAnalysis);
    }
    
    // 尝试从reasoningText解析
    if (reasoningText && reasoningText !== text) {
      parsed = this._tryExtractJSON(reasoningText);
      if (parsed) {
        return this._convertToTimeline(parsed, sceneAnalysis);
      }
    }
    
    console.error('[LLMTimelineGenerator] JSON提取失败: 响应中未找到有效JSON');
    return this._fallbackToRules(sceneAnalysis, {});
  }
  
  /**
   * 尝试从文本中提取JSON对象
   */
  _tryExtractJSON(text) {
    if (!text || text.length < 50) return null;
    
    // 策略1: 找JSON代码块
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (e) {
        console.log('[LLMTimelineGenerator] 代码块JSON解析失败:', e.message);
      }
    }
    
    // 策略2: 从后往前找JSON对象（JSON通常在文本最后）
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace > 0) {
      let braceCount = 0;
      for (let i = lastBrace; i >= 0; i--) {
        // 跳过字符串内容
        if (text[i] === '"') {
          i--;
          while (i >= 0 && text[i] !== '"') {
            if (text[i] === '\\') i--;
            i--;
          }
          continue;
        }
        
        if (text[i] === '}') braceCount++;
        else if (text[i] === '{') {
          braceCount--;
          if (braceCount === 0) {
            const candidate = text.substring(i, lastBrace + 1);
            try {
              const parsed = JSON.parse(candidate);
              if (parsed.segments && Array.isArray(parsed.segments)) {
                return parsed;
              }
            } catch (e) {}
            // 继续找下一个可能的对象
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 转换为标准时间轴格式
   */
  _convertToTimeline(data, sceneAnalysis) {
    if (!data || !data.segments) {
      throw new Error('响应中未找到segments');
    }
    
    const segments = (data.segments || []).map((seg, i) => ({
      index: i,
      timeRange: seg.timeRange || `${i * (sceneAnalysis.duration / 3)}-${(i + 1) * (sceneAnalysis.duration / 3)}`,
      duration: this._parseDuration(seg.timeRange, sceneAnalysis.duration),
      shotSize: seg.shotSize || 'medium',
      shotSizeDesc: this._getShotSizeDesc(seg.shotSize || 'medium'),
      movement: seg.movement || 'stable_hold',
      speed: { value: this._parseSpeed(seg.speed), description: seg.speed || '中等' },
      reason: seg.reason || ''
    }));
    
    return {
      totalDuration: sceneAnalysis.duration,
      segmentCount: segments.length,
      strategy: data.strategy || '个性化设计',
      reasoning: data.reasoning || '基于内容自动生成',
      segments,
      generatedBy: 'LLM-v4'
    };
  }
  
  _parseDuration(timeRange, defaultDuration) {
    if (!timeRange) return defaultDuration / 3;
    const parts = timeRange.split('-');
    if (parts.length === 2) {
      return parseFloat(parts[1]) - parseFloat(parts[0]);
    }
    return defaultDuration / 3;
  }
  
  _parseSpeed(speed) {
    const map = { '极慢': 0.1, '缓慢': 0.3, '中等': 0.5, '快速': 0.7, '很快': 0.9 };
    return map[speed] || 0.5;
  }
  

  
  /**
   * 规则降级
   */
  _fallbackToRules(sceneAnalysis, shotInfo) {
    // 使用v3系统的timeline生成器作为降级
    const v3Generator = new IntraShotTimelineGenerator();
    const timeline = v3Generator.generateTimeline({
      duration: sceneAnalysis.duration,
      emotionPhase: shotInfo.emotionPhase || 'neutral'
    });
    // 标记为规则降级，方便上层识别
    timeline.generatedBy = 'rules-v3';
    timeline.strategy = timeline.strategy || '规则降级';
    return timeline;
  }
  
  _getShotSizeDesc(shotSize) {
    const map = {
      extreme_wide: '极端远景（环境全貌）',
      wide: '远景（环境+主体）',
      full: '全景（全身）',
      medium: '中景（半身/双人）',
      close_up: '特写（面部/细节）',
      extreme_close: '极端特写（眼睛/纹理）'
    };
    return map[shotSize] || shotSize;
  }
}

// ========== Layer 3: 连续性引擎 ==========
class ContinuityEngine {
  constructor() {
    // 景别跳跃限制矩阵
    this.jumpRules = {
      extreme_close: { allowedNext: ['close_up', 'extreme_close'], warning: '极端特写后避免大跳跃' },
      close_up: { allowedNext: ['close_up', 'medium', 'extreme_close'], warning: '特写后避免直接远景' },
      medium: { allowedNext: ['medium', 'close_up', 'wide', 'full'], warning: '中景较灵活' },
      full: { allowedNext: ['full', 'medium', 'wide'], warning: '全景后避免特写' },
      wide: { allowedNext: ['wide', 'full', 'medium'], warning: '远景后避免特写' },
      extreme_wide: { allowedNext: ['extreme_wide', 'wide'], warning: '极端远景后避免中景/特写' }
    };
  }
  
  /**
   * 检查两个镜头间的连续性
   */
  checkContinuity(previousShot, currentShot) {
    const warnings = [];
    const fixes = [];
    
    if (!previousShot?.timeline?.segments || !currentShot?.timeline?.segments) {
      return { valid: true, warnings, fixes };
    }
    
    const prevEnd = previousShot.timeline.segments[previousShot.timeline.segments.length - 1];
    const currStart = currentShot.timeline.segments[0];
    
    const prevSize = prevEnd.shotSize;
    const currSize = currStart.shotSize;
    
    // 检查景别跳跃
    const rule = this.jumpRules[prevSize];
    if (rule && !rule.allowedNext.includes(currSize)) {
      warnings.push({
        type: 'shot_size_jump',
        message: `${prevEnd.shotSizeDesc} → ${currStart.shotSizeDesc}: 视觉跳跃大`,
        severity: 'warning'
      });
      fixes.push({
        type: 'suggest_alternative',
        suggestion: `建议将下一段起始景别改为: ${rule.allowedNext.join(' 或 ')}`
      });
    }
    
    // 检查运动方向冲突
    const prevMovement = prevEnd.movement;
    const currMovement = currStart.movement;
    if (this._isOppositeMovement(prevMovement, currMovement)) {
      warnings.push({
        type: 'movement_conflict',
        message: `运镜方向冲突: ${prevMovement} → ${currMovement}`,
        severity: 'info'
      });
    }
    
    return {
      valid: warnings.length === 0,
      warnings,
      fixes
    };
  }
  
  _isOppositeMovement(m1, m2) {
    const opposites = [
      ['push_in', 'pull_out'],
      ['orbit_cw', 'orbit_ccw'],
      ['pan_left', 'pan_right'],
      ['tilt_up', 'tilt_down']
    ];
    return opposites.some(pair => 
      (m1.includes(pair[0]) && m2.includes(pair[1])) ||
      (m1.includes(pair[1]) && m2.includes(pair[0]))
    );
  }
  
  /**
   * 自动修复连续性
   */
  autoFix(currentShot, previousShotEnd) {
    if (!previousShotEnd || !currentShot.timeline) return currentShot;
    
    const rule = this.jumpRules[previousShotEnd.shotSize];
    if (!rule) return currentShot;
    
    const firstSeg = currentShot.timeline.segments[0];
    if (!rule.allowedNext.includes(firstSeg.shotSize)) {
      // 自动调整第一段景别
      firstSeg.shotSize = rule.allowedNext[0];
      firstSeg.shotSizeDesc = this._getShotSizeDesc(rule.allowedNext[0]);
      console.log(`[ContinuityEngine] 自动修复: ${previousShotEnd.shotSize} → ${firstSeg.shotSize}`);
    }
    
    return currentShot;
  }
  
  _getShotSizeDesc(shotSize) {
    const map = {
      extreme_wide: '极端远景（环境全貌）',
      wide: '远景（环境+主体）',
      full: '全景（全身）',
      medium: '中景（半身/双人）',
      close_up: '特写（面部/细节）',
      extreme_close: '极端特写（眼睛/纹理）'
    };
    return map[shotSize] || shotSize;
  }
}

// ========== Layer 4: 可选开关 ==========
class TimelineFeatureToggle {
  constructor(options = {}) {
    this.mode = options.mode || 'auto'; // 'always' | 'never' | 'auto'
    this.defaultMode = options.defaultMode || 'standard'; // 'complex' | 'standard' | 'simple' | 'disabled'
    
    // 场景类型→默认模式映射
    this.sceneModeMap = {
      action: 'complex',
      chase: 'complex',
      climax: 'complex',
      dialogue: 'standard',
      monologue: 'standard',
      discovery: 'standard',
      emotional: 'simple',
      establishing: 'standard',
      transition: 'disabled'
    };
    
    // 时长→模式映射
    this.durationModeMap = [
      { max: 5, mode: 'simple' },
      { max: 10, mode: 'standard' },
      { max: Infinity, mode: 'complex' }
    ];
  }
  
  /**
   * 决定时间轴模式
   */
  decideMode(sceneType, duration, userOverride = null) {
    // 用户覆盖最高优先级
    if (userOverride) return userOverride;
    
    // never模式
    if (this.mode === 'never') return 'disabled';
    
    // always模式
    if (this.mode === 'always') return this.defaultMode;
    
    // auto模式：根据场景类型和时长
    const typeMode = this.sceneModeMap[sceneType] || this.defaultMode;
    const durationMode = this.durationModeMap.find(d => duration <= d.max)?.mode || 'standard';
    
    // 取更保守的模式（段数更少）
    const modePriority = { disabled: 0, simple: 1, standard: 2, complex: 3 };
    return modePriority[typeMode] < modePriority[durationMode] ? typeMode : durationMode;
  }
  
  /**
   * 是否应该生成时间轴
   */
  shouldGenerate(sceneType, duration) {
    const mode = this.decideMode(sceneType, duration);
    return mode !== 'disabled';
  }
}

// ========== v4.0 主控制器 ==========
class CameraMovementSystemV4 {
  constructor(options = {}) {
    this.sceneAnalyzer = new SceneAnalyzer();
    this.llmGenerator = new LLMTimelineGenerator(options.llmOptions);
    this.continuityEngine = new ContinuityEngine();
    this.featureToggle = new TimelineFeatureToggle(options.toggleOptions);
    this.v3Generator = new IntraShotTimelineGenerator(); // 降级用
  }
  
  /**
   * v4.0核心：生成个性化镜头内时间轴
   */
  async generateIntraShotTimelineV4(shot, previousShot = null, options = {}) {
    const { sceneName, sceneDescription, duration, emotionPhase, characters, dialogue, type } = shot;
    
    // Layer 4: 检查是否应该生成
    const sceneType = type || 'dialogue';
    if (!this.featureToggle.shouldGenerate(sceneType, duration)) {
      return {
        timeline: null,
        v4Enabled: true,
        mode: 'disabled',
        reason: 'Feature toggle disabled for this scene'
      };
    }
    
    // Layer 1: 场景分析
    const analysis = this.sceneAnalyzer.analyze(
      sceneName, sceneDescription, duration, characters
    );
    
    // Layer 2: LLM生成个性化时间轴
    const previousEnd = previousShot?.timeline?.segments?.[previousShot.timeline.segments.length - 1];
    const timeline = await this.llmGenerator.generateTimeline(
      analysis,
      { sceneName, sceneDescription, emotionPhase, characters, dialogue },
      previousEnd
    );
    
    // Layer 3: 连续性检查（如果有上一个镜头）
    let continuityCheck = null;
    if (previousShot) {
      continuityCheck = this.continuityEngine.checkContinuity(previousShot, { timeline });
      
      // 自动修复
      if (!continuityCheck.valid && options.autoFix !== false) {
        this.continuityEngine.autoFix({ timeline }, previousEnd);
      }
    }
    
    return {
      timeline,
      v4Enabled: timeline.generatedBy === 'LLM-v4',
      analysis,
      continuityCheck,
      mode: timeline.generatedBy === 'LLM-v4' ? 'v4-llm-driven' : 'v3-rules-fallback'
    };
  }
  
  /**
   * 向后兼容：v3 API
   */
  generateIntraShotTimeline(sceneName, emotionPhase, options = {}) {
    return this.v3Generator.generateTimeline({
      transitionType: options.transitionType,
      lightingType: options.lightingType,
      speedCurve: options.speedCurve,
      duration: options.duration,
      emotionPhase,
      sceneName
    });
  }
}

module.exports = {
  CameraMovementSystemV4,
  SceneAnalyzer,
  LLMTimelineGenerator,
  ContinuityEngine,
  TimelineFeatureToggle
};
