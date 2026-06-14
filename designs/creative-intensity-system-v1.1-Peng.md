# 创意参数系统 (Creative Intensity System) v1.1-Peng

## 核心参数定义

**创意参数（Creative Intensity）= 影视呈现手法的强度**

只影响"怎么拍"（外在影视表现层），不影响"拍什么"（内容/事实层）。

```javascript
const creativeIntensity = {
  // 全局创意强度: 0-1 (0=完全保守, 1=完全颠覆)
  value: 0.5,        // 默认值
  max: 0.9,          // 可配置上限 (防止失控)
  min: 0.0,          // 下限
  
  // 各模块权重分配 (权重总和=1)
  // 仅影响影视表现模块，剧本/事实模块完全隔离
  weights: {
    visual: 0.30,         // 视觉呈现 (运镜、构图、灯光、色彩)
    audio: 0.20,          // 声音设计 (配乐、音效、空间音频)
    pacing: 0.15,         // 节奏控制 (剪辑节奏、时间感知)
    genreFusion: 0.15,    // 类型融合 (视觉风格参照)
    character: 0.10,      // 角色呈现 (表演风格、镜头感)
    narrative: 0.10       // 叙事节奏 (讲述方式，不改变内容)
  }
};
```

## 内容层 vs 表现层 隔离墙

```
┌─────────────────────────────────────────────────┐
│  内容层 (Content Layer) - 不受创意参数影响        │
│  ├── 剧本内容 (Script)                              │
│  ├── 台词/对白 (Dialogue)                           │
│  ├── 事实/数据 (Facts & Data)                       │
│  ├── 医学/科学内容 (Medical/Scientific)              │
│  └── 叙事逻辑 (Story Logic)                         │
├─────────────────────────────────────────────────┤
│  表现层 (Presentation Layer) - 受创意参数影响      │
│  ├── 🎥 运镜风格 (Camera Movement)                   │
│  ├── 💡 灯光设计 (Lighting Design)                   │
│  ├── 🎨 美术布景 (Production Design)                  │
│  ├── ✂️ 剪辑节奏 (Editing Rhythm)                     │
│  ├── 🎵 声音设计 (Sound Design)                      │
│  └── 🎭 镜头表演 (On-Camera Performance)              │
└─────────────────────────────────────────────────┘
```

**核心原则**：创意参数是"同一道菜的不同摆盘和餐具"——菜本身（内容）完全不动，变的是**呈现方式的高级感**。

## 创意等级划分 (6级)

| 等级 | 范围 | 名称 | 特征描述 |
|------|------|------|----------|
| L0 | 0.0-0.15 | **保守模式** | 完全标准影视呈现，零风格化，适合法规和医疗等严格场景 |
| L1 | 0.15-0.30 | **标准模式** | 略微优化画面质感，基本保持传统风格，适合大多数商业场景 |
| L2 | 0.30-0.50 | **平衡模式** | 适度影视风格化，在传统和创新间平衡，**默认等级** |
| L3 | 0.50-0.70 | **增强模式** | 明显影视风格化，引入非传统视觉元素，适合品牌推广 |
| L4 | 0.70-0.85 | **突破模式** | 大幅影视风格化，打破常规视觉，适合艺术表达和病毒式传播 |
| L5 | 0.85-1.00 | **颠覆模式** | 完全风格化重构，用好莱坞视觉拍科普视频，适合极致视觉需求 |

## 各模块影响矩阵（仅表现层）

### 1. 叙事呈现模块 (Narrative Presentation)

**注意：只改变"讲述方式"，不改变"讲述内容"**

```javascript
function applyCreativeToNarrative(basePrompt, intensity) {
  const narrativeMods = {
    L0: '标准讲述方式：平铺直叙，匀速推进，无特殊节奏设计',
    L1: '轻微节奏优化：开场稍作停顿，段落间自然过渡',
    L2: '讲述节奏设计：开场钩子吸引注意，重点处放慢节奏，信息密集处加速',
    L3: '多维度讲述：同一内容用不同视角/比喻重复强化（内容不变，方式变）',
    L4: '情绪讲述：配合情绪起伏调整讲述节奏，高潮处停顿，情绪处延长',
    L5: '极致讲述：用故事片节奏讲述科普内容，用悬疑片节奏讲述数据，但内容完全不变'
  };
  
  // 根据强度注入讲述方式指令，内容层完全隔离
  const level = getIntensityLevel(intensity);
  return basePrompt + `\n[NARRATIVE_PRESENTATION:${level}] ${narrativeMods[level]}\n[CONTENT_LOCK: 剧本内容、医学事实、数据完全不变，仅调整讲述节奏]`;
}
```

