# v6.5.59 全链路字段排查报告

## 排查时间：2026-06-12
## 版本：v6.5.59
## 排查范围：Stage 7 → Stage 16 全链路字段生成与消费

---

## 1. Stage 7: 故事板生成 (Storyboard)

### 生成字段（shot 对象）：
| 字段 | 来源 | 类型 | 说明 |
|------|------|------|------|
| id | 自动分配 S01-S06 | string | 镜头ID |
| scene | 输入场景 | string | 场景名称 |
| narration | 禁用（v6.5.34） | string | 空字符串 |
| dialogue | 输入/生成 | string | 台词 |
| duration | 输入/计算 | number | 时长（秒） |
| type | 推断/输入 | string | 镜头类型 (building/climax/etc) |
| characters | 输入/推断 | array | 角色ID列表 |
| mouthAction | 输入/生成 | string | 嘴部动作描述 |
| importance | 输入/默认 | number | 重要性 1-10 |
| visualComplexity | 输入/默认 | number | 视觉复杂度 1-10 |
| emotionPhase | 输入/推断 | string | 情绪阶段 |
| fpvRecommended | 输入 | boolean | FPV推荐 |
| prompt | 输入/生成 | string | 初始Prompt |
| cameraMovement | 初始 null | object | 运镜对象（Stage 9填充） |

### 片头 S00 特殊字段：
| 字段 | 来源 | 说明 |
|------|------|------|
| isOpening | true | 标记为片头 |
| title | opening-system-v3.js | 标题对象（v6.5.59新增） |
| postProduction | opening-system-v3.js | 后期包装指令（v6.5.59新增） |

---

## 2. Stage 7.5: 片头生成 (Opening System)

### 输入：
- input.projectName, input.title, input.beastId, input.characters 等

### 生成字段（openingResult）：
| 字段 | 类型 | 说明 |
|------|------|------|
| prompt | string | 片头Prompt |
| length | number | Prompt长度 |
| cameraPlan | array | 运镜计划 |
| complianceCheck | object | 合规检查 |
| truncationApplied | boolean | 是否截断 |
| postProduction | object | 后期包装指令 |
| referenceImages | array | 定妆照路径 |
| content | array | 内容数组 |
| **title** | **object** | **标题对象（v6.5.59新增）** |
| **isOpening** | **boolean** | **true（v6.5.59新增）** |
| **duration** | **number** | **9（v6.5.59新增）** |

### 注入 shot 对象：
- shot.title = openingResult.title
- shot.postProduction = openingResult.postProduction
- shot.prompt = openingResult.prompt
- shot.isOpening = true

---

## 3. Stage 8: 故事板验证 (Storyboard Validation)

### 输入：
- storyboard.shots (来自 Stage 7)

### 消费字段：
- shot.id, shot.duration, shot.mouthAction, shot.dialogue, shot.narration

### 输出：
- validation 对象（含 passed, errors, warnings, alignmentChecks 等）

---

## 4. Stage 9: 运镜生成 (Camera Movement)

### 输入：
- shot.cameraMovement（初始为 null）
- shot.type, shot.scene, shot.emotionPhase, shot.duration
- shot.fpvRecommended, shot.shotSize, shot.speed, shot.movement

### 生成字段（movement 对象）：

**片头 S00：**
| 字段 | 值 | 说明 |
|------|-----|------|
| description | "片头运镜由opening-system-v3.js控制" | 固定描述 |
| isOpening | true | 标记 |
| timeline | null | 片头无时间轴 |

**FPV 镜头：**
| 字段 | 类型 | 说明 |
|------|------|------|
| description | string | FPV描述 |
| isFPV | true | 标记 |
| fpvScore | number | 分数 |
| timeline | object | v3时间轴（多段） |
| movementType | string | 运动类型 |

**普通镜头（Nirath）：**
| 字段 | 类型 | 说明 |
|------|------|------|
| description | string | 运镜描述 |
| timeline | object | 多段式时间轴 |
| v3Enabled | true | 标记 |
| transitionType | string | 转场类型 |
| lightingType | string | 灯光类型 |
| speedCurve | string | 速度曲线 |
| shotType | string | 景别类型 |
| cameraAngle | string | 角度 |
| noFaceCloseUp | boolean | 无面部特写 |

**普通镜头（generic）：**
| 字段 | 类型 | 说明 |
|------|------|------|
| description | string | 运镜描述 |
| movementType | string | 运动类型 |
| shotSize | string | 景别 |
| speed | string | 速度 |

### 注入 shot 对象：
- shot.cameraMovement = movement（所有镜头类型）
- shot._segments = timeline.segments（普通镜头）
- shot._segmentCount = timeline.segmentCount（普通镜头）
- shot._timeline = timeline（普通镜头）

### 输出：
- movements 数组：{ shotId, movement, isFPV }

---

## 5. Stage 10: 连续性检查 (Continuity)

### 输入：
- storyboard.shots (含 shot.cameraMovement)

### 消费字段：
- shot.id, shot.characters, shot.scene, shot.prompt 等

