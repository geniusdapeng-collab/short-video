# v6.2-patch50 生产发布确认

**发布版本**: v6.2-patch50  
**发布日期**: 2026-05-27  
**发布类型**: 系统级修复（Pipeline稳定性 + 运镜完整性）

---

## 📋 发布概述

本次发布修复了【饕餮】EP01 预生产端到端测试中发现的 **3项关键问题**，全部涉及 Pipeline 核心链路的稳定性和正确性。修复后端到端验证 **16/16 全部通过**。

---

## 🔧 修复项清单

### 修复 #1: ShotDurationAllocatorV2 防御性校验（Stage 6）
**问题**: ShotDurationAllocatorV2 在特定输入下报错，导致 Stage 6 中断
**根因**: 输入数据边界情况未处理（空 scenes、异常 narration 格式）
**修复**: 在 `nirath-master-pipeline.js` Stage 6 增加三层防御性校验：
1. 调用前校验 `safeScenes` 非空
2. 逐条处理 narration（异常项降级为占位符）
3. 返回后校验 `shots` 数组存在且长度匹配

**验证结果**: `优化级别: L0 | 总时长预算: 69s | 返回5镜` ✅

---

### 修复 #2: S05 utilization 显示异常
**问题**: S05 Prompt 长度 975/980（利用率 99.5%）被误判为"⚠️空间浪费"
**根因**: 判断条件 `prompt.length >= 950` 过于宽松，970-980 区间被错误归类
**修复**: 调整判断条件为 `prompt.length >= 970 && prompt.length <= 980` 标记为"🔥理想"

**验证结果**: `🔥 S05 利用率理想: 980/980` ✅

---

### 修复 #3: STAGE-9 运镜系统输出有效性（核心修复）
**问题**: PipelineIntegrityValidator 报错 `S01: 运镜description未出现在最终Prompt中`
**根因**: `smartTrim` 核心区块保留逻辑存在"全保留或全跳过"缺陷
- 当核心区块总长度超过 980 时，后面的核心区块会被完全跳过
- S01 `type:钩子` 的 `buildGenericDescription` 生成较长描述，核心区块总长度刚好超过 980
- `【镜头时间轴】` 区块因此整个被跳过

**修复方案**（4层修复）：

#### 修复 3a: `buildPromptV3` Step 4 — movementDesc 标记化
**文件**: `shanhaijing-render-engine/orient-primordial-core-v24.js`
```javascript
const movementDesc = movement?.description 
  ? `【镜头时间轴】${movement.description.substring(0, 80)}` 
  : '';
```
- 用 `【镜头时间轴】` 中文标记包裹，确保 `smartTrim` 识别为核心区块

#### 修复 3b: `buildPromptV3` Step 6 — movementDesc 拼入【叙事】区块开头
**文件**: `shanhaijing-render-engine/orient-primordial-core-v24.js`
```javascript
let prompt = calibratedCore;
if (movementDesc && prompt.includes('【叙事】')) {
  prompt = prompt.replace('【叙事】', `【叙事】${movementDesc}`);
}
```
- 将 `movementDesc` 拼入 `【叙事】` 区块开头，确保 `smartTrim` 在保留 `【叙事】` 时同时保留运镜

#### 修复 3c: `smartTrim` 配置统一
**文件**: `systems/nirath-master-pipeline.js`
- 4处 `smartTrim` 调用统一配置：`preserve` 加入 `'镜头时间轴'`，`trim` 移除 `'镜头时间轴'`

#### 修复 3d: `smartTruncate` 回退阈值提高
**文件**: `shanhaijing-render-engine/orient-primordial-core-v24.js`
```javascript
if (cutAt > truncated.length * 0.95) {  // 从 0.85 提高到 0.95
  truncated = truncated.substring(0, cutAt + 1);
}
```
- 阈值从 0.85 提高到 0.95，减少 `smartTruncate` 回退到空格/句号时的过度截断

**验证结果**:
- 端到端链路: 16/16 全部通过 ✅
- PipelineIntegrityValidator: STAGE-9 全绿 ✅
- S01-S05 所有镜头运镜描述均出现在最终 Prompt 中 ✅

---

## 📁 变更文件

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `systems/nirath-master-pipeline.js` | 修改 | Stage 6 防御性校验 + smartTrim 配置统一 + DEBUG 日志清理 |
| `shanhaijing-render-engine/orient-primordial-core-v24.js` | 修改 | buildPromptV3 movementDesc 标记化 + 拼入【叙事】 + smartTruncate 阈值调整 + DEBUG 日志清理 |

---

## ✅ 验证结果

```
[STAGE-16.5] INFO: 链路输出完整性反向验证（PipelineIntegrityValidator）
🔍 Pipeline完整性反向验证启动...
📊 Pipeline完整性验证报告
  ✅ STAGE-9: 运镜系统输出有效性（核心）
[STAGE-16.5] INFO: ✅ 链路完整性验证通过 | 全部16项检查通过
```

---

## 🎯 发布状态

**发布状态**: ✅ 已发布  
**生产可用**: 是  
**回滚策略**: 如需回滚，恢复 `orient-primordial-core-v24.js` 和 `nirath-master-pipeline.js` 到 patch49 版本

---

## 📝 经验教训

1. **smartTrim 的"全保留或全跳过"陷阱**: 核心区块超过 maxLength 时，后面的核心区块会被完全跳过。修复方式：将关键内容拼入更早的核心区块（如 `【叙事】`），或拆分为更小区块。
2. **smartTruncate 阈值敏感**: 0.85 阈值在特定长度下会过度截断，0.95 更保守但更安全。
3. **DEBUG 日志及时清理**: 排查时添加的 DEBUG 日志在修复后必须清理，避免污染生产日志。

---

**发布人**: 小G  
**发布时间**: 2026-05-27 17:35 GMT+8
