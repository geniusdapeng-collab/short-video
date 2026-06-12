# 超短裙系统 - 参考数据结构差距分析 + 补齐方案

> 参考：短片提示词数据结构 v6.37-Peng（工业化、严谨）
> 目标：结合 Nirath 宇宙设定，做得比参考更好
> 系统：ShortVideoSystem（超短裙）| 无片头 | 1-3镜 | 15秒

---

## 一、差距总览

### 1.1 我们缺少的字段（参考有，我们无）

| # | 字段 | 参考优先级 | 说明 | 超短裙适配 |
|---|------|-----------|------|-----------|
| 1 | `characterRef` | P0 | 定妆照绑定，image://路径，每角色最多9张 | ✅ 需要，但超短裙系统角色通常极简 |
| 2 | `character` | P0 | 极简锚点：种族+3-5核心视觉关键词 | ✅ 需要，替代现有复杂角色描述 |
| 3 | `timeline` | P1 | 时间线标记：起止时间+时长+类型+情绪 | ✅ 需要，15秒时间轴精确管理 |
| 4 | `backgroundSound` | P1 | 结构化音效：AMBIENT+SPATIAL+INTENSITY | ✅ 需要，Seedance渲染音效结构化 |
| 5 | `promptCharCount` | — | 字符数检查（≤6500/≤1500） | ✅ 已有 length/utilization，可规范化 |
| 6 | `audioLayer` | P1 | 片头专属（超短裙无片头，不适用） | ❌ 去掉 |
| 7 | `titleOverlay` | P0 | 片头专属（超短裙无片头，不适用） | ❌ 去掉 |

### 1.2 我们已有的字段需要优化

| # | 字段 | 现状 | 参考做法 | 优化方向 |
|---|------|------|---------|---------|
| 1 | `scene` | 简单字符串 | 五维空间描述法 | 采用五维空间法 |
| 2 | `camera` | 10字段CAMERA | 12级机位+14运镜+光学参数 | 扩展景别系统 |
| 3 | `lighting` | 2000K→2800K→4500K | 主光方向+色温K值+特效光 | 规范光照方案 |
| 4 | `dialogue` | 无格式 | SPEAKER\|TYPE\|EMOTION\|TEXT\|LIP_SYNC:YES | 统一台词格式 |
| 5 | `action` | 简单描述 | 核心动词+交互目标+身体运动 | 规范动作描述 |
| 6 | `mood` | 简单标签 | 3-5个情绪关键词 | 规范情绪描述 |
| 7 | `prompt` | 10字段结构 | 融合顺序 + 截断策略 | 优化融合逻辑 |

### 1.3 系统级规则缺失

| # | 规则 | 参考 | 我们现状 | 补齐方案 |
|---|------|------|---------|---------|
| 1 | 截断策略 | 每个字段有明确截断策略 | 只有smartTrim | 定义字段级截断策略 |
| 2 | 角色规则 | 极简锚点，禁止详细描述 | 无明确规则 | 写入系统规则 |
| 3 | 音效设计 | Murch层次+频率分离 | 无明确规范 | 定义音效规范 |
| 4 | 景别系统 | 12级机位系统 | 有shotSize但不系统 | 扩展景别系统 |
| 5 | 字段优先级 | P0/P1/P2/P3 | 无 | 标注优先级 |
| 6 | 台词规则 | 格式+禁止旁白 | 禁止旁白已执行 | 统一格式规范 |

---

## 二、全链路字段流转图

### 2.1 新增字段产出环节

```
characterRef ────────────────────────────────────────────┐
    │                                                    │
    ├─ Stage 2 (角色系统) → 定妆照生成 → 路径绑定      │
    │                                                    │
    ├─ Stage 4 (角色系统) → 角色档案 → 定妆照路径      │
    │                                                    │
    └─ Stage 11 (合成) → 注入Prompt → image://格式     │
                                                           │
character ─────────────────────────────────────────────────┤
    │                                                    │
    ├─ Stage 2 (角色系统) → 极简锚点生成                │
    │   (种族+3-5核心视觉关键词)                         │
    │                                                    │
    ├─ Stage 4 (角色系统) → 角色档案 → 极简描述        │
    │                                                    │
    └─ Stage 11 (合成) → 注入Prompt → CHARACTER字段    │
                                                           │
timeline ─────────────────────────────────────────────────┤
    │                                                    │
    ├─ Stage 6 (时长分配) → 时间轴计算                 │
    │   (起止时间+时长+类型+情绪)                        │
    │                                                    │
    ├─ Stage 7 (故事板) → 镜头时间轴                   │
    │                                                    │
    └─ Stage 11 (合成) → 注入Prompt → 时间轴标记       │
                                                           │
backgroundSound ──────────────────────────────────────────┤
    │                                                    │
    ├─ Stage 5 (剧本) → 音效描述提取                   │
    │                                                    │
    ├─ Stage 11 (合成) → 结构化音效生成                │
    │   (AMBIENT+SPATIAL+INTENSITY)                      │
    │                                                    │
    └─ Stage 12 (合规) → 音效格式检查                  │
```

