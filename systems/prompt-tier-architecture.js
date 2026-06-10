/**
 * Prompt优先级分层架构 v1.0 (P0-1)
 * Tier-1/2/3分层构建系统
 * 
 * 核心设计：
 * - Tier-1（前30%）：主体+动作+核心场景+镜头运动 — 绝对保留
 * - Tier-2（中段40%）：光照+情绪+风格+环境细节 — 按需加载
 * - Tier-3（尾部30%）：技术规格+世界观锚点+约束 — 超长时优先裁剪
 * 
 * 约束：
 * - 980字符上限（Seedance 2.0 API限制）
 * - Tier-1始终优先保留，Tier-3可弹性裁剪
 * 
 * @version v1.0
 * @author 小G
 */

class PromptTierArchitecture {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 1500;
    this.tier1Ratio = options.tier1Ratio || 0.30;  // 30%
    this.tier2Ratio = options.tier2Ratio || 0.40;  // 40%
    this.tier3Ratio = options.tier3Ratio || 0.30;  // 30%
    
    // 计算各Tier字符预算
    this.tier1Budget = Math.floor(this.maxLength * this.tier1Ratio);  // ~294
    this.tier2Budget = Math.floor(this.maxLength * this.tier2Ratio);  // ~392
    this.tier3Budget = Math.floor(this.maxLength * this.tier3Ratio);  // ~294
    
