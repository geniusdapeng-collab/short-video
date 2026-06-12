# 山海经神兽短片 - 视频提示词数据结构 v6.5.58

> 版本：v6.5.58 | 系统：NirathMasterPipeline
> 结构：1个片头 + 6个内容镜 = 7镜 | 总时长：约60秒

---

## 一、片头（S00）- 独立结构

片头由 `opening-system-v3.js` 独立生成，结构与其他镜头完全不同。**PromptForge 优化跳过此镜头**。

### 1.0 标题字段（片头专属）

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `title.main` | string | `"SHAN HAI JING: 白泽"` | **主标题（英文）**，定格阶段展示 |
| `title.sub` | string | `"A Nirath Original by Genius"` | **副标题（英文）**，出品人信息 |
| `title.creator` | string | `"Genius"` | 出品人/创作者名称 |
| `title.episodeName` | string | `"万物之灵"` | 本集主题/副标题（中文） |
| `title.displayTiming` | string | `"6.8-9.0s"` | 标题展示时间区间（定格阶段） |
| `title.position` | string | `"画面中央偏下"` | 标题在画面中的位置 |
| `title.style` | string | `"史诗级金属质感，微发光边缘，无衬线字体"` | 标题视觉风格 |

> **标题生成规则**：
> - 主标题 = `SHAN HAI JING: {神兽名}`（英文，强制）
> - 副标题 = `A Nirath Original by {creator}`（英文，强制）
> - 标题必须在 **6.8-9.0s 定格阶段** 出现
> - 标题融入提示词 `prompt` 的【定格】模块中
> - Stage 12 片头合规检查会验证 `title.main` 和 `title.sub` 是否存在

### 1.1 基础字段

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `id` | string | `"S00"` | 固定编号 |
| `type` | string | `"opening"` | 片头类型 |
| `scene` | string | `"片头"` | 场景名 |
| `duration` | number | `9` | **固定9秒，不可修改** |
| `prompt` | string | `"【神兽人声签名】..."` | 完整提示词（1500字符上限） |
| `referenceImages` | array | `["id1", "id2"]` | 定妆照ID列表 |
| `mouthAction` | string | `"嘴部动作描述"` | 供Seedance对口型 |
| `length` | number | `1407` | 字符数 |
| `utilization` | number | `93` | 利用率% = length / 1500 * 100 |
| `utilizationStatus` | string | `"🔥理想"` | 状态标记 |
| `qualityScore` | object | `{totalScore:95,...}` | 质量评分 |
| `enhanced` | boolean | `true` | 是否优化（固定true） |
| `isOpening` | boolean | `true` | **PromptForge跳过标记** |

### 1.2 片头 Prompt 内部结构（12个模块）

```
【神兽人声签名】
  └── 神兽特定声音描述
  └── 声音特质（如"清澈理性，如同冰川融水"）
  └── 情绪（无情绪波动但充满知识重量）
  └── 环境音效（纸张声、磁场共振）
  └── 物理效应（3.2Tesla磁场共振、地面微震）

【ASTRALIS】
  └── 超写实渲染指令
  └── 电影级光影
  └── 16:9画幅
  └── Nirath物理参数：0.82G重力、3.2Tesla磁场、双恒星5800K+6500K

【钩子（0-2.3s）】
  └── 黄金3秒开场
  └── 双恒星光照+磁场可见+磁丝矗立

【展开（2.3-6.8s）】
  └── 环境变化
  └── 主角动作
  └── 神兽登场

【定格（6.8-9.0s）】
  └── 角色同框（小G+神兽）
  └── 表情细节（小G侧脸仰望，神兽姿态威严）
  └── **主标题展示**：`SHAN HAI JING: {神兽名}`（英文，画面中央偏下）
  └── **副标题展示**：`A Nirath Original by {creator}`（英文，主标题下方）
  └── **出品人信息**：Genius 出品（融入副标题）
  └── 定格时间轴：6.8s开始出现 → 7.5s完全展示 → 9.0s结束

【运镜】
  └── 时间轴：extreme_wide → dolly_in → ... → dual_star_sweep

【NIRATH明亮约束】
  └── 强制明亮光照
  └── 禁止暗黑/灰暗

【ASTRALIS风格锁死】
  └── Nirath原生视觉语言
  └── 禁止地球/卡通/二次元

【角色约束】
  └── 仅1个小G + 1个神兽

【口播动作】
  └── 主角嘴部动作描述（供Seedance对口型）

【负面约束】
  └── 禁止眼睛非自然色
  └── 禁止水晶
  └── 禁止重复角色

【定妆照引用】
  └── @Image1 小G正面
  └── @Image2 神兽正面
```