### 2.2 现有字段优化流转

```
scene ───────────────────────────────────────────────────┐
    │                                                    │
    ├─ Stage 5 (剧本) → 场景描述                         │
    │                                                    │
    ├─ Stage 7 (故事板) → 五维空间描述                  │
    │   (宏观地理+中观地貌+微观材质+天气时间+空间深度)   │
    │                                                    │
    └─ Stage 11 (合成) → SCENE字段                      │
                                                           │
camera ──────────────────────────────────────────────────┤
    │                                                    │
    ├─ Stage 9 (运镜) → 运镜系统                        │
    │   (12级机位+14运镜+焦距+速度)                      │
    │                                                    │
    └─ Stage 11 (合成) → CAMERA字段                     │
                                                           │
lighting ────────────────────────────────────────────────┤
    │                                                    │
    ├─ Stage 9 (运镜) → 光照方案                        │
    │   (主光方向+色温K值+特效光)                         │
    │                                                    │
    └─ Stage 11 (合成) → LIGHTING字段                   │
                                                           │
dialogue ──────────────────────────────────────────────┤
    │                                                    │
    ├─ Stage 5 (剧本) → 台词生成                         │
    │                                                    │
    ├─ Stage 11 (合成) → 格式化                         │
    │   SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES            │
    │                                                    │
    └─ Stage 12 (合规) → 台词格式检查                   │
```

---

## 三、补齐执行清单

### 3.1 第一阶段：字段新增（数据结构层）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | 新增 `characterRef` | `schema/character-asset.json` | 定妆照绑定规范 |
| 2 | 新增 `character` | `schema/character-asset.json` | 极简锚点规范 |
| 3 | 新增 `timeline` | `schema/shot-prompt.json` | 时间轴标记 |
| 4 | 新增 `backgroundSound` | `schema/shot-prompt.json` | 结构化音效 |
| 5 | 更新 `scene` | `schema/shot-prompt.json` | 五维空间描述 |
| 6 | 扩展 `camera` | `schema/shot-prompt.json` | 12级机位系统 |
| 7 | 规范 `lighting` | `schema/shot-prompt.json` | 主光+色温+特效 |
| 8 | 规范 `dialogue` | `schema/shot-prompt.json` | 统一台词格式 |

### 3.2 第二阶段：系统规则新增

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | 截断策略 | `systems/prompt-length-manager.js` | 字段级截断策略 |
| 2 | 角色规则 | `rules/character-rules.md` | 极简锚点，禁止详细描述 |
| 3 | 音效设计规范 | `rules/sound-design-rules.md` | Murch层次+频率分离 |
| 4 | 景别系统 | `rules/camera-system.md` | 12级机位+14运镜 |
| 5 | 字段优先级 | `schema/field-priority.json` | P0/P1/P2/P3标注 |
| 6 | 台词规则 | `rules/dialogue-rules.md` | 格式+禁止旁白 |

### 3.3 第三阶段：产出环节改造

| # | 任务 | 环节 | 文件 | 说明 |
|---|------|------|------|-------|
| 1 | characterRef产出 | Stage 2/4 | `systems/character-system.js` | 生成image://路径 |
| 2 | character产出 | Stage 2/4 | `systems/character-system.js` | 生成极简锚点 |
| 3 | timeline产出 | Stage 6/7 | `systems/duration-calculator.js` | 时间轴计算 |
| 4 | backgroundSound产出 | Stage 5/11 | `systems/sound-design.js` | 结构化音效 |
| 5 | scene优化 | Stage 7 | `systems/storyboard-engine.js` | 五维空间描述 |
| 6 | camera扩展 | Stage 9 | `systems/camera-movement.js` | 12级机位系统 |
| 7 | lighting规范 | Stage 9 | `systems/lighting-engine.js` | 主光+色温+特效 |
| 8 | dialogue格式化 | Stage 5/11 | `systems/script-engine.js` | 统一台词格式 |

### 3.4 第四阶段：合成环节改造

| # | 任务 | 环节 | 文件 | 说明 |
|---|------|------|------|------|
| 1 | characterRef合成 | Stage 11 | `systems/render-core.js` | 注入image:// |
| 2 | character合成 | Stage 11 | `systems/render-core.js` | 注入极简锚点 |
| 3 | timeline合成 | Stage 11 | `systems/render-core.js` | 注入时间轴 |
| 4 | backgroundSound合成 | Stage 11 | `systems/render-core.js` | 注入结构化音效 |
| 5 | scene合成 | Stage 11 | `systems/render-core.js` | 五维空间描述 |
| 6 | camera合成 | Stage 11 | `systems/render-core.js` | 12级机位系统 |
| 7 | lighting合成 | Stage 11 | `systems/render-core.js` | 主光+色温+特效 |
| 8 | dialogue合成 | Stage 11 | `systems/render-core.js` | 格式化台词 |
| 9 | prompt融合顺序 | Stage 11 | `systems/render-core.js` | 定义融合顺序 |
| 10 | 截断策略执行 | Stage 11 | `systems/smart-trim.js` | 字段级截断 |