---

## 6. Stage 11: 渲染 (Render) - 核心环节

### 输入：
- shot（含 cameraMovement, mouthAction, dialogue, scene, type 等）
- stages（含 characters, camera 等）

### 旧链路字段消费：
1. **buildPromptV3** 消费：
   - sceneName: shot.scene
   - script: enrichedScript（含 visualPrompt, scene.nirathName, scene.description, extendedNarrative）
   - narration: shot.dialogue（v6.5.34禁用narration）
   - characters: shot.characters
   - characterProfiles: 从 stages.characters 构建
   - type: shot.type
   - emotionPhase: shot.emotionPhase
   - movement: shot.cameraMovement
   - mouthAction: shot.mouthAction
   - visualComplexity: shot.visualComplexity
   - importance: shot.importance
   - styleConstraint

2. **新链路 FinalPromptBuilderV3** 消费：
   - shot（完整对象）
   - context（总镜头数、主角名、异兽ID等）

### 输出字段（prompts 数组元素）：

**v6.5.59 标准输出结构：**

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| shotId | string | shot.id | 镜头ID |
| id | string | shot.id | 兼容字段 |
| type | string | shot.type | 镜头类型 |
| scene | string | shot.scene | 场景名称 |
| prompt | string | 生成 | 最终Prompt |
| referenceImages | array | 生成 | 定妆照路径 |
| duration | number | shot.duration | 时长 |
| length | number | 计算 | Prompt长度 |
| mouthAction | string | shot.mouthAction | 嘴部动作 |
| utilization | number | 计算 | 利用率百分比 |
| utilizationStatus | string | 计算 | 状态标签 |
| qualityScore | object | 计算 | 质量评分 |
| enhanced | boolean | true | 标记 |
| cameraMovement | object | shot.cameraMovement | 运镜对象（内容镜） |
| emotionPhase | string | shot.emotionPhase | 情绪阶段 |
| importance | number | shot.importance | 重要性 |
| visualComplexity | number | shot.visualComplexity | 视觉复杂度 |
| dialogue | string | shot.dialogue | 台词 |
| narration | string | shot.narration | 旁白（禁用） |
| isOpening | boolean | 计算 | 是否片头 |
| title | object | shot.title | 标题对象（片头专属） |

---

## 7. Stage 12: 合规检查 (Compliance)

### 输入：
- stages (含 shot.qualityScore, shot.enhanced 等)
- renderResults（来自 Stage 11）

### 消费字段：
- renderResults.shotId, renderResults.prompt, renderResults.duration
- renderResults.mouthAction, renderResults.length
- renderResults.qualityScore
- renderResults.title（片头，v6.5.59新增）
- renderResults.isOpening（v6.5.59新增）

### 输出：
- compliance 对象（含 passed, errors, warnings, checks 等）

---

## 8. Stage 14: PromptForge 增强

### 输入：
- prompts（来自 Stage 11）
- stages（含 storyboard, camera 等）

### 消费字段：
- prompts.shotId, prompts.prompt, prompts.length
- prompts.qualityScore, prompts.enhanced
- prompts.cameraMovement（v6.5.59新增）

### 输出：
- enhancedPrompts（增强后的 prompts）
- qualityReport（质量报告）

---

## 9. Stage 15: 质量评分 (Quality Gate)

### 输入：
- prompts（来自 Stage 11 或 Stage 14）

### 消费字段：
- prompts.length, prompts.prompt, prompts.mouthAction
- prompts.qualityScore（旧链路生成）
- prompts.cameraMovement（v6.5.59新增）

### 输出：
- qualityGate 对象（含 score, passed, grade, issues 等）

---

## 10. Stage 16: 最终提交 (Final Submit)

### 输入：
- prompts（最终渲染产物）

### 消费字段：
- prompts.shotId, prompts.prompt, prompts.referenceImages
- prompts.duration, prompts.length, prompts.mouthAction
- prompts.utilization, prompts.utilizationStatus
- prompts.qualityScore, prompts.enhanced
- prompts.title（片头，v6.5.59新增）
- prompts.isOpening（v6.5.59新增）

### 输出：
- submitResults 数组（提交到渲染引擎）

---

## 11. 端到端字段映射验证

### 片头 S00 字段映射：
```
Stage 7.5 (opening-system-v3.js)
  ├─ title.main → shot.title.main
  ├─ title.sub → shot.title.sub
  ├─ title.creator → shot.title.creator
  ├─ title.episodeName → shot.title.episodeName
  ├─ title.displayTiming → shot.title.displayTiming
  ├─ title.position → shot.title.position
  ├─ title.style → shot.title.style
  ├─ isOpening → shot.isOpening
  └─ duration → shot.duration

Stage 11 (Render)
  ├─ shot.title → prompt.title (标准输出)
  ├─ shot.isOpening → prompt.isOpening (true)
  └─ shot.duration → prompt.duration (9)

Stage 12 (Compliance)
  └─ prompt.title → 检查主标题/副标题格式

Stage 16 (Final Submit)
  └─ prompt.title → 提交到渲染引擎
```

