# v6.0-patch37 生产发布文档

**发布日期**: 2026-05-26  
**版本**: v6.0-patch37  
**类型**: 补丁修复（Patch Release）  
**前置版本**: v6.0-patch36

---

## 修复内容

### Bug 1: S00片头4角度定妆照未注入预生产输出（P0级）

**问题描述**:  
预生产模式下，片头S00的4角度定妆照（front/threeQuarter/closeup/side）未能正确注入最终输出JSON，导致生产提交时片头镜头缺少角色参考图。

**影响范围**:  
- 所有Nirath模式下的山海经系列片头生成
- 定妆照绑定链路断裂，片头角色形象由AI自由发挥

**根因分析**:  
1. `nirath-master-pipeline.js` 的 `extractOpeningConfig()` 未从 `input.characters` 提取完整4角度 `portraits` 数据
2. `opening-system-v3.js` 的 `generateThreeActOpening()` 未返回4角度对象格式，仅返回单角度 `portraitPaths` 数组
3. `nirath-master-pipeline.js` 的 `checkCharacterPortraits()` 文件名匹配规则过于严格，无法兼容 `tao-tie` vs `taotie` 命名差异
4. `scripts/run-taotie-pre-production.js` 输出JSON未在根节点保留 `portraits` 字段

**修复文件**:  
- `systems/nirath-master-pipeline.js` — 3处修复
- `systems/opening-system-v3.js` — 1处修复  
- `scripts/run-taotie-pre-production.js` — 1处修复

**验证结果**:  ✅ 已验证，S00 4角度定妆照全部注入成功

---

### Bug 2: 神兽人声签名未注入片头Prompt（P0级）

**问题描述**:  
神兽人声签名引擎 v1.1 虽然在 `title-production-system-v2.js` 中定义，但 `opening-system-v3.js`（片头三幕叙事引擎）从未调用 `BeastVoiceSignatureEngine`，导致片头Prompt中完全没有神兽人声签名内容。

**影响范围**:  
- 所有使用 `opening-system-v3.js` 的片头生成
- 缺失"声音先于画面"的开场钩子体验

**根因分析**:  
1. `opening-system-v3.js` 未引入 `BeastVoiceSignatureEngine`
2. `combineActs()` 函数未注入神兽人声签名Prompt片段
3. 双模式台词（剧情定制钩子/固定后缀）未被调用

**修复文件**:  
- `systems/opening-system-v3.js` — 4处修改

**修改详情**:  
1. 引入神兽人声签名引擎：`require('./beast-voice-signature-engine')`
2. Prompt组合器注入：在 `combineActs()` 开头生成神兽人声签名
3. 开场钩子优先：神兽人声签名放在Prompt最前面
4. 字数感知裁剪：Prompt超限时保留神兽人声签名（最高优先级）

**验证结果**:  ✅ 已验证，S00 Prompt包含完整神兽人声签名

---

## 文件变更清单

| 文件 | 变更类型 | 变更描述 |
|------|----------|----------|
| `systems/nirath-master-pipeline.js` | 修改 | 3处修复：extractOpeningConfig提取portraits、checkCharacterPortraits文件名兼容、stageOpeningGeneration组装 |
| `systems/opening-system-v3.js` | 修改 | 4处修改：引入BeastVoiceSignatureEngine、combineActs注入签名、裁剪阶段保留签名、新增extractHookFromSummary |
| `scripts/run-taotie-pre-production.js` | 修改 | 1处修复：输出JSON根节点新增portraits字段 |

---

## 验证记录

### 预生产验证
- **项目**: 山海经：饕餮·永恒饥饿 EP01
- **总镜头**: 6镜
- **链路完整性**: 16/16 ✅
- **S00片头**: 
  - 神兽人声签名: ✅ 已注入
  - 4角度定妆照: ✅ 全部绑定
  - Prompt字数: 980/980 (100%利用率)

### 定妆照绑定验证
| 角色 | front | threeQuarter | closeup | side |
|------|-------|-------------|---------|------|
| 小G | ✅ | ✅ | ✅ | ✅ |
| 饕餮 | ✅ | ✅ | ✅ | ✅ |

---

## 系统级影响

✅ **所有山海经系列受益**: 上述修复为系统级修复，所有使用 `opening-system-v3.js` 的片头都会自动获得：
1. 4角度定妆照正确绑定
2. 神兽人声签名自动注入

---

## 发布人
小G (OpenClaw AI Assistant)

---

*Stay Hungry, Stay Foolish, Stay Brutally Honest.*
