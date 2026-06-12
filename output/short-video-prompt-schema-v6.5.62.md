# 超短裙短视频系统 - 视频提示词数据结构 v6.5.62

> 版本：v6.5.62 | 系统：ShortVideoSystem（超短裙）
> 结构：无片头，1-3个内容镜 | 总时长：15秒（固定）
> 基于参考：短片提示词数据结构 v6.37-Peng（工业化、严谨）
> 优化：结合Nirath宇宙设定，超越参考

---

## 一、整体结构（无片头）

```
meta → shots[]
```

| 层级 | 说明 |
|------|------|
| `meta` | 短片元信息（标题、世界观、时长、分辨率等） |
| `shots[]` | 1-3个内容镜 |

> **硬性约束**：镜头数 ≤ 3，总时长 = 15秒（不可超过）

---

## 二、Meta 元信息

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `title` | string | `"白泽·通晓"` | 短片标题 |
| `worldview` | string | `"nirath"` | 世界观标识：nirath / generic |
| `totalDuration` | number | `15` | 总时长（秒），固定15 |
| `fps` | number | `24` | 帧率，默认24 |
| `resolution` | string | `"1920x1080"` | 分辨率 |
| `styleNotes` | string | `"Nirath cinematic, 超写实科幻生态风格"` | 整体风格备注 |
| `promptVersion` | string | `"v6.5.62"` | 数据结构版本 |

---

## 三、内容镜字段结构（1-3个镜头通用）

### 3.1 字段优先级标注

| 优先级 | 含义 | 截断策略 |
|--------|------|----------|
| 🔴 **P0** | 核心字段，绝不截断 | never |
| 🟡 **P1** | 重要字段，可压缩但保留核心 | keep_core |
| 🟢 **P2** | 辅助字段，可截断 | trimmable |
| ⚪ **P3** | 可选字段，可删除 | removable |

### 3.2 完整字段列表

| # | 字段 | 优先级 | 类型 | 说明 | 截断策略 |
|---|------|--------|------|------|----------|
| 1 | `shotId` | — | string | 镜头编号（S01, S02, S03） | — |
| 2 | `duration` | — | number | 时长（秒），3-15秒 | — |
| 3 | `scene` | 🟡 P1 | string | 五维空间描述法 | keep_core_location |
| 4 | `mood` | 🟡 P1 | string | 3-5个情绪关键词 | keyword_list |
| 5 | `camera` | 🟡 P1 | string | 12级机位+14运镜+焦距+速度 | keep_core_movement |
| 6 | `lighting` | 🟡 P1 | string | 主光方向+色温K值+特效光 | keep_main_light_temp |
| 7 | `characterRef` | 🔴 P0 | string | 定妆照绑定，image://路径，每角色最多9张 | never |
| 8 | `character` | 🔴 P0 | string | 极简锚点：种族+3-5核心视觉关键词 | minimal_anchor_only |
| 9 | `action` | 🟡 P1 | string | 核心动词+交互目标+身体运动 | keep_core_verb_object |
| 10 | `dialogue` | 🔴 P0 | string | 台词格式：SPEAKER\|TYPE\|EMOTION\|TEXT\|LIP_SYNC:YES | keep_core_dialogue |
| 11 | `timeline` | 🟡 P1 | string | 时间线标记：起止时间+时长+类型+情绪 | never |
| 12 | `backgroundSound` | 🟡 P1 | string | 结构化音效：AMBIENT+SPATIAL+INTENSITY | keep_core_sound |
| 13 | `prompt` | — | string | 融合后的最终提示词（≤1500字符） | — |
| 14 | `promptCharCount` | — | number | 字符数检查（≤1500） | — |
| 15 | `referenceImages` | 🔴 P0 | array | 定妆照URL数组（同characterRef） | never |
| 16 | `mouthAction` | 🔴 P0 | string | 嘴部动作，供Seedance对口型 | never |
| 17 | `length` | — | number | 字符数（同promptCharCount） | — |
| 18 | `utilization` | — | number | 利用率% = length / 1500 * 100 | — |
| 19 | `utilizationStatus` | — | string | 🔥理想/✅达标/⚠️空间浪费/❌超标 | — |
| 20 | `qualityScore` | — | object | 质量评分 | — |
| 21 | `enhanced` | — | boolean | PromptForge优化标记 | — |
| 22 | `cameraMovement` | 🟡 P1 | object | 运镜系统结构化输出 | keep_core_movement |
| 23 | `emotionPhase` | 🟡 P1 | string | 情绪阶段 | keyword_list |
| 24 | `importance` | 🟡 P1 | number | 重要性（1-10） | — |
| 25 | `visualComplexity` | 🟡 P1 | number | 视觉复杂度（1-10） | — |

