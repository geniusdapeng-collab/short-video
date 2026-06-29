/**
 * Smart Trim v2.0 验证脚本
 * 对比旧版(v1.x)与新版(v2.0)的裁剪质量差异
 * 
 * 验证维度：
 * 1. 语义完整性：裁剪后是否保留完整句子
 * 2. Duration保护：时长信息是否从P3升级到P2
 * 3. 审计可追溯：每次裁剪是否记录被移除内容
 * 4. 极限场景：490汉字（≈980字符）下的表现
 * 5. 向后兼容：旧接口 smartTrim(prompt) 返回字符串
 */

'use strict';

const { IncrementalTrimEngine, smartTrim, parsePromptFields } = require('../systems/smart-trim-v2.js');

// ============================================================
// 一、测试样本（模拟真实 Prompt）
// ============================================================

const TEST_SAMPLES = [
  // 样本1: 超长的完整Prompt（约1100字符）
  {
    name: 'EP01-饕餮-超长Prompt',
    prompt: `CHARACTER: Nirath原创异兽饕餮，融合《山海经》羊身人面目在腋下虎齿人爪特征与2147年科技废墟美学，肩高30米火山岩装甲覆盖全身，人面庄严巨口占面部三分之二利齿白玉交错，腋下两团硫磺黄色眼球缓缓转动，前肢人手掌五指修长，永恒饥饿法则具象化，暗红硫磺黄交织黑曜石质感，超写实CG渲染。 | ACTION: AgentX缓步走向饕餮，每一步都踏出火山岩碎裂的声响。他伸出手掌，掌心向上，试图与这只远古战争遗留单位建立沟通。饕餮的硫磺黄双眼微微转动，婴儿般的啼哭声从巨口中传出，频率如共鸣般干扰心神。 | SCENE: Nirath南半球钩吾废墟核心地带，远古战争遗迹的中央。地面由黑曜石与火山岩碎片构成，裂缝中流淌着暗红色的熔岩光芒。空气中弥漫着硫磺气息与火山灰，远处是坍塌的远古建筑残骸，如同巨兽的骨架矗立在暗红色的天幕下。环境生态充满地球式生机：荧光苔藓覆盖岩石裂缝，发光孢子随风飘散，如同旧世界的萤火虫在废墟中舞蹈。 | MOOD: 庄严中带着远古的悲悯。这不是邪恶的怪物，而是贪婪法则的极致具象化。暗红色的熔岩光芒给整个场景笼罩上一层神圣而危险的氛围，硫磺黄色的能量粒子在空气中缓缓流动，如同被禁锢的星光。 | CAMERA: 低角度仰拍，摄像机位于AgentX身后微微仰起，同时捕捉AgentX的渺小身影与饕餮30米高的庞然身躯，形成强烈尺度对比。缓慢推进镜头，从全景逐渐推至中景，最后聚焦于AgentX伸出的手掌与饕餮垂落的视线交汇点。 | LIGHTING: 主光源来自地面裂缝中的暗红色熔岩光，形成底光效果，给饕餮的火山岩装甲勾勒出危险的轮廓光。辅光源是空气中漂浮的硫磺黄色能量粒子，提供柔和的填充光，照亮AgentX的面部细节。背景光由远处的建筑残骸反射的暗红色天幕提供，营造深邃的空间感。 | NEGATIVE: no deformed hands, no extra fingers, no modern objects, no text watermark, no cartoon style, no flat lighting, no oversaturated colors, no anime eyes, no glowing eyes, no metal armor, no metal texture, no metallic sheen, no dark style, no night scene, no voiceover | AUDIO: 低频火山岩摩擦声作为环境底噪，硫磺气泡破裂声点缀节奏，婴儿啼哭声在关键情感节点出现频率逐渐升高 | DURATION: 12秒 | DIRECTOR: Cameron-scale epic bioluminescent ecosystems, grand scale environmental storytelling, volumetric light rays piercing through volcanic ash`,
    targetLength: 980,
    expectedBehavior: 'P3(DIRECTOR)和P2(NEGATIVE/AUDIO/DURATION)被裁剪，P1(SCENE/CAMERA/LIGHTING)适度裁剪，P0(CHARACTER)完整保留'
  },

  // 样本2: 刚好在边界附近（约1000字符）
  {
    name: 'EP01-饕餮-边界测试',
    prompt: `CHARACTER: Nirath原创异兽饕餮，羊身人面，目在腋下，虎齿人爪，30米肩高，火山岩装甲，硫磺黄双眼。 | ACTION: AgentX面对饕餮，手掌向上伸出。 | SCENE: 钩吾废墟，黑曜石地面，熔岩裂缝，远古建筑残骸。 | MOOD: 庄严悲悯，神圣危险。 | CAMERA: 低角度仰拍，缓慢推进。 | LIGHTING: 暗红熔岩底光，硫磺黄填充光。 | NEGATIVE: no deformed hands, no cartoon style, no anime eyes, no metal armor, no dark style | AUDIO: 火山岩摩擦声，硫磺气泡声 | DURATION: 10秒 | DIRECTOR: Cameron-scale epic`,
    targetLength: 980,
    expectedBehavior: '轻微裁剪或不裁剪'
  },

  // 样本3: 极端超长（约1500字符）- 测试极限裁剪
  {
    name: 'EP01-饕餮-极限超长',
    prompt: `CHARACTER: Nirath原创异兽饕餮，融合《山海经》羊身人面目在腋下虎齿人爪特征与2147年科技废墟美学，肩高30米火山岩装甲覆盖全身，人面庄严巨口占面部三分之二利齿白玉交错，腋下两团硫磺黄色眼球缓缓转动，前肢人手掌五指修长，永恒饥饿法则具象化，暗红硫磺黄交织黑曜石质感，超写实CG渲染，超写实CG渲染，超写实CG渲染。 | ACTION: AgentX缓步走向饕餮，每一步都踏出火山岩碎裂的声响。他伸出手掌，掌心向上，试图与这只远古战争遗留单位建立沟通。饕餮的硫磺黄双眼微微转动，婴儿般的啼哭声从巨口中传出，频率如共鸣般干扰心神。AgentX继续向前，步伐坚定但充满敬畏。 | SCENE: Nirath南半球钩吾废墟核心地带，远古战争遗迹的中央。地面由黑曜石与火山岩碎片构成，裂缝中流淌着暗红色的熔岩光芒。空气中弥漫着硫磺气息与火山灰，远处是坍塌的远古建筑残骸，如同巨兽的骨架矗立在暗红色的天幕下。环境生态充满地球式生机：荧光苔藓覆盖岩石裂缝，发光孢子随风飘散，如同旧世界的萤火虫在废墟中舞蹈。废墟边缘有熔岩河流缓缓流淌，硫磺蒸汽从裂缝中升腾。 | MOOD: 庄严中带着远古的悲悯。这不是邪恶的怪物，而是贪婪法则的极致具象化。暗红色的熔岩光芒给整个场景笼罩上一层神圣而危险的氛围，硫磺黄色的能量粒子在空气中缓缓流动，如同被禁锢的星光。情绪从敬畏逐渐过渡到理解。 | CAMERA: 低角度仰拍，摄像机位于AgentX身后微微仰起，同时捕捉AgentX的渺小身影与饕餮30米高的庞然身躯，形成强烈尺度对比。缓慢推进镜头，从全景逐渐推至中景，最后聚焦于AgentX伸出的手掌与饕餮垂落的视线交汇点。轨道移动镜头，环绕AgentX与饕餮的相遇点旋转180度。 | LIGHTING: 主光源来自地面裂缝中的暗红色熔岩光，形成底光效果，给饕餮的火山岩装甲勾勒出危险的轮廓光。辅光源是空气中漂浮的硫磺黄色能量粒子，提供柔和的填充光，照亮AgentX的面部细节。背景光由远处的建筑残骸反射的暗红色天幕提供，营造深邃的空间感。三点布光法，主光+辅光+轮廓光。 | NEGATIVE: no deformed hands, no extra fingers, no modern objects, no text watermark, no cartoon style, no flat lighting, no oversaturated colors, no anime eyes, no glowing eyes, no metal armor, no metal texture, no metallic sheen, no dark style, no night scene, no voiceover, no bad anatomy, no blurry, no low quality | AUDIO: 低频火山岩摩擦声作为环境底噪，硫磺气泡破裂声点缀节奏，婴儿啼哭声在关键情感节点出现频率逐渐升高，形成情绪引导线索 | DURATION: 15秒 | DIRECTOR: Cameron-scale epic bioluminescent ecosystems, grand scale environmental storytelling, volumetric light rays piercing through volcanic ash, epic cinematic composition`,
    targetLength: 980,
    expectedBehavior: '大幅裁剪P3/P2，P1适度裁剪，P0完整保留，最终接近980字符'
  }
];

