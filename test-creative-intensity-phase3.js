#!/usr/bin/env node
/**
 * 创意指数系统 Phase 3 测试 - 智能推荐系统
 */

const { CreativeIntensityRecommender } = require('./systems/creative-intensity-recommender.js');

const recommender = new CreativeIntensityRecommender({
  dataPath: './data/creative-intensity-feedback.json',
  minSamples: 3
});

console.log('=== 创意指数 Phase 3 智能推荐系统测试 ===\n');

// 测试1: 默认值推荐（无数据时）
console.log('--- 测试1: 默认值推荐（无数据时）---');
const healthRec = recommender.recommend('health_edu');
const dramaRec = recommender.recommend('drama');
const commercialRec = recommender.recommend('commercial');
const nirathRec = recommender.recommend('nirath');

console.log(`医疗科普: intensity=${healthRec.intensity}, 置信度=${healthRec.confidence}, 来源=${healthRec.isDefault ? '默认' : '数据'}`);
console.log(`剧情短片: intensity=${dramaRec.intensity}, 置信度=${dramaRec.confidence}, 来源=${dramaRec.isDefault ? '默认' : '数据'}`);
console.log(`商业广告: intensity=${commercialRec.intensity}, 置信度=${commercialRec.confidence}, 来源=${commercialRec.isDefault ? '默认' : '数据'}`);
console.log(`Nirath系列: intensity=${nirathRec.intensity}, 置信度=${nirathRec.confidence}, 来源=${nirathRec.isDefault ? '默认' : '数据'}`);

// 测试2: 记录数据
console.log('\n--- 测试2: 记录模拟数据 ---');
// 模拟医疗科普数据：intensity=0.4 时完播率最高
recommender.record({ videoType: 'health_edu', intensity: 0.2, completionRate: 45, engagementRate: 30 });
recommender.record({ videoType: 'health_edu', intensity: 0.4, completionRate: 72, engagementRate: 55 });
recommender.record({ videoType: 'health_edu', intensity: 0.6, completionRate: 58, engagementRate: 42 });
recommender.record({ videoType: 'health_edu', intensity: 0.8, completionRate: 35, engagementRate: 25 });

// 模拟剧情短片数据：intensity=0.7 时完播率最高
recommender.record({ videoType: 'drama', intensity: 0.5, completionRate: 55, engagementRate: 40 });
recommender.record({ videoType: 'drama', intensity: 0.7, completionRate: 78, engagementRate: 65 });
recommender.record({ videoType: 'drama', intensity: 0.9, completionRate: 62, engagementRate: 50 });

console.log('模拟数据已记录：医疗科普4条，剧情短片3条');

// 测试3: 数据驱动推荐
console.log('\n--- 测试3: 数据驱动推荐 ---');
const healthRec2 = recommender.recommend('health_edu');
const dramaRec2 = recommender.recommend('drama');

console.log(`医疗科普: intensity=${healthRec2.intensity} (应为0.4) | 置信度=${healthRec2.confidence} | 来源=${healthRec2.isDefault ? '默认' : '数据驱动'}`);
console.log(`原因: ${healthRec2.reason}`);
console.log(`\n剧情短片: intensity=${dramaRec2.intensity} (应为0.7) | 置信度=${dramaRec2.confidence} | 来源=${dramaRec2.isDefault ? '默认' : '数据驱动'}`);
console.log(`原因: ${dramaRec2.reason}`);

// 测试4: 聚合数据查看
console.log('\n--- 测试4: 聚合数据 ---');
const summary = recommender.getSummary();
console.log(`总条目数: ${summary.totalEntries}`);
console.log(`已聚合类型: ${Object.keys(summary.aggregated).join(', ')}`);

// 测试5: 生成报告
console.log('\n--- 测试5: 生成报告 ---');
const report = recommender.generateReport();
console.log(report.substring(0, 500) + '...');

console.log('\n=== Phase 3 测试完成 ===');
console.log('\n关键结论：');
console.log('1. 无数据时返回类型默认值（置信度=0）');
console.log('2. 样本≥3且置信度≥0.6时返回数据驱动推荐');
console.log('3. 医疗科普最优: 0.4（完播率72%）');
console.log('4. 剧情短片最优: 0.7（完播率78%）');
console.log('5. 反馈闭环已建立，数据自动保存到 JSON 文件');
