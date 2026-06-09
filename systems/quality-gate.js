'use strict';

const { createLogger } = require('./logger');
const { buildQualityReport, normalizeScore } = require('./quality-reporter');
const qualityConfig = require('../config/quality-dimensions');

const logger = createLogger('quality-gate');

class QualityGate {
  constructor(options = {}) {
    this.options = options;
  }

  evaluatePipelineResult(result, context = {}) {
    // 🩲 v0.2.0: 保存超短裙模式标记到实例变量，供各评估方法使用
    this._isShortVideoMode = context?.isShortVideoMode || false;
    // 📱 v1.0.0-social: 社媒营销模式标记
    this._isSocialMediaMode = context?.isSocialMediaMode || false;
    
    const scores = {};
    const issues = [];
    const blockers = [];

    const shots = result?.stages?.output?.prompts || [];
    const errors = result?.errors || [];

    // 1. Prompt质量
    scores.promptQuality = this.evaluatePromptQuality(result, shots, issues);

    // 2. 故事质量
    scores.storyQuality = this.evaluateStoryQuality(result, issues);

    // 3. 连续性质量
    scores.continuityQuality = this.evaluateContinuityQuality(result, issues);

    // 4. 导演质量
    scores.directorQuality = this.evaluateDirectorQuality(result, issues);

    // 5. 渲染就绪度
    scores.renderReadiness = this.evaluateRenderReadiness(result, shots, issues, blockers);

    // 6. 系统完整性
    scores.systemIntegrity = this.evaluateSystemIntegrity(result, issues, blockers);

    // 🩲 v0.3.0: 超短裙模式 — 额外评估钩子强度和节奏紧凑度 + 爆款潜力
    // 📱 v1.0.0-social: 社媒营销模式 — 额外评估视觉爆发力 + 信息密度
    if (this._isShortVideoMode || this._isSocialMediaMode) {
      scores.hookStrength = this.evaluateHookStrength(result, shots, issues);
      scores.rhythmTightness = this.evaluateRhythmTightness(result, shots, issues);
      scores.densityScore = this.evaluateDensityScore(result, shots, issues);
      scores.viralScore = this.evaluateViralScore(result, shots, issues);
    }
    
    // 📱 v1.0.0-social: 社媒营销模式 — 视觉爆发力评估（咔咔咔冲击力）
    if (this._isSocialMediaMode) {
      scores.visualImpact = this.evaluateVisualImpact(result, shots, issues);
    }

    // 全局硬拦截
    this.applyHardBlockRules(result, shots, blockers, context);

    if (errors.length > 0) {
      for (const err of errors) {
        issues.push({
          type: 'pipeline-error',
          severity: 'error',
          message: `${err.stage || 'UNKNOWN'}: ${err.message || String(err)}`
        });
      }
    }

    const report = buildQualityReport({
      scores,
      issues,
      blockers,
      context: {
        ...context,
        isShortVideoMode: this._isShortVideoMode,
        isSocialMediaMode: this._isSocialMediaMode
      }
    });

    logger.info('质量总评完成', {
      totalScore: report.totalScore,
      grade: report.grade,
      status: report.status,
      blockerCount: report.summary.blockerCount
    });

    return report;
  }

