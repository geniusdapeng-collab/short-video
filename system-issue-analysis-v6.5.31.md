# Nirath视频生成系统 v6.5.31 问题全面分析报告

> 提交日期: 2026-06-08  
> 系统版本: v6.5.31 (commit `7ab8a1e`)  
> 分析人: 小G  
> 目标: 供外部专家诊断

---

## 一、背景概述

### 1.1 系统定位
我们正在构建一个 **AI 视频生成预生产系统**（对标 "视频生成行业的 cloud code"），目标是让高质量短片创作触手可及。系统基于 **Seedance 2.0 API**（字节跳动火山引擎视频生成服务）进行视频渲染。

### 1.2 双模式架构
- **Nirath 模式**: 科幻/奇幻题材（异兽、外星场景、双恒星照明）
- **generic 模式**: 真实世界纪录片/科普风格（医疗、教育、真实场景）
- 当前案例: **generic 模式** — 健康科普视频「横纹肌溶解 EP01」

### 1.3 核心工作流（16-20个Stage）
```
PRD文档 → 剧本生成 → 角色系统 → 世界观场景 → 分镜设计 → 
Prompt构建 → 运镜系统 → 导演优化 → 质量门检查 → 输出交付
```

---

## 二、已修复问题（v6.5.31）

### 2.1 `[object Object]` 残留 — 已根治

**问题描述**  
预生产输出的 `prompt` 字段中出现 `[object Object]` 字符串污染，导致质量分卡在 75（C级 WARN）。

**污染示例**（修复前）:
```
电影级镜头, 开场介绍, realistic scene, [object Object], 电影级镜头, 
natural expression and [object Object], natural expression, static shot
```

**根因**  
`CharacterPromptBuilder.build()` 返回的是对象：
```javascript
{
  prompt: "东亚面孔短发年轻男性...",
  layers: { ... },
  stats: { ... },
  negativePrompt: "western face, caucasian..."
}
```

但 `stageCharacters` 方法直接将整个对象存为 `char.prompt`：
```javascript
// 问题代码（修复前）
charPrompt = this.modules.characterPromptBuilder.build(charProfile);
// charPrompt 是对象，但后续被当作字符串使用
```

当 `buildBasePrompt` 做字符串拼接时：
```javascript
// 问题代码（修复前）
shot.characters?.map(cid => {
  const char = characters[cid];
  return { 
    name: cid, 
    appearance: (typeof char?.prompt === 'string' ? 
      char?.prompt?.substring(0, 50) : 
      String(char?.prompt || cid)  // ← 这里！对象转字符串 → "[object Object]"
    ).substring(0, 50) 
  };
})
```

**修复方案**（3处防御式补丁）:

1. **stageCharacters** (line ~1230):
```javascript
charPrompt = this.modules.characterPromptBuilder.build(charProfile);
// v6.5.31-fix: build() returns {prompt, layers, stats, negativePrompt}, extract the string
if (charPrompt && typeof charPrompt === 'object' && charPrompt.prompt) {
  charPrompt = charPrompt.prompt;
}
```

2. **stageRender** Nirath路径 (line ~3937):
```javascript
// v6.5.31-fix: pass char.profile (the actual character profile) instead of wrapper
const minimal = this.modules.characterPromptBuilder.buildMinimal(char.profile || char, { maxChars: 30 });
```

3. **buildBasePrompt** (line ~5554/5586):
```javascript
// v6.5.31-fix: defensive extraction - handle both string and object prompts
let promptText = char?.prompt;
if (promptText && typeof promptText === 'object') {
  promptText = promptText.prompt || promptText.description || promptText.name || String(cid);
}
return { 
  name: cid, 
  appearance: (typeof promptText === 'string' ? promptText.substring(0, 50) : String(promptText || cid)).substring(0, 50) 
};
```

**验证结果**: `grep '[object Object]' output.json` → **0 处匹配** ✅

---

## 三、当前未解决问题（需外部专家诊断）

### 3.1 问题一：角色 Prompt 完全无差异化

**现状**  
3 个角色的 `prompt` 字段完全相同：

