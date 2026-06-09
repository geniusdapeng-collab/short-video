/**
 * Narration-Prompt 一致性校验引擎
 * 核心能力：检查台词(narration)和画面(prompt)是否严格对齐
 * 这是防止"台词说A，画面说B"的终极防线
 */

class NarrationPromptAlignmentChecker {
  constructor() {
    // 主题关键词映射表：每个narration主题对应prompt必须包含的关键词
    this.topicKeywords = {
      'CK值': ['CK', '肌酸激酶', '检查', '血液', '指标', '报告'],
      '肾功能': ['肾', '肌红蛋白', '肾小管', '肾脏', '损伤'],
      '提问': ['提问', '问', '举手', '询问'],
      '总结': ['总结', '记住', '回顾', '图表'],
      '症状': ['症状', '酸痛', '尿液', '肿胀', '压痛'],
      '开场': ['开场', '介绍', '主题', '科普'],
      '肌肉细胞': ['肌肉', '细胞', '破裂', '泄漏']
    };
    
    // 角色-动作一致性：谁说的台词，画面中谁在说话
    this.speakerActionRules = {
      'chen-nurse': {
        mustContain: ['陈女士', '小陈'],
        mustNotContain: ['小G提问', '教练展示'] // 不能是其他角色在做的事
      },
      'xiaoG': {
        mustContain: ['小G'],
        mustNotContain: ['陈女士讲解', '小陈总结'] // 不能是其他角色在做的事
      }
    };
  }
  
  /**
   * 主校验函数
   * @param {string} shotId - 镜头ID
   * @param {string} narration - 台词内容
   * @param {string} prompt - 画面描述
   * @param {Array} characters - 角色列表
   * @returns {Object} - {passed, score, errors, details}
   */
  check(shotId, narration, prompt, characters) {
    const errors = [];
    const details = [];
    let score = 100;
    
    // 1. 主题一致性检查：narration中的主题是否在prompt中有对应
    const topicMatch = this.checkTopicAlignment(narration, prompt);
    if (!topicMatch.passed) {
      errors.push(`主题不一致：${topicMatch.reason}`);
      score -= 30;
      details.push(`台词主题：${topicMatch.narrationTopics.join(', ')}`);
      details.push(`画面匹配：${topicMatch.promptTopics.join(', ')}`);
    } else {
      details.push('✅ 主题对齐');
    }
    
    // 2. 角色-动作一致性：谁说的台词，画面里谁在动
    const speakerMatch = this.checkSpeakerAction(narration, prompt, characters);
    if (!speakerMatch.passed) {
      errors.push(`角色动作不一致：${speakerMatch.reason}`);
      score -= 25;
      details.push(`预期说话者：${speakerMatch.expectedSpeaker}`);
      details.push(`画面动作主体：${speakerMatch.actualActor}`);
    } else {
      details.push('✅ 角色动作对齐');
    }
    
    // 3. 场景-内容一致性：场景描述是否支持台词内容
    const sceneMatch = this.checkSceneContent(narration, prompt);
    if (!sceneMatch.passed) {
      errors.push(`场景内容不一致：${sceneMatch.reason}`);
      score -= 20;
    } else {
      details.push('✅ 场景内容对齐');
    }
    
    // 4. 禁止冲突检查：prompt中不能出现与narration矛盾的内容
    const conflictCheck = this.checkConflicts(narration, prompt);
    if (!conflictCheck.passed) {
      errors.push(`内容冲突：${conflictCheck.reason}`);
      score -= 25;
    } else {
      details.push('✅ 无内容冲突');
    }
    
    return {
      passed: errors.length === 0,
      score: Math.max(0, score),
      errors,
      details
    };
  }
  
