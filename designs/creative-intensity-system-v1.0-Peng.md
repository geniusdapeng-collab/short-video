# 创意参数系统 (Creative Intensity System) v1.0-Peng

## 核心参数定义

```javascript
const creativeIntensity = {
  // 全局创意强度: 0-1 (0=完全保守, 1=完全颠覆)
  value: 0.5,        // 默认值
  max: 0.9,          // 可配置上限 (防止失控)
  min: 0.0,          // 下限
  
  // 各模块权重分配 (权重总和=1)
  weights: {
    narrative: 0.25,      // 叙事创新度 (故事结构、情节反转)
    visual: 0.25,         // 视觉冲击度 (运镜、构图、色彩)
    audio: 0.15,          // 音效创意度 (配乐、声效设计)
    character: 0.15,      // 角色表现力 (表演风格、微表情)
    pacing: 0.10,         // 节奏控制 (剪辑节奏、时间感知)
    genreFusion: 0.10     // 类型融合度 (跨类型混搭)
  }
};
```

## 创意等级划分 (6级)

| 等级 | 范围 | 名称 | 特征描述 |
|------|------|------|----------|
| L0 | 0.0-0.15 | **保守模式** | 完全遵循标准模板，零创新，适合法规和医疗等严格场景 |
| L1 | 0.15-0.30 | **标准模式** | 略微优化，基本保持传统风格，适合大多数商业场景 |
| L2 | 0.30-0.50 | **平衡模式** | 适度创新，在传统和创新间平衡，**默认等级** |
| L3 | 0.50-0.70 | **增强模式** | 明显创新，引入非传统元素，适合品牌推广 |
| L4 | 0.70-0.85 | **突破模式** | 大幅创新，打破常规，适合艺术表达和病毒式传播 |
| L5 | 0.85-1.00 | **颠覆模式** | 完全重构，用好莱坞大片拍科普视频，适合极致创意需求 |

## 各模块影响矩阵

### 1. 叙事模块 (Narrative Engine)