```json
// 陈女士 (chen-nurse)
"prompt": "陈女士，28，亲切温和，略带好奇，摄影棚三点布光，背景虚化，专业人像摄影，自然生活化场景"

// 小G (xiaoG)  
"prompt": "小G，28，亲切温和，略带好奇，摄影棚三点布光，背景虚化，专业人像摄影，自然生活化场景"

// 李明教练 (coach-li)
"prompt": "李明教练，28，亲切温和，略带好奇，摄影棚三点布光，背景虚化，专业人像摄影，自然生活化场景"
```

**问题**  
- 年龄全部硬编码为 28 岁（小G 应该是 8 岁男孩）
- 性别特征未区分（陈女士应为女性，小G 为男孩，李明教练为男性）
- 角色身份未体现（护士、8岁男孩、教练）
- 服装/外观未差异化（白大褂、童装、教练服）

**根因分析**  
`CharacterPromptBuilder.build()` 方法似乎忽略了输入角色的 `baseIdentity` 和 `visualIdentity` 数据，或者 `characterManager` 在创建角色档案时未正确写入差异化信息。

**相关代码** (`character-prompt-builder.js` line ~248):
```javascript
build(character, options = {}) {
  // ... 合并权重
  // 构建各层内容
  const layers = {};
  for (const layer of orderedLayers) {
    const content = layer.build(character, angle, sceneType, 
      layer.id === 'expression' ? expression : 
      layer.id === 'environment' ? environment : undefined);
    // ...
  }
  // 最终返回 { prompt, layers, stats, negativePrompt }
}
```

**期望结果**  
每个角色应有差异化描述：
```json
// 陈女士
"prompt": "陈女士，30岁女性，穿白色护士服，短发，专业亲和，健康科普演播室"

// 小G
"prompt": "小G，8岁男孩，穿休闲运动装，短发，好奇活泼，坐于观众席"

// 李明教练
"prompt": "李明教练，35岁男性，穿专业教练服，肌肉线条明显，沉稳专业"
```

---

### 3.2 问题二：角色约束硬编码 "小G"

**现状**  
Prompt 中角色约束字段显示：
```
【角色约束】画面中仅出现一个小G, , 禁止重复角色
```

**问题**  
- 应该显示所有在场角色（陈女士、小G、李明教练）
- 逗号后有额外空格
- 可能来源于 `shot.characters` 数组处理逻辑错误

**相关代码** (`nirath-master-pipeline.js` 或 `prompt-builder.js`):
角色约束的生成逻辑疑似只取 `shot.characters[0]` 或硬编码了主角名。

**期望结果**:
```
【角色约束】画面中仅出现陈女士、小G、李明教练，禁止重复角色
```

---

### 3.3 问题三：环境布景 Nirath 科幻残留

**现状**  
generic 模式的 prompt 中出现了 Nirath 科幻描述：
```
【环境布景】中景原始发光毯覆盖地表，随磁场脉动明暗。
生态活跃：原始单细胞发光毯覆盖地表；矿物结晶生长过程缓慢可见。
禁止塑料/CG质感，禁止光秃秃/荒芜/寸草不生
```

**问题**  
- "发光毯覆盖地表"、"磁场脉动"、"矿物结晶" 是 Nirath 外星场景特征
- generic 模式应该是：社区健康讲座现场、医院检验科、健身科普教室
- 尽管已有多处 `if (this.mode !== 'nirath')` 守卫，但环境布景仍有渗漏

**相关代码** (`nirath-master-pipeline.js` line ~4481 或 `prompt-builder.js`):
环境布景的注入逻辑可能未被 mode 守卫覆盖。

**期望结果**:
```
【环境布景】明亮整洁的健康科普演播室，白色墙面，人体肌肉解剖示意图，
健身器材陈列架，柔和均匀的演播室灯光
```

---

### 3.4 问题四：质量分仍低（34-36 / 目标 90+）

**现状**  
修复后质量分仍然很低：
```json
S01: 34分
S02: 34分  
S03: 36分
S04: 34分
S05: 34分
```

**质量分维度**:
```json
{
  "cameraVariety": 0,        // 运镜多样性
  "lightingProgression": 8,  // 光影递进
  "emotionalDepth": 7-9,   // 情绪深度
  "promptUtilization": 15, // Prompt利用率
  "narrativeAlignment": 4,  // 叙事对齐
  "totalScore": 34-36,
  "segmentCount": 0
}
```

