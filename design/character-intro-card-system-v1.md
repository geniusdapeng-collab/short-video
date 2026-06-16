# 人物出场卡片系统设计方案

> **版本**: v1.0
> **提出者**: 大鹏
> **设计者**: 小G
> **日期**: 2026-06-16
> **状态**: 待队长确认后开发

---

## 一、问题背景

### 当前痛点
健康科普视频（generic模式）中，角色自我介绍存在「重复啰嗦」问题：

| 镜头 | 当前台词 | 问题 |
|------|---------|------|
| S01 | "大家好，我是陈卓。今天我们来认识..." | ✅ 首次介绍，合理 |
| S02 | "我是陈卓。横纹肌溶解的本质..." | ❌ 重复自我介绍 |
| S03 | "陈卓：如果你发现..." | ⚠️ 角色标注生硬 |
| S04 | "陈卓：有三类人..." | ⚠️ 角色标注生硬 |
| S05 | "我是陈卓，科学运动..." | ❌ 结尾重复身份 |

**根因**：系统缺乏「角色出场标记」机制，导致每段台词都硬编码身份信息。

---

## 二、核心思路

**用「人物出场卡片」替代台词中的硬编码自我介绍**

> 就像影视剧/纪录片中的人物介绍字幕卡片，在角色首次出场时以视觉方式呈现身份信息，后续镜头直接进入主题内容。

### 参考案例

**纪录片风格**：
```
┌─────────────────────┐
│  陈卓              │
│  健康教育主讲人    │
│  资深护士          │
└─────────────────────┘
（画面：陈卓半身像，微笑面向镜头）
```

**新闻采访风格**：
```
┌─────────────────────┐
│  Dr. Chen          │
│  健康科普专家       │
└─────────────────────┘
（画面：右下角弹出，2秒后淡出）
```

---

## 三、系统设计方案

### 3.1 数据层设计

#### 新增字段：`characterIntroCard`（人物出场卡片）

```javascript
// 在 shot 对象中新增
{
  id: "S01",
  scene: "开场介绍",
  dialogue: "今天我们来认识横纹肌溶解。", // 移除"我是陈卓"
  
  // 新增：人物出场卡片
  characterIntroCard: {
    enabled: true,              // 是否启用卡片
    characterId: "chen-nurse",  // 角色ID
    displayStyle: "documentary", // 展示风格：documentary|news|minimal
    displayTiming: "0-2s",      // 展示时机（镜头内的时段）
    position: "lower-third",    // 位置：lower-third|center|side
    content: {
      name: "陈卓",
      title: "健康教育主讲人",
      subtitle: "资深护士",
      avatar: true              // 是否显示头像
    }
  }
}
```

#### 角色首次出场标记

```javascript
// 在 pipeline 阶段标记
{
  characters: {
    "chen-nurse": {
      id: "chen-nurse",
      name: "陈卓",
      firstAppearance: "S01",    // 首次出场镜头
      introCardDelivered: false  // 卡片是否已投放
    }
  }
}
```

### 3.2 生成流程（Pipeline集成）

```
Stage 5: 剧本/台词生成
  ↓
Stage 5.5: 角色出场分析（新增）
  - 扫描所有 scenes，识别每个角色的首次出场
  - 为首次出场镜头标记 introCard: true
  - 后续出场镜头标记 introCard: false
  ↓
Stage 6: 台词优化（修改）
  - 如果 introCard === true：
    → 台词中允许保留自我介绍（"大家好，我是陈卓"）
    → 同时生成 characterIntroCard 字段
  - 如果 introCard === false：
    → 台词中移除所有自我介绍前缀
    → 直接输出主题内容
  ↓
Stage 11: 渲染核心（修改）
  - 如果 shot.characterIntroCard?.enabled === true：
    → 在 prompt 中注入【人物卡片】字段
    → 卡片与画面一同渲染
```

### 3.3 Prompt 注入格式

#### 方案A：画面内字幕（推荐）

```
【人物卡片-纪录片风格】
画面下方三分之一处（lower-third）浮现人物信息卡片：
- 卡片背景：半透明毛玻璃质感，圆角矩形
- 排版：左侧头像缩略图（圆形裁切）+ 右侧文字
- 文字内容：
  第一行「陈卓」—— 18pt 粗体，白色
  第二行「健康教育主讲人 | 资深护士」—— 14pt 常规，浅灰色
- 动画：从下方滑入（translateY: 30px → 0），持续0.5秒，带轻微弹性缓动
- 停留：2秒后自动淡出（opacity: 1 → 0）
- 整体风格：专业、干净、不抢戏
```