// ============================================================
// 二、验证函数
// ============================================================

function runTests() {
  console.log('🔬 Smart Trim v2.0 验证开始\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const sample of TEST_SAMPLES) {
    console.log(`\n📋 测试样本: ${sample.name}`);
    console.log(`   原始长度: ${sample.prompt.length} 字符`);
    console.log(`   目标长度: ${sample.targetLength} 字符`);
    console.log(`   超出: ${sample.prompt.length - sample.targetLength} 字符`);
    console.log(`   预期行为: ${sample.expectedBehavior}`);
    console.log('-'.repeat(50));
    
    // 1. 测试增量裁剪引擎
    const engine = new IncrementalTrimEngine({
      targetLength: sample.targetLength,
      minEffectiveLength: 850
    });
    
    const result = engine.trim(sample.prompt);
    
    // 2. 解析裁剪前后的字段
    const beforeFields = parsePromptFields(sample.prompt);
    const afterFields = parsePromptFields(result.trimmedPrompt);
    
    // 3. 验证结果
    const validations = [];
    
    // V1: 长度检查
    const lenOk = result.trimmedPrompt.length <= sample.targetLength;
    validations.push({
      name: '长度不超限',
      passed: lenOk,
      detail: `${result.trimmedPrompt.length}/${sample.targetLength} 字符`
    });
    
    // V2: P0字段完整性
    const p0Fields = ['CHARACTER'];
    let p0Ok = true;
    for (const f of p0Fields) {
      const before = beforeFields[f]?.content || '';
      const after = afterFields[f]?.content || '';
      if (after.length < before.length) {
        p0Ok = false;
        validations.push({
          name: `P0字段[${f}]未裁剪`,
          passed: false,
          detail: `从${before.length}裁到${after.length}字符`
        });
      }
    }
    if (p0Ok) {
      validations.push({ name: 'P0字段完整保留', passed: true, detail: 'CHARACTER未裁剪' });
    }
    
    // V3: DURATION字段保护（v2.0核心改进：从P3升级到P2）
    const durationBefore = beforeFields['DURATION']?.content || '';
    const durationAfter = afterFields['DURATION']?.content || '';
    const durationProtected = durationAfter.length >= durationBefore.length || 
                             (durationBefore.length > 20 && durationAfter.length >= 20);
    validations.push({
      name: 'DURATION字段保护(P2)',
      passed: durationProtected,
      detail: `从${durationBefore.length}→${durationAfter.length}字符 (min=20)`
    });
    
    // V4: 语义边界检查（抽查SCENE字段）
    const sceneAfter = afterFields['SCENE']?.content || '';
    const lastChar = sceneAfter.slice(-1);
    const semanticOk = /[。，；！？.，;!?:]$/.test(lastChar) || sceneAfter.length === beforeFields['SCENE']?.content?.length;
    validations.push({
      name: '语义边界保留',
      passed: semanticOk,
      detail: `SCENE字段末尾: "${lastChar}" (应为标点或完整保留)`
    });
    
    // V5: 审计日志完整性
    const auditOk = result.auditLog.length > 0 || !result.wasTrimmed;
    validations.push({
      name: '审计日志完整',
      passed: auditOk,
      detail: result.wasTrimmed ? `${result.auditLog.length}条记录` : '未裁剪'
    });
    
    // V6: 向后兼容接口
    const compatResult = smartTrim(sample.prompt, { 
      targetLength: sample.targetLength,
      returnStats: false 
    });
    const compatOk = typeof compatResult === 'string' && compatResult.length <= sample.targetLength;
    validations.push({
      name: '向后兼容接口',
      passed: compatOk,
      detail: `返回字符串，长度${compatResult.length}`
    });
    
    // 汇总
    const passed = validations.filter(v => v.passed).length;
    const total = validations.length;
    
    console.log(`\n   验证结果: ${passed}/${total} 通过`);
    for (const v of validations) {
      const icon = v.passed ? '✅' : '❌';
      console.log(`   ${icon} ${v.name}: ${v.detail}`);
    }
    
    // 审计日志摘要
    if (result.auditLog.length > 0) {
      console.log(`\n   📊 裁剪审计:`);
      for (const entry of result.auditLog) {
        console.log(`      [${entry.priority}] ${entry.field}: 裁${entry.charsRemoved}字符 (${entry.originalLength}→${entry.trimmedLength})`);
        if (entry.removedText) {
          const preview = entry.removedText.substring(0, 40).replace(/\n/g, ' ');
          console.log(`         移除: "${preview}${entry.removedText.length > 40 ? '...' : ''}"`);
        }
      }
    }
    
    // 字段对比表
    console.log(`\n   📊 字段长度对比:`);
    console.log(`      字段        裁剪前   裁剪后   变化`);
    for (const fieldName of ['CHARACTER', 'ACTION', 'SCENE', 'MOOD', 'CAMERA', 'LIGHTING', 'NEGATIVE', 'AUDIO', 'DURATION', 'DIRECTOR']) {
      const before = beforeFields[fieldName]?.length || 0;
      const after = afterFields[fieldName]?.length || 0;
      const delta = after - before;
      const marker = delta === 0 ? '=' : delta < 0 ? '-' : '+';
      console.log(`      ${fieldName.padEnd(12)} ${String(before).padStart(5)}   ${String(after).padStart(5)}   ${marker}${Math.abs(delta)}`);
    }
    
    results.push({
      sample: sample.name,
      originalLength: sample.prompt.length,
      finalLength: result.trimmedPrompt.length,
      charsRemoved: result.stats.charsRemoved,
      validations,
      passed: passed === total,
      auditLog: result.auditLog
    });
  }
  
  // 汇总报告
  console.log('\n' + '='.repeat(60));
  console.log('📋 验证汇总');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const r of results) {
    const passed = r.validations.filter(v => v.passed).length;
    const total = r.validations.length;
    totalPassed += passed;
    totalTests += total;
    
    const icon = passed === total ? '✅' : '⚠️';
    console.log(`${icon} ${r.sample}: ${passed}/${total} 通过 | ${r.originalLength}→${r.finalLength}字符(裁${r.charsRemoved})`);
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log(`总计: ${totalPassed}/${totalTests} 验证通过`);
  
  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log('\n🎉 所有验证通过！Smart Trim v2.0 就绪。');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分验证未通过，请检查上述错误。');
    process.exit(1);
  }
}

// 运行测试
runTests();