**问题分析**  
- `cameraVariety: 0` — 所有镜头都是 `static shot`，没有变化
- `promptUtilization: 15` — 远低于 490 字符上限（利用率可能只有 15%）
- `narrativeAlignment: 4` — 与叙事对齐度极低
- `segmentCount: 0` — 没有分段

**可能原因**:
1. 质量评分算法本身可能有 bug（比如 `segmentCount` 为 0 但 prompt 实际有内容）
2. Prompt 结构问题（大量重复内容，如角色描述重复 3 次）
3. 缺少动态运镜（全部 static）

**期望结果**: 质量分达到 90+（A级）

---

## 四、关键代码文件清单

| 文件 | 作用 | 相关行 |
|------|------|--------|
| `systems/nirath-master-pipeline.js` | 主链路控制器 | ~1230 (stageCharacters), ~3937 (stageRender), ~5554 (buildBasePrompt) |
| `systems/character-prompt-builder.js` | 角色Prompt构建 | ~248 (build), ~591 (buildMinimal) |
| `systems/prompt-builder.js` | Prompt组装 | ~4150 (buildBasePrompt) |
| `systems/prompt-tier-architecture.js` | Tier分层架构 | ~114 (_buildTier1) |
| `systems/prompt-channel-separator.js` | 通道分离 | ~1 (separate) |
| `systems/worldview-scene-manager.js` | 场景管理 | ~243 (getSceneVisualCore) |
| `systems/camera-movement-system-v3.js` | 运镜系统 | ~348 (generateTimeline) |
| `systems/character-manager-v2.js` | 角色档案管理 | ~1 (createCharacter) |

---

## 五、系统架构图

```
输入: 项目配置 (generic模式, 健康科普主题)
  ↓
STAGE-1: PRD中央校准
STAGE-2: 需求对齐闸机
STAGE-3: Schema校验
STAGE-4: 角色系统 (CharacterManagerV2 + CharacterPromptBuilder)
  → 问题: 3角色prompt完全相同
  
STAGE-5: 剧本生成 (LLM驱动)
STAGE-5B: 视觉Prompt生成
  
STAGE-6: 场景设计
STAGE-7: 分镜构建
  → 问题: 角色约束硬编码"小G"
  
STAGE-8: 运镜系统 (CameraMovementSystemV3)
  → 问题: 全部static shot, cameraVariety=0
  
STAGE-9: 导演优化
STAGE-10: Prompt构建 (PromptBuilder + PromptTierArchitecture + PromptChannelSeparator)
  → 问题: 环境布景Nirath残留
  → 已修复: [object Object]残留
  
STAGE-11: 质量门检查
  → 问题: 质量分34-36 (目标90+)
  
STAGE-12~16: 输出交付
```

---

## 六、期望结果总结

我们需要系统达到以下状态：

1. **角色差异化**: 每个角色有符合身份的年龄、性别、服装、外观描述
2. **角色约束正确**: 显示所有在场角色，不硬编码单一角色
3. **环境真实**: generic 模式完全清除 Nirath 科幻元素，使用真实场景描述
4. **质量分达标**: 90+ 分（A级），或至少明确质量分算法是否合理
5. **系统健壮**: 避免 `[object Object]` 这类类型错误再次发生

---

## 七、附件信息

- **输出文件**: `output/rhabdomyolysis-ep01-preproduction.json` (约 7000+ 行)
- **发布记录**: `releases/v6.5.31-release-notes.md`
- **当前版本**: `.current-version` → `v6.5.31`
- **Git状态**: `7ab8a1e` (已提交)

---

## 八、专家问题建议

请外部专家重点分析：

1. **角色差异化机制**: `CharacterPromptBuilder` 为何输出相同 prompt？是输入数据问题还是构建逻辑问题？
2. **质量分算法**: `cameraVariety=0` / `segmentCount=0` 是算法 bug 还是 prompt 确实有问题？
3. **模式隔离完整性**: 为何 `if (this.mode !== 'nirath')` 守卫未覆盖环境布景注入？
4. **架构设计建议**: 当前 16-20 Stage 链路是否有更优雅的防错设计（如 TypeScript 类型检查）？

---

*报告完毕，等待专家诊断。*
