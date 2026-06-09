/**
 * 运镜衔接管理器 v1.0
 * 确保相邻镜头运镜连贯，避免视觉割裂
 * 
 * 影视创作原理：
 * 1. 禁止相同运镜连续使用（推→推、拉→拉等）
 * 2. 推之后跟拉或环绕（创造对比）
 * 3. 拉之后跟推或俯冲（创造紧张感）
 * 4. 环绕之后跟推或拉（从外到内/内到外）
 * 5. 俯冲之后跟悬浮或环绕（减速稳定）
 * 6. 定格之后跟动态运镜（从静到动）
 */

class CameraMovementContinuityManager {
  constructor() {
    // 运镜类型定义
    this.movementTypes = {
      PUSH: { keywords: ['推进', '推近', '逼近', 'zoom in', 'push in', 'dolly in', '逼近核心'], type: 'push' },
      PULL: { keywords: ['拉远', '拉出', '远离', 'pull out', 'zoom out', 'dolly out', '急速拉远'], type: 'pull' },
      ORBIT: { keywords: ['环绕', '旋转', '盘旋', 'orbit', 'swirl', '环绕旋转'], type: 'orbit' },
      DIVE: { keywords: ['俯冲', '下沉', '坠落', 'dive', 'plunge', '冲下'], type: 'dive' },
      RISE: { keywords: ['升空', '上升', '仰冲', 'rise', 'ascend', '拉升'], type: 'rise' },
      PAN: { keywords: ['平移', '扫视', 'pan', 'slide', '平移滑动'], type: 'pan' },
      FREEZE: { keywords: ['定格', '静止', '冻结', 'freeze', '锁定', '定格冻结'], type: 'freeze' },
      HOVER: { keywords: ['悬浮', '停滞', 'hover', 'float', '悬停'], type: 'hover' }
    };
    
    // 运镜衔接规则矩阵
    // ✅ 推荐 / ⚠️ 一般 / ❌ 禁止
    this.transitionRules = {
      push: { push: '❌', pull: '✅', orbit: '✅', dive: '✅', rise: '⚠️', pan: '⚠️', freeze: '✅', hover: '⚠️' },
      pull: { push: '✅', pull: '❌', orbit: '✅', dive: '✅', rise: '⚠️', pan: '⚠️', freeze: '⚠️', hover: '✅' },
      orbit: { push: '✅', pull: '✅', orbit: '❌', dive: '⚠️', rise: '✅', pan: '⚠️', freeze: '✅', hover: '✅' },
      dive: { push: '✅', pull: '⚠️', orbit: '✅', dive: '❌', rise: '⚠️', pan: '⚠️', freeze: '⚠️', hover: '✅' },
      rise: { push: '⚠️', pull: '✅', orbit: '✅', dive: '⚠️', rise: '❌', pan: '⚠️', freeze: '⚠️', hover: '✅' },
      pan: { push: '⚠️', pull: '⚠️', orbit: '⚠️', dive: '⚠️', rise: '⚠️', pan: '❌', freeze: '⚠️', hover: '⚠️' },
      freeze: { push: '✅', pull: '✅', orbit: '⚠️', dive: '✅', rise: '⚠️', pan: '⚠️', freeze: '❌', hover: '⚠️' },
      hover: { push: '⚠️', pull: '✅', orbit: '✅', dive: '⚠️', rise: '✅', pan: '⚠️', freeze: '⚠️', hover: '❌' }
    };
    
    // 替代运镜建议（当冲突时）
    this.alternatives = {
      push: ['拉远', '环绕', '俯冲', '定格'],
      pull: ['推进', '环绕', '俯冲', '悬浮'],
      orbit: ['推进', '拉远', '俯冲', '定格'],
      dive: ['悬浮', '环绕', '推进', '定格'],
      rise: ['拉远', '环绕', '悬浮', '定格'],
      pan: ['推进', '拉远', '环绕', '定格'],
      freeze: ['推进', '拉远', '俯冲', '环绕'],
      hover: ['拉远', '环绕', '上升', '推进']
    };
    
    // 检查报告
    this.report = {
      checks: [],
      adjustments: [],
      violations: []
    };
  }
  
