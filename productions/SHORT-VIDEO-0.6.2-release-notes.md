# SHORT-VIDEO-0.6.2-social-media-gate 发布记录

## 发布版本
- **版本号**: `SHORT-VIDEO-0.6.2-social-media-gate`
- **上一版本**: `SHORT-VIDEO-0.6.1-social-media-fix`
- **发布时间**: 2026-06-09
- **Git 提交**: `84203a7`
- **远程仓库**: https://github.com/geniusdapeng-collab/short-video

## 修复内容

### 1. 社媒营销模式硬阻断规则修复（核心）
**问题**: `quality-gate.js` 的 `applyHardBlockRules` 只检查 `isShortVideoMode`，没有检查 `isSocialMediaMode`，导致社媒模式使用标准硬阻断规则，而非 `quality-dimensions-social.js` 中的专用规则。

**修复**:
```javascript
// 修复前：
const rules = isShort
  ? require('../config/quality-dimensions-short').hardBlockRules
  : qualityConfig.hardBlockRules;

// 修复后：
const isSocial = context && context.isSocialMediaMode;
const rules = isSocial
  ? require('../config/quality-dimensions-social').hardBlockRules
  : isShort
    ? require('../config/quality-dimensions-short').hardBlockRules
    : qualityConfig.hardBlockRules;
```

**社媒模式硬阻断规则**（与标准模式不同）：
- `requireSystemIntegrity: false`（社媒放宽完整性）
- `requireRenderReadiness: true`
- `requirePromptText: true`
- `requireShots: true`
- `requireTimelineSegments: false`（建议级别，非强制）

### 2. 输入配置明确标记社媒类型
- `xiangxiang-maldives-input.json`: `videoType` 从 `"generic"` → `"social"`
- 明确触发社媒营销链路，确保所有社媒专用逻辑激活

## 社媒营销系统当前状态（三核心升级）

| 模块 | 状态 | 说明 |
|------|------|------|
| **质量门** `quality-gate.js` | ✅ 完成 | `isSocialMediaMode` 检测、10维度评估（含新增 `visualImpact`）、社媒硬阻断规则 |
| **计分器** `quality-reporter.js` | ✅ 完成 | 自动加载 `quality-dimensions-social.js` 权重配置，80分及格线 |
| **时长分配器** `shot-duration-allocator.js` | ✅ 完成 | 支持 `minDuration: 3` / `maxDuration: 15`，输入 `shotCount: 3` 由场景数组控制 |

### 质量门10维度评估（社媒模式）
1. `promptQuality` (20%) - Prompt质量，每字都是金子
2. `hookStrength` (20%) - 钩子强度，黄金3秒定生死
3. `visualImpact` (20%) - 视觉爆发力，咔咔咔冲击力
4. `rhythmTightness` (15%) - 节奏紧凑度，不浪费1帧
5. `densityScore` (10%) - 信息密度，15秒每帧满载
6. `storyQuality` (5%) - 弱化叙事，讲情绪
7. `continuityQuality` (3%) - 弱化连续性
8. `directorQuality` (3%) - 弱化导演空间
9. `renderReadiness` (5%) - 渲染就绪度
10. `systemIntegrity` (3%) - 系统完整性

### 视觉爆发力评估指标
- 时间轴细分：`【镜头时间轴·咔咔咔节奏】` + 逐秒时间轴标记
- 景别切换：广角/全景/中景/近景/特写/微距/大特写
- 人物表情变化：眉毛/瞳孔/嘴角/眼角/笑容/大哭/震惊
- 爆发力关键词：炸裂/爆炸/冲击/碾压/海啸/子弹/闪电
- 运镜密度：推进/拉远/环绕/俯冲/仰冲/悬浮/定格

## 文件变更
- `systems/quality-gate.js` - 社媒模式硬阻断规则修复
- `stories/xiangxiang-maldives-input.json` - videoType 改为 social

## 验证记录
- 社媒模式检测：input.style 包含 "社媒" / "营销" / "抖音" / "转化率" → 触发 ✅
- 或 input.videoType === 'social' → 触发 ✅
- 质量门权重：自动加载 `quality-dimensions-social.js` ✅
- 硬阻断规则：社媒专用规则（放宽完整性）✅

## 下一步
重新跑预生产验证社媒营销效果（超能力宝宝 + 社媒模式）！