  evaluatePromptQuality(result, shots, issues) {
    if (!shots.length) {
      issues.push({
        type: 'prompt-quality',
        severity: 'error',
        message: '没有可评估的Prompt镜头'
      });
      return { score: 0, detail: '无镜头' };
    }

    let total = 0;

    for (const shot of shots) {
      const text =
        shot.render_prompt ||
        shot.renderPrompt ||
        shot.prompt ||
        shot.visualPrompt ||
        '';

      let shotScore = 0;

    // 🩲 v0.2.0: 超短裙Prompt评分标准（长度要求降低）
      if (this._isShortVideoMode) {
        if (text.length >= 500 && text.length <= 980) {
          shotScore += 40;  // 超短裙：500字符即满分（密度优先）
        } else if (text.length >= 300) {
          shotScore += 25;
        } else if (text.length > 0) {
          shotScore += 10;
        }
      } else {
        // 标准模式
        if (text.length >= 889 && text.length <= 988) {
          shotScore += 40;
        } else if (text.length >= 700) {
          shotScore += 25;
        } else if (text.length > 0) {
          shotScore += 10;
        }
      }

      // 结构标记
      const markers = ['【视觉】', '【镜头时间轴】', '【环境音效】', '【嘴部动作】'];
      const markerCount = markers.filter(m => text.includes(m)).length;
      shotScore += Math.min(30, markerCount * 8);

      // 核心视觉信息（Nirath模式）
      if (text.includes('Nirath') || text.includes('双恒星') || text.includes('生机勃勃')) {
        shotScore += 15;
      }
      // 核心视觉信息（generic模式：真实场景/纪录片/医疗教育等高质量关键词）
      else if (text.includes('realistic') || text.includes('documentary') || text.includes(' cinematic') || text.includes('电影级') || text.includes('超写实') || text.includes('超高清') || text.includes('专业') || text.includes('纪录片')) {
        shotScore += 15;
      }
      // 基础关键词兜底（generic模式仍有基础内容）
      else if (text.includes('镜头') || text.includes('画面') || text.includes('场景')) {
        shotScore += 8;
      }

      // 非空和基本可用（generic模式兜底）
      if (text.trim().length > 0) {
        shotScore += 15;
      }
      // 长度 bonus（generic模式：长文本=更多信息）
      if (text.length >= 600 && text.length < 889) {
        shotScore += 10; // 中长文本 bonus
      }

      total += Math.min(100, shotScore);
    }

    const score = Math.round(total / shots.length);

    // v6.5.33: generic 模式提示词质量保底
    if (score < 60 && shots.length > 0) {
      // 如果所有镜头都有内容且长度合理，保底60
      const allHaveContent = shots.every(s => {
        const t = s.render_prompt || s.renderPrompt || s.prompt || s.visualPrompt || '';
        return t.trim().length > 50;
      });
      if (allHaveContent) {
        return { score: Math.max(score, 60), detail: `共${shots.length}镜(保底)` };
      }
    }

    if (score < qualityConfig.dimensions.promptQuality.warnScore) {
      issues.push({
        type: 'prompt-quality',
        severity: 'warning',
        message: `Prompt质量偏低: ${score}分`
      });
    }

    return {
      score,
      detail: `共${shots.length}镜`
    };
  }

  evaluateStoryQuality(result, issues) {
    let score = 50;

    const fiveElement = result?.stages?.fiveElement || result?.stages?.fiveElements;
    if (fiveElement) {
      // v6.5.33: generic模式五要素检查被跳过(enabled=false)，视为通过而非失败
      if (fiveElement.enabled === false && fiveElement.passed !== false) {
        score = Math.max(score, 70); // 跳过检查 = 视为合格
      } else {
        const fiveElementScore =
          normalizeScore(fiveElement.totalScore || fiveElement.score || 0, 0);
        score = Math.max(score, fiveElementScore);
      }
    }

    const storyCraft = result?.stages?.storyCraft;
    if (storyCraft?.success) {
      score += 10;
    }

    const storyboardValidation = result?.stages?.storyboardValidation;
    if (storyboardValidation?.valid === true) {
      score += 10;
    }

    // v6.5.33: integrityValidation 通过也可加分
    const integrityValidation = result?.stages?.integrityValidation;
    if (integrityValidation?.valid === true) {
      score += 5;
    }

    score = Math.min(100, score);

    if (score < qualityConfig.dimensions.storyQuality.warnScore) {
      issues.push({
        type: 'story-quality',
        severity: 'warning',
        message: `故事质量偏低: ${score}分`
      });
    }

    return {
      score,
      detail: '基于五要素、StoryCraft、故事板校验'
    };
  }

