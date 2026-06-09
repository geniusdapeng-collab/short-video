# Nirath Master Pipeline v6.2-patch47 生产发布

**发布日期**: 2026-05-27  
**发布类型**: 紧急修复补丁（Prompt长度结构性问题）  
**风险等级**: 中 → 低  
**兼容性**: 向后兼容

---

## 📋 修复内容

### 问题描述
完整预生产链路中，所有镜头Prompt长度被强制压缩至仅 **526字符**，远低于800字符最低要求和980上限，导致980字符空间严重浪费。

**根因**: MicroMotion MergeAgent 中 `maxPromptLength: 500` 强制截断 + smartTrim `trim` 列表误裁 `环境布景` + buildPromptV3 核心script输入极短（~200字符）

### 修复项（4项）

| # | 修复项 | 文件 | 修改 |
|---|---|---|---|
| 1 | **smartTrim冲突修复** | `nirath-master-pipeline.js` | `trim`列表移除`环境布景`，保留核心块 |
| 2 | **MicroMotion截断限制提升** | `shanhaijing-micromotion/data/motion-library.json` | `maxPromptLength`: 500→980 |
| 3 | **MicroMotion硬编码修复** | `shanhaijing-micromotion/agents/merge.js` | 硬编码`maxPromptLength`: 490→980 |
| 4 | **script参数丰富化** | `nirath-master-pipeline.js` | buildPromptV3输入从单一`visualPrompt`扩展为合并`scene.description`+`atmosphere`+`extendedNarrative`+`innerMonologue`+`narration` |
| 5 | **短内容扩展阈值提升** | `orient-primordial-core-v24.js` | 自动扩展触发条件：`<200`→`<350` |

---

## ✅ 验证数据

### 修复前后对比

| 镜头 | 修复前 | 修复后 | 提升 |
|---|---|---|---|
| S01 | 526 | 974 | +448 |
| S02 | 526 | 972 | +446 |
| S03 | 526 | 870 | +344 |
| S04 | 526 | 917 | +391 |
| S05 | 526 | 980 | +454 |
| **平均** | **526** | **943** | **+417** |

### 链路完整性

| 指标 | 修复前 | 修复后 |
|---|---|---|
| 总错误数 | 13 | 4 |
| 端到端场景流转 | ❌ 4断裂 | ✅ 全部通过 |
| Prompt生成质量 | ❌ 5严重不足 | ✅ 全部通过 |

### 核心模块状态

- ✅ 布景增强模块：正常注入，不再被误裁
- ✅ 微动作系统：保留至~980字符，不再强制截断
- ✅ 技术规格块：正确保留
- ✅ 场景描述流转：成功进入Prompt

---

## 📦 受影响文件

1. `systems/nirath-master-pipeline.js` — smartTrim修复 + script参数丰富化
2. `shanhaijing-render-engine/orient-primordial-core-v24.js` — 短内容扩展阈值提升
3. `shanhaijing-micromotion/data/motion-library.json` — maxPromptLength: 500→980
4. `shanhaijing-micromotion/agents/merge.js` — 硬编码maxPromptLength: 490→980

---

## ⚠️ 已知问题（非阻塞）

1. STAGE-9运镜系统输出未被消费（独立问题，需单独修复）
2. S03/S04 Prompt长度870/917，略低于950理想线（已超800最低线）
3. 镜头质感评分偏低（长期优化项）

---

## 🎯 质量标准

- ✅ Prompt长度 ≥ 800字符：5/5 全部达标
- ✅ Prompt长度 ≥ 950字符：3/5（S01=974, S02=972, S05=980）
- ✅ 端到端链路完整性：通过
- ✅ 场景描述流转：通过
- ✅ 布景/微动作/技术规格保留：通过

---

## 📌 回滚策略

若发现问题，可回滚至 `v6.2-patch46`：
```bash
git revert --no-commit HEAD~1..HEAD
git checkout -- shanhaijing-micromotion/data/motion-library.json
```

---

**发布人**: 小叶紫檀小G  
**审批人**: 李大鹏（队长）  
**状态**: ✅ 已发布
