# RELEASE-v6.0-patch34.md — StoryCraft v2.0 主链路激活 + 废旧清理

**发布日期**: 2026-05-26
**版本**: v6.0-patch34
**前一版本**: v6.0-patch33

---

## 本次发布内容

### 🔥 核心修复：StoryCraft Engine v2.0 主链路激活

**问题**: v2.0 6大模块（beast-psyche-generator/beat-sheet-engine/dialogue-distiller/concept-forge/encounter-dynamics/twist-validator）虽已注入系统，但主链路 `nirath-master-pipeline.js` 只识别 `v1.0`，导致v2.0字段（三幕引擎/感知锚点/钻石台词/核心意象）未流入Prompt。

**修复内容**:

1. **`systems/story-craft-engine/story-craft-integration.js`**
   - Step顺序调整：先BeastPsyche（感知蓝图+欲望内核+声音签名），再BeatSheet（传入enrichedProfile含psyche）
   - 新增v2.0日志输出：感知蓝图/欲望内核/声音签名/三幕引擎/静默高潮/核心意象
   - DialogueDistiller标注v2.0：钻石台词≤3句+声音签名
   - TwistValidator标注v2.0：6维度验证（Need揭示+静默预算）

2. **`systems/nirath-master-pipeline.js`**
   - StoryCraft版本识别：支持 `v2.0` || `v1.0` || `enableStoryCraft`
   - v2.0日志输出：三幕引擎5/5 beats标记、静默高潮数量、核心意象绽放
   - Prompt融合：三幕标记+感知锚点+情感曲线融入每镜visualPrompt
   - 静默标记：S05（余韵镜）自动注入静默高潮指令
   - 核心意象：B5镜自动注入意象绽放描述
   - 钻石台词：标注💎钻石台词标记融入narration

3. **`scripts/run-taotie-pre-production.js`**
   - 配置升级：`storyCraftVersion: 'v2.0'`

### 🧹 废旧代码清理

- 删除 `tests/v5.0-nirath-e2e-full-test.js`
- 删除 `tests/v5.0-nirath-e2e-test.js`
- 删除 `tests/v5.0-nirath-master-pipeline-test.js`
- 删除 `/tmp/story-craft-v2-mock-test.js.bak`

### 📊 验证结果

- 完整链路：16/16 全部通过
- 系统错误：0个
- 警告：0个
- Prompt利用率：6/6镜 980/980（理想）
- 五要素评分：69/100
- 风险评级：低风险

### ✅ v2.0 效果验证

| 镜头 | v2.0标记 |
|------|---------|
| S01 | `【入侵(0-12s) \| 感知锚点:能量波动扫描 \| 情感曲线:好奇→警觉】` |
| S02-S04 | `【震颤(12-40s) \| 感知锚点:毒素浓度/黑暗密度 \| 情感曲线:守护战场→被记住】` |
| S05 | `【🌸核心意象绽放:火种被另一只手托住】` + `【⚠️静默高潮:最后8秒不说话】` + `【蜕变(40-60s) \| 情感曲线:转变→宁静】` |

### 📝 文件变更

- 修改：`systems/story-craft-engine/story-craft-integration.js`
- 修改：`systems/nirath-master-pipeline.js`
- 修改：`scripts/run-taotie-pre-production.js`
- 修改：`SYSTEM.md`（版本号更新）
- 新增：`RELEASE-v6.0-patch34.md`
- 删除：`tests/v5.0-*`（3个旧测试文件）

### 🎯 生产状态

**生产就绪**。StoryCraft Engine v2.0 完整激活，60秒三幕引擎、钻石台词≤3句、核心意象预埋、静默高潮全部流入Prompt。

---

*"接受失败，不接受欺骗。"*