### 3.3 新增字段详解

#### 7. characterRef 🔴 P0

- **适用范围**：全部镜头（如有角色）
- **说明**：角色定妆照绑定，image://路径，每角色最多9张，必须包含角色特征关键张
- **格式**：`角色名: image://bestiary/角色名-角度.png, image://bestiary/角色名-特写.png`
- **示例**：`白泽: image://bestiary/baize-front.png, image://bestiary/baize-profile.png`
- **必须包含**：image://、角色名
- **截断策略**：never — P0绝不截断
- **Nirath适配**：角色名使用Nirath命名（如"小G"、"白泽"），禁止地球动物名

#### 8. character 🔴 P0

- **适用范围**：全部镜头（如有角色）
- **说明**：角色核心特征，极简锚点模式，种族/物种 + 3-5个核心视觉关键词
- **格式**：`角色名: 种族, 关键词1, 关键词2, 关键词3`
- **示例**：`白泽: 狮形异兽, 额间竖眼, 三尾白焰, 纯白毛皮, 金蹄`
- **必须包含**：种族/物种、3-5个核心视觉关键词
- **截断策略**：minimal_anchor_only — 仅保留3-5个关键词
- **Nirath适配**：
  - 禁止地球动物名（如"狮子"→"狮形异兽"）
  - 禁止地球文化元素（如"龙"→"Nirath巨兽"）
  - 使用Nirath专属描述（如"双恒星光照下的琥珀色瞳孔"）

#### 11. timeline 🟡 P1

- **适用范围**：全部镜头
- **说明**：时间线标记，镜头起止时间、时长、类型、情绪
- **格式**：`T00:XX-T00:XX / duration: Xs / type: normal / mood: tense`
- **示例**：`T00:00-T00:07 / duration: 7s / type: normal / mood: tense`
- **必须包含**：duration、type
- **截断策略**：never — P1绝不截断
- **15秒适配**：精确到0.1秒，如`T00:00.0-T00:07.5`

#### 12. backgroundSound 🟡 P1

- **适用范围**：全部镜头
- **说明**：背景音效设计，基于Murch音效层次+频率分离+叙事功能+镜头衔接
- **格式**：`AMBIENT: ... | SPATIAL: ... | INTENSITY: ...`
- **示例**：
  ```
  AMBIENT: fantasy atmosphere, deep earth rumble 20-60Hz, enchanted wind
  | SPATIAL: 3D audio pan L-R as beast moves
  | INTENSITY: crescendo 0-3s, peak 3-5s, decay 5-7s
  ```
- **必须包含**：AMBIENT、INTENSITY
- **截断策略**：keep_core_sound
- **Nirath适配**：
  - 环境音使用Nirath专属描述（如"双恒星低频嗡鸣"、"生物发光脉动声"）
  - 频率分离：20-200Hz（大地/恒星嗡鸣）、200-2kHz（生物/风声）、2k-20kHz（细节/晶体）

### 3.4 优化字段详解

#### 3. scene 🟡 P1

- **五维空间描述法**（参考优化）：
  1. **宏观地理**：星球/大陆/区域（如"Nirath东部大陆，Aurelius-5800K暖金恒星照耀的荒原"）
  2. **中观地貌**：地形/地貌（如"晶体峡谷迷宫，六角火山岩裂缝"）
  3. **微观材质**：表面材质/纹理（如"生物发光孢子云，纳米级晶体粉末"）
  4. **天气时间**：时间/天气/光照（如"双恒星日落，紫金色边缘光"）
  5. **空间深度**：前景/中景/背景层次（如"前景岩石，中景异兽，背景峡谷壁"）