### 2. 视觉模块 (Visual Engine / Cinematography)

```javascript
function applyCreativeToVisual(basePrompt, intensity) {
  const visualMods = {
    L0: '标准纪录片风格：固定机位、平视角度、自然光',
    L1: '基础运镜：简单推轨、稳定器跟拍',
    L2: '电影级运镜：轨道滑动、斯坦尼康、适度景深',
    L3: '艺术运镜：低角度仰拍、旋转镜头、长镜头探索',
    L4: '极致视觉：无人机航拍、微距特写、时间流逝、光绘',
    L5: '好莱坞大片：IMAX构图、维伦纽瓦式宏大、诺兰式时间操控、王家卫式色彩'
  };
  
  // 动态选择镜头类型
  if (intensity > 0.7) {
    // 高创意：优先使用 Stage 8.4 好莱坞技能中最极端的选项
    return injectExtremeCinematicSkills(basePrompt, intensity);
  }
  
  const level = getIntensityLevel(intensity);
  return basePrompt + `\n[VISUAL_CREATIVE:${level}] ${visualMods[level]}`;
}
```

### 3. 角色呈现模块 (Character Presentation)

**注意：只改变镜头前的表演风格，不改变角色设定和内容**

```javascript
function applyCreativeToCharacter(characterPrompt, intensity) {
  const charMods = {
    L0: '标准职业表现：专业、冷静、客观，无个人情感',
    L1: '温和人性化：微笑、适度眼神交流',
    L2: '情感丰富：情感层次、微表情、肢体语言',
    L3: '角色化表演：赋予镜头前的小习惯、口头禅',
    L4: '极致表演：情绪爆发、即兴反应、打破角色预期',
    L5: '超现实呈现：风格化表演、象征化表达、镜头感极致'
  };
  
  const level = getIntensityLevel(intensity);
  return characterPrompt + `\n[CHARACTER_PRESENTATION:${level}] ${charMods[level]}\n[CONTENT_LOCK: 角色设定、台词内容完全不变，仅调整镜头前表演风格]`;
}
```

### 4. 音效模块 (Audio Engine)

```javascript
function applyCreativeToAudio(basePrompt, intensity) {
  const audioMods = {
    L0: '标准旁白+背景音乐，无音效设计',
    L1: '环境音填充，基础情绪配乐',
    L2: '音效设计：ASMR元素、节奏配乐、情绪音效',
    L3: '沉浸式音效：3D环绕、空间音频、动态音乐',
    L4: '实验性音频：噪音音乐、反向音频、音频拼贴',
    L5: '声音景观：每个视觉元素都有专属音景，BGM即主角，汉斯·季默式史诗配乐'
  };
  
  const level = getIntensityLevel(intensity);
  return basePrompt + `\n[AUDIO_CREATIVE:${level}] ${audioMods[level]}`;
}
```

### 5. 节奏模块 (Pacing Engine)

```javascript
function applyCreativeToPacing(storyboard, intensity) {
  const pacingMods = {
    L0: '匀速节奏：固定镜头时长，标准剪辑',
    L1: '基础变速：开场慢→中间快→结尾慢',
    L2: '情绪节奏：根据情绪起伏调整节奏',
    L3: '变速剪辑：快速剪辑+慢动作交替，制造节奏感',
    L4: '时间操控：时间膨胀、时间压缩、非线性时间',
    L5: '节奏暴力：24帧→120帧切换，静止帧+疯狂快切，音乐同步剪辑'
  };
  
  // 动态调整镜头时长
  storyboard.shots.forEach(shot => {
    if (intensity > 0.7) {
      shot.duration *= (0.7 + Math.random() * 0.6); // 随机化时长
    } else if (intensity > 0.4) {
      shot.duration *= (0.9 + Math.random() * 0.2); // 轻微变化
    }
    // L0-L1: 保持原有时长
  });
  
  return storyboard;
}
```

