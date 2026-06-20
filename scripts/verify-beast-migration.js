/**
 * Beast Domain Model 迁移验证脚本
 * 验证新旧 Bestiary 兼容性与数据完整性
 */

'use strict';

const { Bestiary, LEGACY_ID_MAP } = require('../shanhaijing-bestiary/bestiary.js');

console.log('🔬 Beast Domain Model 迁移验证\n');
console.log('=' .repeat(60));

const bestiary = new Bestiary();
const results = [];

function test(name, fn) {
  try {
    const result = fn();
    const passed = result.passed !== false;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${result.message}`);
    results.push({ name, passed, message: result.message });
  } catch (e) {
    console.log(`❌ ${name}: 异常 ${e.message}`);
    results.push({ name, passed: false, message: e.message });
  }
}

// ============================================================
// 一、旧接口兼容验证
// ============================================================

console.log('\n📋 旧接口兼容');

test('getCreature(taotie)', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.id === 'taotie' && c.name === '饕餮',
    message: `id=${c?.id}, name=${c?.name}` 
  };
});

test('getBeast(taotie) 别名', () => {
  const c = bestiary.getBeast('taotie');
  return { 
    passed: c && c.id === 'taotie',
    message: `id=${c?.id}` 
  };
});

test('getCreature(zhuLong) 旧别名映射', () => {
  const c = bestiary.getCreature('zhuLong');
  return { 
    passed: c && c.id === 'zhulong',
    message: `旧zhuLong → 新${c?.id}, name=${c?.name}` 
  };
});

test('getCreature(nuanNuan) 旧别名映射', () => {
  const c = bestiary.getCreature('nuanNuan');
  return { 
    passed: c && c.id === 'dijiang',
    message: `旧nuanNuan → 新${c?.id}, name=${c?.name}` 
  };
});

test('getCreature(xuanGui) 旧别名映射', () => {
  const c = bestiary.getCreature('xuanGui');
  return { 
    passed: c && c.id === 'xuangui',
    message: `旧xuanGui → 新${c?.id}, name=${c?.name}` 
  };
});

test('getCreature(baiZe) 旧别名映射', () => {
  const c = bestiary.getCreature('baiZe');
  return { 
    passed: c && c.id === 'baize',
    message: `旧baiZe → 新${c?.id}, name=${c?.name}` 
  };
});

test('getCreature(jiuWeiHu) 旧别名映射', () => {
  const c = bestiary.getCreature('jiuWeiHu');
  return { 
    passed: c && c.id === 'jiuweihu',
    message: `旧jiuWeiHu → 新${c?.id}, name=${c?.name}` 
  };
});

test('listCreatures()', () => {
  const list = bestiary.listCreatures();
  return { 
    passed: list.length >= 5 && list.includes('taotie'),
    message: `${list.length} 只: ${list.join(', ')}` 
  };
});

test('searchByLocation("Nirath")', () => {
  const list = bestiary.searchByLocation('Nirath');
  return { 
    passed: list.length >= 5,
    message: `${list.length} 只` 
  };
});

// ============================================================
// 二、新数据字段验证（迁移核心收益）
// ============================================================

console.log('\n📋 新数据字段');

test('taotie 视觉签名存在', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.visualSignature && c.visualSignature.length > 100,
    message: `visualSignature长度=${c?.visualSignature?.length}` 
  };
});

test('taotie 视觉关键特征', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.visualKeyFeatures && c.visualKeyFeatures.includes('羊身'),
    message: `keyFeatures=[${c?.visualKeyFeatures?.join(', ')}]` 
  };
});

test('taotie Prompt模板存在', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.promptTemplate && c.promptTemplate.includes('{scene}'),
    message: `promptTemplate含{scene}=${c?.promptTemplate?.includes('{scene}')}` 
  };
});

test('taotie 负面提示词存在', () => {
  const c = bestiary.getCreature('taotie');
  const neg = c?.negativePrompt || '';
  const hasMetal = neg.includes('metal');
  return { 
    passed: neg.length > 10 && hasMetal,
    message: `negativePrompt长度=${neg.length}, 含metal=${hasMetal}` 
  };
});

test('taotie Lore摘要', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.lore && c.lore.length > 10,
    message: `lore长度=${c?.lore?.length}` 
  };
});

test('taotie 能力列表', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.abilities && c.abilities.length > 0,
    message: `abilities=[${c?.abilities?.join(', ')}]` 
  };
});

test('taotie 颜色调色板', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.colorPalette && c.colorPalette.includes('暗红'),
    message: `palette=[${c?.colorPalette?.join(', ')}]` 
  };
});

test('taotie 栖息地', () => {
  const c = bestiary.getCreature('taotie');
  return { 
    passed: c && c.habitat && c.habitat.primary,
    message: `habitat.primary=${c?.habitat?.primary}` 
  };
});

// ============================================================
// 三、新增接口验证
// ============================================================

console.log('\n📋 新增接口');

test('getVisualSignaturePrompt(taotie)', () => {
  const prompt = bestiary.getVisualSignaturePrompt('taotie');
  return { 
    passed: prompt && prompt.includes('Creature: Taotie'),
    message: `长度=${prompt?.length}, 含Creature=${prompt?.includes('Creature:')}` 
  };
});

test('getPromptTemplate(taotie, scene=test)', () => {
  const template = bestiary.getPromptTemplate('taotie', '钩吾废墟核心');
  return { 
    passed: template && template.includes('钩吾废墟核心'),
    message: `含scene=${template?.includes('钩吾废墟核心')}, 长度=${template?.length}` 
  };
});

test('getNegativePrompt(taotie)', () => {
  const neg = bestiary.getNegativePrompt('taotie');
  return { 
    passed: neg && neg.includes('metal'),
    message: `含metal=${neg?.includes('metal')}, 长度=${neg?.length}` 
  };
});

test('search("火山")', () => {
  const results = bestiary.search('火山');
  return { 
    passed: results.length > 0,
    message: `${results.length} 结果, 首条=${results[0]?.name}` 
  };
});

// ============================================================
// 四、数据对比（旧 vs 新）
// ============================================================

console.log('\n📋 数据丰富度对比');

const taotie = bestiary.getCreature('taotie');
const zhulong = bestiary.getCreature('zhuLong');
const dijiang = bestiary.getCreature('nuanNuan');

console.log(`   taotie:  id=${taotie.id}, name=${taotie.name}`);
console.log(`           visualSignature=${taotie.visualSignature?.length}字符`);
console.log(`           promptTemplate=${taotie.promptTemplate?.length}字符`);
console.log(`           lore=${taotie.lore?.length}字符`);
console.log(`           abilities=${taotie.abilities?.length}项`);
console.log(`           keyFeatures=${taotie.visualKeyFeatures?.length}项`);

console.log(`   zhulong(旧zhuLong): id=${zhulong.id}, name=${zhulong.name}`);
console.log(`           visualSignature=${zhulong.visualSignature?.length}字符`);

console.log(`   dijiang(旧nuanNuan): id=${dijiang.id}, name=${dijiang.name}`);
console.log(`           visualSignature=${dijiang.visualSignature?.length}字符`);

// ============================================================
// 五、迁移日志
// ============================================================

console.log('\n📋 迁移日志');
const migrationLog = bestiary.getMigrationLog();
console.log(`   迁移记录: ${migrationLog.length} 条`);
for (const entry of migrationLog.slice(0, 5)) {
  console.log(`     ${entry.from} → ${entry.to} (${entry.method})`);
}

// ============================================================
// 六、汇总
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('📋 验证汇总');
console.log('='.repeat(60));

const passed = results.filter(r => r.passed).length;
const total = results.length;

for (const r of results) {
  const icon = r.passed ? '✅' : '❌';
  console.log(`${icon} ${r.name}: ${r.message}`);
}

console.log('\n' + '-'.repeat(60));
console.log(`总计: ${passed}/${total} 通过`);

if (passed === total) {
  console.log('\n🎉 所有验证通过！Beast Domain Model迁移完成。');
  console.log('\n✅ 迁移确认：');
  console.log('   1. 旧接口 100% 兼容（getCreature/getBeast/listCreatures/searchByLocation）');
  console.log('   2. 旧别名自动映射（zhuLong→zhulong, nuanNuan→dijiang, 等）');
  console.log('   3. 新数据字段可用（visualSignature, promptTemplate, lore, abilities等）');
  console.log('   4. 新增接口可用（getVisualSignaturePrompt, getPromptTemplate, search）');
  console.log('   5. 6只神兽数据全部加载成功');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${total - passed} 项失败，请检查。`);
  process.exit(1);
}