#### 方案B：独立开场镜头

增加一个 S00.5 镜头（1-2秒）：
```
镜头 S00.5 — 人物出场卡片

【画面】陈卓半身像居中，背景为柔和渐变
【卡片】画面中央浮现信息卡片
  - 头像：陈卓正面照，圆形裁切，带2px白色描边
  - 姓名：陈卓（24pt，粗体，深色）
  - 职称：健康教育主讲人（16pt，常规）
  - 单位：健康科普团队（14pt，浅灰）
【动效】卡片从中心放大出现（scale: 0.8 → 1），伴随轻微光晕
【时长】1.5秒
```

### 3.4 台词生成规则（系统级）

#### 规则1：首次出场检测
```javascript
function analyzeCharacterAppearance(scenes, characters) {
  const appearanceMap = {};
  
  for (const scene of scenes) {
    const sceneChars = scene.characters || [];
    for (const charId of sceneChars) {
      if (!appearanceMap[charId]) {
        appearanceMap[charId] = {
          firstScene: scene.id,
          hasIntroduced: false
        };
      }
    }
  }
  
  return appearanceMap;
}
```

#### 规则2：台词清洗规则
```javascript
function cleanDialogue(dialogue, isFirstAppearance, characterName) {
  if (isFirstAppearance) {
    // 首次出场：允许自我介绍，但限制长度
    return dialogue; // 保留原样
  }
  
  // 非首次出场：移除自我介绍前缀
  const patterns = [
    new RegExp(`^我是${characterName}[，。.]`, 'g'),
    new RegExp(`^大家好，我是${characterName}[，。.]`, 'g'),
    new RegExp(`^${characterName}：`, 'g'),
    new RegExp(`^这里是${characterName}[，。.]`, 'g')
  ];
  
  let cleaned = dialogue;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim();
}
```

#### 规则3：多角色场景处理
```javascript
// 如果场景中有多个角色，且都是首次出场
// 为每个角色生成独立的卡片（分时展示或并列展示）

// 示例：S02 有陈卓和张医生
{
  characterIntroCard: {
    enabled: true,
    mode: "sequential", // sequential（分时）| parallel（并列）
    cards: [
      { characterId: "chen-nurse", timing: "0-2s" },
      { characterId: "dr-zhang", timing: "2-4s" }
    ]
  }
}
```

---

## 四、技术实现

### 4.1 修改点清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `nirath-master-pipeline.js` | 新增 Stage | Stage 5.5: 角色出场分析 |
| `nirath-master-pipeline.js` | 修改 | Stage 6: 台词生成增加 introCard 标记 |
| `orient-primordial-core-v24.js` | 修改 | 渲染核心增加【人物卡片】字段注入 |
| `opening-system-v3.js` | 可选 | 片头阶段预生成角色卡片模板 |
| `SOUL.md` | 新增规则 | 人物卡片系统规则焊死 |

### 4.2 伪代码实现

```javascript
// Stage 5.5: 角色出场分析
async stageCharacterAppearanceAnalysis(script) {
  const characters = this.input.characters || {};
  const scenes = script.scenes || [];
  
  // 分析每个角色的首次出场
  const appearanceMap = {};
  for (const scene of scenes) {
    const sceneChars = scene.characters || [];
    for (const charId of sceneChars) {
      if (!appearanceMap[charId] && characters[charId]) {
        appearanceMap[charId] = scene.id;
        scene.isFirstAppearance = true;
        scene.characterToIntroduce = charId;
      }
    }
  }
  
  this.log('STAGE-5.5', `✅ 角色出场分析完成`);
  for (const [charId, sceneId] of Object.entries(appearanceMap)) {
    this.log('STAGE-5.5', `  ${charId} 首次出场: ${sceneId}`);
  }
  
  return appearanceMap;
}

// Stage 6: 台词生成（修改）
async stageScriptGeneration(input) {
  // ... 原有逻辑 ...
  
  // 新增：处理人物出场卡片
  for (const scene of generatedScenes) {
    if (scene.isFirstAppearance && scene.characterToIntroduce) {
      const char = input.characters[scene.characterToIntroduce];
      scene.characterIntroCard = {
        enabled: true,
        characterId: scene.characterToIntroduce,
        displayStyle: input.introCardStyle || 'documentary',
        content: {
          name: char.name,
          title: char.title || char.role,
          subtitle: char.subtitle || ''
        }
      };
    }
  }
  
  // ... 原有逻辑 ...
}

// Stage 11: 渲染核心（修改）
buildPromptV3(params) {
  // ... 原有逻辑 ...
  
  // 新增：注入人物卡片
  if (params.characterIntroCard?.enabled) {
    const card = params.characterIntroCard;
    const cardPrompt = this.buildCharacterCardPrompt(card);
    prompt += ` \n【人物卡片】${cardPrompt}`;
  }
  
  // ... 原有逻辑 ...
}
```