### 6. 类型风格模块 (Genre Style Engine)

**注意：只改变视觉风格参照，不改变内容类型**

```javascript
function applyGenreStyle(basePrompt, intensity, targetGenre) {
  const styleMap = {
    'health-edu': {
      L0: '标准医疗纪录片视觉：白色诊室、均匀照明、固定机位',
      L1: 'Discovery纪录片视觉：自然光、跟拍、适度景深',
      L2: 'Netflix纪录片视觉：电影感布光、轨道滑动、浅景深',
      L3: '悬疑剧视觉：戏剧性光影、低角度、阴影对比',
      L4: '科幻片视觉：冷色调、未来感布光、概念化场景',
      L5: '史诗片视觉：IMAX构图、宏大布光、象征性色彩'
    },
    'product-ad': {
      L0: '标准产品展示：均匀照明、纯色背景、标准镜头',
      L1: '生活方式展示：自然光、场景化、柔和色调',
      L2: '品牌广告展示：电影感布光、轨道、浅景深',
      L3: '微电影视觉：戏剧性光影、情绪色调、故事感',
      L4: '艺术电影视觉：风格化色彩、实验构图、象征性',
      L5: '超现实视觉：概念艺术、梦境色调、极致美学'
    },
    'tech-demo': {
      L0: '标准演示：屏幕录制、平光、功能聚焦',
      L1: '科技感展示：冷色调、线条光、现代感',
      L2: '未来感展示：霓虹光、HUD元素、赛博感',
      L3: '科幻片展示：戏剧性光影、未来场景、氛围感',
      L4: '史诗级展示：宏大构图、光效、粒子特效',
      L5: '魔法级展示：概念艺术、超现实、极致视觉'
    }
  };
  
  const level = getIntensityLevel(intensity);
  const style = styleMap[targetGenre]?.[level] || styleMap['health-edu'][level];
  
  return basePrompt + `\n[GENRE_STYLE:${level}] ${style}\n[CONTENT_LOCK: 内容类型保持${targetGenre}不变，仅视觉风格参照]`;
}
```

## 创意参数注入链路（仅表现层）

```
输入: creativeIntensity = 0.75 (突破模式)

Stage 1: 需求分析
  ↓ 不影响: 剧本内容、事实、叙事逻辑
  ↓ 影响: 视觉风格方向选择 (写实/电影感/先锋?)
  
Stage 2: 剧本生成
  ↓ 不影响: 台词、医学内容、事实准确性
  ↓ 影响: 无 (剧本层完全隔离)
  
Stage 3: 分镜设计
  ↓ 不影响: 镜头内容、叙事信息
  ↓ 影响: 镜头类型选择 (固定/轨道/航拍/微距?)
  
Stage 8.1: 运镜控制
  ↓ 影响: 是否启用 Stage 8.4 好莱坞技能?
  ↓ 影响: 选择哪位导演风格? (维伦纽瓦/诺兰/昆汀?)
  
Stage 8.4: 好莱坞技能路由
  ↓ 影响: 匹配镜头语言风格?
  
Stage 10: 渲染
  ↓ 影响: 色彩分级? (自然/戏剧性/风格化?)
  
Stage 11: 后期合成
  ↓ 影响: 特效程度? (粒子特效/光效/毛刺?)
  
Stage 12: 音频
  ↓ 影响: 配乐风格? (标准/沉浸式/实验?)
  
输出: 影视风格升级的科普视频 🎬 (内容100%原样保留)
```

## 实际配置示例

### 示例1: 保守科普 (0.2) - 医疗培训
```json
{
  "creativeIntensity": {
    "value": 0.2,
    "max": 0.9,
    "context": "医疗法规培训，必须严格准确",
    "modules": {
      "visual": "L0-标准纪录片：固定机位、平视角度、自然光",
      "audio": "L1-基础：标准旁白+环境音",
      "pacing": "L0-匀速：固定镜头时长",
      "genre_style": "L0-标准医疗：白色诊室、均匀照明",
      "character_performance": "L0-专业：冷静、客观、无个人情感",
      "narrative": "L0-标准讲述：平铺直叙"
    }
  }
}
// 内容层：医疗法规内容100%原样，不受任何影响
```