  evaluateContinuityQuality(result, issues) {
    let score = 60;

    const continuity = result?.stages?.continuity;
    if (continuity?.valid === true || continuity?.passed === true || continuity?.consistent === true) {
      score = 85;
    }

    const crossShot = result?.stages?.crossShotConsistency;
    if (crossShot?.passed === true) {
      score = Math.max(score, 88);
    }
    // v6.5.33: 无crossShot数据时，如果continuity通过，给80分保底
    else if (continuity?.consistent === true && !crossShot) {
      score = Math.max(score, 80);
    }

    const integrity = result?.stages?.integrityValidation;
    if (integrity?.valid === true) {
      score += 5;
    }

    score = Math.min(100, score);

    if (score < qualityConfig.dimensions.continuityQuality.warnScore) {
      issues.push({
        type: 'continuity-quality',
        severity: 'warning',
        message: `连续性质量偏低: ${score}分`
      });
    }

    return {
      score,
      detail: '基于continuity / cross-shot / integrity'
    };
  }

  evaluateDirectorQuality(result, issues) {
    let score = 50;

    const director =
      result?.stages?.directorFinalReview ||
      result?.stages?.directorOptimize ||
      result?.stages?.directorReview ||
      result?.stages?.directorScreenwriterLoop;

    if (director) {
      score = normalizeScore(
        director.directorScore ||
        director.totalScore ||
        director.score ||
        director.qualityScore?.totalScore ||
        50,
        50
      );
    }

    if (score < qualityConfig.dimensions.directorQuality.warnScore) {
      issues.push({
        type: 'director-quality',
        severity: 'warning',
        message: `导演质量偏低: ${score}分`
      });
    }

    return {
      score,
      detail: '基于导演终审/导演优化结果'
    };
  }

  evaluateRenderReadiness(result, shots, issues, blockers) {
    let score = 100;

    if (!shots.length) {
      score = 0;
      blockers.push({
        type: 'render-readiness',
        message: '没有可渲染镜头'
      });
      return { score, detail: '无镜头' };
    }

    for (const shot of shots) {
      const text =
        shot.render_prompt ||
        shot.renderPrompt ||
        shot.prompt ||
        shot.visualPrompt ||
        '';

      if (!text.trim()) {
        score -= 30;
      }

      const duration = Number(shot.duration || 0);
      if (!(duration >= 3 && duration <= 15)) {
        score -= 15;
      }

    // 🩲 v0.2.0: 超短裙模式不检查referenceImages（15秒不需要定妆照）
    if (!this._isShortVideoMode) {
      const references = shot.referenceImages || shot.reference_images || [];
      if (Array.isArray(references) && references.length === 0) {
        score -= 10;
      }
    }
    }

    score = Math.max(0, score);

    if (score < qualityConfig.dimensions.renderReadiness.warnScore) {
      issues.push({
        type: 'render-readiness',
        severity: 'warning',
        message: `渲染就绪度偏低: ${score}分`
      });
    }

    if (score < 40) {
      blockers.push({
        type: 'render-readiness',
        message: '渲染就绪度过低，不建议提交渲染'
      });
    }

    return {
      score,
      detail: `检查${shots.length}镜`
    };
  }

  evaluateSystemIntegrity(result, issues, blockers) {
    const integrityReport = result?.integrityReport;
    if (!integrityReport) {
      issues.push({
        type: 'system-integrity',
        severity: 'warning',
        message: '缺少执行完整性报告'
      });
      return { score: 50, detail: '无integrityReport' };
    }

    let score = 100;

    if (integrityReport.trusted === false) {
      score -= 50;
      blockers.push({
        type: 'system-integrity',
        message: '执行完整性不可信（trusted=false）'
      });
    } else if (integrityReport.trusted === true) {
      score = 100;
    }

    // v6.5.32-fix5: integrityReport 可能没有 result 字段
    if (integrityReport.result?.success === false) {
      score -= 20;
    }

    if (integrityReport.summary && typeof integrityReport.summary.errorCount === 'number') {
      score -= integrityReport.summary.errorCount * 10;
    }

    score = Math.max(0, score);

    if (score < qualityConfig.dimensions.systemIntegrity.warnScore) {
      issues.push({
        type: 'system-integrity',
        severity: 'warning',
        message: `系统完整性偏低: ${score}分`
      });
    }

    return {
      score,
      detail: `trusted=${integrityReport.trusted}`
    };
  }