- **示例**：`Nirath东部荒原黎明，晶体峡谷迷宫，六角火山岩裂缝，生物发光孢子云，双恒星紫金色边缘光，空间深度：前景岩石，中景白泽，背景峡谷壁`
- **截断策略**：keep_core_location — 保留地点+≥2种材质细节

#### 5. camera 🟡 P1

- **12级机位系统**（扩展）：
  - 极端特写(extreme close-up) / 特写(close-up) / 近景(medium close-up)
  - 中景(medium shot) / 中全景(medium wide) / 全景(wide shot)
  - 大全景(extreme wide) / 建立镜头(establishing) / 空中(aerial)
  - 低角度(low-angle) / 高角度(high-angle) / 鸟瞰(bird's-eye) / 虫瞰(worm's-eye)
- **14种运镜**（扩展）：
  - dolly in/out / crane up/down / handheld / steadicam / static
  - pan left/right / tilt up/down / tracking / orbital / arc
  - push / pull / zoom / rack focus / whip pan
- **光学参数**：焦距(24mm/50mm/85mm/135mm/macro)、光圈(f/1.4-f/22)、格式(35mm/16mm/IMAX)
- **速度控制**：slow motion(0.5x) / real-time / time-lapse / speed ramp / static
- **示例**：`low-angle arc shot, 85mm macro tracking, slow dolly in 0.5x, rack focus skeleton→face, speed ramp at light-flare`
- **截断策略**：keep_core_movement — 保留景别+核心运镜词

#### 6. lighting 🟡 P1

- **三要素**：位置+性质+效果
- **主光方向**：key light方向（如"moonlight from above"、"backlit silhouette"）
- **色温K值**：明确数值（如"5600K"、"2700K"、"3200K"）
- **特效光**：volumetric god rays、rim light、self-illumination等
- **Nirath适配**：
  - 双恒星系统：Aurelius-5800K暖金 + Silvana-6500K清冷
  - 生物发光：2700K暖金自发光
  - 玫瑰金阴影：双恒星琥珀-紫罗兰光照形成
- **示例**：`moonlight key 5600K from above through rib bones creating hard-light stripes, 2700K warm gold self-illumination from beast eyes as fill, 6500K cool ambient in shadows`
- **截断策略**：keep_main_light_temp — 保留主光方向+色温数值

#### 9. action 🟡 P1

- **核心动词**：明确动作（如"steps forward"、"opens mouth"、"raises tail"）
- **交互目标**：动作对象（如"scanning inscriptions"、"facing camera"）
- **身体运动**：身体部位运动（如"three tails rising into fan formation"）
- **环境互动**：与环境的互动（如"hooves leaving glowing footprints"）
- **示例**：`BaiZe steps forward, hooves leaving glowing footprints that fade, three tails rising into fan, vertical eye opening and scanning inscriptions`
- **截断策略**：keep_core_verb_object — 保留核心动词+交互目标

#### 10. dialogue 🔴 P0

- **统一格式**：`SPEAKER|TYPE|EMOTION|TEXT|LIP_SYNC:YES`
- **TYPE**：独白(monologue) / 对白(dialogue) / 呼喊(shout)
- **EMOTION**：情绪描述（如"低沉威严"、"紧张急促"）
- **TEXT**：中文台词（≤67字，15秒×4.5字/秒）
- **LIP_SYNC**：YES（强制，供Seedance对口型）
- **禁止**：旁白(Voiceover) — P0级禁止
- **示例**：`白泽|独白|低沉威严|这些骨头……还在说话。|LIP_SYNC:YES`
- **截断策略**：keep_core_dialogue — 可压缩但不可删除

---

## 四、Prompt融合顺序

### 4.1 融合顺序（Stage 11）

```
characterRef → timeline → dialogue → backgroundSound → character → action → scene → mood → camera → lighting
```

### 4.2 融合规则

