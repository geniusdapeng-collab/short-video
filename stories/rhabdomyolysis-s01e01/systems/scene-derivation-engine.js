/**
 * 场景推导引擎 v1.0
 * 核心能力：根据narration内容+角色+镜头类型，动态推导场景描述
 * 原则：零硬编码，纯动态生成，任何narration变更自动触发场景重新推导
 */

class SceneDerivationEngine {
  constructor() {
    // 主题-场景元素映射（关键词→场景元素）
    this.topicSceneElements = {
      // 医学检查类
      'CK': ['CK指标对比图表', '检查报告单', '数据对比'],
      '肌酸激酶': ['CK指标对比图表', '检查报告单'],
      '抽血': ['采血场景', '化验设备'],
      '检查': ['检查流程图', '医学设备', '化验报告'],
      '肾功能': ['肾脏结构示意图', '肾小管动画', '医学模型'],
      '肌红蛋白': ['肾脏结构示意图', '堵塞示意'],
      '肾脏': ['肾脏结构图', '泌尿系统模型'],
      
      // 症状类（扩展同义词）
      '症状': ['症状图标墙', '警示标识', '分类图表', '健康警报'],
      '警报': ['警示标识', '症状图标墙', '健康警报'],
      '酸痛': ['肌肉解剖图', '疼痛标识', '症状图标墙'],
      '无力': ['肌肉状态图', '力量对比', '症状图标墙'],
      '小便': ['尿液颜色对比样本', '体液样本', '排泄系统图'],
      '颜色变深': ['尿液颜色对比样本', '体液颜色对比', '警示标识'],
      '尿液': ['尿液颜色对比样本', '体液样本'],
      '肿胀': ['肿胀部位示意图', '对比照片'],
      '压痛': ['按压检查动作', '疼痛部位标识'],
      
      // 互动类
      '提问': ['互动问答区', '对话框', '交流空间'],
      '回答': ['讲解区域', '指示手势', '教学场景'],
      '老师': ['教学区', '听众席', '互动空间'],
      
      // 总结类
      '记住': ['总结图表', '要点回顾板', '核心信息墙'],
      '总结': ['总结图表', '要点回顾板', '分类汇总'],
      '回顾': ['回顾面板', '时间线', '要点清单'],
      
      // 开场类
      '开场': ['主题海报', '标题板', '开场动画'],
      '介绍': ['介绍区域', '主题展示', '封面板'],
      '科普': ['科普展板', '知识图谱', '主题海报'],
      
      // 原理类
      '细胞': ['细胞结构图', '显微镜视图', '微观动画'],
      '破裂': ['细胞破裂动画', '微观示意图'],
      '泄漏': ['泄漏示意', '物质流动图'],
      '肌肉': ['肌肉解剖图', '肌肉模型', '运动系统图']
    };
    
    // 镜头类型→默认场景模板
    this.typeTemplates = {
      'opening': '科普讲堂开场区，{topic_elements}，专业医学设备陈设',
      'explanation': '医学讲堂讲解区，大屏幕显示{display_content}，桌上放有{props}',
      'interaction': '医学讲堂互动区，{interaction_setup}，背景有健康科普海报，氛围亲切互动',
      'demonstration': '医学演示区，{demo_setup}，专业设备支持',
      'closing': '医学讲堂总结区，{summary_elements}，认真严肃地强调重点'
    };
    
    // 角色→默认动作
    this.roleActions = {
      'chen-nurse': {
        speaking: '陈女士手持{prop}讲解，表情亲切专业',
        listening: '小陈侧身倾听，目光关注',
        demonstrating: '陈女士展示{prop}，指示关键部位'
      },
      'xiaoG': {
        speaking: '小G面向{chen-nurse}认真提问，表情认真专注',
        listening: '小G认真听讲，目光跟随讲解',
        asking: '小G举手提问，身体前倾表达好奇'
      }
    };
  }
  