    // 技术规格词汇库（Tier-3，可裁剪）
    this.techSpecs = {
      // 有效技术声明（保留）
      effective: [
        '电影级光影',
        '体积雾',
        '大气透视',
        '景深',
        '微距摄影细节',
        'IMAX画幅'
      ],
      // 无效/冗余声明（移除）
      ineffective: [
        '虚幻引擎5',
        'Lumen全局光照',
        'Nanite几何',
        '超写实3D数字人渲染',
        '8K分辨率',
        '写实概念美术'
      ],
      // Nirath专属有效声明
      nirathEffective: [
        'dual-sunset lighting with rose-gold tones',
        'bioluminescent ecosystem fill light',
        '5800K warm gold + 6500K cool white',
        'non-Earth vegetation',
        'alien planet atmosphere'
      ]
    };
  }

  /**
   * 主入口：分层构建Prompt
   * @param {Object} params - 构建参数
   * @returns {Object} { prompt, tiers, metrics }
   */
  build(params) {
    const startTime = Date.now();
    console.log(`[PromptTier] 🔧 Tier分层构建开始 | 场景: ${params.sceneName || 'unknown'}`);
    
    // Step 1: 构建Tier-1（核心视觉，绝对保留）
    const tier1 = this._buildTier1(params);
    
    // Step 2: 构建Tier-2（环境+光照+情绪）
    const tier2 = this._buildTier2(params);
    
    // Step 2.5: v6.2-patch80 导演风格注入（如果提供）
    let directorStyleText = '';
    if (params.directorStyle) {
      const ds = params.directorStyle;
      directorStyleText = `Director style: ${ds.primaryDirector} + ${ds.secondaryDirector}, ${ds.directorTags.join(', ')}`;
      console.log(`[PromptTier] 🎬 导演风格注入: ${ds.sceneType} | ${ds.primaryDirector} + ${ds.secondaryDirector}`);
    }
    
    // Step 3: 构建Tier-3（技术规格+约束，可裁剪）
    const tier3 = this._buildTier3(params);
    
    // Step 4: 智能组装与裁剪
    const assembled = this._assemble(tier1, tier2, tier3, directorStyleText);
    
    // Step 5: 质量验证
    const metrics = this._calculateMetrics(assembled, tier1, tier2, tier3);
    
    const duration = Date.now() - startTime;
    console.log(`[PromptTier] ✅ 分层构建完成 | 总长度: ${assembled.length} | Tier-1保留率: ${metrics.tier1Retention}% | 耗时: ${duration}ms`);
    
    return {
      prompt: assembled.prompt,
      rawPrompt: assembled.raw,
      tiers: {
        tier1: { text: tier1, budget: this.tier1Budget, actual: tier1.length },
        tier2: { text: tier2, budget: this.tier2Budget, actual: tier2.length },
        tier3: { text: tier3, budget: this.tier3Budget, actual: tier3.length }
      },
      metrics,
      duration
    };
  }

  /**
   * Tier-1: 核心视觉（前30%，~294字符）
   * 内容：主体 + 动作 + 核心场景 + 镜头运动
   * 策略：绝对保留，超预算时优先压缩修饰词
   */
  _buildTier1(params) {
    const parts = [];
    
    // 1. 镜头类型 + 核心场景（必须保留）
    const shotType = params.shotType || params.type || '电影级镜头';
    // v6.5.29-fix: generic模式使用真实场景描述，不默认Nirath
    const sceneCore = params.sceneCore || params.sceneName || '真实场景';
    parts.push(`${shotType}, ${sceneCore}`);
    
    // 2. 主体描述（角色/异兽 + 核心动作）
    if (params.subject) {
      const subjectDesc = this._buildSubjectDescription(params.subject);
      parts.push(subjectDesc);
    }
    
    // 3. 核心动作（必须保留）
    if (params.action) {
      const actionStr = typeof params.action === 'string' ? params.action : (params.action?.description || params.action?.type || String(params.action));
      parts.push(actionStr);
    }
    
    // 4. 镜头运动（简化版，保留核心）
    if (params.cameraMovement) {
      const camCore = this._extractCameraCore(params.cameraMovement);
      parts.push(camCore);
    }
    
    let tier1Text = parts.join(', ');
    
    // 如果超预算，压缩修饰词但保留核心名词和动词
    if (tier1Text.length > this.tier1Budget) {
      tier1Text = this._compressTier1(tier1Text);
    }
    
    return tier1Text;
  }

  /**
   * Tier-2: 环境光照情绪（中段40%，~392字符）
   * 内容：光照 + 情绪 + 风格 + 环境细节
   * 策略：按需加载，可按情绪阶段动态调整
   */
  _buildTier2(params) {
    const parts = [];
    
    // 1. 光照描述（动态生成）
    const lighting = this._buildLightingDescription(params);
    if (lighting) parts.push(lighting);
    
    // 2. 情绪氛围（按情绪阶段）
    const emotion = this._buildEmotionDescription(params.emotionPhase, params.emotionIntensity);
    if (emotion) parts.push(emotion);
    
    // 3. 环境细节（Nirath特征）
    const environment = this._buildEnvironmentDetails(params);
    if (environment) parts.push(environment);
    
    // 4. 风格声明（简化版）
    const style = this._buildStyleDeclaration(params);
    if (style) parts.push(style);
    
    let tier2Text = parts.join(', ');
    
    // Tier-2可弹性压缩
    if (tier2Text.length > this.tier2Budget) {
      tier2Text = this._smartTrim(tier2Text, this.tier2Budget);
    }
    
    return tier2Text;
  }

  /**
   * Tier-3: 技术规格+约束（尾部30%，~294字符）
   * 内容：有效技术声明 + 世界观锚点 + 负面约束
   * 策略：优先裁剪，保留最关键的技术规格
   */
  _buildTier3(params) {
    const parts = [];
    
    // 1. 有效技术规格（仅保留对Seedance有效的）
    const techSpecs = this._selectEffectiveTechSpecs(params);
    if (techSpecs) parts.push(techSpecs);
    
    // 2. 世界观锚点（仅在Opening/首镜注入，其他镜头省略）
    if (params.isOpening || params.isFirstShot) {
      const worldAnchor = this._buildWorldAnchor(params);
      if (worldAnchor) parts.push(worldAnchor);
    }
    
    // 3. 负面约束（精简版）
    const negative = this._buildNegativeConstraints(params);
    if (negative) parts.push(negative);
    
    let tier3Text = parts.join(', ');
    
    // Tier-3最易裁剪
    if (tier3Text.length > this.tier3Budget) {
      tier3Text = this._smartTrim(tier3Text, this.tier3Budget);
    }
    
    return tier3Text;
  }

  /**
   * 组装三层Prompt
   * 优先级：Tier-1 > Tier-2 > Tier-3
   * 超长时从Tier-3开始裁剪，必要时压缩Tier-2
   */
  _assemble(tier1, tier2, tier3, directorStyleText) {
    let prompt = tier1;
    
    // 添加导演风格声明（如果有，融入Tier-2位置）
    if (directorStyleText && directorStyleText.length > 0) {
      const combined = `${prompt}, ${directorStyleText}`;
      if (combined.length <= this.maxLength) {
        prompt = combined;
      } else {
        const remaining = this.maxLength - prompt.length - 2;
        if (remaining > 20) {
          const compressed = directorStyleText.substring(0, remaining);
          prompt = `${prompt}, ${compressed}`;
        }
      }
    }
    
    // 添加Tier-2（如果空间允许）
    if (tier2 && tier2.length > 0) {
      const combined = `${prompt}, ${tier2}`;
      if (combined.length <= this.maxLength) {
        prompt = combined;
      } else {
        // 压缩Tier-2
        const remaining = this.maxLength - prompt.length - 2;
        if (remaining > 20) {
          const compressedTier2 = this._smartTrim(tier2, remaining);
          prompt = `${prompt}, ${compressedTier2}`;
        }
      }
    }
    
    // 添加Tier-3（如果空间允许）
    if (tier3 && tier3.length > 0) {
      const combined = `${prompt}, ${tier3}`;
      if (combined.length <= this.maxLength) {
        prompt = combined;
      } else {
        // 裁剪Tier-3
        const remaining = this.maxLength - prompt.length - 2;
        if (remaining > 20) {
          const compressedTier3 = this._smartTrim(tier3, remaining);
          prompt = `${prompt}, ${compressedTier3}`;
        }
      }
    }
    
    // 最终截断（保险）
    if (prompt.length > this.maxLength) {
      prompt = this._trimAtPunctuation(prompt, this.maxLength);
    }
    
    return {
      prompt,
      raw: [tier1, directorStyleText, tier2, tier3].filter(Boolean).join(' | ')
    };
  }

  // ====== 辅助方法 ======
  
  _buildSubjectDescription(subject) {
    if (typeof subject === 'string') return subject;
    if (Array.isArray(subject)) {
      return subject.map(s => typeof s === 'string' ? s : s.name || s.description).join(' and ');
    }
    return subject.description || subject.name || '';
  }
  
  _extractCameraCore(movement) {
    if (typeof movement === 'string') {
      // 提取核心运镜词（前3-5个单词）
      const words = movement.split(/[\s,]+/).filter(w => w.length > 0);
      const coreWords = words.slice(0, 5);
      return coreWords.join(' ');
    }
    // v6.5.31-fix: 支持 type 和 movementType 字段
    return movement.type || movement.movementType || movement.movement || 'static shot';
  }
  
  _buildLightingDescription(params) {
    const phase = params.emotionPhase || 'neutral';
    const lightingMap = {
      'establishing': 'soft warm dual-starlight, gentle ambient glow',
      'rising': 'dramatic side-lighting, deepening shadows',
      'building': 'contrasting warm-cool tones, intensifying highlights',
      'climax': 'high-contrast dramatic lighting, rim light on subjects',
      'resolve': 'soft diffused golden light, peaceful atmosphere',
      'opening': 'epic wide-angle dual-sunset, rose-gold atmospheric light'
    };
    return lightingMap[phase] || lightingMap['neutral'];
  }
  
  _buildEmotionDescription(phase, intensity = 'moderate') {
    const emotionMap = {
      'establishing': 'serene, awe-inspiring, vast scale',
      'rising': 'growing tension, anticipation building',
      'building': 'intensifying drama, emotional surge',
      'climax': 'peak emotional intensity, transformative moment',
      'resolve': 'peaceful resolution, quiet wonder',
      'opening': 'epic grandeur, majestic alien world'
    };
    return emotionMap[phase] || '电影级氛围';
  }
  
  _buildEnvironmentDetails(params) {
    const envFeatures = params.environmentFeatures || [];
    if (envFeatures.length === 0) return '';
    return envFeatures.slice(0, 3).join(', '); // 最多3个环境特征
  }
  
  _buildStyleDeclaration(params) {
    // v6.2-patch80-rewrite-v5: 导演风格融入
    // 如果提供了导演风格注入，优先使用导演融合风格体系
    if (params.directorStyle) {
      const ds = params.directorStyle;
      const styles = [
        '写实电影级',
        ds.stylePrompt || '异世界电影级'
      ];
      
      // 融入导演核心标签（2-3个最高优先级）
      if (ds.directorTags && ds.directorTags.length > 0) {
        styles.push(...ds.directorTags.slice(0, 2));
      }
      
      // Nirath模式追加氛围
      if (params.mode === 'nirath') {
        styles.push('bright fantasy atmosphere');
      }
      
      return styles.join(', ');
    }
    
    // 默认风格声明（回退兼容）
    const styles = ['写实风', '科幻电影级'];
    if (params.mode === 'nirath') {
      styles.push('bright fantasy atmosphere');
    }
    return styles.join(', ');
  }
  
  _selectEffectiveTechSpecs(params) {
    const specs = [];
    
    // 根据模式选择
    if (params.mode === 'nirath') {
      specs.push(...this.techSpecs.nirathEffective.slice(0, 2));
    }
    
    // 通用有效声明
    specs.push(...this.techSpecs.effective.slice(0, 3));
    
    return specs.join(', ');
  }
  
  _buildWorldAnchor(params) {
    // 仅在Nirath模式且Opening/首镜注入
    if (params.mode !== 'nirath') return '';
    if (!params.isOpening && !params.isFirstShot) return '';
    return 'Nirath planet, alien ecosystem';
  }
  
  _buildNegativeConstraints(params) {
    // 精简负面约束
    const constraints = [
      'no metallic shine',
      'no traditional Chinese symbols',
      'natural eye colors only'
    ];
    return constraints.join(', ');
  }
  
  _compressTier1(text) {
    // 移除Tier-1中的修饰副词，保留核心名词+动词
    return text
      .replace(/\bvery\s+/gi, '')
      .replace(/\bextremely\s+/gi, '')
      .replace(/\bbeautifully\s+/gi, '')
      .replace(/\bamazingly\s+/gi, '');
  }
  
  _smartTrim(text, maxLen) {
    if (text.length <= maxLen) return text;
    
    // 优先在标点处截断
    const trimmed = text.substring(0, maxLen);
    const lastPunct = Math.max(
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf(','),
      trimmed.lastIndexOf(';')
    );
    
    if (lastPunct > maxLen * 0.7) {
      return trimmed.substring(0, lastPunct + 1);
    }
    
    // 其次在空格处截断
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.7) {
      return trimmed.substring(0, lastSpace);
    }
    
    return trimmed;
  }
  
  _trimAtPunctuation(text, maxLen) {
    if (text.length <= maxLen) return text;
    const trimmed = text.substring(0, maxLen);
    
    // 中文标点优先
    const cnPuncts = ['。', '，', '；', '！', '？'];
    for (const p of cnPuncts) {
      const idx = trimmed.lastIndexOf(p);
      if (idx > maxLen * 0.8) return trimmed.substring(0, idx + 1);
    }
    
    // 英文标点
    const enPuncts = ['.', ',', ';', '!', '?'];
    for (const p of enPuncts) {
      const idx = trimmed.lastIndexOf(p);
      if (idx > maxLen * 0.8) return trimmed.substring(0, idx + 1);
    }
    
    // 空格
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.8) return trimmed.substring(0, lastSpace);
    
    return trimmed;
  }
  
  _calculateMetrics(assembled, tier1, tier2, tier3) {
    const total = assembled.prompt.length;
    return {
      totalLength: total,
      tier1Length: tier1.length,
      tier2Length: tier2.length,
      tier3Length: tier3.length,
      tier1Retention: Math.round((tier1.length / this.tier1Budget) * 100),
      tier2Retention: Math.round((tier2.length / this.tier2Budget) * 100),
      tier3Retention: Math.round((tier3.length / this.tier3Budget) * 100),
      utilization: Math.round((total / this.maxLength) * 100),
      status: total >= 1470 ? '🔥理想' : total >= 850 ? '✅良好' : '⚠️不足'
    };
  }
}

module.exports = { PromptTierArchitecture };