1. **characterRef**（P0）：首先注入，确保角色一致性
2. **timeline**（P1）：标记时间轴，精确控制节奏
3. **dialogue**（P0）：台词独立通道，供Seedance对口型
4. **backgroundSound**（P1）：音效结构化，Seedance渲染
5. **character**（P0）：极简锚点，避免详细描述占用空间
6. **action**（P1）：核心动作，驱动叙事
7. **scene**（P1）：五维空间，建立世界观
8. **mood**（P1）：情绪关键词，氛围基调
9. **camera**（P1）：运镜指令，视觉语言
10. **lighting**（P1）：光影方案，质感提升

---

## 五、硬约束

### 5.1 字数限制

| 限制项 | 数值 | 说明 |
|--------|------|------|
| 总字符数 | ≤1500 | 每个镜头Prompt上限 |
| 中文台词 | ≤67字 | 15秒×4.5字/秒 |
| 英文词 | ≤1000 | 非Dialogue字段合计（参考） |
| 角色关键词 | 3-5个 | character字段 |
| 情绪关键词 | 3-5个 | mood字段 |
| 景别+运镜 | 2-3个 | camera字段核心 |

### 5.2 语言规范

| 字段 | 语言 | 说明 |
|------|------|------|
| dialogue | 中文 | 保留中文台词 |
| 其他所有字段 | 英文 | 强制，characterRef除外 |
| characterRef | 混合 | 角色名中文，路径英文 |

### 5.3 角色规则

- 极简锚点模式：种族/物种 + 3-5个核心视觉关键词
- 禁止详细描述（如"十五米高的巨型身躯"、完整外貌描写）
- 禁止地球动物名融合（如"狮子"→"狮形异兽"）
- 禁止地球文化元素（如"龙"→"Nirath巨兽"）

### 5.4 镜头系统

| 类别 | 选项 |
|------|------|
| 景别 | extreme close-up / close-up / medium shot / medium wide / wide shot / extreme wide / establishing / low-angle / high-angle / aerial / bird's-eye / worm's-eye |
| 运镜 | dolly in/out / crane up/down / handheld / steadicam / static / pan left/right / tilt up/down / tracking / orbital / arc / push / pull / zoom / rack focus / whip pan |
| 焦距 | 24mm wide / 50mm standard / 85mm portrait / 135mm telephoto / macro |
| 速度 | slow motion(0.5x) / real-time / time-lapse / speed ramp / static |

### 5.5 音效设计

- **框架**：Murch音效层次（对白 > 音效 > 音乐）+ 频率分离
- **频率分离**：20-200Hz（大地/恒星嗡鸣）/ 200-2kHz（生物/风声）/ 2k-20kHz（细节/晶体）
- **叙事功能**：establishing / transitional / emotional cue / tension builder / release
- **格式**：`AMBIENT: ... | SPATIAL: ... | INTENSITY: ...`

---

## 六、内部字段（不出现在最终Prompt中）

| 字段 | 优先级 | 说明 | 融合目标 |
|------|--------|------|----------|
| `PhysicsLayer` | P1 | 水体/大气/材质/柔体物理描述 | → scene |
| `ColorScience` | P1 | 12种标准调色板+色温+场景自适应映射 | → lighting |
| `NegativePrompt` | P2 | 排除的视觉元素和技术缺陷 | 独立使用 |
| `RenderStyle` | P2 | 整体视觉风格声明+质量声明 | 独立使用 |
| `DirectorStyle` | P3 | 导演标识+1-2项风格参数 | 独立使用 |

---

## 七、截断策略

| 字段 | 策略 | 说明 |
|------|------|------|
| characterRef | never | P0绝不截断 |
| character | minimal_anchor_only | 仅保留3-5个关键词 |
| dialogue | keep_core_dialogue | 可压缩但不可删除 |
| timeline | never | P1绝不截断 |
| scene | keep_core_location | 保留地点+≥2种材质细节 |
| mood | keyword_list | 保留3-5个关键词 |
| camera | keep_core_movement | 保留景别+核心运镜词 |
| lighting | keep_main_light_temp | 保留主光方向+色温数值 |
| action | keep_core_verb_object | 保留核心动词+交互目标 |
| backgroundSound | keep_core_sound | 保留AMBIENT+INTENSITY |