```javascript
function applyCreativeToNarrative(basePrompt, intensity) {
  const narrativeMods = {
    L0: '严格按照标准叙事结构：背景→问题→解决方案→结论',
    L1: '标准叙事结构，允许轻微的情感渲染',
    L2: '引入"钩子"开场，适度悬念设置，情感层次丰富',
    L3: '非线性叙事片段，多视角切换，情感弧线强烈',
    L4: '打破第四面墙，元叙事元素，让观众成为参与者',
    L5: '完全颠覆：用科幻史诗讲科普，用悬疑惊悚讲健康，用爱情片讲数据'
  };
  
  // 根据强度注入叙事指令
  const level = getIntensityLevel(intensity);
  return basePrompt + `\n[NARRATIVE_CREATIVE:${level}] ${narrativeMods[level]}`;
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

### 3. 角色模块 (Character Engine)

```javascript
function applyCreativeToCharacter(characterPrompt, intensity) {
  const charMods = {
    L0: '标准职业表现：专业、冷静、客观，无个人情感',
    L1: '温和人性化：微笑、适度眼神交流',
    L2: '情感丰富：情感层次、微表情、肢体语言',
    L3: '角色化表演：赋予角色背景故事、小习惯、口头禅',
    L4: '极致表演：情绪爆发、即兴反应、打破角色预期',
    L5: '超现实角色：卡通化、象征化、超能力、人格分裂式呈现'
  };
  
  const level = getIntensityLevel(intensity);
  return characterPrompt + `\n[CHARACTER_CREATIVE:${level}] ${charMods[level]}`;
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

### 6. 类型融合模块 (Genre Fusion Engine)

```javascript
function applyGenreFusion(basePrompt, intensity, targetGenre) {
  const fusionMap = {
    'health-edu': {
      L0: '标准健康教育视频',
      L1: '健康TED演讲风格',
      L2: '健康纪录片风格（Discovery）',
      L3: '健康悬疑剧风格（用悬疑讲病理）',
      L4: '健康科幻风格（体内微观世界冒险）',
      L5: '健康史诗风格（免疫系统大战 = 星球大战）'
    },
    'product-ad': {
      L0: '标准产品展示',
      L1: '生活方式广告',
      L2: '情感故事广告',
      L3: '微电影式广告',
      L4: '艺术电影式广告',
      L5: '超现实广告（产品 = 艺术品 = 哲学命题）'
    },
    'tech-demo': {
      L0: '标准功能演示',
      L1: '科技感展示',
      L2: '科幻感展示',
      L3: '赛博朋克风格',
      L4: '未来主义史诗',
      L5: '技术 = 魔法，功能 = 超能力'
    }
  };
  
  const level = getIntensityLevel(intensity);
  const fusion = fusionMap[targetGenre]?.[level] || fusionMap['health-edu'][level];
  
  return basePrompt + `\n[GENRE_FUSION:${level}] ${fusion}`;
}
```

## 创意参数注入链路

```
输入: creativeIntensity = 0.75 (突破模式)

Stage 1: 需求分析
  ↓ 影响: 叙事方向选择 (悬疑/史诗/爱情？)
  
Stage 2: 剧本生成
  ↓ 影响: 非线性叙事？打破第四面墙？
  
Stage 3: 分镜设计
  ↓ 影响: 镜头类型选择 (IMAX/航拍/微距？)
  
Stage 8.1: 运镜控制
  ↓ 影响: 是否启用 Stage 8.4 好莱坞技能？
  ↓ 影响: 选择哪位导演风格？ (维伦纽瓦/诺兰/昆汀？)
  
Stage 8.4: 好莱坞技能路由
  ↓ 影响: 匹配最极端的导演技能？
  
Stage 10: 渲染
  ↓ 影响: 色彩分级？ (黑白/赛博朋克/暖黄？)
  
Stage 11: 后期合成
  ↓ 影响: 特效程度？ (粒子特效/光效/毛刺？)
  
Stage 12: 音频
  ↓ 影响: 配乐风格？ (汉斯·季默/极简/电子？)
  
输出: 好莱坞大片级科普视频 🎬
```

## 实际配置示例

### 示例1: 保守科普 (0.2)
```json
{
  "creativeIntensity": {
    "value": 0.2,
    "max": 0.5,
    "context": "医疗法规培训，必须严格准确",
    "modules": {
      "narrative": "L1-标准",
      "visual": "L0-纪录片",
      "audio": "L1-基础",
      "character": "L0-专业",
      "pacing": "L0-匀速",
      "genreFusion": "L0-标准"
    }
  }
}
```

### 示例2: 平衡科普 (0.5 - 默认)
```json
{
  "creativeIntensity": {
    "value": 0.5,
    "max": 0.8,
    "context": "健康科普，需要吸引年轻人但保持准确性",
    "modules": {
      "narrative": "L2-钩子+悬念",
      "visual": "L2-电影级",
      "audio": "L2-ASMR",
      "character": "L2-情感丰富",
      "pacing": "L2-情绪节奏",
      "genreFusion": "L2-纪录片风格"
    }
  }
}
```

### 示例3: 好莱坞大片科普 (0.9)
```json
{
  "creativeIntensity": {
    "value": 0.9,
    "max": 1.0,
    "context": "病毒式传播，需要极度震撼",
    "modules": {
      "narrative": "L5-完全颠覆: 用星球大战讲免疫系统",
      "visual": "L5-维伦纽瓦式IMAX + 诺兰式时间",
      "audio": "L5-汉斯·季默式史诗配乐",
      "character": "L5-超现实角色: 白细胞 = 绝地武士",
      "pacing": "L5-节奏暴力: 快切+慢动作交替",
      "genreFusion": "L5-科幻史诗: 健康 = 星际冒险"
    }
  }
}
```

## 实施路径

### Phase 1: 参数层 (立即)
1. 在 `input` 对象中添加 `creativeIntensity` 字段
2. 在 `nirath-master-pipeline.js` 的 `validateInput` 阶段验证参数
3. 默认 0.5，可配置 max 上限

### Phase 2: 模块适配 (本周)
1. 修改各 Stage 的 prompt 模板，添加 `[CREATIVE_INTENSITY]` 占位符
2. 在 Stage 8.1 (运镜) 中根据 intensity 调整导演风格选择
3. 在 Stage 8.4 (好莱坞技能) 中根据 intensity 调整匹配阈值

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

当前模式: 🎬 平衡模式 - 适度创新，在传统与创新间平衡

各模块状态:
  📖 叙事创新: [====|    ] 0.5  标准钩子+悬念
  🎥 视觉冲击: [====|    ] 0.5  电影级运镜
  🎵 音效创意: [===|     ] 0.4  ASMR+节奏配乐
  👤 角色表现: [====|    ] 0.5  情感丰富
  ⏱️  节奏控制: [===|     ] 0.3  情绪节奏
  🎭 类型融合: [===|     ] 0.4  纪录片风格

⚡ 快速预设:
  [保守科普] [标准广告] [平衡教育] [品牌推广] [病毒传播] [好莱坞大片]

💡 提示: 提升到 0.8 将启用诺兰式时间操控和维伦纽瓦式IMAX构图
```

## 安全护栏

```javascript
// 1. 上限保护
if (intensity > config.max) {
  console.warn(`[CreativeGuard] 创意强度 ${intensity} 超过上限 ${config.max}，已截断`);
  intensity = config.max;
}

// 2. 类型保护 (医疗/法律等严格场景)
if (contentType === 'medical' || contentType === 'legal') {
  const maxSafe = 0.6; // 医疗内容不允许超过0.6
  if (intensity > maxSafe) {
    console.warn(`[CreativeGuard] 医疗内容创意强度限制为 ${maxSafe}`);
    intensity = maxSafe;
  }
}

// 3. 事实准确性保护 (创意不影响事实)
const FACTUAL_MODULES = ['data', 'statistics', 'medical_facts'];
FACTUAL_MODULES.forEach(module => {
  // 事实模块不受创意参数影响，永远保持100%准确
});
```

## 版本历史

- v1.0-Peng: 创意参数系统设计方案，6级创意等级，6模块影响矩阵，3阶段实施路径

---
**设计完成**: 等待队长确认方向和实施优先级！🔥