### 3.5 第五阶段：审核环节改造

| # | 任务 | 环节 | 文件 | 说明 |
|---|------|------|------|------|
| 1 | characterRef检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查image://格式 |
| 2 | character检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查极简锚点 |
| 3 | timeline检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查时间轴 |
| 4 | backgroundSound检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查三段式 |
| 5 | scene检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查五维空间 |
| 6 | camera检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查景别系统 |
| 7 | lighting检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查光照方案 |
| 8 | dialogue检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查台词格式 |
| 9 | 截断策略检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查截断执行 |
| 10 | 字段优先级检查 | Stage 12 | `systems/pipeline-integrity-validator.js` | 检查P0字段完整性 |

---

## 四、超短裙系统专属适配

### 4.1 去掉的字段（无片头）

- `audioLayer` → 去掉（片头专属）
- `titleOverlay` → 去掉（片头专属）
- `isOpening` → 去掉（无片头）
- `title` → 去掉（无片头）

### 4.2 保留的核心字段（1-3镜通用）

```json
{
  "shotId": "S01",
  "duration": 7,
  "scene": "五维空间描述",
  "mood": "3-5个情绪关键词",
  "camera": "12级机位+14运镜+焦距+速度",
  "lighting": "主光方向+色温K值+特效光",
  "characterRef": "image://路径，每角色最多9张",
  "character": "极简锚点：种族+3-5核心视觉关键词",
  "action": "核心动词+交互目标+身体运动",
  "dialogue": "SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES",
  "timeline": "T00:00-T00:07 / duration: 7s / type: normal / mood: tense",
  "backgroundSound": "AMBIENT: ... | SPATIAL: ... | INTENSITY: ...",
  "prompt": "融合后的最终提示词",
  "promptCharCount": 1247,
  "length": 1247,
  "utilization": 83,
  "utilizationStatus": "🔥理想"
}
```

### 4.3 15秒时长适配

| 字段 | 15秒适配 |
|------|---------|
| timeline | 精确到0.1秒，总时长15秒 |
| backgroundSound | 三段式压缩到15秒内 |
| camera | 运镜速度加快，减少慢速镜头 |
| dialogue | 台词压缩到67字以内（15秒×4.5字/秒） |
| scene | 五维空间精简，聚焦核心元素 |

---

## 五、优化创新（超越参考）

### 5.1 我们比参考更好的地方

| # | 创新点 | 说明 |
|---|--------|------|
| 1 | Nirath宇宙设定 | 参考是通用山海经，我们有独特的Nirath世界观 |
| 2 | 双恒星光照系统 | Aurelius+Silvana，参考无此设定 |
| 3 | 角色一致性保障 | 定妆照系统+极简锚点，参考只有image:// |
| 4 | PromptForge优化 | 子进程三阶流水线，参考无此优化 |
| 5 | 质量闸门系统 | Stage 11.5/12/16.5多层检查，参考只有单层 |
| 6 | 自动重试+断点恢复 | v6.5.60，参考无此机制 |
| 7 | 15秒精准控制 | 超短裙系统，参考是60-90秒 |
| 8 | 阶段级重试 | 3次重试，1分钟间隔，参考无此机制 |

### 5.2 小优化（参考不足处）

| # | 参考不足 | 我们的优化 |
|---|---------|---------|
| 1 | 无自动重试机制 | 阶段级3次重试 |
| 2 | 无断点恢复 | 检查点文件恢复 |
| 3 | 无质量闸门 | 多层检查（11.5/12/16.5） |
| 4 | 无字段优先级检查 | P0字段完整性检查 |
| 5 | 截断策略单一 | 字段级截断策略 |
| 6 | 无音效渲染规范 | Seedance结构化音效 |
| 7 | 无时长精确控制 | 15秒精准到0.1秒 |
| 8 | 台词无字数限制 | 15秒×4.5字/秒=67字上限 |

---

## 六、执行优先级

### P0（必须立即执行）
1. 更新数据结构文档（v6.5.62）
2. 新增4个核心字段（characterRef/character/timeline/backgroundSound）
3. 规范5个现有字段（scene/camera/lighting/dialogue/action）
4. 定义系统级规则（截断/角色/音效/景别/优先级/台词）

### P1（本周内执行）
5. 改造产出环节（Stage 2/4/5/6/7/9）
6. 改造合成环节（Stage 11）
7. 改造审核环节（Stage 12）

### P2（下周执行）
8. 全链路验证测试
9. 预生产验证
10. 生产发布

---

> 版本：v6.5.62 | 分析时间：2026-06-12 21:15
> 分析师：小G | 队长：李大鹏