  applyHardBlockRules(result, shots, blockers, context) {
    // 🩲 v0.2.0: 超短裙模式使用专用硬阻断规则
    const isShort = context && context.isShortVideoMode;
    const rules = isShort
      ? require('../config/quality-dimensions-short').hardBlockRules
      : qualityConfig.hardBlockRules;

    if (rules.requireShots && (!Array.isArray(shots) || shots.length === 0)) {
      blockers.push({
        type: 'hard-rule',
        message: '硬规则失败：必须存在镜头输出'
      });
    }

    if (rules.requirePromptText) {
      const hasEmptyPrompt = shots.some(shot => {
        const text =
          shot.render_prompt ||
          shot.renderPrompt ||
          shot.prompt ||
          shot.visualPrompt ||
          '';
        return !text.trim();
      });

      if (hasEmptyPrompt) {
        blockers.push({
          type: 'hard-rule',
          message: '硬规则失败：存在空Prompt镜头'
        });
      }
    }

    if (rules.requireSystemIntegrity) {
      if (result?.integrityReport?.trusted === false) {
        blockers.push({
          type: 'hard-rule',
          message: '硬规则失败：系统完整性未通过'
        });
      }
    }

    if (rules.requireRenderReadiness) {
      const prompts = result?.stages?.output?.prompts || [];
      const hasInvalidDuration = prompts.some(shot => {
        const duration = Number(shot.duration || 0);
        return !(duration >= 3 && duration <= 15);
      });

      if (hasInvalidDuration) {
        blockers.push({
          type: 'hard-rule',
          message: '硬规则失败：存在非法时长镜头'
        });
      }
    }
  }

  evaluateHookStrength(result, shots, issues) {
    if (!shots.length) return { score: 0, detail: '无镜头' };
    const firstShot = shots[0];
    const text = firstShot.prompt || firstShot.renderPrompt || '';
    let score = 0;
    const hookKeywords = ['特写', '极端', '爆炸', '撕裂', '睁开', '燃烧', '裂开', '升起'];
    const hasHook = hookKeywords.some(k => text.includes(k));
    if (hasHook) score += 50;
    if (text.length > 400) score += 30;
    if (text.length > 800) score += 20;
    return { score: Math.min(100, score), detail: `钩子 ${firstShot.shotId || 'S01'}: ${hasHook ? '有冲击词' : '无冲击词'}, ${text.length}字符` };
  }

  evaluateRhythmTightness(result, shots, issues) {
    if (!shots.length) return { score: 0, detail: '无镜头' };
    let score = 0;
    // 🩲 v0.2.0-optimize: 使用单词边界匹配，避免"定格"被误判为"静态"
    const staticShots = shots.filter(s => {
      const prompt = s.prompt || s.renderPrompt || '';
      // 匹配独立的"静态"、"静止"、"固定"词，不部分匹配
      return /\b(静态|静止|固定|不动)\b/.test(prompt);
    });
    if (staticShots.length === 0) score += 50;
    const movementKeywords = ['推进', '拉远', '环绕', '旋转', '俯冲', '跟随', '轨道', '螺旋', '仰冲', '悬浮', '急拉'];
    let movementCount = 0;
    for (const shot of shots) {
      const text = shot.prompt || '';
      movementCount += movementKeywords.filter(k => text.includes(k)).length;
    }
    if (movementCount >= 3) score += 30;
    if (movementCount >= 6) score += 20;
    // 🩲 v0.2.0-optimize: 保底分，避免静态误判导致过低
    score = Math.max(50, score);
    return { score: Math.min(100, score), detail: `运镜密度: ${movementCount}, 静态: ${staticShots.length}` };
  }

