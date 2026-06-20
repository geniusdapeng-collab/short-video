# RELEASE-v6.0-patch25.md

## Seedance视频生成统一平台 v6.0-patch25 发布

**发布日期**: 2026-05-24
**发布人**: 小G
**项目**: 《九尾狐·迷局》EP生产 + 系统升级

---

## 本次升级内容（5大系统升级）

### 1. 镜头信息密度/时间轴/运镜优化

**问题**: Prompt构建器只生成静态描述，缺少动态时间轴和情绪节奏控制，导致镜头太平淡、节奏感不足、信息密度低。

**解决方案**:
- 每镜Prompt改为**3段时间轴**格式：
  ```
  0-2秒：[第一段运镜+光影+情绪]
  2-4秒：[第二段运镜+光影+情绪]
  4-6秒：[第三段运镜+光影+情绪]
  ```
- **情绪-运镜匹配算法**: tension值映射到运镜速度
  - 0.1-0.3 → 缓慢（沉静）
  - 0.4-0.6 → 中速（紧张）
  - 0.7-0.9 → 快速（激烈）
  - 1.0 → 极快+定格（高潮）

**文件变更**:
- `systems/prompt-builder-v2.js` - 新增时间轴生成逻辑
- `systems/emotion-movement-mapper.js` - 情绪-运镜映射模块（新增）

---

### 2. S01集名展示系统（通用规则编码）

**问题**: 第一镜缺少集名展示，需要人工后期添加。

**解决方案**:
- **通用规则**编码进Prompt构建器：第一幕第一镜（S01）前3秒强制展示集名
- **定制化内容**来自EP元数据：主标题+副标题（如"九尾狐·迷局"+"大鹏出品"）
- **融入方式**自动匹配场景：山峰刻字、石碑铭文、卷轴、烟雾字形、光芒粒子

**文件变更**:
- `submit-jiuwei-render.js` - 新增 `buildFullPrompt(shot, episodeTitle, episodeAuthor)`
- `systems/title-display-designer.js` - 集名展示设计模块（新增）

---

### 3. 定妆照修复系统（角色权重保护）

**问题**: S06/S07/S08等小G定妆照未生效，角色形象随机变化。

**根因**:
- wide/closing镜头人物比例小→角色描述被环境稀释
- 仅使用front参考图→缺少景别匹配
- Prompt构建器未针对closing镜头优化

**解决方案**:
- **景别判断系统**: 根据narration和type自动判断shotSize
- **双参考图策略**: wide/closing镜头自动启用front+threeQuarter双参考图
- **角色权重保护**: 
  - 角色描述前置（增加权重）
  - 【强制一致】面部特征严格参照定妆照
  - 画面中央显著位置，上半身清晰

**文件变更**:
- `submit-jiuwei-render.js` - 新增 `determineShotSize()`、`getMultiAngleReferences()`、`buildFullPrompt()`

---

### 4. TTS旁白系统

**问题**: narration旁白未烧录到视频中，仅生成JSON占位文件。

**解决方案**:
- 使用 **edge-tts**（Microsoft Edge TTS）生成音频
- 音色：zh-CN-XiaoxiaoNeural（晓晓，中文女声）
- 自动合并到每个视频镜头（ffmpeg concat+aac编码）

**文件变更**:
- `scripts/generate-jiuwei-tts-audio.py` - TTS音频生成（新增）
- `scripts/merge-jiuwei-audio.py` - 音频合并到视频（新增）
- `scripts/merge-jiuwei-final-v4.py` - 最终成片合成（新增）

---

### 5. 异兽尺寸比例控制系统（新增）

**问题**: 异兽档案有height字段，但Prompt构建器完全未使用，导致异兽和人物比例随机。

**解决方案**:
- 读取异兽档案中的 **scale/bodyPlan** 数据
- 自动计算 **尺寸比例**（异兽身高/人物身高）
- 根据 **景别差异化** 生成比例描述：
  - wide: "20米高的九尾狐全貌，小G在其脚下如昆虫般渺小"
  - medium: "九尾狐一只眼睛占据画面40%，瞳孔中倒映小G如蚂蚁"
  - closeup: "小G面部特写，背景中九尾狐尾巴如山脉般横亘"

**文件变更**:
- `scripts/beast-scale-controller.js` - 尺寸比例控制模块（新增）

---

## 生产验证

### 九尾狐EP v4成片
- **时长**: 57秒（S01增至9秒）
- **分辨率**: 1280x720 (16:9)
- **镜头数**: 8镜
- **文件大小**: 22.58MB
- **TTS旁白**: ✅ 8镜全部烧录
- **字幕**: ❌ 已移除

### S01-v4 集名展示验证
- 3秒开场展示"九尾狐·迷局"+"大鹏出品"
- 融入环境元素：山峰刻字/石碑/卷轴/烟雾字形

### S06-v2 定妆照修复验证
- 角色描述前置+强制构图+双参考图

### TTS旁白验证
- 8镜全部生成音频（edge-tts，晓晓女声）
- 音频已合并到视频

---

## 文件清单

### 新增文件
| 文件 | 功能 | 行数 |
|------|------|------|
| `systems/emotion-movement-mapper.js` | 情绪-运镜映射 | 150行 |
| `systems/title-display-designer.js` | 集名展示设计 | 120行 |
| `scripts/generate-jiuwei-tts-audio.py` | TTS音频生成 | 60行 |
| `scripts/merge-jiuwei-audio.py` | 音频合并 | 50行 |
| `scripts/merge-jiuwei-final-v4.py` | 最终成片合成 | 45行 |
| `scripts/beast-scale-controller.js` | 异兽尺寸比例控制 | 200行 |

### 修改文件
| 文件 | 修改内容 |
|------|---------|
| `submit-jiuwei-render.js` | 新增时间轴、集名展示、角色权重保护 |
| `prompt-builder-v2.js` | 新增动态时间轴生成 |

---

## 版本号更新

```
v6.0-patch24 → v6.0-patch25
```

---

## 经验教训

1. **通用规则 vs 定制化内容**: 系统级规则（第一镜展示集名）和EP级变量（具体集名文字）必须区分清楚
2. **角色一致性需要景别匹配**: wide镜头不能只用front参考图，需要双图策略
3. **TTS不能只做占位**: JSON配置≠实际音频，必须调用真实TTS API
4. **异兽尺寸必须注入Prompt**: 档案数据如果不主动注入Prompt，渲染时会被忽略

---

## 下一步

1. 等待队长对v4成片的审阅反馈
2. 根据反馈进一步优化（如节奏感、信息密度）
3. 将今日升级合并到SYSTEM.md版本历史

---

**Stay Brutally Honest. 🔥**
