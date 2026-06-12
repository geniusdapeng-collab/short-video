# 卓越系统差距分析（基于参考 v6.37-Peng）

> 对比对象：卓越系统当前结构 vs 参考文档 v6.37-Peng
> 分析时间：2026-06-12
> 当前卓越系统版本：v1.2.0-alpha1

---

## 一、顶层结构差距

| 维度 | 参考文档 | 卓越系统现状 | 差距等级 |
|------|----------|-------------|----------|
| `meta` | 有（title/worldview/totalDuration/openingDuration/fps/resolution/styleNotes） | ❌ 缺失 | **大** |
| `opening` | 独立片头对象（S00，15字段） | ❌ 缺失（只有 `featured_beast_id` 开关） | **大** |
| `shots[]` | 6个镜头（S01-S06，14字段） | 有（但字段差异大） | 中 |

---

## 二、字段级差距（正片镜头）

### 2.1 完全缺失的字段

| 字段 | 优先级 | 说明 | 差距等级 |
|------|--------|------|----------|
| `mood` | P1 | 3-5情绪关键词 | **大** |
| `lighting` | P1 | 主光方向+色温K值+特效光 | **大** |
| `backgroundSound` | P1 | AMBIENT+SPATIAL+INTENSITY三段式 | **大** |
| `titleOverlay` | P0 | 片头专属（主标题+副标题+制作人） | **大** |
| `audioLayer` | P1 | 片头专属声音设计 | **大** |
| `promptCharCount` | — | 字符数检查 | 中 |

### 2.2 存在但格式不符的字段

| 字段 | 参考文档要求 | 卓越系统现状 | 改造方案 |
|------|-------------|-------------|----------|
| `scene` | 五维空间描述法（宏观+中观+微观+天气+空间深度） | `setting`（简单场景名） | 升级为五维空间 |
| `characterRef` | `image://`格式，每角色最多9张 | `imageReferences`（对象数组） | 改为字符串格式 |
| `character` | 极简锚点：`角色名: 种族, 关键词1, 关键词2...` | `characterDescs`（长描述） | 改为极简锚点 |
| `action` | 核心动词+交互目标+身体运动 | `action`/`characterAction`（简单描述） | 规范化格式 |
| `dialogue` | `SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES` | `dialogue`对象 + `dialogueText`（中文台词） | 统一格式 |
| `timeline` | `T00:XX-T00:XX / duration: Xs / type: XXX / mood: XXX` | `timing`对象（start/duration/end） | 改为字符串格式 |
| `camera` | 12级机位+14运镜+焦距+速度 | `camera`对象（有timeline/shotType/movement/speed） | 扩展为完整格式 |
| `prompt` | 最终融合提示词（≤1000英文词） | `prompt.fullPrompt`（中文混杂） | 标准化 |

### 2.3 基本符合的字段

| 字段 | 状态 | 说明 |
|------|------|------|
| `shotId` | ✅ 符合 | 如 S01, SC01 |
| `duration` | ✅ 符合 | 时长数值 |

---

## 三、内部字段差距

| 字段 | 优先级 | 参考文档 | 卓越系统现状 | 差距 |
|------|--------|----------|-------------|------|
| `PhysicsLayer` | P1 | 水体/大气/材质/柔体物理 | ❌ 缺失 | **大** |
| `ColorScience` | P1 | 12种标准调色板+色温+场景自适应 | ❌ 缺失 | **大** |
| `NegativePrompt` | P2 | 排除的视觉元素和技术缺陷 | ❌ 缺失 | 中 |
| `RenderStyle` | P2 | 整体视觉风格声明+质量声明 | ❌ 缺失 | 中 |
| `DirectorStyle` | P3 | 导演标识+1-2项风格参数 | ❌ 缺失 | 小 |

---

## 四、全链路字段流转差距

### 4.1 当前卓越系统链路

```
ScriptEngine (剧本引擎)
  → 输出：scenes[] (scene_id, setting, dialogue, characters, timing...)

ProductionEngine (制作引擎)
  → Stage 1: 场景提取 → shots[] (shotId, setting, characterDescs, dialogueText...)
  → Stage 2: 时长分配 → timing (start/duration/end)
  → Stage 3: 运镜设计 → camera (timeline, shotType, movement, speed)
  → Stage 4: Prompt工程 → prompt.fullPrompt + imageReferences
  → Stage 5: 质量门 → prompt.length检查
  → Stage 6: 片头生成 → 仅根据 featured_beast_id 开关
  → Stage 7: 连续性检查

RenderingEngine (渲染引擎)
  → 消费：prompts[] (shotId, prompt, imageRefs, duration)
  → 转换为：shots[] (shotId, id, prompt, duration, isOpening, referenceImages)

PostProductionEngine (后期引擎)
  → 消费：最终渲染结果
```

### 4.2 参考文档要求链路

```
meta → opening → shots[]

每个镜头包含：
shotId → duration → scene → mood → camera → lighting → 
characterRef → character → action → dialogue → timeline → 
audioLayer(片头) → titleOverlay(片头) → backgroundSound → 
prompt → promptCharCount
```

### 4.3 差距总结

1. **产出环节缺失**：Stage 1-3 没有产出 mood, lighting, characterRef, character, action, backgroundSound
2. **合成环节缺失**：Stage 4 Prompt 工程没有按参考文档的融合顺序注入字段
3. **审核环节缺失**：没有针对 mood/lighting/characterRef/character/timeline/backgroundSound 的格式检查

---

## 五、改造优先级

### P0（必须先完成）
1. **新增 meta 结构** - 顶层元信息
2. **新增 opening 结构** - 片头15字段
3. **改造 camera 字段** - 从对象改为字符串格式（12级机位+14运镜+焦距+速度）
4. **改造 lighting 字段** - 新增（主光方向+色温K值+特效光）
5. **改造 characterRef 字段** - 从 imageReferences 改为字符串格式
6. **改造 character 字段** - 从 characterDescs 改为极简锚点
7. **改造 dialogue 字段** - 统一格式 SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES
8. **改造 timeline 字段** - 从 timing 对象改为字符串格式

### P1（产出环节）
9. **新增 mood 字段** - 3-5情绪关键词
10. **新增 action 字段** - 核心动词+交互目标
11. **新增 backgroundSound 字段** - 三段式音效
12. **新增 audioLayer 字段** - 片头专属声音设计
13. **新增 titleOverlay 字段** - 片头标题元数据
14. **新增 scene 五维空间描述** - 升级 setting

### P2（审核/验证）
15. **审核环节增强** - 检查新增字段格式与完整性
16. **全链路验证** - 预生产测试

---

## 六、超越参考的优化点

1. **通用性**：不将山海经专属内容（如 Nirath 星球、双恒星）硬编码为默认值，而是作为可配置的世界观参数
2. **灵活性**：audioLayer/titleOverlay 字段在片头中可配置，普通镜头中自动省略
3. **扩展性**：保留内部字段（PhysicsLayer/ColorScience/NegativePrompt/RenderStyle/DirectorStyle）的注入接口

---

## 七、执行计划

### 阶段1：P0（合成环节）
- 改造 production-engine.js 输出结构
- 新增 meta / opening 结构
- 改造 camera / lighting / characterRef / character / dialogue / timeline 字段

### 阶段2：P1（产出环节）
- 新增 mood / action / backgroundSound / audioLayer / titleOverlay 字段
- 升级 scene 为五维空间描述

### 阶段3：P2（审核/验证）
- 新增验证逻辑
- 全链路预生产测试

---

*分析完成时间：2026-06-12 22:30*