---

## 八、完整示例：1镜方案（15秒）

### 镜头1（S01 - 15秒）

```json
{
  "shotId": "S01",
  "duration": 15,
  "scene": "Nirath东部荒原黎明，晶体峡谷迷宫，六角火山岩裂缝，生物发光孢子云，双恒星紫金色边缘光，空间深度：前景岩石，中景白泽，背景峡谷壁",
  "mood": "mysterious, epic, awe, ancient awakening, primordial",
  "camera": "wide establishing aerial shot, slow dolly in from high altitude to ground level, 24mm wide lens, speed 0.3x",
  "lighting": "backlit silhouette, 3200K warm golden sunrise at 45°, volumetric god rays through mist, 6500K cool ambient fill",
  "characterRef": "白泽: image://bestiary/baize-front-fullbody.png, image://bestiary/baize-profile-head.png, image://bestiary/baize-three-tails-detail.png",
  "character": "白泽: 狮形异兽, 额间竖眼, 三尾白焰, 纯白毛皮, 金蹄",
  "action": "白泽缓步前行，蹄子留下发光的脚印随后消散，三尾展开成扇形，额间竖眼睁开扫描碑文",
  "dialogue": "白泽|独白|低沉威严|这些骨头……还在说话。|LIP_SYNC:YES",
  "timeline": "T00:00.0-T00:15.0 / duration: 15s / type: normal / mood: epic",
  "backgroundSound": "AMBIENT: fantasy atmosphere, deep earth rumble 20-60Hz, enchanted wind | SPATIAL: 3D audio panning synchronized with dolly in | INTENSITY: crescendo 0-5s, peak 5-10s, decay 10-15s",
  "prompt": "融合后的最终提示词...",
  "promptCharCount": 1400,
  "referenceImages": ["image://bestiary/baize-front-fullbody.png"],
  "mouthAction": "嘴部自然说话",
  "length": 1400,
  "utilization": 93,
  "utilizationStatus": "🔥理想",
  "qualityScore": {"totalScore": 80},
  "enhanced": true,
  "cameraMovement": {
    "scene": "Nirath荒原",
    "primaryMovement": "dolly_in",
    "speed": "slow",
    "shotSize": "extreme_wide",
    "timeline": {
      "totalDuration": 15,
      "segmentCount": 3,
      "segments": [...]
    }
  },
  "emotionPhase": "epic",
  "importance": 10,
  "visualComplexity": 8
}
```

---

## 九、完整示例：2镜方案（7+8秒）

### 镜头1（S01 - 7秒）

```json
{
  "shotId": "S01",
  "duration": 7,
  "scene": "Nirath晶体峡谷入口，双恒星光照，空间深度：前景岩石，中景通道，背景峡谷",
  "mood": "mysterious, anticipation",
  "camera": "medium shot, tracking forward, 50mm lens, speed 0.8x",
  "lighting": "Aurelius-5800K key from left, Silvana-6500K rim from right, 3200K ambient fill",
  "characterRef": "NONE",
  "character": "NONE",
  "action": "camera tracking forward through canyon entrance, dust particles floating in light beams",
  "dialogue": "NONE",
  "timeline": "T00:00.0-T00:07.0 / duration: 7s / type: establishing / mood: mysterious",
  "backgroundSound": "AMBIENT: deep earth rumble 20-60Hz, dust particles rustling | SPATIAL: approaching footsteps echo | INTENSITY: crescendo 0-3s, sustain 3-7s",
  "prompt": "...",
  "promptCharCount": 1100,
  "referenceImages": [],
  "mouthAction": "NONE",
  "length": 1100,
  "utilization": 73,
  "utilizationStatus": "✅ 达标"
}
```

### 镜头2（S02 - 8秒）