### 示例2: 平衡科普 (0.5 - 默认) - 健康科普
```json
{
  "creativeIntensity": {
    "value": 0.5,
    "max": 0.9,
    "context": "健康科普，需要吸引年轻人但保持准确性",
    "modules": {
      "visual": "L2-电影级：轨道滑动、斯坦尼康、适度景深",
      "audio": "L2-ASMR：沉浸式音效、节奏配乐",
      "pacing": "L2-情绪节奏：根据情绪起伏调整",
      "genre_style": "L2-纪录片风格：Netflix质感、电影感布光",
      "character_performance": "L2-情感丰富：微表情、肢体语言",
      "narrative": "L2-讲述节奏：开场钩子，重点放慢"
    }
  }
}
// 内容层：陈卓的医学讲解100%原样，仅改变"怎么拍陈卓"
```

### 示例3: 电影感科普 (0.9) - 病毒式传播
```json
{
  "creativeIntensity": {
    "value": 0.9,
    "max": 1.0,
    "context": "病毒式传播，需要极度震撼但内容必须准确",
    "modules": {
      "visual": "L5-好莱坞级：IMAX构图、维伦纽瓦式宏大、戏剧性光影",
      "audio": "L5-沉浸式：3D环绕、空间音频、汉斯·季默式史诗",
      "pacing": "L5-节奏暴力：快切+慢动作交替，音乐同步剪辑",
      "genre_style": "L5-史诗视觉：宏大布光、象征性色彩、极致美学",
      "character_performance": "L5-风格化：情绪层次、镜头感、象征性表演",
      "narrative": "L5-极致讲述：用故事片节奏讲述科普，但内容完全不变"
    }
  }
}
// 内容层：免疫系统知识100%原样，仅视觉风格参照星球大战
// 陈卓的台词、医学内容纹丝不动，变的是镜头怎么拍她
```

### 示例4: 医疗科普 - 陈卓讲解横纹肌溶解 (0.6)
```json
{
  "creativeIntensity": {
    "value": 0.6,
    "max": 0.9,
    "context": "陈卓讲解横纹肌溶解，医学内容必须准确，但画面要有电影感",
    "modules": {
      "visual": "L3-艺术级：低角度仰拍、戏剧性光影、浅景深",
      "audio": "L2-沉浸：环境音填充、情绪配乐",
      "pacing": "L2-情绪节奏：根据医学内容情绪起伏调整",
      "genre_style": "L3-悬疑视觉：用悬疑剧光影拍医疗科普（内容不变）",
      "character_performance": "L2-情感丰富：陈卓展现同理心和专业度",
      "narrative": "L2-讲述节奏：开场钩子，重点放慢"
    }
  }
}
// 内容层完全隔离：
// ✅ 陈卓讲解的横纹肌溶解知识100%准确
// ✅ 医学数据、症状、实验室检查完全不变
// ✅ 台词、对白原样保留
// 表现层升级：
// 🔥 陈卓站在戏剧性光影中讲解（怎么拍她变了）
// 🔥 镜头用悬疑剧的低角度仰拍（视觉风格变了）
// 🔥 配乐在讲到严重后果时变紧张（声音设计变了）
// 但陈卓说的每一个医学事实，和0.2保守版完全一致！
```

## 实施路径

### Phase 1: 参数层 (立即)
1. 在 `input` 对象中添加 `creativeIntensity` 字段
2. 在 `nirath-master-pipeline.js` 的 `validateInput` 阶段验证参数
3. 默认 0.5，可配置 max 上限
4. **关键**：在参数层注入内容防火墙标记 `[CONTENT_LOCK]`

### Phase 2: 模块适配 (本周)
1. 修改各 Stage 的 prompt 模板，添加 `[CREATIVE_INTENSITY]` 占位符
2. 在 Stage 8.1 (运镜) 中根据 intensity 调整导演风格选择
3. 在 Stage 8.4 (好莱坞技能) 中根据 intensity 调整匹配阈值
4. **关键**：所有内容模块（剧本、台词、事实）添加 `[CONTENT_LOCK]` 跳过逻辑