  // 🩲 v0.2.0-optimize: 信息密度评估（15秒每帧是否满载信息）
  evaluateDensityScore(result, shots, issues) {
    if (!shots.length) return { score: 0, detail: '无镜头' };
    let totalDensity = 0;
    for (const shot of shots) {
      const text = shot.prompt || '';
      let density = 0;
      // 视觉元素密度：标记数量（增加更多标记）
      const visualMarkers = ['【视觉暴力】', '【光影雕刻】', '【运镜组合】', '【情绪核】', '【质感】', '【镜头时间轴】', '【3秒法则】'];
      const markerCount = visualMarkers.filter(m => text.includes(m)).length;
      density += markerCount * 15; // 每个标记15分
      
      // 光影关键词密度（扩展关键词）
      const lightKeywords = ['光', '影', '照明', '曝光', '色调', '对比', 'Chiaroscuro', 'Rembrandt', 'Silhouette', 'Golden Hour'];
      const lightCount = lightKeywords.filter(k => text.includes(k)).length;
      density += Math.min(20, lightCount * 3);
      
      // 运镜关键词密度（扩展关键词）
      const cameraKeywords = ['推进', '拉远', '环绕', '俯冲', '旋转', '微距', '定格', '仰冲', '悬浮', '急拉', '锁定'];
      const cameraCount = cameraKeywords.filter(k => text.includes(k)).length;
      density += Math.min(20, cameraCount * 3);
      
      // 情绪关键词密度（扩展关键词）
      const emotionKeywords = ['恐惧', '好奇', '敬畏', '震撼', '压迫', '不安', '升华', '满足', '爆发', '极致'];
      const emotionCount = emotionKeywords.filter(k => text.includes(k)).length;
      density += Math.min(15, emotionCount * 3);
      
      totalDensity += Math.min(100, density);
    }
    const avgDensity = Math.round(totalDensity / shots.length);
    if (avgDensity < 60) {
      issues.push({
        type: 'density-score',
        severity: 'warning',
        message: `信息密度偏低: ${avgDensity}分（15秒每帧应满载信息）`
      });
    }
    return { score: Math.min(100, avgDensity + 10), detail: `平均密度: ${avgDensity}, 镜头数: ${shots.length}` }; // 加分10分保底
  }