  /**
   * 主推导函数
   * @param {string} shotId - 镜头ID
   * @param {string} type - 镜头类型
   * @param {string} narration - 台词内容
   * @param {Array} characters - 角色列表
   * @returns {Object} - { sceneSpecific, action, background }
   */
  derive(shotId, type, narration, characters) {
    const n = narration || '';
    
    // 1. 提取主题关键词
    const topics = this.extractTopics(n);
    
    // 2. 生成场景元素
    const sceneElements = this.generateSceneElements(topics, type, n);
    
    // 3. 生成动作描述
    const action = this.generateAction(n, characters, type, topics);
    
    // 4. 组装场景描述
    const sceneSpecific = this.assembleScene(type, sceneElements, action, characters, n);
    
    return {
      sceneSpecific,
      action,
      background: sceneSpecific, // background与sceneSpecific保持一致
      topics, // 返回推导出的主题，用于调试
      confidence: this.calculateConfidence(topics, sceneElements) // 置信度
    };
  }
  
  /**
   * 提取narration中的主题关键词
   */
  extractTopics(narration) {
    const topics = [];
    for (const [keyword, elements] of Object.entries(this.topicSceneElements)) {
      if (narration.includes(keyword)) {
        topics.push({ keyword, elements });
      }
    }
    return topics;
  }
  
  /**
   * 生成场景元素列表
   */
  generateSceneElements(topics, type, narration) {
    const elements = new Set();
    
    // 从主题提取元素
    for (const topic of topics) {
      for (const element of topic.elements) {
        elements.add(element);
      }
    }
    
    // 根据镜头类型补充默认元素
    if (type === 'opening' && elements.size === 0) {
      elements.add('主题海报');
      elements.add('专业设备');
    }
    if (type === 'closing' && elements.size === 0) {
      elements.add('总结图表');
      elements.add('要点回顾');
    }
    if (type === 'interaction' && elements.size === 0) {
      elements.add('互动问答区');
      elements.add('交流空间');
    }
    
    return Array.from(elements);
  }
  
  /**
   * 生成动作描述（关键！谁在说台词，谁在行动）
   */
  generateAction(narration, characters, type, topics) {
    const n = narration || '';
    const primary = characters[0] || 'chen-nurse';
    const secondary = characters[1] || null;
    
    // 判断说话者
    const speaker = this.detectSpeaker(n, characters);
    
    // 判断动作类型
    if (type === 'interaction' || n.includes('吗？') || n.includes('提问') || n.includes('？')) {
      // 提问/互动场景
      if (speaker === 'xiaoG' && secondary === 'chen-nurse') {
        return '小G提问，小陈倾听并准备回答';
      }
      if (speaker === 'chen-nurse' && secondary === 'xiaoG') {
        return '小陈回答小G的提问，详细讲解';
      }
      return `${speaker === 'xiaoG' ? '小G' : '小陈'}提问互动`;
    }
    
    if (type === 'closing' || n.includes('记住') || n.includes('总结')) {
      return `${speaker === 'xiaoG' ? '小G' : '小陈'}总结强调核心要点`;
    }
    
    if (n.includes('CK') || n.includes('抽血') || n.includes('检查')) {
      return `${speaker === 'xiaoG' ? '小G' : '小陈'}讲解CK值检查和指标意义`;
    }
    
    if (n.includes('肾功能') || n.includes('肌红蛋白') || n.includes('肾脏')) {
      return `${speaker === 'xiaoG' ? '小G' : '小陈'}讲解肾功能和肾损伤原理`;
    }
    
    if (n.includes('症状') || n.includes('酸痛') || n.includes('尿液') || n.includes('肿胀')) {
      return `${speaker === 'xiaoG' ? '小G' : '小陈'}讲解症状识别和判断`;
    }
    
    if (n.includes('细胞') || n.includes('破裂') || n.includes('肌肉')) {
      return `${speaker === 'xiaoG' ? '小G' : '小陈'}讲解肌肉细胞破裂原理`;
    }
    
    // 默认
    return `${speaker === 'xiaoG' ? '小G' : '小陈'}讲解医学知识`;
  }
  
