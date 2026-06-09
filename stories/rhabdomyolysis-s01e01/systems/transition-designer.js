/**
 * 过渡衔接设计模块 v1.0
 * 解决：镜头之间连贯性不好，跳来跳去
 * 原则：上一镜→下一镜必须有逻辑衔接
 */

class TransitionDesigner {
  constructor() {
    // 过渡台词模板
    this.transitionTemplates = {
      // 症状→就医
      'symptoms-to-treatment': [
        "那出现了这些症状，我们该怎么办呢？",
        "遇到这种情况，第一时间该怎么做？",
        "出现这些症状可千万不能拖，那要怎么做？"
      ],
      // 检查→总结
      'check-to-summary': [
        "所以总结一下，记住这几个关键点。",
        "说了这么多，最重要的就这几点。",
        "最后提醒一下，千万别忘记这些。"
      ],
      // 原理→症状
      'cause-to-symptoms': [
        "那身体会有什么反应呢？",
        "这种情况下，身体会给你发信号。",
        "那怎么知道是不是中招了呢？"
      ],
      // 开场→主题
      'opening-to-topic': [
        "今天给大家讲一个很重要的健康知识。",
        "有一个健康问题，很多人都不太了解。",
        "今天来聊一个和肌肉、肾脏都相关的话题。"
      ],
      // 总结→结尾
      'summary-to-closing': [
        "记住，健康才是最重要的，千万别硬扛！",
        "身体是自己的，有问题一定要及时就医。",
        "健康知识讲完了，一定要记住重点哦。"
      ],
      // 通用过渡
      'generic': [
        "那接下来我们看看...",
        "还有一个重要的点...",
        "接着往下讲..."
      ]
    };
    
    // 镜头间关系映射（内容类型→需要的过渡）
    this.typeTransitions = {
      'explanation→interaction': 'symptoms-to-treatment',
      'explanation→closing': 'check-to-summary',
      'opening→explanation': 'opening-to-topic',
      'explanation→explanation': 'cause-to-symptoms',
      'interaction→explanation': 'generic',
      'closing→closing': 'summary-to-closing'
    };
  }

  /**
   * 分析两个镜头之间的衔接关系
   */
  analyzeTransition(prevShot, nextShot) {
    const prevType = prevShot.type || 'explanation';
    const nextType = nextShot.type || 'explanation';
    const prevContent = prevShot.narration || '';
    const nextContent = nextShot.narration || '';
    
    // 检查是否有逻辑断层
    const gaps = this.detectGaps(prevContent, nextContent, prevType, nextType);
    
    // 确定过渡类型
    const transitionKey = `${prevType}→${nextType}`;
    const transitionType = this.typeTransitions[transitionKey] || 'generic';
    
    return {
      transitionType,
      gaps,
      needsTransition: gaps.length > 0,
      severity: gaps.length > 0 ? 'high' : 'low'
    };
  }

  /**
   * 检测逻辑断层
   */
  detectGaps(prevContent, nextContent, prevType, nextType) {
    const gaps = [];
    
    // 检查1：因果链是否完整
    if (prevContent.includes('症状') && nextContent.includes('去医院')) {
      // 症状→就医 是合理的，不需要过渡
    } else if (prevContent.includes('症状') && nextContent.includes('检查')) {
      // 症状→检查，需要"那要做什么检查？"过渡
      if (!prevContent.includes('检查') && !nextContent.includes('怎么办')) {
        gaps.push('缺少"如何诊断"的过渡');
      }
    }
    
    // 检查2：角色转换是否需要缓冲
    if (prevType === 'explanation' && nextType === 'interaction') {
      // 讲解→互动，需要过渡
      if (!prevContent.includes('呢') && !prevContent.includes('吗')) {
        gaps.push('缺少"提问引入"过渡');
      }
    }
    
    // 检查3：总结是否突兀
    if (nextType === 'closing' && !prevContent.includes('记住') && !prevContent.includes('总结')) {
      gaps.push('缺少"总结引入"过渡');
    }
    
    return gaps;
  }

  /**
   * 生成过渡台词
   */
  generateTransitionText(prevShot, nextShot) {
    const analysis = this.analyzeTransition(prevShot, nextShot);
    
    if (!analysis.needsTransition) {
      return null; // 不需要过渡
    }
    
    const templates = this.transitionTemplates[analysis.transitionType] || this.transitionTemplates['generic'];
    
    // 根据上下文选择最合适的模板
    const prevContent = prevShot.narration || '';
    const nextContent = nextShot.narration || '';
    
    // 简单启发式：选择包含最多关键词的模板
    let bestTemplate = templates[0];
    let bestScore = 0;
    
    for (const template of templates) {
      let score = 0;
      // 如果模板包含上一镜的关键词，加分
      if (prevContent.includes('症状') && template.includes('症状')) score += 2;
      if (prevContent.includes('检查') && template.includes('检查')) score += 2;
      // 如果模板包含下一镜的关键词，加分
      if (nextContent.includes('记住') && template.includes('记住')) score += 2;
      if (nextContent.includes('千万') && template.includes('千万')) score += 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }
    
    return {
      text: bestTemplate,
      type: analysis.transitionType,
      severity: analysis.severity,
      duration: 3 // 过渡台词约3秒
    };
  }

  /**
   * 为故事板添加过渡镜头
   */
  addTransitions(storyboard) {
    const newStoryboard = [];
    
    for (let i = 0; i < storyboard.length; i++) {
      const shot = storyboard[i];
      newStoryboard.push(shot);
      
      // 检查是否需要添加过渡镜头
      if (i < storyboard.length - 1) {
        const nextShot = storyboard[i + 1];
        const transition = this.generateTransitionText(shot, nextShot);
        
        if (transition) {
          // 在当前镜头后插入过渡镜头
          newStoryboard.push({
            id: `T${i + 1}`,
            type: 'transition',
            role: 'transition',
            narration: transition.text,
            narrationLength: transition.text.length,
            duration: transition.duration,
            characters: shot.characters, // 延续当前角色
            primaryCharacter: shot.primaryCharacter,
            transitionFrom: shot.id,
            transitionTo: nextShot.id,
            transitionType: transition.type,
            purpose: '逻辑衔接',
            cameraMovement: {
              shotSize: 'medium',
              position: 'front',
              movement: 'follow',
              speed: 'silky',
              description: '丝滑过渡'
            }
          });
        }
      }
    }
    
    return newStoryboard;
  }

  /**
   * 验证故事板连贯性
   */
  validateCoherence(storyboard) {
    const issues = [];
    
    for (let i = 0; i < storyboard.length - 1; i++) {
      const current = storyboard[i];
      const next = storyboard[i + 1];
      
      const analysis = this.analyzeTransition(current, next);
      
      if (analysis.needsTransition && !this.hasTransitionBetween(storyboard, i, i + 1)) {
        issues.push({
          from: current.id,
          to: next.id,
          type: analysis.transitionType,
          gaps: analysis.gaps,
          severity: analysis.severity,
          suggestion: this.generateTransitionText(current, next)?.text || '建议添加过渡'
        });
      }
    }
    
    return {
      coherent: issues.length === 0,
      issues,
      issueCount: issues.length
    };
  }

  /**
   * 检查两个镜头之间是否有过渡
   */
  hasTransitionBetween(storyboard, idx1, idx2) {
    // 简单检查：中间是否有transition类型的镜头
    for (let i = idx1 + 1; i < idx2; i++) {
      if (storyboard[i] && storyboard[i].type === 'transition') {
        return true;
      }
    }
    return false;
  }
}

module.exports = TransitionDesigner;