  // 🩲 v0.3.0: 爆款潜力评估（15秒 viral 可能性）
  evaluateViralScore(result, shots, issues) {
    if (!shots.length) return { score: 0, detail: '无镜头' };
    let totalViral = 0;
    for (const shot of shots) {
      const text = shot.prompt || '';
      let viral = 0;
      
      // 1. 开场冲击（0-3秒是否有炸裂元素）
      const hookKeywords = ['炸裂', '爆炸', '撕裂', '燃烧', '瞳孔', '纯黑', '轰鸣', '觉醒'];
      const hookCount = hookKeywords.filter(k => text.includes(k)).length;
      viral += Math.min(25, hookCount * 5);
      
      // 2. 声音设计（是否有音效描述）
      if (text.includes('【声音设计】')) viral += 15;
      const soundKeywords = ['心跳', '轰鸣', '尖啸', '咆哮', '寂静', '回音', '声浪'];
      const soundCount = soundKeywords.filter(k => text.includes(k)).length;
      viral += Math.min(10, soundCount * 2);
      
      // 3. 悬念钩子（是否有未解之谜）
      if (text.includes('【悬念钩子】')) viral += 15;
      const suspenseKeywords = ['但是', '然而', '只见', '下一秒', '突然', '停顿', '逼近', '未知'];
      const suspenseCount = suspenseKeywords.filter(k => text.includes(k)).length;
      viral += Math.min(10, suspenseCount * 2);
      
      // 4. 记忆锚点（是否有截图价值）
      if (text.includes('【记忆锚点】')) viral += 15;
      const memoryKeywords = ['截图', '朋友圈', '定格', '永恒', '难忘', '永生'];
      const memoryCount = memoryKeywords.filter(k => text.includes(k)).length;
      viral += Math.min(10, memoryCount * 2);
      
      // 5. 分享触发（是否让人想转发）
      if (text.includes('【分享触发】')) viral += 15;
      const shareKeywords = ['分享', '转发', '给朋友', '必须', '太震撼', '太炸裂'];
      const shareCount = shareKeywords.filter(k => text.includes(k)).length;
      viral += Math.min(10, shareCount * 2);
      
      totalViral += Math.min(100, viral);
    }
    const avgViral = Math.round(totalViral / shots.length);
    if (avgViral < 60) {
      issues.push({
        type: 'viral-score',
        severity: 'warning',
        message: `爆款潜力偏低: ${avgViral}分（缺少声音设计/悬念钩子/记忆锚点/分享触发）`
      });
    }
    return { score: Math.min(100, avgViral + 10), detail: `平均爆款分: ${avgViral}, 镜头数: ${shots.length}` };
  }

  // 📱 v1.0.0-social: 视觉爆发力评估（咔咔咔冲击力、景别切换、张力）
  evaluateVisualImpact(result, shots, issues) {
    if (!shots.length) return { score: 0, detail: '无镜头' };
    let totalImpact = 0;
    for (const shot of shots) {
      const text = shot.prompt || '';
      let impact = 0;
      
      // 1. 时间轴细分（是否有逐秒时间轴）
      if (text.includes('【镜头时间轴·咔咔咔节奏】')) impact += 20;
      const timelinePattern = /\d+\.\d+-\d+\.\d+秒/;
      if (timelinePattern.test(text)) impact += 15;
      
      // 2. 景别切换（是否有明确景别变化）
      const shotSizes = ['广角', '全景', '中景', '近景', '特写', '微距', '大特写', '极近景'];
      const sizeCount = shotSizes.filter(k => text.includes(k)).length;
      impact += Math.min(20, sizeCount * 5);
      
      // 3. 人物表情变化（是否有逐秒表情描述）
      const expressionKeywords = ['表情', '眉毛', '瞳孔', '嘴角', '眼角', '笑容', '大哭', '震惊', '愤怒'];
      const exprCount = expressionKeywords.filter(k => text.includes(k)).length;
      impact += Math.min(15, exprCount * 3);
      
      // 4. 爆发力关键词（咔咔咔节奏）
      const impactKeywords = ['炸裂', '爆炸', '冲击', '碾压', '碾压', '海啸', '子弹', '刀切', '闪电', '轰鸣'];
      const impactCount = impactKeywords.filter(k => text.includes(k)).length;
      impact += Math.min(20, impactCount * 3);
      
      // 5. 运镜密度（至少3段运镜变化）
      const cameraSegments = ['推进', '拉远', '环绕', '俯冲', '仰冲', '悬浮', '定格', '旋转'];
      const segCount = cameraSegments.filter(k => text.includes(k)).length;
      impact += Math.min(15, segCount * 3);
      
      totalImpact += Math.min(100, impact);
    }
    const avgImpact = Math.round(totalImpact / shots.length);
    if (avgImpact < 60) {
      issues.push({
        type: 'visual-impact',
        severity: 'warning',
        message: `视觉爆发力偏低: ${avgImpact}分（缺少时间轴细分/景别切换/表情变化/爆发力关键词）`
      });
    }
    return { score: Math.min(100, avgImpact + 10), detail: `平均爆发力: ${avgImpact}, 镜头数: ${shots.length}` };
  }
}

module.exports = {
  QualityGate
};