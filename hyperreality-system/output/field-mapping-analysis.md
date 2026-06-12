# 卓越系统字段结构映射分析

## 一、两套结构对比

### 1. 参考文档 v6.37-Peng（目标结构）

```json
{
  "meta": { ... },
  "opening": { ... },
  "shots": [
    {
      "shotId": "S01",
      "duration": 15,
      "scene": "五维空间描述",
      "mood": "3-5情绪关键词",
      "camera": "12级机位+运镜+焦距+速度",
      "lighting": "主光方向+色温K值+特效光",
      "characterRef": "image://格式",
      "character": "极简锚点",
      "action": "核心动词+交互目标",
      "dialogue": "SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES",
      "timeline": "T00:XX-T00:XX格式",
      "audioLayer": "片头专属",
      "titleOverlay": "片头标题",
      "backgroundSound": "三段式",
      "prompt": "最终融合提示词",
      "promptCharCount": 1234
    }
  ]
}
```

### 2. 卓越系统当前 v6.5.58（现有结构）

```json
{
  "id": "S01",
  "type": "building",
  "scene": "知识圣殿",
  "duration": 15,
  "prompt": "完整提示词...",
  "referenceImages": ["id1", "id2"],
  "mouthAction": "嘴部自然闭合",
  "length": 1247,
  "utilization": 83,
  "utilizationStatus": "🔥理想",
  "qualityScore": {"totalScore": 75},
  "enhanced": true,
  "dialogue": "",
  "narration": "",
  "cameraMovement": {
    "physicsDriver": "generic",
    "primaryMovement": "orbit_360",
    "speed": "smooth",
    "shotSize": "medium",
    "cameraHeight": "normal",
    "lens": "35mm",
    "pattern": "standard tracking",
    "timeline": {
      "segments": [...],
      "summary": "渐进式揭示"
    }
  },
  "emotionPhase": "curiosity",
  "importance": 5,
  "visualComplexity": 5
}
```

---

## 二、字段映射关系

| v6.37-Peng 字段 | v6.5.58 对应字段 | 差异说明 | 映射方案 |
|----------------|------------------|----------|----------|
| `shotId` | `id` | 名称不同 | 统一为 `shotId` |
| `duration` | `duration` | ✅ 相同 | 保持不变 |
| `scene` | `scene` | ✅ 相同 | 保持不变，升级五维空间 |
| `mood` | `emotionPhase` | 字符串 vs 单值 | `emotionPhase` → `mood` 字符串 |
| `camera` | `cameraMovement` | 字符串 vs 对象 | 对象 → 字符串转换 |
| `lighting` | 无 | 缺失 | 新增 |
| `characterRef` | `referenceImages` | image:// vs ID数组 | 新增字符串格式 |
| `character` | 无 | 缺失 | 新增极简锚点 |
| `action` | 无（在prompt中） | 缺失 | 新增独立字段 |
| `dialogue` | `dialogue` | 格式不同 | 改造为统一格式 |
| `timeline` | `cameraMovement.timeline` | 字符串 vs 对象 | 对象 → 字符串转换 |
| `audioLayer` | 无 | 片头缺失 | 新增 |
| `titleOverlay` | `title` | 字符串 vs 对象 | 对象 → 字符串转换 |
| `backgroundSound` | 无 | 缺失 | 新增 |
| `prompt` | `prompt` | ✅ 相同 | 保持不变，优化融合顺序 |
| `promptCharCount` | `length` | 名称不同 | 统一为 `promptCharCount` |
| 无 | `mouthAction` | 参考无此字段 | 保留（Seedance对口型需要） |
| 无 | `importance` | 参考无此字段 | 保留（时长分配需要） |
| 无 | `visualComplexity` | 参考无此字段 | 保留（视觉复杂度评估） |
| 无 | `qualityScore` | 参考无此字段 | 保留（质量评分） |
| 无 | `enhanced` | 参考无此字段 | 保留（PromptForge标记） |

---

## 三、融合策略（建议）

### 方案A：以参考文档为准（完全对齐）
- 优点：与参考文档完全一致，通用性强
- 缺点：丢失卓越系统现有字段（mouthAction/importance/visualComplexity）
- 风险：影响现有功能（对口型、时长分配）

### 方案B：融合两者（推荐）
- 核心字段：采用参考文档格式（v6.37-Peng）
- 保留字段：mouthAction, importance, visualComplexity, qualityScore, enhanced
- 新增字段：lighting, characterRef, character, action, backgroundSound, audioLayer, titleOverlay
- 转换字段：cameraMovement → camera（字符串），timeline（字符串），title → titleOverlay（字符串）

### 方案C：以卓越系统为基础
- 优点：兼容现有功能
- 缺点：与参考文档差异大，通用性弱

---

## 四、建议执行方案（方案B）

### 输出结构
```json
{
  "meta": { ... },
  "opening": { ... },
  "shots": [
    {
      // 参考文档字段（核心）
      "shotId": "S01",
      "duration": 15,
      "scene": "...",
      "mood": "...",
      "camera": "...",
      "lighting": "...",
      "characterRef": "...",
      "character": "...",
      "action": "...",
      "dialogue": "...",
      "timeline": "...",
      "backgroundSound": "...",
      "prompt": "...",
      "promptCharCount": 1234,
      
      // 卓越系统保留字段（扩展）
      "mouthAction": "...",
      "importance": 5,
      "visualComplexity": 5,
      "qualityScore": {...},
      "enhanced": true,
      
      // 片头专属字段
      "audioLayer": "...",
      "titleOverlay": "..."
    }
  ]
}
```

---

*分析完成时间：2026-06-12*
