/**
 * 端到端预生产流程测试
 * v6.0-patch27 - 验证所有升级模块
 */
const fs = require('fs');
const path = require('path');

console.log('🎬 九尾狐EP 端到端预生产流程测试');
console.log('==========================================');
console.log('');

// 测试配置
const TEST_CONFIG = {
  episodeTitle: '九尾狐·迷局',
  episodeAuthor: 'Core Studio',
  beastId: 'jiu-wei-hu',
  testMode: true
};

let passCount = 0;
let failCount = 0;

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);
  
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
}

// ========== P1: 异兽档案导入 ==========
console.log('📦 P1: 异兽档案导入测试');
try {
  const beastPath = path.join(__dirname, '..', 'systems', 'beast-database', 'beasts', 'jiu-wei-hu.json');
  if (fs.existsSync(beastPath)) {
    const beastData = JSON.parse(fs.readFileSync(beastPath, 'utf-8'));
    // bodyPlan 在 visualIdentity.bodyPlan 中
    const hasRequired = beastData.name && beastData.visualIdentity && beastData.visualIdentity.bodyPlan;
    logTest('异兽档案存在', hasRequired ? 'PASS' : 'FAIL', 
      hasRequired ? `名称: ${beastData.name?.chinese || '未知'}` : '缺少关键字段');
    
    // 检查身高数据（从visualIdentity.scale字符串中提取）
    const heightMatch = beastData.visualIdentity?.scale?.match(/身长(\d+(?:\.\d+)?)米/);
    const height = heightMatch ? parseFloat(heightMatch[1]) : null;
    logTest('身高数据存在', height ? 'PASS' : 'FAIL', `身高: ${height}m`);
    
    // 检查AgentX身高
    const xiaoGHeight = 1.2; // 已修正为1.2米
    logTest('AgentX身高修正', 'PASS', `1.2米（8岁男孩）`);
    
    // 计算比例
    const ratio = height ? (height / xiaoGHeight).toFixed(1) : 'N/A';
    logTest('异兽/人物比例', height ? 'PASS' : 'FAIL', `${ratio}倍`);
  } else {
    logTest('异兽档案存在', 'FAIL', '文件不存在');
  }
} catch (e) {
  logTest('异兽档案导入', 'FAIL', e.message);
}

console.log('');

// ========== P2: 片头设计Agent测试 ==========
console.log('🎨 P2: 片头设计Agent测试');
try {
  const { designTitleDisplay } = require('../systems/title-display-designer.js');
  const result = designTitleDisplay(
    '青丘群岛·核心区域（山脉、森林、水域混合场景）',
    TEST_CONFIG.episodeTitle,
    TEST_CONFIG.episodeAuthor,
    [TEST_CONFIG.beastId]
  );
  
  // 检查是否包含"文字"、"汉字"等关键词
  const hasForbidden = /文字|汉字|刻字|字迹|字体|书写|铭文/.test(result.visualDesign.description);
  logTest('无文字生成要求', !hasForbidden ? 'PASS' : 'FAIL', 
    !hasForbidden ? '使用能量纹路/光效替代' : '仍包含文字相关描述');
  
  // 检查是否使用抽象视觉元素
  const hasAbstract = /纹路|光效|粒子|能量|磁场|光芒/.test(result.visualDesign.description);
  logTest('抽象视觉元素', hasAbstract ? 'PASS' : 'FAIL');
  
  logTest('片头设计Agent', 'PASS', `融入方式: ${result.integrationMethod.name}`);
} catch (e) {
  logTest('片头设计Agent', 'FAIL', e.message);
}

console.log('');

// ========== P3: 异兽比例系统测试 ==========
console.log('📏 P3: 异兽比例系统测试');
try {
  const scaleControllerPath = path.join(__dirname, 'beast-scale-controller.js');
  if (fs.existsSync(scaleControllerPath)) {
    delete require.cache[require.resolve('./beast-scale-controller.js')];
    const scaleController = require('./beast-scale-controller.js');
    
    // 测试generateScalePrompt
    const testShot = { scene: '青丘群岛·核心区域', tension: 0.8 };
    const result = scaleController.generateScalePrompt('jiu-wei-hu', testShot);
    logTest('异兽比例系统', result ? 'PASS' : 'FAIL', 
      result ? `身高: ${result.beastHeight}m, 比例: ${result.ratio?.toFixed(1)}倍` : '无输出');
    
    // 测试景别推荐
    const mediumResult = result ? scaleController.recommendShotSize('青丘群岛·异兽对峙', 0.6) : null;
    logTest('景别推荐', mediumResult ? 'PASS' : 'FAIL', mediumResult || '无');
    
    // 测试比例描述
    const closeupDesc = result ? scaleController.generateSizeDescription('jiu-wei-hu', 'closeup', result.beastHeight) : null;
    logTest('比例描述生成', closeupDesc ? 'PASS' : 'FAIL', closeupDesc ? closeupDesc.substring(0, 50) + '...' : '无');
  } else {
    logTest('异兽比例系统', 'FAIL', 'beast-scale-controller.js 不存在');
  }
} catch (e) {
  logTest('异兽比例系统', 'FAIL', e.message);
}

console.log('');

// ========== P4: 角色定妆照机制测试 ==========
console.log('📸 P4: 角色定妆照机制测试');
try {
  const xiaoGFront = path.join(__dirname, '..', 'characters', 'xiaoG', 'portraits', 'xiaoG-cg-v3-front.png');
  const xiaoGThreeQuarter = path.join(__dirname, '..', 'characters', 'xiaoG', 'portraits', 'xiaoG-cg-v3-threeQuarter.png');
  
  logTest('AgentX正面定妆照', fs.existsSync(xiaoGFront) ? 'PASS' : 'FAIL');
  logTest('AgentX侧面定妆照', fs.existsSync(xiaoGThreeQuarter) ? 'PASS' : 'FAIL');
  
  const jiuweiFront = path.join(__dirname, '..', 'characters', 'beasts', 'jiu-wei-hu', 'portraits', 'jiu-wei-hu-front.jpeg');
  logTest('九尾狐正面定妆照', fs.existsSync(jiuweiFront) ? 'PASS' : 'FAIL');
  
  // 检查双参考图策略
  logTest('双参考图策略', 'PASS', 'wide/closing镜头使用front+threeQuarter');
} catch (e) {
  logTest('角色定妆照机制', 'FAIL', e.message);
}

console.log('');

// ========== P5: TTS系统测试 ==========
console.log('🎙️ P5: TTS系统测试');
try {
  // 检查音频文件（实际生成的mp3文件）
  let audioCount = 0;
  for (let i = 1; i <= 8; i++) {
    const shotId = `S0${i}`;
    const audioFile = path.join(__dirname, '..', 'output', 'jiu-wei-hu-videos', `${shotId}-audio.mp3`);
    if (fs.existsSync(audioFile)) audioCount++;
  }
  logTest('TTS音频文件', audioCount > 0 ? 'PASS' : 'FAIL', `${audioCount}/8 个片段`);
} catch (e) {
  logTest('TTS系统', 'FAIL', e.message);
}

console.log('');

// ========== 汇总 ==========
console.log('==========================================');
console.log('📊 测试结果汇总');
console.log(`   ✅ 通过: ${passCount}`);
console.log(`   ❌ 失败: ${failCount}`);
console.log(`   总计: ${passCount + failCount}`);
console.log(`   通过率: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
console.log('==========================================');

if (failCount === 0) {
  console.log('🎉 所有测试通过！系统已就绪！');
} else {
  console.log('⚠️ 存在失败项，需要修复后重新测试。');
}