  /**
   * 主题对齐检查（智能版本）
   */
  checkTopicAlignment(narration, prompt) {
    const n = narration || '';
    const p = prompt || '';
    
    // 判断镜头类型
    const isClosing = n.includes('记住') || n.includes('总结') || n.includes('回顾');
    const isInteraction = n.includes('吗？') || n.includes('提问') || n.includes('问');
    const isOpening = n.includes('讲解') || n.includes('开场') || n.includes('介绍');
    
    // 提取narration中的主题
    const narrationTopics = [];
    for (const [topic, keywords] of Object.entries(this.topicKeywords)) {
      if (keywords.some(k => n.includes(k))) {
        narrationTopics.push(topic);
      }
    }
    
    // 提取prompt中的主题
    const promptTopics = [];
    for (const [topic, keywords] of Object.entries(this.topicKeywords)) {
      if (keywords.some(k => p.includes(k))) {
        promptTopics.push(topic);
      }
    }
    
    // 智能判断：
    // 1. 总结镜头：只要有"总结"主题即可，不需要包含所有子主题
    if (isClosing) {
      const hasSummary = p.includes('总结') || p.includes('图表') || p.includes('回顾');
      if (!hasSummary) {
        return {
          passed: false,
          reason: '总结镜头画面中无总结元素（图表/回顾/总结）',
          narrationTopics,
          promptTopics
        };
      }
      return { passed: true, narrationTopics, promptTopics };
    }
    
    // 2. 互动镜头：只要有"提问"或"互动"主题即可
    if (isInteraction) {
      const hasInteraction = p.includes('提问') || p.includes('问') || p.includes('互动') || p.includes('倾听');
      if (!hasInteraction) {
        return {
          passed: false,
          reason: '互动镜头画面中无互动元素（提问/倾听/互动）',
          narrationTopics,
          promptTopics
        };
      }
      return { passed: true, narrationTopics, promptTopics };
    }
    
    // 3. 开场镜头：只要有"开场"主题即可
    if (isOpening) {
      const hasOpening = p.includes('开场') || p.includes('介绍') || p.includes('主题');
      if (!hasOpening) {
        return {
          passed: false,
          reason: '开场镜头画面中无开场元素',
          narrationTopics,
          promptTopics
        };
      }
      return { passed: true, narrationTopics, promptTopics };
    }
    
    // 4. 讲解镜头（默认）：检查核心主题是否匹配
    const missingTopics = narrationTopics.filter(t => !promptTopics.includes(t));
    
    if (missingTopics.length > 0) {
      return {
        passed: false,
        reason: `台词包含主题[${missingTopics.join(', ')}]，但画面未体现`,
        narrationTopics,
        promptTopics
      };
    }
    
    return { passed: true, narrationTopics, promptTopics };
  }
  
  /**
   * 角色动作一致性检查
   */
  checkSpeakerAction(narration, prompt, characters) {
    // 判断谁在说台词（改进版：区分"称呼"和"自称"）
    let expectedSpeaker = null;
    
    // xiaoG说话的特征：称呼别人、提问、自称"我"
    const isXiaoGSpeaking = 
      narration.includes('老师') ||  // "小陈老师"
      narration.includes('吗？') ||   // 提问
      (narration.includes('我') && !narration.includes('我们'));  // 自称
    
    // chen-nurse说话的特征：自称"我"、回答"对！"、讲解内容
    const isChenNurseSpeaking = 
      narration.includes('对！') ||
      narration.includes('一定要') ||
      narration.includes('记住') ||
      narration.includes('就是') ||
      narration.includes('因为');
    
    if (isXiaoGSpeaking && characters.includes('xiaoG')) {
      expectedSpeaker = 'xiaoG';
    } else if (isChenNurseSpeaking && characters.includes('chen-nurse')) {
      expectedSpeaker = 'chen-nurse';
    }
    
    if (!expectedSpeaker) {
      return { passed: true }; // 无法判断时跳过
    }
    
    // 检查prompt中主要动作的主体是谁
    const rules = this.speakerActionRules[expectedSpeaker];
    if (!rules) {
      return { passed: true };
    }
    
    // 检查mustContain
    const hasRequired = rules.mustContain.some(k => prompt.includes(k));
    // 检查mustNotContain
    const hasForbidden = rules.mustNotContain.some(k => prompt.includes(k));
    
    if (!hasRequired) {
      return {
        passed: false,
        reason: `台词由${expectedSpeaker}说出，但画面未体现该角色`,
        expectedSpeaker,
        actualActor: '未识别'
      };
    }
    
    if (hasForbidden) {
      return {
        passed: false,
        reason: `台词由${expectedSpeaker}说出，但画面显示其他角色在行动`,
        expectedSpeaker,
        actualActor: '其他角色'
      };
    }
    
    return { passed: true, expectedSpeaker };
  }
  
