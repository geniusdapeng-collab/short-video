# 超短裙短视频系统 - 视频提示词数据结构 v6.5.61

> 版本：v6.5.61 | 系统：ShortVideoSystem（超短裙）
> 结构：无片头，1-3个内容镜 | 总时长：15秒（固定）
> 规则：1镜×15秒 / 2镜（7+8秒）/ 3镜（3+6+6秒）

---

## 一、整体结构（无片头）

超短裙系统**没有片头**，直接由内容镜组成，总时长严格限制为15秒。

### 镜头数量规则

| 方案 | 镜头数 | 时长分配示例 | 适用场景 |
|------|--------|-------------|----------|
| A | 1镜 | 15秒 | 单场景展示，极简 |
| B | 2镜 | 7+8秒 / 6+9秒 / 5+10秒 | 双场景切换 |
| C | 3镜 | 3+6+6秒 / 4+5+6秒 / 5+5+5秒 | 多场景叙事（上限） |

> **硬性约束**：镜头数 ≤ 3，总时长 = 15秒（不可超过）

---

## 二、内容镜字段结构（1-3个镜头通用）

### 2.1 基础字段

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `id` | string | `"S01"` | 镜头编号（S01, S02, S03） |
| `type` | string | `"building"` | 类型：building/discovery/confrontation/climax/closing |
| `scene` | string | `"知识圣殿"` | Nirath场景名 |
| `duration` | number | `7` | 时长（秒），3-15秒 |
| `prompt` | string | `"完整提示词..."` | 1500字符上限 |
| `referenceImages` | array | `[]` | 定妆照（如适用） |
| `mouthAction` | string | `"嘴部自然闭合"` | 供Seedance对口型 |
| `length` | number | `1247` | 字符数 |
| `utilization` | number | `83` | 利用率% = length / 1500 * 100 |
| `utilizationStatus` | string | `"🔥理想"` | 状态标记 |
| `qualityScore` | object | `{totalScore:75}` | 质量评分 |
| `enhanced` | boolean | `true` | PromptForge优化标记 |
| `dialogue` | string | `""` | 对话（已融入prompt，保留兼容） |
| `narration` | string | `""` | **旁白（P0禁止，仅保留字段）** |
| `cameraMovement` | object | `{...}` | 运镜系统输出 |
| `emotionPhase` | string | `"curiosity"` | 情绪阶段 |
| `importance` | number | `5` | 重要性（1-10） |
| `visualComplexity` | number | `5` | 视觉复杂度（1-10） |

### 2.2 内容镜 Prompt 10字段结构

| 字段 | 说明 | 示例 |
|------|------|------|
| **CHARACTER** | 角色+视觉约束 | `小G，禁止任何地球已知动物特征融合` |
| **ACTION** | 动作+台词 | `小G：这就是白泽的领地吗？` |
| **SCENE** | 场景名 | `知识圣殿` |
| **MOOD** | 情绪标签 | `curiosity` |
| **CAMERA** | 运镜指令 | `orbit_360, push_in, 时间轴...` |
| **LIGHTING** | 光照方案 | `2000K→2800K→4500K 晨曦渐亮` |
| **NEGATIVE** | 负面约束 | `no blurry, no watermark, no cartoon...` |
| **AUDIO** | 音效+台词 | `环境音+角色对话（Seedance渲染）` |
| **RENDER** | 渲染风格 | `电影级、超写实、细节丰富` |
| **DIRECTOR** | 导演指令 | `景别策略+光影策略+速度曲线` |

### 2.3 运镜系统结构（cameraMovement）

```json
{
  "scene": "知识圣殿",
  "physicsDriver": "generic",
  "primaryMovement": "orbit_360",
  "speed": "smooth",
  "shotSize": "medium",
  "cameraHeight": "normal",
  "lens": "35mm",
  "pattern": "standard tracking",
  "referenceFilm": "general cinematic",
  "timeline": {
    "totalDuration": 7,
    "segmentCount": 2,
    "segments": [
      {
        "index": 0,
        "timeRange": "早期",
        "duration": 3,
        "shotSize": "extreme_wide",
        "movement": "orbit_360",
        "speed": {"value": 0.3, "description": "缓慢"},
        "lighting": {
          "intensity": 0.1,
          "colorTemp": 2000,
          "direction": "low_back",
          "effect": "仅轮廓可见"
        },
        "transition": "smooth_dissolve"
      }
    ],
    "summary": "镜头时间轴文字描述"
  }
}
```

---

## 三、时长分配规则

### 3.1 1镜方案（15秒）

```json
{
  "id": "S01",
  "type": "building",
  "scene": "知识圣殿",
  "duration": 15,
  "prompt": "...",
  "length": 1400,
  "utilization": 93
}
```

### 3.2 2镜方案（7+8秒）