```json
{
  "shotId": "S02",
  "duration": 8,
  "scene": "峡谷核心，白泽站立处，巨型骨架旁，月光从肋骨缝隙漏下",
  "mood": "confrontation, tension beneath surface, vigilance",
  "camera": "low-angle arc shot, 85mm lens, slow orbital track, rack focus skeleton→face",
  "lighting": "moonlight key 5600K from above through rib bones, 2700K warm gold self-illumination from eyes as fill",
  "characterRef": "白泽: image://bestiary/baize-front-fullbody.png",
  "character": "白泽: 狮形异兽, 额间竖眼, 三尾白焰",
  "action": "白泽缓缓转身，面对镜头，额间竖眼睁开，三尾白焰微微燃烧",
  "dialogue": "白泽|独白|低沉威严|这些骨头……还在说话。|LIP_SYNC:YES",
  "timeline": "T00:07.0-T00:15.0 / duration: 8s / type: normal / mood: tense",
  "backgroundSound": "AMBIENT: tension-building drone, heartbeat 40BPM | SPATIAL: arc shot pan L-R | INTENSITY: crescendo 0-4s, peak 4-6s, decay 6-8s",
  "prompt": "...",
  "promptCharCount": 1300,
  "referenceImages": ["image://bestiary/baize-front-fullbody.png"],
  "mouthAction": "嘴部自然说话",
  "length": 1300,
  "utilization": 87,
  "utilizationStatus": "🔥理想"
}
```

---

## 十、时长分配规则

### 10.1 1镜方案（15秒）

```json
{
  "shotId": "S01",
  "duration": 15,
  "type": "climax",
  "prompt": "..."
}
```

### 10.2 2镜方案（7+8秒）

```json
[
  { "shotId": "S01", "duration": 7, "type": "establishing" },
  { "shotId": "S02", "duration": 8, "type": "climax" }
]
```

### 10.3 3镜方案（3+6+6秒）

```json
[
  { "shotId": "S01", "duration": 3, "type": "establishing" },
  { "shotId": "S02", "duration": 6, "type": "discovery" },
  { "shotId": "S03", "duration": 6, "type": "climax" }
]
```

### 10.4 时长分配算法

```
输入：总时长=15秒，场景数=1-3个

算法：
1. 按场景重要性和台词长度分配基础时长
2. 每镜最短3秒，最长15秒
3. 优先保证台词完整（语速4.5字/秒，15秒≤67字）
4. 剩余时间按重要性加权分配
5. 考虑镜头类型：establishing(3-5s) / discovery(5-8s) / climax(8-15s)

输出：每镜时长 + 调整建议
```

---

## 十一、利用率状态说明

| 状态 | 字符范围 | 含义 | 处理建议 |
|------|----------|------|----------|
| 🔥 **理想** | 1200-1500 | 最优利用率 | 无需调整 |
| ✅ **达标** | 1000-1199 | 可接受 | 可优化但非必须 |
| ⚠️ **空间浪费** | <1000 | 需要扩充 | 补充场景细节/运镜/光影 |
| ❌ **超标** | >1500 | 需要截断 | 按字段优先级截断 |

---

## 十二、关键约束（P0级）

1. **无片头**：超短裙系统无片头，直接进入内容镜
2. **总时长15秒**：严格限制，不可超过
3. **镜头数1-3个**：最多3个镜头，最少1个
4. **每镜最短3秒**：低于3秒无法有效叙事
5. **禁止旁白**：仅保留 `dialogue`（对嘴），旁白禁用
6. **字符上限**：每个镜头1500字符
7. **台词上限**：15秒×4.5字/秒=67字
8. **Seedance渲染**：所有音效/台词由 Seedance 渲染，非后期制作
9. **PromptForge优化**：所有内容镜均经过PromptForge优化
10. **阶段级重试**：3次重试，1分钟间隔（v6.5.60）
11. **断点恢复**：检查点文件恢复（v6.5.60）
12. **Nirath宇宙**：所有描述使用Nirath专属语言，禁止地球元素

---

## 十三、全链路字段流转

### 13.1 产出环节