  /**
   * 检测运镜类型
   * 分析运镜描述，提取开始运镜和结束运镜
   */
  detectMovementTypes(description) {
    if (!description) return { start: null, end: null, all: [] };
    
    const desc = description.toLowerCase();
    const detected = [];
    
    // 检测所有运镜类型
    for (const [name, config] of Object.entries(this.movementTypes)) {
      for (const keyword of config.keywords) {
        if (desc.includes(keyword.toLowerCase())) {
          detected.push(config.type);
          break;
        }
      }
    }
    
    // 去重
    const unique = [...new Set(detected)];
    
    return {
      start: unique[0] || null,  // 第一个运镜作为开始
      end: unique[unique.length - 1] || null,  // 最后一个运镜作为结束
      all: unique
    };
  }
  
  /**
   * 检查相邻镜头运镜衔接
   * prevMovement: 前一镜头的运镜描述
   * currMovement: 当前镜头的运镜描述
   */
  checkContinuity(prevShot, currShot) {
    const prev = this.detectMovementTypes(prevShot?.movement?.description || prevShot?.cameraMovement?.description || '');
    const curr = this.detectMovementTypes(currShot?.movement?.description || currShot?.cameraMovement?.description || '');
    
    if (!prev.end || !curr.start) {
      return { valid: true, reason: '无法检测运镜类型' };
    }
    
    const rule = this.transitionRules[prev.end]?.[curr.start];
    
    const check = {
      prevShotId: prevShot?.shotId || prevShot?.id || 'unknown',
      currShotId: currShot?.shotId || currShot?.id || 'unknown',
      prevEndMovement: prev.end,
      currStartMovement: curr.start,
      rule: rule || '⚠️',
      valid: rule === '✅' || rule === '⚠️',
      needsAdjustment: rule === '❌'
    };
    
    this.report.checks.push(check);
    
    if (rule === '❌') {
      this.report.violations.push(check);
      
      // 自动调整建议
      const alternatives = this.alternatives[curr.start] || ['环绕', '推进', '拉远'];
      const suggestedAlt = alternatives[0]; // 推荐第一个替代
      
      check.adjustment = {
        original: curr.start,
        suggested: suggestedAlt,
        alternatives: alternatives
      };
      
      this.report.adjustments.push(check);
    }
    
    return check;
  }
  
  /**
   * 检查整个故事板的运镜衔接
   */
  checkStoryboardContinuity(storyboard) {
    this.report = { checks: [], adjustments: [], violations: [] };
    
    if (!storyboard?.shots || storyboard.shots.length < 2) {
      return this.report;
    }
    
    const shots = storyboard.shots;
    
    for (let i = 1; i < shots.length; i++) {
      const prev = shots[i - 1];
      const curr = shots[i];
      
      this.checkContinuity(prev, curr);
    }
    
    return this.report;
  }
  
