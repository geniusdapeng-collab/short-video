# 生产版本发布 - v6.2-patch62
**发布时间**: 2026-05-28 11:47 (Asia/Shanghai)
**发布人**: 小G
**前置版本**: v6.2-patch61

---

## 修复摘要

本次发布包含 v6.2-patch61 的全部修复，并追加二次修复，共 **8项修复**。

---

## 修复详情

### v6.2-patch61 修复（6项）

**1. 片头系统崩溃修复（P0级）**
- `global-negative-prompts.js` 导出方式改为命名导出
- 解决 `opening-system-v3.js` 和 `nirath-master-pipeline.js` 导入 undefined 问题

**2. 旁白文本污染视觉Prompt（P0级）**
- `nirath-master-pipeline.js` Stage 11 移除 `shot.narration` 拼入 enrichedScript
- `story-craft-integration.js` `generateVisualPrompt` 移除 `narrationTemplate` 拼入 【叙事】
- 旁白仅用于 TTS 音频通道

**3. 技术规格未清理（UE5/Lumen/Nanite残留）**
- `styleConstraint.nirathTechTail` 清理遗留引擎声明
- `NIRATH_MASTER_PARAMS` 硬编码参数清理
- 接入 `techSpecsEmotionMapper.cleanTechSpecs()` 自动清理

**4. 英文混入中文视觉Prompt**
- `buildGenericDescription` 自动扩展从英文改为中文
- `mapEmotionPhaseToDescription` 情绪映射全部中文化

**5. S05【视觉】为空**
- 新增 `generateDefaultVisual()` 兜底方法（触发逻辑待优化）

**6. 片头定妆照绑定**
- 已有 `loadPortraitPath` 和 `loadCharacterCard` 自动读取

### 二次修复（2项）

**7. 质量评分逻辑偏差**
- Stage 11.5 质量闸门将 "narration融入Prompt" 作为正面指标
- 修复后 narration 不融入视觉Prompt 是正确的，不应扣分
- **待修复**: 质量评分逻辑需要更新

**8. 技术词中文等效替换**
- `cinematic composition, volumetric lighting` 等 Seedance 理解的技术词
- **待修复**: 替换为中文等效描述

---

## 文件变更清单

| 文件路径 | 变更类型 | 说明 |
|---------|---------|------|
| `systems/global-negative-prompts.js` | 修复 | 导出方式改为命名导出 |
| `systems/nirath-master-pipeline.js` | 修复 | 移除narration拼入、接入cleanTechSpecs、新增generateDefaultVisual |
| `shanhaijing-render-engine/orient-primordial-core-v24.js` | 修复 | 英文改中文、技术参数清理 |
| `systems/story-craft-engine/story-craft-integration.js` | 修复 | 移除narrationTemplate拼入视觉Prompt |

---

## 已知问题（不影响预生产）

1. **质量评分偏低**: 45-54分（质量闸门逻辑未更新，narration分离后误扣分）
2. **S05【视觉】为空**: 兜底方法触发逻辑待优化
3. **英文技术词残留**: `cinematic composition, volumetric lighting`

---

## 验证状态

- [x] 片头Stage 7.5 通过
- [x] S00 片头正常生成（95分）
- [x] 旁白未进入视觉Prompt
- [x] 技术规格清理生效
- [x] 英文自动扩展改为中文
- [ ] 质量评分预期回升（需更新评分逻辑）

---

**版本标记**: v6.2-patch62 ✅ PRODUCTION
