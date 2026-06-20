# 2026-05-28 饕餮预生产运行记录

## 执行概况
- **时间**: 2026-05-28 10:30-10:42 GMT+8
- **项目**: 山海经：饕餮·永恒饥饿 EP01
- **模式**: 预生产（不提交渲染）
- **链路版本**: v6.2-patch60 + PRD v21
- **执行原则**: 全新执行，清理旧输出

## 链路执行结果
- 17个Stage全部调用 ✅
- 链路完整性验证：16/16通过 ✅
- 总时长：71秒
- 总镜头：5个内容镜
- **风险评级：高风险** ⚠️

## 发现的问题（6项）

### 🔴 FATAL级别
1. **Prompt截断（S04/S05）**
   - S04末尾：`【震颤(12-40s) | 感知锚点...【`（不完整）
   - S05末尾：`...strange glowing plants covering terr【异兽动作】tao-ti`（不完整）
   - 根因：smartTrim硬截断，未在标点处截断

### 🟠 CRITICAL级别
2. **旁白文本污染视觉Prompt**
   - 【独白】段落出现在所有镜头的Prompt中
   - 示例："又一天。土壤的毒素含量上升了3%。还要再吃多少？"
   - 根因：通道分离系统（P0-2）在渲染核心未生效

3. **技术规格词汇未清理**
   - 所有镜头仍包含：`Unreal Engine 5`, `Lumen global illumination`, `Nanite geometry`
   - 根因：`tech-specs-emotion-mapper.js`的清理逻辑未在`orient-primordial-core-v24.js`中生效
   - 注：v6.2-patch60已在`buildBasePrompt`中集成，但渲染核心v24.3独立注入这些词汇

### 🟡 WARNING级别
4. **质量评分偏低**
   - S01: 49分 | S02: 52分 | S03: 49分 | S04: 54分 | S05: 54分
   - 全部低于75分放行标准
   - 与旁白污染和技术规格占用字符预算有关

5. **S00片头缺失**
   - Stage 7.5报错：`Cannot read properties of undefined (reading 'generate')`
   - 根因：`opening-system-v3.js`的generate方法未定义

6. **定妆照未绑定**
   - 5/5镜头未绑定定妆照（Stage 10.5警告）
   - 定妆照文件存在（characters/tao-tie/portraits/ 4角度齐全）
   - 但reference-image-gate未正确绑定到渲染任务

## 根因分析

**核心问题：v6.2-patch60的升级在"渲染核心层"未完全生效**

| 升级模块 | 集成位置 | 实际生效 | 问题 |
|---------|---------|---------|------|
| prompt-channel-separator.js | buildBasePrompt | ⚠️部分 | 渲染核心v24.3独立生成Prompt，绕过了分离逻辑 |
| tech-specs-emotion-mapper.js | buildBasePrompt | ❌未生效 | 渲染核心直接注入UE5/Lumen/Nanite |
| prompt-quality-gate.js | buildBasePrompt | ⚠️部分 | 评分逻辑工作但无法阻止污染 |
| prompt-tier-architecture.js | buildBasePrompt | ⚠️部分 | Tier-1保留但旁白（Tier-3）未被正确识别 |

**结论**：v6.2-patch60的升级主要集中在`buildBasePrompt`阶段，但`orient-primordial-core-v24.js`（渲染核心）在后续阶段独立添加了大量内容，绕过了清理和分离逻辑。

## 修复方向

1. **渲染核心改造**：在`orient-primordial-core-v24.js`中集成通道分离 + 技术规格清理
2. **smartTrim修复**：确保在标点处截断（v6.2-patch56已修复，但未在渲染核心生效）
3. **opening-system-v3.js**：补充generate方法定义
4. **reference-image-gate**：修复定妆照绑定逻辑

## 交付物
- 预生产审阅报告：`output/饕餮预生产审阅报告-EP01-v21.md`
- Prompts JSON：`output/taotie-ep01-prompts-full.json`
- 原始Prompts MD：`output/taotie-ep01-prompts.md`

## 经验沉淀
- **系统升级必须端到端验证**：buildBasePrompt的升级不等于渲染核心的升级
- **渲染核心是最后一道关卡**：所有清理/分离逻辑必须在渲染核心生效
- **预生产的价值**：在提交渲染前发现问题，避免浪费渲染成本