```json
[
  {
    "id": "S01",
    "type": "building",
    "scene": "知识圣殿入口",
    "duration": 7,
    "prompt": "..."
  },
  {
    "id": "S02",
    "type": "discovery",
    "scene": "知识圣殿核心",
    "duration": 8,
    "prompt": "..."
  }
]
```

### 3.3 3镜方案（3+6+6秒）

```json
[
  {
    "id": "S01",
    "type": "building",
    "scene": "入口",
    "duration": 3,
    "prompt": "..."
  },
  {
    "id": "S02",
    "type": "discovery",
    "scene": "通道",
    "duration": 6,
    "prompt": "..."
  },
  {
    "id": "S03",
    "type": "climax",
    "scene": "核心",
    "duration": 6,
    "prompt": "..."
  }
]
```

### 3.4 时长分配算法

```
输入：总时长=15秒，场景数=1-3个

算法：
1. 按场景重要性和台词长度分配基础时长
2. 每镜最短3秒，最长15秒
3. 优先保证台词完整（语速4.5字/秒）
4. 剩余时间按重要性加权分配

输出：每镜时长 + 调整建议
```

---

## 四、利用率状态说明

| 状态 | 字符范围 | 含义 | 处理建议 |
|------|----------|------|----------|
| 🔥 **理想** | 970-1500 | 最优利用率 | 无需调整 |
| ✅ **达标** | 889-969 | 可接受 | 可优化但非必须 |
| ⚠️ **空间浪费** | <889 | 需要扩充 | 补充场景细节/运镜/光影 |
| ❌ **超标** | >1500 | 需要截断 | 精简冗余描述，保留核心要素 |

---

## 五、关键约束（P0级）

1. **无片头**：超短裙系统无片头，直接进入内容镜
2. **总时长15秒**：严格限制，不可超过
3. **镜头数1-3个**：最多3个镜头，最少1个
4. **每镜最短3秒**：低于3秒无法有效叙事
5. **禁止旁白**：仅保留 `dialogue`（对嘴），`narration` 禁用
6. **字符上限**：每个镜头1500字符
7. **Seedance渲染**：所有音效/台词由 Seedance 渲染，非后期制作
8. **PromptForge优化**：所有内容镜均经过PromptForge优化

---

## 六、完整示例：3镜方案（15秒）

### 镜头1（S01 - 3秒）

```json
{
  "id": "S01",
  "type": "building",
  "scene": "入口",
  "duration": 3,
  "prompt": "{CHARACTER: xiaoG | ACTION: 小G快速进入... | SCENE: 入口 | MOOD: curiosity | CAMERA: push_in... | LIGHTING: 2000K... | NEGATIVE: no blurry... | AUDIO: 环境音+台词... | RENDER: 电影级... | DIRECTOR: 快速建立...}",
  "referenceImages": [],
  "mouthAction": "嘴部快速说话",
  "length": 900,
  "utilization": 60,
  "utilizationStatus": "⚠️ 空间浪费",
  "qualityScore": {"totalScore": 70},
  "enhanced": true,
  "dialogue": "",
  "narration": "",
  "cameraMovement": {
    "scene": "入口",
    "primaryMovement": "push_in",
    "speed": "fast",
    "shotSize": "wide",
    "timeline": {
      "totalDuration": 3,
      "segmentCount": 1,
      "segments": [...]
    }
  },
  "emotionPhase": "curiosity",
  "importance": 8,
  "visualComplexity": 3
}
```

### 镜头2（S02 - 6秒）

```json
{
  "id": "S02",
  "type": "discovery",
  "scene": "通道",
  "duration": 6,
  "prompt": "...",
  "length": 1100,
  "utilization": 73,
  "utilizationStatus": "✅ 达标",
  "qualityScore": {"totalScore": 75}
}
```

### 镜头3（S03 - 6秒）

```json
{
  "id": "S03",
  "type": "climax",
  "scene": "核心",
  "duration": 6,
  "prompt": "...",
  "length": 1200,
  "utilization": 80,
  "utilizationStatus": "🔥 理想",
  "qualityScore": {"totalScore": 80}
}
```

---

## 七、输出流程

```
输入（projectName + scenes + characters）
  ↓
Stage 0-11: 主链路生成（剧本→故事板→运镜→渲染前准备）
  ↓
Stage 11.5: Prompt质量闸门（视觉内容/人物鲜活度/光影质量）
  ↓
Stage 12: 合规检查（利用率+禁止词+时长合规）
  ↓
PromptForge: 子进程优化（70分→90分）
  ↓
Stage 13-16: 最终验证（前置验证+风格注入+后期规则+端到端检查）
  ↓
输出：JSON报告 + Markdown报告 → Seedance API提交
```

---

**文件**：`output/short-video-prompt-schema-v6.5.61.json`
**版本**：v6.5.61 | ShortVideoSystem（超短裙）
**规则**：1-3镜，无片头，总时长15秒