---

## 五、预期效果

### 优化后台词对比

| 镜头 | 优化前 | 优化后 |
|------|--------|--------|
| S01 | "大家好，我是陈卓。今天我们来认识横纹肌溶解。" | "今天我们来认识横纹肌溶解。"（人物卡片在画面下方展示「陈卓 | 健康教育主讲人」） |
| S02 | "我是陈卓。横纹肌溶解的本质..." | "横纹肌溶解的本质，是肌肉细胞..."（直接进入主题） |
| S03 | "陈卓：如果你发现..." | "如果你发现肌肉异常酸痛..."（自然叙述） |
| S05 | "我是陈卓，科学运动..." | "科学运动，倾听身体信号..."（直接收束） |

### 视觉呈现效果

```
┌─────────────────────────────────────┐
│                                     │
│    [画面：陈卓讲解横纹肌溶解]        │
│                                     │
│                                     │
│    ┌──────────────────────┐        │
│    │ 👤 陈卓              │        │
│    │ 健康教育主讲人        │        │
│    └──────────────────────┘        │
│              （下方浮现，2秒后淡出）  │
└─────────────────────────────────────┘
```

---

## 六、与现有系统的关系

### 与 Nirath 模式的区别
- **Nirath模式**：已有角色出场动效（神兽浮现、主角登场），人物卡片可作为补充
- **Generic模式**：人物卡片是主要出场方式，替代硬编码自我介绍

### 与台词系统的集成
- 人物卡片作为 **独立字段** 与台词并行存在
- 不替代台词，而是 **减少台词中的冗余身份信息**
- 台词聚焦于 **内容传递**，卡片负责 **身份展示**

---

## 七、开发计划

### Phase 1：核心功能（2-3小时）
- [ ] Stage 5.5 角色出场分析
- [ ] Stage 6 台词清洗逻辑
- [ ] Stage 11 【人物卡片】字段注入

### Phase 2：样式优化（1-2小时）
- [ ] 纪录片风格卡片设计
- [ ] 新闻采访风格卡片设计
- [ ] 极简风格卡片设计

### Phase 3：验证测试（1小时）
- [ ] 健康科普EP01重跑验证
- [ ] 多角色场景测试
- [ ] 与Nirath模式兼容性测试

---

## 八、风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 卡片与画面风格不统一 | 中 | 视觉违和 | 提供多种风格模板，匹配视频类型 |
| 卡片遮挡画面重要内容 | 低 | 信息丢失 | 默认lower-third位置，避开人脸 |
| 多角色卡片叠加 | 低 | 画面拥挤 | 分时展示（sequential模式） |
| Seedance对卡片渲染不佳 | 中 | 效果不达预期 | 提供纯文字备选方案 |

---

## 九、队长决策点

1. **展示风格选择**：
   - [ ] 纪录片风格（推荐，与generic模式匹配）
   - [ ] 新闻采访风格
   - [ ] 极简风格（仅姓名+职称）

2. **展示时机**：
   - [ ] 方案A：画面内字幕（与画面一同渲染）
   - [ ] 方案B：独立开场镜头（S00.5，1-2秒）

3. **是否立即开发**：
   - [ ] 立即开发（预计4-6小时）
   - [ ] 延后到下一版本
   - [ ] 需要更多讨论

---

> **设计原则**：系统级解决，非硬编码。让人物出场自然、专业、不抢戏。
