#!/usr/bin/env node
/**
 * 创意指数系统单元测试
 */

const { CreativeIntensityIndex } = require('./systems/creative-intensity-index.js');

const cii = new CreativeIntensityIndex();

console.log('=== 创意指数系统单元测试 ===\n');

// 测试1: 数值解析
console.log('--- 测试1: 数值解析 ---');
console.log(`parse(0.2) = ${cii.parse(0.2)} (期望: 0.2)`);
console.log(`parse(0.7) = ${cii.parse(0.7)} (期望: 0.7)`);
console.log(`parse(1.5) = ${cii.parse(1.5)} (期望: 1.0, 上限截断)`);
console.log(`parse(-0.1) = ${cii.parse(-0.1)} (期望: 0.0, 下限截断)`);

// 测试2: 字符串解析
console.log('\n--- 测试2: 字符串解析 ---');
console.log(`parse("0.5") = ${cii.parse('0.5')} (期望: 0.5)`);
console.log(`parse("非常有创意") = ${cii.parse('非常有创意')} (期望: 0.7)`);
console.log(`parse("创意天花板") = ${cii.parse('创意天花板')} (期望: 0.9)`);
console.log(`parse("拉到满") = ${cii.parse('拉到满')} (期望: 0.95)`);
console.log(`parse("保守") = ${cii.parse('保守')} (期望: 0.2)`);
console.log(`parse("默认") = ${cii.parse('默认')} (期望: 0.2)`);

// 测试3: 对象解析
console.log('\n--- 测试3: 对象解析 ---');
console.log(`parse({creativeIntensity: 0.8}) = ${cii.parse({creativeIntensity: 0.8})} (期望: 0.8)`);
console.log(`parse({creative: 0.6}) = ${cii.parse({creative: 0.6})} (期望: 0.6)`);
console.log(`parse({}) = ${cii.parse({})} (期望: 0.2, 默认)`);

// 测试4: 模糊匹配
console.log('\n--- 测试4: 模糊匹配 ---');
console.log(`parse("请非常有创意地拍摄") = ${cii.parse('请非常有创意地拍摄')} (期望: 0.7)`);
console.log(`parse("我想拉到满") = ${cii.parse('我想拉到满')} (期望: 0.95)`);

// 测试5: 模块激活
console.log('\n--- 测试5: 模块激活 (0.2 vs 0.7 vs 0.95) ---');
const modules02 = cii.getActiveModules(0.2);
const modules07 = cii.getActiveModules(0.7);
const modules095 = cii.getActiveModules(0.95);
console.log(`0.2 激活模块: ${modules02.length}/14 (${modules02.map(m => m.name).join(', ')})`);
console.log(`0.7 激活模块: ${modules07.length}/14 (${modules07.map(m => m.name).join(', ')})`);
console.log(`0.95 激活模块: ${modules095.length}/14 (${modules095.map(m => m.name).join(', ')})`);

// 测试6: 指令生成
console.log('\n--- 测试6: 指令生成 (0.7 @ STAGE-9) ---');
const stage9Instructions = cii.generateStageInstructions('STAGE-9', 0.7);
if (stage9Instructions) {
  console.log(`Stage: ${stage9Instructions.stage}`);
  console.log(`Intensity: ${stage9Instructions.intensity}`);
  console.log(`Level: ${stage9Instructions.level.key} (${stage9Instructions.level.name})`);
  console.log(`Count: ${stage9Instructions.count}`);
  console.log(`Instructions:\n${stage9Instructions.instructions}`);
} else {
  console.log('STAGE-9 无指令 (0.7 可能未达到阈值)');
}

// 测试7: 完整报告
console.log('\n--- 测试7: 完整报告 (0.7) ---');
const report = cii.generateReport(0.7);
console.log(`Intensity: ${report.intensity}`);
console.log(`Level: ${report.level} (${report.levelName})`);
console.log(`Active: ${report.activeModules.length}/14`);
console.log(`Inactive: ${report.inactiveModules.length}/14`);
console.log(`Summary: ${report.summary}`);

console.log('\n=== 测试完成 ===');