### 1.3 片头质量评分结构

```json
{
  "totalScore": 95,           // 总分（片头固定高分）
  "cameraVariety": 8,         // 运镜丰富度
  "lightingProgression": "advanced",  // 光照进阶程度
  "emotionalDepth": 90        // 情感深度
}
```

---

## 二、内容镜（S01-S06）- 10字段结构

内容镜由主链路生成，**PromptForge 优化提升质量**。

### 2.1 基础字段

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `id` | string | `"S01"` | 镜头编号 |
| `type` | string | `"building"` | 类型：building/discovery/confrontation/climax/closing |
| `scene` | string | `"知识圣殿"` | Nirath场景名 |
| `duration` | number | `15` | 时长（秒） |
| `prompt` | string | `"完整提示词..."` | 1500字符上限 |
| `referenceImages` | array | `[]` | 定妆照（后续补充） |
| `mouthAction` | string | `"嘴部自然闭合"` | Stage 7生成，供对口型 |
| `length` | number | `1247` | 字符数 |
| `utilization` | number | `83` | 利用率% |
| `utilizationStatus` | string | `"🔥理想"` | 状态标记 |
| `qualityScore` | object | `{totalScore:75}` | 质量评分 |
| `enhanced` | boolean | `true` | PromptForge优化标记 |
| `dialogue` | string | `""` | 对话（已融入prompt，保留兼容） |
| `narration` | string | `""` | **旁白（P0禁止，仅保留字段）** |
| `cameraMovement` | object | `{...}` | Stage 9运镜系统输出 |
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
  "physicsDriver": "generic",           // nirath/generic/physics-based
  "primaryMovement": "orbit_360",       // 主要运镜
  "speed": "smooth",                    // slow/smooth/fast/extreme
  "shotSize": "medium",                 // extreme_wide/wide/medium/close_up
  "cameraHeight": "normal",             // low/normal/high/aerial
  "lens": "35mm",                       // 35mm/50mm/85mm
  "pattern": "standard tracking",       // 运镜路径
  "referenceFilm": "general cinematic", // 参考影片
  "timeline": {
    "totalDuration": 15,
    "segmentCount": 4,
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

## 三、利用率状态说明

| 状态 | 字符范围 | 含义 | 处理建议 |
|------|----------|------|----------|
| 🔥 **理想** | 970-1500 | 最优利用率 | 无需调整 |
| ✅ **达标** | 889-969 | 可接受 | 可优化但非必须 |
| ⚠️ **空间浪费** | <889 | 需要扩充 | 补充场景细节/运镜/光影 |
| ❌ **超标** | >1500 | 需要截断 | 精简冗余描述，保留核心要素 |

---

## 四、关键约束（P0级）

1. **禁止旁白**：仅保留 `dialogue`（对嘴），`narration` 字段保留但禁用
2. **片头保护**：S00 由 opening-system-v3.js 生成，PromptForge 跳过
3. **字符上限**：片头 1500，内容镜 1500
4. **Seedance 渲染**：所有音效/台词由 Seedance 渲染，**非后期制作**
5. **Nirath 物理参数**：必须包含 0.82G 重力、3.2Tesla 磁场、双恒星 5800K+6500K
6. **定妆照引用**：必须包含 @Image1（小G）和 @Image2（神兽）
7. **PromptForge 优化**：仅优化内容镜（S01+），片头跳过

---

## 五、完整示例：1片头+6内容镜

### 片头示例（S00）

```json
{
  "id": "S00",
  "type": "opening",
  "scene": "片头",
  "duration": 9,
  "title": {
    "main": "SHAN HAI JING: 白泽",
    "sub": "A Nirath Original by Genius",
    "creator": "Genius",
    "episodeName": "万物之灵",
    "displayTiming": "6.8-9.0s",
    "position": "画面中央偏下",
    "style": "史诗级金属质感，微发光边缘，无衬线字体"
  },
  "prompt": "【神兽人声签名】白泽低语...\n【ASTRALIS】超写实渲染...\n【0-2.3s 钩子】...\n【2.3-6.8s 展开】...\n【6.8-9.0s 定格】角色同框，主标题'SHAN HAI JING: 白泽'，副标题'A Nirath Original by Genius'...\n【运镜】extreme_wide→...\n【NIRATH明亮约束】...\n【ASTRALIS风格锁死】...\n【角色约束】...\n【口播动作】...\n【负面约束】...\n【定妆照引用】@Image1 @Image2",
  "referenceImages": ["xiaoG-portrait-001", "bai-ze-portrait-001"],
  "mouthAction": "嘴部自然闭合，面对镜头",
  "length": 1407,
  "utilization": 93,
  "utilizationStatus": "🔥理想",
  "qualityScore": {
    "totalScore": 95,
    "cameraVariety": 8,
    "lightingProgression": "advanced",
    "emotionalDepth": 90
  },
  "enhanced": true,
  "isOpening": true
}
```

### 内容镜示例（S01 - 铺垫）

```json
{
  "id": "S01",
  "type": "building",
  "scene": "知识圣殿",
  "duration": 15,
  "prompt": "{CHARACTER: xiaoG，bai-ze | ACTION: 小G... | SCENE: 知识圣殿 | MOOD: curiosity | CAMERA: orbit_360... | LIGHTING: 2000K→2800K... | NEGATIVE: no blurry... | AUDIO: 环境音+台词... | RENDER: 电影级... | DIRECTOR: 渐进式揭示...}",
  "referenceImages": [],
  "mouthAction": "嘴部自然闭合",
  "length": 1247,
  "utilization": 83,
  "utilizationStatus": "🔥理想",
  "qualityScore": {"totalScore": 75},
  "enhanced": true,
  "dialogue": "",
  "narration": "",
  "cameraMovement": {
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
      "totalDuration": 15,
      "segmentCount": 4,
      "segments": [...],
      "summary": "渐进式揭示"
    }
  },
  "emotionPhase": "curiosity",
  "importance": 5,
  "visualComplexity": 5
}
```

### 内容镜示例（S02-S06）

| 镜头 | 类型 | 场景 | 时长 | 情绪 |
|------|------|------|------|------|
| S02 | discovery | 建木林 | 15s | curiosity |
| S03 | confrontation | 白泽居所 | 15s | curiosity |
| S04 | climax | 智慧核心 | 15s | resolution |
| S05 | closing | 永恒之海 | 9s | resolution |
| S06 | closing | 归途 | 7s | resolution |

---

## 六、输出流程

```
输入（projectName + scenes + characters）
  ↓
Stage 0-11: 主链路生成（剧本→故事板→运镜→渲染前准备）
  ↓
Stage 11.5: Prompt质量闸门（视觉内容/人物鲜活度/光影质量）
  ↓
Stage 12: 合规检查（利用率+禁止词+片头合规）
  ↓
PromptForge: 子进程优化（70分→90分，片头跳过）
  ↓
Stage 13-16: 最终验证（前置验证+风格注入+后期规则+端到端检查）
  ↓
输出：JSON报告 + Markdown报告 → Seedance API提交
```

---

**文件**：`output/short-video-prompt-schema-v6.5.58.json`
**版本**：v6.5.58 | NirathMasterPipeline
