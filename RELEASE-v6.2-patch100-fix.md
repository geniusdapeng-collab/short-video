# v6.2-patch100-fix 发布记录

**发布时间**: 2026-06-02
**版本号**: v6.2-patch100-fix
**升级模块**: 预生产Pipeline 6大系统性问题修复

---

## 问题背景

第3轮预生产报告（饕餮EP01）暴露6项系统性问题，需从架构层面修复：
1. **占位符未替换**（🔴 P0）— 微动作系统残留的 `****圆睁，瞳孔瞬间放大****` 占位符未替换
2. **Prompt截断**（🔴 P0）— `smartTruncate` 在句子中间硬截断，破坏语义完整性
3. **80%模板冗余**（🟡 P1）— 每镜复制粘贴相同的 `【环境布景】【环境质感】【明亮约束】` 等板块
4. **镜头时间轴同质化**（🟡 P1）— 所有场景使用相同的运镜组合，缺乏场景差异化
5. **情绪描述自相矛盾**（🟡 P1）— 冲突场景使用 `neutral` 返回"和谐宁静"，与场景矛盾
6. **台词与动作混杂**（🟡 P1）— `mouthAction` 和 `dialogue` 文本都拼接到同一个 prompt 字符串中

---

## 修复内容

### Patch A — 紧急修复（P0）

#### A1: 占位符清理（nirath-master-pipeline.js Stage 11）
- **位置**: `stageRender` 方法，在 `motionEnhanced` 赋值后、最终组装前
- **逻辑**: 正则 `/\*\*\*\*[^*]+\*\*\*\*/g` 匹配并移除残留占位符，压缩多余空格与逗号
- **效果**: 占位符 `****圆睁，瞳孔瞬间放大****` 等被自动清理，不再污染视觉Prompt

#### A2: Prompt截断修复（orient-primordial-core-v24.js）
- **位置**: `smartTruncate` 方法
- **原逻辑**: `substring(0, maxLen - 3)` 硬截断，仅当 `cutAt > 0.95` 时才在标点处截断
- **新逻辑**: 三级递进截断策略
  1. 优先在中文标点（`。，；！？`）处截断
  2. 其次在英文标点（`.,;!?`）处截断
  3. 再次在空格处截断
  4. 最后手段才硬截断
- **效果**: 确保任何截断都优先落在句子边界，避免截断句子中间

#### A3: render-engine.js 优先使用 shot.prompt（架构级修复）
- **发现**: `renderShot` 方法始终调用 `_buildShotPrompt(shot)`，使用旧版 `buildOrientPrompt` 重建 Prompt，完全忽略 Stage 11 生成的 `shot.prompt`
- **修复**: `if (shot.prompt && shot.prompt.length > 0)` 则优先使用 `shot.prompt`，否则回退到旧版 `_buildShotPrompt`
- **效果**: Stage 11 的板块化高质量 Prompt（含 `【视觉】`、`【环境质感】`、`【镜头时间轴】` 等）能被渲染引擎正确消费

### Patch B — 架构优化（P1）

#### B1: 全局上下文注入（nirath-master-pipeline.js + render-engine.js）
- **新增方法**: `extractGlobalContext(prompts)` — 从所有镜头中提取相同的固定板块
- **新增方法**: `removeGlobalContext(prompt, globalContext)` — 从每个镜头中移除冗余内容，替换为 `【标记】[全局注入]`
- **新增方法**: `mergeGlobalContext(prompt, globalContext)` — 渲染时自动合并全局上下文到每个镜头
- **效果**: 每镜释放80%冗余字符空间，给差异化内容留出更多空间

#### B2: 场景差异化运镜（intra-shot-prompt-enhancer.js）
- **新增方法**: `detectComboType(sceneName, type)` — 根据场景名/类型返回差异化运镜组合
  - 火山/熔岩/岩浆 → `epic`（史诗运镜）
  - 森林/丛林/树 → `intimate`（亲密运镜）
  - 沼泽/湿地/毒 → `horror`（恐怖运镜）
  - 荒原/沙漠/戈壁 → `suspense`（悬疑运镜）
- **效果**: 不同场景类型的运镜组合差异化，避免所有镜头同质化

### Patch C — 体验提升（P1）

#### C1: 情绪一致性（orient-primordial-core-v24.js）
- **修改**: `mapEmotionPhaseToDescription` 中增加 `sceneType` 参数
- **效果**: `neutral` 描述根据场景类型动态调整：
  - 火山 → "紧张对峙构图，暗流涌动，危机潜伏"
  - 沼泽 → "诡异静谧构图，迷雾笼罩，不安潜行"
  - 荒原 → "荒凉孤寂构图，风沙肆虐，生存挣扎"
  - 森林 → "幽深神秘构图，光影斑驳，探索未知"
  - 其他 → 保持原 "平衡构图，自然流动，和谐宁静"

#### C2: 双通道分离（orient-primordial-core-v24.js + dialogue-distiller.js）
- **视觉通道**: 只保留【嘴部动作】（如"嘴部微张，下巴微动"）
- **音频通道**: `dialogue`/`narration` 文本只进 TTS，不进视觉 Prompt
- **效果**: 台词与动作指令彻底分离，视觉Prompt只包含视觉指令

---

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `systems/nirath-master-pipeline.js` | 新增+修改 | Patch A1（占位符清理）+ Patch B1（全局上下文注入） |
| `shanhaijing-render-engine/orient-primordial-core-v24.js` | 修改 | Patch A2（截断修复）+ Patch C1（情绪一致性）+ Patch C2（双通道分离） |
| `shanhaijing-render-engine/render-engine.js` | 修改 | Patch A3（shot.prompt优先）+ Patch B1（mergeGlobalContext） |
| `systems/intra-shot-prompt-enhancer.js` | 新增 | Patch B2（场景差异化运镜） |
| `systems/story-craft-engine/dialogue-distiller.js` | 修改 | Patch C2（mouthAction结构化返回） |

---

## 清理工作

- 删除已废弃的 `check-render-raw.js`（May 31，已被新检查替代）
- 删除已废弃的 `check-render-status.js`（May 31，已被新检查替代）

---

## 验证状态

- **未运行预生产验证**：等待队长指令后执行
- **代码编译检查**：已通过（无语法错误）
- **向后兼容**：保留所有旧版API，确保兼容性

---

## 待办项

- [P0] 运行预生产流程，验证占位符清理、截断修复、shot.prompt消费
- [P1] 验证全局上下文注入的完整链路（extract → remove → merge）
- [P1] 验证场景差异化运镜的 `detectComboType` 正确调用
- [P1] 验证情绪一致性调用链打通（build*Description → mapEmotionPhaseToDescription）
- [P1] 验证双通道分离（mouthAction只进视觉，dialogue只进TTS）