| 字段 | 产出环节 | 产出文件 |
|------|----------|----------|
| shotId | Stage 7 (故事板) | `systems/storyboard-engine.js` |
| duration | Stage 6 (时长分配) | `systems/duration-calculator.js` |
| scene | Stage 7 (故事板) | `systems/storyboard-engine.js` |
| mood | Stage 7 (故事板) | `systems/storyboard-engine.js` |
| camera | Stage 9 (运镜) | `systems/camera-movement.js` |
| lighting | Stage 9 (运镜) | `systems/lighting-engine.js` |
| characterRef | Stage 2/4 (角色系统) | `systems/character-system.js` |
| character | Stage 2/4 (角色系统) | `systems/character-system.js` |
| action | Stage 5 (剧本) | `systems/script-engine.js` |
| dialogue | Stage 5 (剧本) | `systems/script-engine.js` |
| timeline | Stage 6/7 (时长/故事板) | `systems/duration-calculator.js` |
| backgroundSound | Stage 5/11 (剧本/合成) | `systems/sound-design.js` |
| prompt | Stage 11 (合成) | `systems/render-core.js` |
| promptCharCount | Stage 11 (合成) | `systems/render-core.js` |
| referenceImages | Stage 2/4 (角色系统) | `systems/character-system.js` |
| mouthAction | Stage 5 (剧本) | `systems/script-engine.js` |
| cameraMovement | Stage 9 (运镜) | `systems/camera-movement.js` |
| emotionPhase | Stage 5 (剧本) | `systems/script-engine.js` |
| importance | Stage 5/6 (剧本/时长) | `systems/script-engine.js` |
| visualComplexity | Stage 5 (剧本) | `systems/script-engine.js` |

### 13.2 合成环节（Stage 11）

```
输入：shot对象（包含所有字段）
  ↓
1. 提取characterRef → 注入Prompt
2. 提取timeline → 注入Prompt
3. 提取dialogue → 格式化 → 注入Prompt
4. 提取backgroundSound → 结构化 → 注入Prompt
5. 提取character → 极简锚点 → 注入Prompt
6. 提取action → 注入Prompt
7. 提取scene → 五维空间 → 注入Prompt
8. 提取mood → 注入Prompt
9. 提取camera → 12级机位 → 注入Prompt
10. 提取lighting → 主光+色温 → 注入Prompt
  ↓
输出：prompt（≤1500字符）+ 标准输出对象（25字段）
```

### 13.3 审核环节（Stage 12）

| 检查项 | 检查内容 | 通过标准 |
|--------|----------|----------|
| characterRef | 格式、路径、数量 | image://格式，≤9张 |
| character | 极简锚点 | 种族+3-5关键词 |
| timeline | 时间轴格式 | 起止时间+duration+type |
| backgroundSound | 三段式 | AMBIENT+SPATIAL+INTENSITY |
| scene | 五维空间 | ≥2维度 |
| camera | 景别+运镜 | 景别+运镜词 |
| lighting | 光照方案 | 主光+色温 |
| dialogue | 台词格式 | SPEAKER\|TYPE\|EMOTION\|TEXT\|LIP_SYNC:YES |
| prompt长度 | 字符数 | ≤1500 |
| P0字段完整性 | 必填字段 | characterRef/character/dialogue/timeline |

---

## 十四、输出流程

```
输入（projectName + scenes + characters）
  ↓
Stage 0-5: 剧本/角色/时长分配
  ↓
Stage 6-7: 时长分配/故事板（新增字段产出）
  ↓
Stage 9: 运镜系统（camera/lighting优化）
  ↓
Stage 11: 合成（新增字段注入，Prompt融合）
  ↓
Stage 11.5: Prompt质量闸门（视觉内容/人物鲜活度/光影质量）
  ↓
Stage 12: 合规检查（新增字段检查，P0完整性）
  ↓
PromptForge: 子进程优化（70分→90分）
  ↓
Stage 13-16: 最终验证（前置验证+风格注入+后期规则+端到端检查）
  ↓
输出：JSON报告 + Markdown报告 → Seedance API提交
```

---

**文件**：`output/short-video-prompt-schema-v6.5.62.md`
**版本**：v6.5.62 | ShortVideoSystem（超短裙）
**规则**：1-3镜，无片头，总时长15秒，25字段，P0/P1/P2优先级
**参考**：短片提示词数据结构 v6.37-Peng（已优化超越）
**Nirath**：双恒星光照系统，禁止地球元素，独特世界观