### 内容镜 S01-S06 字段映射：
```
Stage 7 (Storyboard)
  ├─ scene → shot.scene
  ├─ dialogue → shot.dialogue
  ├─ duration → shot.duration
  ├─ type → shot.type
  ├─ characters → shot.characters
  ├─ mouthAction → shot.mouthAction
  ├─ importance → shot.importance
  ├─ visualComplexity → shot.visualComplexity
  └─ emotionPhase → shot.emotionPhase

Stage 9 (Camera Movement)
  └─ shot.* → movement 对象 → shot.cameraMovement

Stage 11 (Render)
  ├─ shot.scene → sceneName (buildPromptV3)
  ├─ shot.dialogue → narration
  ├─ shot.duration → duration
  ├─ shot.type → type
  ├─ shot.characters → characters
  ├─ shot.mouthAction → mouthAction
  ├─ shot.importance → importance
  ├─ shot.visualComplexity → visualComplexity
  ├─ shot.emotionPhase → emotionPhase
  ├─ shot.cameraMovement → movement
  └─ 所有字段 → prompts 标准输出

Stage 12 (Compliance)
  └─ prompts.* → 合规检查

Stage 14 (PromptForge)
  └─ prompts.cameraMovement → 质量检查

Stage 16 (Final Submit)
  └─ prompts.* → 提交渲染
```

---

## 12. 发现的问题与修复

### 问题1：旧链路缺少标准字段
**状态：** ✅ 已修复（v6.5.59）
**描述：** 旧链路 push 的 prompts 对象只有 8 个字段（shotId, prompt, referenceImages, duration, length, mouthAction, utilization, utilizationStatus, qualityScore, enhanced），缺少 id, type, scene, cameraMovement, emotionPhase, importance, visualComplexity, dialogue, narration, isOpening。
**修复：** 在旧链路 push 代码中添加所有标准字段。

### 问题2：新链路缺少标准字段
**状态：** ✅ 已修复（v6.5.59）
**描述：** 新链路 push 的 prompts 对象同样缺少标准字段。
**修复：** 在新链路两处 push 代码中添加所有标准字段。

### 问题3：片头缺少 title 对象
**状态：** ✅ 已修复（v6.5.59）
**描述：** 片头 shot 和 render 输出中没有 title 对象，title 信息只存在于 prompt 文本中。
**修复：** 
1. opening-system-v3.js 返回对象中添加 title 对象和 isOpening 标记
2. nirath-master-pipeline.js 片头 shot 注入 title 和 postProduction
3. 片头 push 代码注入 title 对象

### 问题4：片头 duration 不一致
**状态：** ✅ 已修复（v6.5.59）
**描述：** 片头 shot.duration 可能为 9，但 Stage 11 片头处理代码中 duration: shot.duration 可能不是 9。
**修复：** 片头 push 代码中 duration 固定为 9。

### 问题5：validator 缺少标准字段检查
**状态：** ✅ 已修复（v6.5.59）
**描述：** pipeline-integrity-validator.js 没有检查标准字段的完整性。
**修复：** 
1. Stage 11 添加标准字段检查（_checkStage11_Render）
2. Stage 12 添加片头 title 字段检查（_checkStage12_Compliance）
3. 新增 Stage 16.5 标准字段完整性检查（_checkStage16_FieldIntegrity）

---

## 13. 验证结果

### 语法检查：
- ✅ pipeline-integrity-validator.js: 通过
- ✅ nirath-master-pipeline.js: 通过
- ✅ opening-system-v3.js: 通过

### 字段覆盖检查：
- ✅ 通用必填字段：shotId, prompt, duration, length, utilization, mouthAction, qualityScore, enhanced
- ✅ 片头专属字段：isOpening, title (main, sub, creator, episodeName, displayTiming, position, style)
- ✅ 内容镜专属字段：cameraMovement, emotionPhase, importance, visualComplexity
- ✅ 兼容字段：id, type, scene, dialogue, narration

### 链路贯通检查：
- ✅ Stage 7 → Stage 9: shot.cameraMovement 正确注入
- ✅ Stage 7 → Stage 11: shot.* 字段正确消费
- ✅ Stage 9 → Stage 11: movement 字段正确消费
- ✅ Stage 11 → Stage 12: prompts 字段正确传递
- ✅ Stage 11 → Stage 14: prompts 字段正确传递
- ✅ Stage 11 → Stage 16: prompts 字段正确传递

---

## 14. 结论

✅ **v6.5.59 全链路字段排查完成**

所有字段生成与消费环节已验证通过。标准字段检查已集成到 pipeline-integrity-validator.js 的 Stage 11、Stage 12 和 Stage 16.5 中。

修改文件清单：
1. `/systems/opening-system-v3.js` - 添加 title, isOpening, duration
2. `/systems/nirath-master-pipeline.js` - 添加标准字段到所有 push 代码
3. `/systems/pipeline-integrity-validator.js` - 添加标准字段检查
4. `/.current-version` - 更新到 v6.5.59