  /**
   * 检测说话者
   */
  detectSpeaker(narration, characters) {
    const n = narration || '';
    
    // xiaoG说话的特征
    if (n.includes('老师') || n.includes('吗？') || n.includes('？')) {
      if (characters.includes('xiaoG')) return 'xiaoG';
    }
    
    // chen-nurse说话的特征
    if (n.includes('对！') || n.includes('一定要') || n.includes('记住') || 
        n.includes('就是') || n.includes('因为') || n.includes('同时')) {
      if (characters.includes('chen-nurse')) return 'chen-nurse';
    }
    
    // 默认第一个角色
    return characters[0] || 'chen-nurse';
  }
  
  /**
   * 组装完整场景描述（修复：限制元素数量，避免堆砌）
   */
  assembleScene(type, elements, action, characters, narration) {
    const template = this.typeTemplates[type] || this.typeTemplates['explanation'];
    
    // 去重 + 限制最多5个元素（避免prompt过长）
    const uniqueElements = [...new Set(elements)].slice(0, 5);
    
    // 生成展示内容描述
    const displayContent = uniqueElements.slice(0, 2).join('、') || '医学知识图谱';
    const props = uniqueElements.slice(0, 2).join('、') || '医学模型';
    const topicElements = uniqueElements.join('、') || '医学科普海报';
    const interactionSetup = characters.includes('xiaoG') && characters.includes('chen-nurse') 
      ? '小G面向小陈认真提问，小陈侧身倾听' 
      : '讲解者与听众互动';
    const demoSetup = uniqueElements.join('、') || '医学演示设备';
    const summaryElements = uniqueElements.join('、') || '要点回顾板';
    
    return template
      .replace('{topic_elements}', topicElements)
      .replace('{display_content}', displayContent)
      .replace('{props}', props)
      .replace('{interaction_setup}', interactionSetup)
      .replace('{demo_setup}', demoSetup)
      .replace('{summary_elements}', summaryElements);
  }
  
  /**
   * 计算置信度（0-1）
   */
  calculateConfidence(topics, elements) {
    if (topics.length === 0) return 0.5; // 无主题匹配，中等置信度
    if (elements.length >= 2) return 0.95; // 多元素匹配，高置信度
    return 0.75; // 单元素匹配
  }
}

module.exports = SceneDerivationEngine;

// 测试
if (require.main === module) {
  const engine = new SceneDerivationEngine();
  
  console.log('=== 场景推导引擎测试 ===\n');
  
  const testCases = [
    {
      shotId: 'S04',
      type: 'interaction',
      narration: '小陈老师，出现这些症状要立即去医院吗？',
      characters: ['xiaoG', 'chen-nurse']
    },
    {
      shotId: 'S05',
      type: 'explanation',
      narration: '对！一定要马上就医。医生会抽血查CK值，正常是几十，发病时会飙到几千甚至几万。',
      characters: ['chen-nurse']
    },
    {
      shotId: 'S06',
      type: 'explanation',
      narration: '同时查肾功能。因为肌红蛋白会堵住肾脏，导致急性肾损伤，严重时心跳都会停止。',
      characters: ['chen-nurse']
    },
    {
      shotId: 'S07',
      type: 'closing',
      narration: '记住三个症状：肌肉酸痛、尿液深色、肿胀压痛。两项检查：CK值和肾功能。千万别硬扛！',
      characters: ['chen-nurse']
    }
  ];
  
  for (const tc of testCases) {
    const result = engine.derive(tc.shotId, tc.type, tc.narration, tc.characters);
    console.log(`${tc.shotId}: ${tc.narration.substring(0, 30)}...`);
    console.log(`  动作: ${result.action}`);
    console.log(`  场景: ${result.sceneSpecific.substring(0, 60)}...`);
    console.log(`  置信度: ${result.confidence}`);
    console.log();
  }
}
