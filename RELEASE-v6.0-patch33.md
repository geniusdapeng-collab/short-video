# RELEASE v6.0-patch33 — 预生产链路假阳性清零 + StoryCraft v1.1 稳定化

**发布日期**: 2026-05-26
**前一版本**: v6.0-patch32
**状态**: 生产就绪

---

## 本次发布核心内容

### 1. StoryCraft Engine v1.1 稳定化
- **直观动作替代概念叙事**: `visual-action-translator.js` 模块集成到 `beat-sheet-engine.js`
- 5 节拍自动生成后自动翻译为视觉动作描述（观众3秒看懂发生了什么，不需要"听说"）
- 默认启用，向后兼容可通过 `options.visualAction.strictMode: false` 关闭

### 2. 预生产链路假阳性全部清零（5项修复）

| # | 问题 | 根因 | 修复文件 |
|---|---|---|---|
| 1 | **mouthAction 5/5 镜误报缺失** | `storyboard-validator.js` 检查 `mouth_action`（下划线），但 StoryCraft 用 `mouthAction`（驼峰） | `systems/storyboard-validator.js` |
| 2 | **Stage-6 疲劳度 `undefined`** | `groupToShots` 存 `type` 字段，但疲劳检查读 `role`；StoryCraft beatName 无 typeMapping | `systems/shot-duration-allocator.js` |
| 3 | **Stage-10.5 ERROR 定妆照** | 日志硬编码 `error` 级别，且 `stages.isPreProduction` 不存在 | `systems/nirath-master-pipeline.js` |
| 4 | **Stage-11.5 S00 narration误报** | 片头标题文案被当故事内容检查 | `systems/nirath-master-pipeline.js` |
| 5 | **字数不足 5项假阳性** | Stage-8 时 Prompt 尚未生成，检查 visualPrompt 必然不足 | `systems/storyboard-validator.js` |

### 3. 附加修复（patch32 延续）
- **S05 StoryCraft 覆盖 V2 时长**: `nirath-master-pipeline.js` Stage-5.2 转换逻辑优先使用 V2 分配器时长
- **validator 硬编码 maxDuration**: `storyboard-validator.js` 从 12 秒改为 15 秒（API 真实上限）
- **五要素字段名修复**: `fiveElements` → `fiveElement`（单复数对齐）
- **空 script fallback**: `orient-primordial-core-v24.js` 空输入时回退到默认视觉描述
- **小G 定妆照路径**: `run-taotie-pre-production.js` v2 → v3 标准化

---

## 验证结果

```
链路完整性: 16/16 全部通过 ✅
系统错误: 0个
故事板审核: 0错误 0警告
五要素评分: 69/100
总镜头: 6 | 总时长: 78秒
6/6 镜 Prompt 利用率理想（980/980）
```

**测试覆盖**:
- 预生产链路端到端验证: 2 轮全部通过
- StoryCraft v1.1 视觉翻译: 5 条抽象 narration 全部翻译为视觉动作
- `shot-duration-allocator.js` beatName 映射: 钩子/深入/裂缝/翻转/余韵 → discovery/explanation/interaction/highlight/closing

---

## 文件变更清单

### 新增文件
- `systems/story-craft-engine/visual-action-translator.js` — 视觉动作翻译器
- `systems/story-craft-engine/RELEASE-v1.1.md` — StoryCraft 升级记录

### 修改文件
- `systems/story-craft-engine/beat-sheet-engine.js` — v1.1 集成 VisualActionTranslator
- `systems/storyboard-validator.js` — mouthAction 双字段支持 + 片头跳过 + 无prompt跳过字数检查
- `systems/shot-duration-allocator.js` — StoryCraft beatName 映射 + 疲劳检查字段回退
- `systems/nirath-master-pipeline.js` — Stage-10.5 日志降级 + Stage-11.5 片头豁免 + Stage-5.2 V2时长优先 + Stage-8 对齐检查 beatName 识别
- `systems/orient-primordial-core-v24.js` — 空 script fallback
- `scripts/run-taotie-pre-production.js` — 小G定妆照路径 v2→v3
- `SYSTEM.md` — 版本号更新

---

## 已知限制（非阻断）

1. **剧本 Agent 未配置**: 使用结构化 fallback 生成剧本，不影响链路运行
2. **定妆照绑定**: Stage-10.5 记录为 WARN（预生产模式不阻断），生产环境需确保定妆照到位
3. **镜头内增强裁剪**: 6/6 镜增强后超限被智能裁剪至 980 字符，属正常设计

---

## 下一步建议

- 配置剧本生成 Agent 以替代结构化 fallback
- 为饕餮角色生成定妆照并绑定到 characters/tao-tie/portraits/
- 生产环境运行时关闭预生产模式，启用定妆照强制闸机