  /**
   * 场景内容一致性检查
   */
  checkSceneContent(narration, prompt) {
    const n = narration || '';
    const p = prompt || '';
    
    // 判断镜头类型
    const isClosing = n.includes('记住') || n.includes('总结') || n.includes('回顾');
    const isInteraction = n.includes('吗？') || n.includes('提问');
    
    // 总结镜头和互动镜头：放宽场景元素检查
    if (isClosing || isInteraction) {
      return { passed: true };
    }
    
    // 检查：如果narration提到"图表"，prompt中是否有"图表"
    if (n.includes('图表') && !p.includes('图表')) {
      return { passed: false, reason: '台词提到图表，画面无图表' };
    }
    
    // 检查：如果narration提到"检查"，prompt中是否有相关检查场景
    if (n.includes('检查') && !p.includes('检查') && !p.includes('化验') && !p.includes('检验')) {
      return { passed: false, reason: '台词提到检查，画面无检查场景' };
    }
    
    // 检查：如果narration提到"医院"，prompt中是否有医院相关元素
    if (n.includes('医院') && !p.includes('医院') && !p.includes('就医') && !p.includes('急诊')) {
      return { passed: false, reason: '台词提到医院，画面无医院元素' };
    }
    
    return { passed: true };
  }
  
  /**
   * 内容冲突检查
   */
  checkConflicts(narration, prompt) {
    const n = narration || '';
    const p = prompt || '';
    
    // 冲突规则：narration说A，prompt说B，A和B不能同时成立
    
    // 例1：narration讲CK值，prompt讲尿液颜色 → 冲突
    if ((n.includes('CK值') || n.includes('抽血')) && p.includes('尿液颜色')) {
      return { passed: false, reason: '台词讲CK值检查，画面讲尿液颜色 → 内容错位' };
    }
    
    // 例2：narration讲肾功能，prompt讲肿胀压痛 → 冲突
    if ((n.includes('肾功能') || n.includes('肌红蛋白')) && p.includes('肿胀压痛')) {
      return { passed: false, reason: '台词讲肾功能，画面讲肿胀压痛 → 内容错位' };
    }
    
    // 例3：narration讲总结，prompt讲提问 → 冲突
    if ((n.includes('记住') || n.includes('总结')) && p.includes('提问')) {
      return { passed: false, reason: '台词是总结，画面是提问 → 内容相反' };
    }
    
    // 例4：narration是提问，prompt是讲解 → 冲突
    if (n.includes('吗？') && p.includes('讲解') && !p.includes('提问') && !p.includes('倾听')) {
      return { passed: false, reason: '台词是提问，画面是讲解 → 角色错位' };
    }
    
    return { passed: true };
  }
}

module.exports = NarrationPromptAlignmentChecker;

// CLI用法
if (require.main === module) {
  const checker = new NarrationPromptAlignmentChecker();
  
  // 测试用例：S07的修复前 vs 修复后
  console.log('=== S07 修复前（模拟）===');
  const before = checker.check('S07', 
    '记住三个症状：肌肉酸痛、尿液深色、肿胀压痛。两项检查：CK值和肾功能。千万别硬扛！',
    '正在小G提问。讲堂听众区，小G举手提问，背景有其他听众',
    ['chen-nurse']
  );
  console.log('结果:', before.passed ? '✅通过' : '❌失败');
  console.log('评分:', before.score);
  console.log('错误:', before.errors);
  console.log();
  
  console.log('=== S07 修复后 ===');
  const after = checker.check('S07',
    '记住三个症状：肌肉酸痛、尿液深色、肿胀压痛。两项检查：CK值和肾功能。千万别硬扛！',
    '正在总结强调核心要点。医学讲堂总结区，小陈站在总结图表前，背景汇总三个症状图标',
    ['chen-nurse']
  );
  console.log('结果:', after.passed ? '✅通过' : '❌失败');
  console.log('评分:', after.score);
  console.log('错误:', after.errors);
}
