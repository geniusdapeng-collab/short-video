/**
 * 语义完整性校验模块 v1.0
 * 解决：台词截断、内容被裁剪过度
 * 原则：句子完整性 > 时长压缩
 */

class SemanticIntegrityValidator {
  constructor() {
    // 不同内容类型的语速（字/秒）
    this.speechRates = {
      'opening': 4.0,      // 开场偏慢，需要亲和感
      'explanation': 4.2,  // 讲解适中
      'interaction': 5.0,  // 互动自然快一点
      'closing': 4.0,     // 总结偏慢，强调重点
      'warning': 3.5,     // 警示语最慢，停顿多
      'demonstration': 4.0 // 演示适中
    };
    
    // 最低时长保障（哪怕字数少，也要说完+停顿）
    this.minDuration = 5;  // 秒
    
    // 语义完整性规则
    this.integrityRules = [
      {
        name: '完整句子不截断',
        check: (narration, duration) => {
          // 检查是否有未闭合的引号、括号、冒号后的内容
          const hasUnclosedColon = /：[^。.]+$/g.test(narration);
          const hasUnclosedQuote = /"[^"]*$/g.test(narration);
          if (hasUnclosedColon || hasUnclosedQuote) {
            return { pass: false, reason: '句子未闭合（冒号/引号后内容未完）' };
          }
          return { pass: true };
        }
      },
      {
        name: '医学术语需要慢说',
        check: (narration, duration) => {
          const medicalTerms = ['横纹肌溶解', '肌红蛋白', '肾小管', '急性肾损伤', 'CK值'];
          const hasTerms = medicalTerms.some(t => narration.includes(t));
          if (hasTerms && duration < 6) {
            return { pass: false, reason: '包含医学术语，需要至少6秒慢说' };
          }
          return { pass: true };
        }
      },
      {
        name: '数字对比需要停顿',
        check: (narration, duration) => {
          // "正常是几十，发病时会飙到几千甚至几万"
          const hasNumberComparison = /\d+.*\d+/.test(narration) && narration.includes('甚至');
          if (hasNumberComparison && duration < 8) {
            return { pass: false, reason: '包含数字对比，需要至少8秒停顿' };
          }
          return { pass: true };
        }
      },
      {
        name: '三个要点以上需要展开',
        check: (narration, duration) => {
          // "三个症状：A、B、C" 需要足够时间展开
          const threePoints = /三个.*：.*、.*、/.test(narration);
          if (threePoints && duration < 8) {
            return { pass: false, reason: '三个要点需要至少8秒展开' };
          }
          return { pass: true };
        }
      },
      {
        name: '警示语需要强调停顿',
        check: (narration, duration) => {
          const warningWords = ['千万别', '一定要', '千万', '一定'];
          const hasWarning = warningWords.some(w => narration.includes(w));
          if (hasWarning && duration < 5) {
            return { pass: false, reason: '包含警示语，需要至少5秒强调' };
          }
          return { pass: true };
        }
      }
    ];
  }

  /**
   * 计算推荐时长（基于语义完整性）
   */
  calculateRecommendedDuration(narration, type, strictMode = false) {
    const n = narration || '';
    const rate = this.speechRates[type] || 4.2;
    
    // 基础时长 = 字数 ÷ 语速 + 停顿缓冲
    let baseDuration = Math.ceil(n.length / rate);
    
    // 语义缓冲（根据内容类型增加）
    let buffer = 0;
    
    // 医学术语缓冲
    const medicalTerms = ['横纹肌溶解', '肌红蛋白', '肾小管', '急性肾损伤'];
    if (medicalTerms.some(t => n.includes(t))) buffer += 1;
    
    // 数字对比缓冲
    if (/\d+.*\d+/.test(n) && n.includes('甚至')) buffer += 1.5;
    
    // 多个要点缓冲
    if (/三个.*：/.test(n)) buffer += 1;
    
    // 警示语缓冲
    if (n.includes('千万别') || n.includes('千万别硬扛')) buffer += 1;
    
    // 互动提问缓冲（需要反应时间）
    if (type === 'interaction') buffer += 1;
    
    let recommended = baseDuration + buffer;
    
    // 严格模式：不低于语义最低要求
    if (strictMode) {
      // 运行所有完整性规则
      for (const rule of this.integrityRules) {
        const result = rule.check(n, recommended);
        if (!result.pass) {
          // 自动修正时长
          if (result.reason.includes('至少')) {
            const match = result.reason.match(/至少(\d+)秒/);
            if (match) {
              recommended = Math.max(recommended, parseInt(match[1]));
            }
          }
        }
      }
    }
    
    // 最低保障
    recommended = Math.max(recommended, this.minDuration);
    
    return {
      recommended: Math.ceil(recommended),
      baseDuration,
      buffer,
      narrationLength: n.length,
      rate,
      details: {
        baseDuration,
        buffer,
        rate,
        minDuration: this.minDuration
      }
    };
  }

  /**
   * 校验narration的语义完整性
   */
  validate(narration, duration, type) {
    const results = [];
    let allPassed = true;
    
    for (const rule of this.integrityRules) {
      const result = rule.check(narration, duration);
      results.push({
        name: rule.name,
        passed: result.pass,
        reason: result.reason || null
      });
      if (!result.pass) allPassed = false;
    }
    
    // 额外检查：字数vs时长是否合理
    const rate = this.speechRates[type] || 4.2;
    const theoreticalMin = Math.ceil(narration.length / rate);
    if (duration < theoreticalMin) {
      results.push({
        name: '语速校验',
        passed: false,
        reason: `时长${duration}秒 < 理论最低${theoreticalMin}秒（按${rate}字/秒）`
      });
      allPassed = false;
    }
    
    return {
      allPassed,
      results,
      recommended: this.calculateRecommendedDuration(narration, type, true).recommended
    };
  }
}

module.exports = SemanticIntegrityValidator;