  /**
   * 自动调整运镜（修改当前镜头）
   */
  autoAdjustMovement(shot, prevShot) {
    const check = this.checkContinuity(prevShot, shot);
    
    if (!check.needsAdjustment) {
      return { adjusted: false, shot };
    }
    
    // 获取建议的替代运镜
    const suggestedAlt = check.adjustment?.suggested || '环绕';
    
    // 修改运镜描述
    let newDescription = shot.movement?.description || shot.cameraMovement?.description || '';
    
    // 替换第一个冲突的运镜关键词
    const currStart = check.currStartMovement;
    const keywords = this.movementTypes[currStart.toUpperCase()]?.keywords || [];
    
    for (const keyword of keywords) {
      if (newDescription.includes(keyword)) {
        newDescription = newDescription.replace(keyword, suggestedAlt);
        break;
      }
    }
    
    // 更新运镜对象
    if (shot.movement) {
      shot.movement.description = newDescription;
      shot.movement.isAdjusted = true;
      shot.movement.adjustmentReason = `避免与${prevShot.shotId || prevShot.id}的"${check.prevEndMovement}"运镜冲突`;
      shot.movement.originalDescription = shot.movement.description;
    }
    
    if (shot.cameraMovement) {
      shot.cameraMovement.description = newDescription;
      shot.cameraMovement.isAdjusted = true;
      shot.cameraMovement.adjustmentReason = `避免与${prevShot.shotId || prevShot.id}的"${check.prevEndMovement}"运镜冲突`;
    }
    
    return {
      adjusted: true,
      shot,
      originalMovement: currStart,
      newMovement: suggestedAlt,
      reason: check.adjustmentReason
    };
  }
  
  /**
   * 生成运镜衔接报告
   */
  generateReport() {
    const { checks, violations, adjustments } = this.report;
    
    let report = '\n🎬 运镜衔接检查报告\n';
    report += '='.repeat(50) + '\n';
    
    report += `\n总检查数: ${checks.length}\n`;
    report += `违规数: ${violations.length}\n`;
    report += `自动调整: ${adjustments.length}\n\n`;
    
    if (violations.length > 0) {
      report += '❌ 违规项:\n';
      for (const v of violations) {
        report += `  ${v.prevShotId}(${v.prevEndMovement}) → ${v.currShotId}(${v.currStartMovement}) [${v.rule}]\n`;
        if (v.adjustment) {
          report += `    → 建议改为: ${v.adjustment.suggested}\n`;
        }
      }
    }
    
    if (adjustments.length > 0) {
      report += '\n🔧 自动调整:\n';
      for (const a of adjustments) {
        report += `  ${a.currShotId}: ${a.adjustment.original} → ${a.adjustment.suggested}\n`;
      }
    }
    
    if (violations.length === 0) {
      report += '\n✅ 所有运镜衔接正常！\n';
    }
    
    return report;
  }
  
  /**
   * 获取运镜衔接建议（用于prompt生成）
   */
  getTransitionSuggestion(prevMovementType, currMovementType) {
    const rule = this.transitionRules[prevMovementType]?.[currMovementType];
    
    if (rule === '✅') {
      return { valid: true, suggestion: '运镜衔接良好' };
    } else if (rule === '⚠️') {
      return { valid: true, suggestion: '运镜衔接一般，建议优化' };
    } else {
      const alternatives = this.alternatives[currMovementType] || ['环绕'];
      return {
        valid: false,
        suggestion: `避免与前一镜头运镜重复，建议改为：${alternatives.join('、')}`
      };
    }
  }
}

module.exports = { CameraMovementContinuityManager };

// 测试
if (require.main === module) {
  const manager = new CameraMovementContinuityManager();
  
  // 测试用例
  const testShots = [
    { id: 'S01', movement: { description: '极速环绕推进 → 急拉俯冲 → 瞳孔锁定' } },
    { id: 'S02', movement: { description: '微距急速推进 → 仰冲升空 → 悬浮环绕' } },
    { id: 'S03', movement: { description: '急速拉远俯冲 → 微距环绕旋转 → 定格冻结' } }
  ];
  
  console.log('测试运镜衔接检查...');
  
  for (let i = 1; i < testShots.length; i++) {
    const check = manager.checkContinuity(testShots[i-1], testShots[i]);
    console.log(`\n${check.prevShotId}(${check.prevEndMovement}) → ${check.currShotId}(${check.currStartMovement})`);
    console.log(`结果: ${check.rule} ${check.valid ? '✅' : '❌'}`);
    if (check.needsAdjustment) {
      console.log(`建议: 改为 ${check.adjustment.suggested}`);
    }
  }
  
  console.log(manager.generateReport());
}