### Phase 3: 智能融合 (下周)
1. 基于历史数据训练 intensity 与视频完播率的关系
2. 自动推荐 optimal intensity 值
3. A/B 测试不同 intensity 对视频效果的影响

## 用户交互界面

```
🎨 创意参数控制台

创意强度: [====|====] 0.5 (平衡模式)
          0    0.5    1.0
          保守 ←→ 颠覆

上限锁定: [0.9] 🔒 (可调整)

当前模式: 🎬 平衡模式 - 影视呈现适度升级，内容完全不变

各模块状态（仅表现层）:
  🎥 视觉呈现: [====|    ] 0.5  电影级运镜+灯光
  🎵 声音设计: [===|     ] 0.4  ASMR+节奏配乐
  ⏱️  剪辑节奏: [===|     ] 0.3  情绪节奏
  🎭 类型风格: [===|     ] 0.4  纪录片质感
  👤 镜头表演: [====|    ] 0.5  情感丰富
  📖 讲述节奏: [====|    ] 0.5  开场钩子+重点放慢

⚠️ 内容防火墙状态: 🟢 开启
  ├── 剧本内容: 已锁定 🔒
  ├── 医学事实: 已锁定 🔒
  ├── 台词对白: 已锁定 🔒
  └── 数据信息: 已锁定 🔒

⚡ 快速预设:
  [保守平拍] [纪录片跟拍] [电影感布光] [品牌推广] [病毒传播] [好莱坞大片]

💡 提示: 提升到 0.8 将启用诺兰式时间操控和维伦纽瓦式IMAX构图
        但陈卓讲的医学内容，和0.2版本完全一致！
```

## 安全护栏（内容防火墙）

```javascript
// 1. 上限保护
if (intensity > config.max) {
  console.warn(`[CreativeGuard] 创意强度 ${intensity} 超过上限 ${config.max}，已截断`);
  intensity = config.max;
}

// 2. 内容防火墙 (核心隔离机制)
// 创意参数只接入影视表现模块，剧本/事实模块完全隔离
const CONTENT_MODULES = ['script', 'dialogue', 'facts', 'medical_content', 'data'];
const PRESENTATION_MODULES = ['visual', 'audio', 'pacing', 'genre_style', 'character_performance'];

function applyCreative(module, basePrompt, intensity) {
  if (CONTENT_MODULES.includes(module)) {
    // 内容模块：创意参数完全无效，原样返回
    console.log(`[ContentFirewall] 模块 ${module} 为内容层，跳过创意参数`);
    return basePrompt;
  }
  
  if (PRESENTATION_MODULES.includes(module)) {
    // 表现模块：应用创意参数
    return applyCreativeToPresentation(module, basePrompt, intensity);
  }
  
  return basePrompt;
}

// 3. 类型适配（不是限制）
// 医疗/法律内容：创意参数影响"怎么拍陈卓"，不影响"陈卓讲什么"
// 0.2 = 诊室平拍，0.5 = 纪录片跟拍，0.9 = 电影感布光+运镜
// 台词、医学内容100%原样保留
if (contentType === 'medical' || contentType === 'legal') {
  // 不限制创意强度上限，但确保内容防火墙生效
  console.log(`[ContentFirewall] ${contentType} 内容：创意参数仅影响视觉呈现，事实内容完全隔离`);
}

// 4. 事实准确性保护 (永远100%)
const FACTUAL_MODULES = ['data', 'statistics', 'medical_facts', 'legal_facts'];
FACTUAL_MODULES.forEach(module => {
  // 事实模块永远不受创意参数影响，保持100%准确
  console.log(`[ContentFirewall] 事实模块 ${module} 已锁定，跳过创意参数`);
});
```

## 版本历史

- v1.0-Peng: 创意参数系统设计方案，6级创意等级，6模块影响矩阵，3阶段实施路径
- v1.1-Peng: 修正创意参数定义范围，明确区分内容层与表现层，添加内容防火墙机制，将"类型保护"改为"内容防火墙"，确保创意参数只影响影视呈现手法不改变事实内容

---
**设计完成**: 等待队长确认实施优先级！🔥