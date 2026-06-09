# RELEASE-v6.0-patch30 — 生产版本发布

**版本**: v6.0-patch30  
**日期**: 2026-05-26  
**前一版本**: v6.0-patch29  
**发布人**: 小G  

---

## 🔥 核心修复清单

### 1. 敏感词根治修复（P0）
**根因**: 异兽档案 `tao-tie.json` 的 `coreDescription` 中含"不寒而栗""骇人""贪婪与暴虐"等词汇，被片头系统/StoryCraft引擎/Prompt构建器层层引用，注入最终渲染Prompt，触发 `OutputVideoSensitiveContentDetected` 渲染失败。

**修复**:
- `systems/beast-database/beasts/tao-tie.json` — 7处敏感词替换为温和描述
- `systems/story-craft-engine/concept-forge.js` — "诡异恐怖" → "神秘莫测"

**教训**: 数据污染源比代码Bug更隐蔽，修复必须追溯到数据源头。

### 2. 6项闸机系统级修复（v6.0-patch29遗留）
| # | 闸机 | 状态 | 文件 |
|---|------|------|------|
| 1 | 定妆照强制绑定 | ✅ | `pre-render-validation.js` |
| 2 | 片头标题强制烧录 | ✅ | `post-production-pipeline.js` |
| 3 | 叙事完整性验证 | ✅ | `storyboard-validator.js` |
| 4 | 跨镜头连续性引擎v2 | ✅ | `continuity-engine.js` |
| 5 | Nirath视觉锚点注入 | ✅ | `nirath-visual-anchor-injector.js` |
| 6 | POV视角锁定器 | ✅ | `beat-sheet-engine.js` |

### 3. StoryCraft Engine v1.0 集成修复
- `const scShots` → `let scShots`（const重复赋值错误）
- titleConfig 构造函数参数修复
- narration 融入 Prompt（Pipeline Stage-11 合并 visualPrompt + narration）
- `[object Object]` Bug 修复（habitat对象→字符串）

### 4. 链路完整性验证
- 16/16 全部通过
- 6镜全部 980/980 字符理想利用率
- 反转验证 90/100 ✅
- 五要素评分 69/100 ✅

---

## 📦 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `SYSTEM.md` | 修改 | 版本号 v6.0-patch29 → patch30 |
| `systems/beast-database/beasts/tao-tie.json` | 修改 | 敏感词清除（7处替换） |
| `systems/story-craft-engine/concept-forge.js` | 修改 | "诡异恐怖" → "神秘莫测" |
| `systems/nirath-master-pipeline.js` | 修改 | StoryCraft集成 + narration合并 + 6闸机集成 |
| `systems/pre-render-validation.js` | 修改 | 定妆照强制绑定 |
| `systems/post-production-pipeline.js` | 修改 | 片头标题强制烧录 |
| `systems/storyboard-validator.js` | 修改 | 叙事完整性验证 |
| `systems/continuity-engine.js` | 修改 | v2.0 跨镜头连续性 |
| `systems/nirath-visual-anchor-injector.js` | 新增 | Nirath视觉锚点注入 |
| `systems/story-craft-engine/beat-sheet-engine.js` | 修改 | POV视角锁定器 + `[object Object]`修复 |

---

## 🎯 验证结果

- **Mock测试**: 通过
- **端到端链路**: 16/16 全部通过
- **敏感词扫描**: 6镜全部通过，无残留
- **预生产交付**: [【饕餮】EP01 预生产报告 v3.0](https://feishu.cn/docx/MBsAdiyx8oEsGCxnkVZcFq9snQE)

---

## 📋 待办事项

- [ ] 后续升级：敏感词预渲染闸机（P0）
- [ ] 后续升级：异兽档案敏感词扫描器（P1）
- [ ] 后续升级：Prompt负向词汇自动转换器（P1）
- [ ] 后续升级：档案引用链路追踪（P2）

---

**状态**: ✅ 生产就绪  
**下一步**: 等待队长确认 "OK" → 提交 Seedance 渲染
