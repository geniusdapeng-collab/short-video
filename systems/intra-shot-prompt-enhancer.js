/**
 * 镜头内Prompt增强器 v1.0
 * Intra-Shot Prompt Enhancer
 * 
 * 将静态单镜头Prompt升级为含时间轴的动态描述，
 * 实现镜头内运镜变化、光影情绪递进、转场过渡。
 * 
 * 核心设计：Prompt级实现，不改造渲染架构。
 * Seedance 2.0通过理解Prompt中的时间描述实现镜头内变化。
 */

const INTRA_SHOT_VERSION = 'v1.0';

// ═══════════════════════════════════════════════════════════
// 运镜原子库（基于队长方案，精选15个最实用组合）
// ═══════════════════════════════════════════════════════════

const CAMERA_ATOMS = {
  // A. 推/拉类
  'push_in': {
    id: 'CAM-P01',
    name: '推近',
    prompt: '缓慢推近至{{target}}',
    params: { target: 'subject', speed: 'ease_in_out' },
    defaultDuration: 3,
    emotion: '聚焦、紧张感上升'
  },
  'pull_out': {
    id: 'CAM-P02',
    name: '拉远',
    prompt: '缓缓拉远揭示{{reveal}}',
    params: { reveal: 'environment' },
    defaultDuration: 3,
    emotion: '开阔、释然、环境展现'
  },
  
  // B. 横/纵摇类
  'pan_left': {
    id: 'CAM-R01',
    name: '左摇',
    prompt: '镜头向左横摇{{angle}}度',
    params: { angle: 45 },
    defaultDuration: 2,
    emotion: '探索、发现'
  },
  'pan_right': {
    id: 'CAM-R02',
    name: '右摇',
    prompt: '镜头向右横摇{{angle}}度',
    params: { angle: 45 },
    defaultDuration: 2,
    emotion: '追踪、跟随'
  },
  'tilt_up': {
    id: 'CAM-R03',
    name: '上摇',
    prompt: '镜头缓缓上摇',
    params: {},
    defaultDuration: 2,
    emotion: '崇高、仰望、希望'
  },
  
  // C. 环绕类
  'orbit_left': {
    id: 'CAM-O01',
    name: '左环绕',
    prompt: '镜头以主体为中心向左环绕{{angle}}度',
    params: { angle: 30 },
    defaultDuration: 3,
    emotion: '环绕审视、关系变化'
  },
  'orbit_right': {
    id: 'CAM-O02',
    name: '右环绕',
    prompt: '镜头以主体为中心向右环绕{{angle}}度',
    params: { angle: 30 },
    defaultDuration: 3,
    emotion: '揭示背景、空间感'
  },
  
  // D. 升降类
  'crane_up': {
    id: 'CAM-V01',
    name: '升起',
    prompt: '摄影机缓缓上升',
    params: {},
    defaultDuration: 4,
    emotion: '升华、俯瞰、格局扩大'
  },
  'crane_down': {
    id: 'CAM-V02',
    name: '下降',
    prompt: '摄影机缓缓下降逼近主体',
    params: {},
    defaultDuration: 4,
    emotion: '逼近、压迫、关注细节'
  },
  
  // E. 特殊机位
  'pov': {
    id: 'CAM-S01',
    name: '主观视角',
    prompt: '第一人称主观视角（POV），轻微头部晃动',
    params: {},
    defaultDuration: 3,
    emotion: '沉浸、临场感'
  },
  'low_angle': {
    id: 'CAM-S03',
    name: '仰拍',
    prompt: '低角度仰拍，强化主体高大感',
    params: {},
    defaultDuration: 2,
    emotion: '崇高、压迫、敬畏'
  },
  'over_shoulder': {
    id: 'CAM-S02',
    name: '过肩',
    prompt: '过肩镜头（OTS），前景人物肩部占据画面1/4',
    params: {},
    defaultDuration: 3,
    emotion: '对话感、关系张力'
  },
  
  // F. 静态/微动
  'static': {
    id: 'CAM-F01',
    name: '固定',
    prompt: '固定机位，画面稳定',
    params: {},
    defaultDuration: 2,
    emotion: '稳定、观察、建立场景'
  },
  'rack_focus': {
    id: 'CAM-F05',
    name: '移焦',
    prompt: '焦点从{{from}}平滑转移至{{to}}',
    params: { from: 'foreground', to: 'background' },
    defaultDuration: 2,
    emotion: '注意力转移、关系揭示'
  },
  
  // G. 复合运镜
  'push_in_orbit': {
    id: 'CAM-C01',
    name: '推近+环绕',
    prompt: '缓慢推近同时微幅环绕，双重动态',
    params: {},
    defaultDuration: 4,
    emotion: '深入审视、关系深化'
  },
  'steadicam_follow': {
    id: 'CAM-O06',
    name: '斯坦尼康跟随',
    prompt: '斯坦尼康手持稳定跟随，轻微呼吸感晃动',
    params: {},
    defaultDuration: 5,
    emotion: '纪实感、沉浸式跟随'
  }
};

// ═══════════════════════════════════════════════════════════
// 光影情绪库（基于队长70种光源，精选30种最实用）
// ═══════════════════════════════════════════════════════════

const LIGHTING_ATOMS = {
  // === 自然日光（5种）===
  'LIT-N02': {
    name: '晨光侧射',
    colorTemp: 5200,
    prompt: '清晨侧射光，柔和自然，略暖，清晰阴影',
    emotions: ['清新', '宁静', '生命力'],
    category: 'natural'
  },
  'LIT-N04': {
    name: '金时刻',
    colorTemp: 3500,
    prompt: '黄金时刻魔法光，长而温暖的阴影，万物沐浴琥珀色光辉，怀旧感',
    emotions: ['温暖', '眷恋', '时光珍贵'],
    category: 'natural'
  },
  'LIT-N06': {
    name: '蓝调时刻',
    colorTemp: 9000,
    prompt: '蓝调暮光，深蓝青色天空微光，冷调环境光，无直射阳光，宁静深远',
    emotions: ['忧郁', '孤独', '冷静思考'],
    category: 'natural'
  },
  'LIT-N09': {
    name: '林间隙光',
    colorTemp: 5000,
    prompt: '阳光穿透树冠洒下，丁达尔效应光束，地面光斑斑驳，神圣空灵',
    emotions: ['神秘', '神圣', '自然力量'],
    category: 'natural'
  },
  'LIT-N01': {
    name: '晨曦柔光',
    colorTemp: 4500,
    prompt: '晨曦透过薄纱窗帘的柔光，温暖金色薄雾，轻柔 glow',
    emotions: ['希望萌芽', '纯净', '新的开始'],
    category: 'natural'
  },
  
  // === 方向性主光（8种）===
  'LIT-D03': {
    name: '暖色侧光',
    colorTemp: 5000,
    prompt: '暖色45度侧光，经典伦勃朗质感，右脸柔和阴影，亲密而神秘，温柔有人情味',
    emotions: ['亲密', '温柔', '有人情味'],
    category: 'directional'
  },
  'LIT-D04': {
    name: '冷色侧光',
    colorTemp: 7000,
    prompt: '冷色45度侧光，锐利阴影横切面部，忧伤孤独，内心冰冷',
    emotions: ['忧伤', '孤独', '冰冷'],
    category: 'directional'
  },
  'LIT-D08': {
    name: '暖色逆光',
    colorTemp: 3500,
    prompt: '暖金色逆光，主体包裹在发光光晕中，头发和肩部边缘光勾勒，神圣温暖',
    emotions: ['神圣', '温暖', '被眷顾'],
    category: 'directional'
  },
  'LIT-D09': {
    name: '冷色逆光',
    colorTemp: 9000,
    prompt: '冷蓝色逆光，冰冷轮廓光，人物从黑暗中浮现，不祥预感',
    emotions: ['绝望', '被遗弃', '命运降临'],
    category: 'directional'
  },
  'LIT-D11': {
    name: '冷色顶光',
    colorTemp: 8000,
    prompt: '冷硬顶光，深陷的眼窝阴影，制度化压迫感，无处逃避',
    emotions: ['绝望', '被审判', '压迫'],
    category: 'directional'
  },
  'LIT-D05': {
    name: '伦勃朗光',
    colorTemp: 4500,
    prompt: '伦勃朗布光，阴影脸颊上的小三角光斑，古典油画质感，深沉智慧',
    emotions: ['深沉', '智慧', '历史厚重'],
    category: 'directional'
  },
  'LIT-D13': {
    name: '冷色底光',
    colorTemp: 10000,
    prompt: '底部冷光向上照射，面部产生非自然阴影，恐怖不安，超自然力量',
    emotions: ['恐怖', '不安', '非自然'],
    category: 'directional'
  },
  'LIT-D10': {
    name: '暖色顶光',
    colorTemp: 4000,
    prompt: '温暖柔和顶光如神性聚光灯，温和向下 glow，精神升华',
    emotions: ['希望', '梦想', '神圣启示'],
    category: 'directional'
  },
  
  // === 情绪氛围光（7种）===
  'LIT-E01': {
    name: '忧伤弱光',
    colorTemp: 7500,
    prompt: '暗淡冷色弱侧光，大面积阴影，面部 barely visible，极度忧伤孤独无力',
    emotions: ['极度忧伤', '孤独', '无力'],
    category: 'emotional'
  },
  'LIT-E04': {
    name: '温馨暖团',
    colorTemp: 2800,
    prompt: '多点暖色柔光环绕，包围式 gentle glow，温馨被爱包围的归属感',
    emotions: ['温馨', '归属', '被爱包围'],
    category: 'emotional'
  },
  'LIT-E05': {
    name: '浪漫双辉',
    colorTemp: 3500,
    prompt: '暖侧光加金色逆光轮廓，人物周围梦幻 glow，浪漫唯美心动',
    emotions: ['浪漫', '心动', '唯美'],
    category: 'emotional'
  },
  'LIT-E08': {
    name: '神圣天光',
    colorTemp: 6000,
    prompt: '神圣光束从天而降，体积光上帝之光，轻微过曝，超越感宇宙连接',
    emotions: ['神圣', '超越', '宇宙连接'],
    category: 'emotional'
  },
  'LIT-E09': {
    name: '末日昏黄',
    colorTemp: 2500,
    prompt: '末日琥珀色雾霾，低角度暖光穿透尘埃，去饱和绿黄调，荒凉文明挽歌',
    emotions: ['荒凉', '终结', '文明挽歌'],
    category: 'emotional'
  },
  'LIT-E03': {
    name: '恐怖底光',
    colorTemp: 10000,
    prompt: '底部冷光频闪暗示，面部非自然阴影跳动，恐怖超自然噩梦',
    emotions: ['恐怖', '噩梦', '惊吓'],
    category: 'emotional'
  },
  'LIT-E10': {
    name: '赛博幻彩',
    colorTemp: 'variable',
    prompt: '青品红撞色光，反光 wet surfaces，暗底 vivid color pops，迷幻未来焦虑',
    emotions: ['迷幻', '未来焦虑', '虚拟与现实模糊'],
    category: 'emotional'
  },
  
  // === 特殊光效（5种）===
  'LIT-S01': {
    name: '丁达尔体积光',
    colorTemp: 5000,
    prompt: '丁达尔效应体积光束，空气中可见光柱穿过尘埃或雾气，神圣 ethereal',
    emotions: ['神圣', '神秘', '看得见的光'],
    category: 'special'
  },
  'LIT-S02': {
    name: '透镜光晕',
    colorTemp: 4500,
    prompt: '变形镜头光晕，光 streaks 横跨画面，复古胶片美学，怀旧梦幻',
    emotions: ['怀旧', '梦幻', '超现实'],
    category: 'special'
  },
  'LIT-S03': {
    name: '闪电瞬光',
    colorTemp: 6500,
    prompt: '闪电闪光照明，短暂 stark white light，立即回归黑暗，震撼突然',
    emotions: ['震撼', '突然', '不可抗力'],
    category: 'special'
  },
  'LIT-S09': {
    name: '生物荧光',
    colorTemp: 8000,
    prompt: '生物体发出的蓝绿色 glow，有机生命体发光，奇幻生命奇迹',
    emotions: ['奇幻', '生命奇迹', '未知自然'],
    category: 'special'
  },
  'LIT-S05': {
    name: '爆炸火光',
    colorTemp: 2000,
    prompt: '爆炸火球强光， intense orange blast illumination，混乱毁灭能量',
    emotions: ['暴力', '毁灭', '极度危险'],
    category: 'special'
  },
  
  // === 经典布光（3种）===
  'LIT-C01': {
    name: '好莱坞三点布光',
    colorTemp: 3200,
    prompt: '经典好莱坞三点布光，完美造型 glamorous，明星质感梦境制造',
    emotions: ['理想化', '明星感', '梦境制造'],
    category: 'classic'
  },
  'LIT-C02': {
    name: '黑色电影noir',
    colorTemp: 7000,
    prompt: '黑色电影硬侧光，百叶窗阴影投影，深黑阴影，宿命阴暗道德模糊',
    emotions: ['宿命', '阴暗', '道德模糊'],
    category: 'classic'
  },
  'LIT-C10': {
    name: '科幻冷舱光',
    colorTemp: 8000,
    prompt: '科幻冷舱窄条形 LED 光，选择性过曝， crushing blacks，未来孤立技术统治',
    emotions: ['未来', '孤立', '技术统治'],
    category: 'classic'
  },
  
  // === 动态光变（2种）===
  'LIT-V01': {
    name: '渐亮苏醒',
    colorTemp: 4500,
    prompt: '光线从黑暗中逐渐增强，缓慢 dawn-like illumination，意识恢复觉醒',
    emotions: ['觉醒', '意识恢复', '开场'],
    category: 'dynamic',
    isTransition: true
  },
  'LIT-V03': {
    name: '色温漂移',
    colorTemp: 'gradient',
    prompt: '色温从暖到冷渐变过渡，情绪气候转变，温暖变冷漠/冷漠变温暖',
    emotions: ['情绪转变', '时空切换', '内心变化'],
    category: 'dynamic',
    isTransition: true
  }
};

// ═══════════════════════════════════════════════════════════
// 情绪-光源速查矩阵（导演分镜核心参考）
// ═══════════════════════════════════════════════════════════

const EMOTION_LIGHTING_MAP = {
  '宁静': ['LIT-N02', 'LIT-N01', 'LIT-N06'],
  '希望': ['LIT-N01', 'LIT-D10', 'LIT-E08'],
  '忧伤': ['LIT-D04', 'LIT-E01', 'LIT-N06'],
  '紧张': ['LIT-D11', 'LIT-S03', 'LIT-D13'],
  '恐怖': ['LIT-D13', 'LIT-E03', 'LIT-S03'],
  '浪漫': ['LIT-E05', 'LIT-N04', 'LIT-D03'],
  '神圣': ['LIT-E08', 'LIT-S01', 'LIT-D10'],
  '史诗': ['LIT-N04', 'LIT-D08', 'LIT-C06'],
  '科幻': ['LIT-C10', 'LIT-E10', 'LIT-A03'],
  '怀旧': ['LIT-A01', 'LIT-N05', 'LIT-S02'],
  '狂乱': ['LIT-E07', 'LIT-S05', 'LIT-S03'],
  '温馨': ['LIT-E04', 'LIT-A05', 'LIT-A06'],
  '孤独': ['LIT-N06', 'LIT-E01', 'LIT-A07'],
  '压迫': ['LIT-D11', 'LIT-D09', 'LIT-C10'],
  '神秘': ['LIT-S01', 'LIT-N09', 'LIT-D13'],
  '决绝': ['LIT-D07', 'LIT-V03', 'LIT-E09']
};

// ═══════════════════════════════════════════════════════════
// 运镜组合推荐表（按场景类型）
// ═══════════════════════════════════════════════════════════

const CAMERA_COMBOS = {
  'opening': {
    name: '开场建立',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-N02', emotion: '宁静' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-D03', emotion: '聚焦' },
      { camera: 'orbit_right', duration: 2, lighting: 'LIT-D08', emotion: '升华' }
    ],
    description: '固定建立 → 推近聚焦 → 环绕升华'
  },
  'dialogue': {
    name: '对话场景',
    segments: [
      { camera: 'over_shoulder', duration: 3, lighting: 'LIT-D03', emotion: '亲密' },
      { camera: 'rack_focus', duration: 2, lighting: 'LIT-D03', emotion: '转移' },
      { camera: 'over_shoulder', duration: 3, lighting: 'LIT-D03', emotion: '回应' }
    ],
    description: '过肩A → 移焦过渡 → 过肩B'
  },
  'suspense': {
    name: '悬疑揭示',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-D05', emotion: '深沉' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-D03', emotion: '紧张' },
      { camera: 'static', duration: 1, lighting: 'LIT-V01', emotion: '定格' }
    ],
    description: '固定深沉 → 推近紧张 → 定格揭示'
  },
  'epic': {
    name: '壮阔登场',
    segments: [
      { camera: 'crane_down', duration: 4, lighting: 'LIT-N04', emotion: '史诗' },
      { camera: 'orbit_left', duration: 3, lighting: 'LIT-D08', emotion: '神圣' },
      { camera: 'crane_up', duration: 4, lighting: 'LIT-E08', emotion: '超越' }
    ],
    description: '下降逼近 → 环绕审视 → 上升升华'
  },
  'chase': {
    name: '追逐紧张',
    segments: [
      { camera: 'steadicam_follow', duration: 3, lighting: 'LIT-N03', emotion: '紧迫' },
      { camera: 'pan_right', duration: 1, lighting: 'LIT-N03', emotion: '甩镜' },
      { camera: 'steadicam_follow', duration: 3, lighting: 'LIT-A02', emotion: '持续' }
    ],
    description: '跟随 → 甩镜转向 → 继续跟随'
  },
  'intimate': {
    name: '温情亲密',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-E04', emotion: '温馨' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-E05', emotion: '浪漫' },
      { camera: 'static', duration: 2, lighting: 'LIT-A05', emotion: '沉淀' }
    ],
    description: '温馨建立 → 推近心动 → 烛光沉淀'
  },
  'horror': {
    name: '恐怖惊吓',
    segments: [
      { camera: 'static', duration: 1, lighting: 'LIT-E01', emotion: '压抑' },
      { camera: 'push_in', duration: 2, lighting: 'LIT-D13', emotion: '恐怖' },
      { camera: 'static', duration: 0.5, lighting: 'LIT-S03', emotion: '定格' }
    ],
    description: '压抑 → 推近恐怖 → 定格惊吓'
  },
  'memory': {
    name: '回忆闪回',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-A01', emotion: '怀旧' },
      { camera: 'rack_focus', duration: 2, lighting: 'LIT-S02', emotion: '模糊' },
      { camera: 'static', duration: 2, lighting: 'LIT-N05', emotion: '逝去' }
    ],
    description: '暖黄建立 → 移焦模糊 → 暮光逝去'
  },
  'confrontation': {
    name: '对峙冲突',
    segments: [
      { camera: 'over_shoulder', duration: 2, lighting: 'LIT-D07', emotion: '分裂' },
      { camera: 'push_in_orbit', duration: 3, lighting: 'LIT-D11', emotion: '压迫' },
      { camera: 'low_angle', duration: 2, lighting: 'LIT-D13', emotion: '压制' }
    ],
    description: '分裂对峙 → 推近压迫 → 仰拍压制'
  },
  'revelation': {
    name: '真相揭示',
    segments: [
      { camera: 'static', duration: 1.5, lighting: 'LIT-V01', emotion: '苏醒' },
      { camera: 'crane_up', duration: 3, lighting: 'LIT-E08', emotion: '神圣' },
      { camera: 'static', duration: 2, lighting: 'LIT-S01', emotion: '顿悟' }
    ],
    description: '渐亮苏醒 → 升起神圣 → 体积光顿悟'
  },
  
  // 🔥 v6.2-patch101-fix: 场景特定运镜组合（解决时间轴模板化）
  // 根因：所有场景套用相同模板（如epic），时间轴千篇一律
  // 修复：每个场景类型有独特的运镜组合和光照设计
  'volcanic_epic': {
    name: '火山史诗',
    segments: [
      { camera: 'crane_up', duration: 2, lighting: 'LIT-S05', emotion: '爆发' },
      { camera: 'static', duration: 2, lighting: 'LIT-N04', emotion: '炽热' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-S05', emotion: '逼近' },
      { camera: 'crane_down', duration: 2, lighting: 'LIT-E09', emotion: '毁灭' }
    ],
    description: '上升爆发 → 固定炽热 → 推近逼近 → 下降毁灭'
  },
  'forest_intimate': {
    name: '森林亲密',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-E04', emotion: '温馨' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-S01', emotion: '神秘' },
      { camera: 'orbit_left', duration: 3, lighting: 'LIT-E05', emotion: '浪漫' },
      { camera: 'static', duration: 2, lighting: 'LIT-A05', emotion: '沉淀' }
    ],
    description: '温馨建立 → 推近神秘 → 环绕浪漫 → 烛光沉淀'
  },
  'swamp_horror': {
    name: '沼泽恐怖',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-E01', emotion: '压抑' },
      { camera: 'push_in', duration: 2, lighting: 'LIT-D13', emotion: '恐怖' },
      { camera: 'static', duration: 1, lighting: 'LIT-S03', emotion: '定格' },
      { camera: 'crane_up', duration: 2, lighting: 'LIT-E03', emotion: '逃离' }
    ],
    description: '压抑 → 推近恐怖 → 定格惊吓 → 上升逃离'
  },
  'wasteland_suspense': {
    name: '荒原悬疑',
    segments: [
      { camera: 'static', duration: 2, lighting: 'LIT-E09', emotion: '荒凉' },
      { camera: 'pan_right', duration: 2, lighting: 'LIT-N03', emotion: '探索' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-D11', emotion: '压迫' },
      { camera: 'static', duration: 2, lighting: 'LIT-V01', emotion: '揭示' }
    ],
    description: '荒凉固定 → 摇镜探索 → 推近压迫 → 渐亮揭示'
  },
  'crystal_suspense': {
    name: '晶体悬疑',
    segments: [
      { camera: 'orbit_360', duration: 2, lighting: 'LIT-S09', emotion: '奇幻' },
      { camera: 'push_in', duration: 3, lighting: 'LIT-N04', emotion: '紧张' },
      { camera: 'rack_focus', duration: 2, lighting: 'LIT-S01', emotion: '神秘' },
      { camera: 'static', duration: 1, lighting: 'LIT-V01', emotion: '揭示' }
    ],
    description: '环绕奇幻 → 推近紧张 → 移焦神秘 → 渐亮揭示'
  },
  'bone_awe': {
    name: '骸骨敬畏',
    segments: [
      { camera: 'crane_up', duration: 3, lighting: 'LIT-D08', emotion: '神圣' },
      { camera: 'orbit_left', duration: 3, lighting: 'LIT-S09', emotion: '奇幻' },
      { camera: 'push_in', duration: 2, lighting: 'LIT-E08', emotion: '超越' }
    ],
    description: '上升神圣 → 环绕奇幻 → 推近超越'
  },

  // 🔥 v6.5.32-fix5: generic 医疗科普专用组合（解决镜头千篇一律）
  'educational_opening': {
    name: '科普开场',
    segments: [
      { camera: 'static_hold', duration: 2, lighting: 'LIT-N01', emotion: '清晰' },
      { camera: 'slow_push_in', duration: 3, lighting: 'LIT-N02', emotion: '聚焦' },
      { camera: 'slide_right', duration: 2, lighting: 'LIT-D01', emotion: '引导' }
    ],
    description: '稳定建立 → 缓慢推近 → 平移引导'
  },

  'medical_explain': {
    name: '医疗讲解',
    segments: [
      { camera: 'static_hold', duration: 2, lighting: 'LIT-N02', emotion: '平静' },
      { camera: 'slow_push_in', duration: 3, lighting: 'LIT-D03', emotion: '聚焦' },
      { camera: 'orbit_soft', duration: 2, lighting: 'LIT-D05', emotion: '理解' }
    ],
    description: '定镜说明 → 推近强调 → 柔和环绕加深理解'
  },

  'clinical_demo': {
    name: '临床演示',
    segments: [
      { camera: 'slide_left', duration: 2, lighting: 'LIT-N03', emotion: '展示' },
      { camera: 'tilt_down', duration: 2, lighting: 'LIT-D02', emotion: '分解' },
      { camera: 'macro_push', duration: 3, lighting: 'LIT-D06', emotion: '细节' }
    ],
    description: '横移展示 → 下倾说明 → 微距细节'
  },

  'process_breakdown': {
    name: '流程拆解',
    segments: [
      { camera: 'static_hold', duration: 2, lighting: 'LIT-N01', emotion: '条理' },
      { camera: 'slide_right', duration: 2, lighting: 'LIT-N02', emotion: '展开' },
      { camera: 'slow_push_in', duration: 2, lighting: 'LIT-D03', emotion: '重点' },
      { camera: 'static_hold', duration: 1, lighting: 'LIT-D04', emotion: '确认' }
    ],
    description: '稳定起始 → 平移展开 → 推近重点 → 定镜确认'
  },

  'reassurance_closing': {
    name: '安抚式结尾',
    segments: [
      { camera: 'slow_push_in', duration: 2, lighting: 'LIT-N02', emotion: '关怀' },
      { camera: 'static_hold', duration: 2, lighting: 'LIT-D01', emotion: '稳定' },
      { camera: 'slow_dolly_out', duration: 3, lighting: 'LIT-D08', emotion: '收束' }
    ],
    description: '轻推建立信任 → 稳定停留 → 拉远收束'
  }
};

// ═══════════════════════════════════════════════════════════
// v6.5.35: 人物鲜活度注入系统（基于外部专家方案）
// ═══════════════════════════════════════════════════════════

/**
 * 情绪→生理反应映射表
 * 基于文档：AI视频生成系统提示词工程方案 v1.0
 */
const EMOTION_PHYSIOLOGY_MAP = {
  'joy': ['脸颊泛起自然红晕', '眼睛微微眯起带笑意', '嘴角上扬时眼角挤出细纹'],
  'happy': ['脸颊泛起自然红晕', '眼睛微微眯起带笑意', '嘴角上扬时眼角挤出细纹'],
  'sad': ['通红的眼眶', '鼻尖微红', '一滴泪在眼角蓄势', '嘴唇微微颤抖'],
  'grief': ['眼神空洞麻木', '眼下有淡淡青黑色', '嘴唇失去血色', '肩膀微微下沉'],
  'anger': ['额头青筋微显', '下颌线紧绷', '瞳孔收缩', '鼻翼微微扩张'],
  'fear': ['瞳孔剧烈收缩', '额头冒出一层冷汗', '手指微微颤抖', '呼吸急促胸口起伏'],
  'surprise': ['瞳孔瞬间放大', '眉毛上扬', '嘴巴微张', '手不自觉地抬起'],
  'shy': ['脸颊泛起红晕', '耳朵尖也红了', '眼神闪躲', '手指无意识地绞着衣角'],
  'tired': ['眼下有明显青黑色', '忍不住打哈欠', '眼皮微微下垂', '肩膀下沉'],
  'anxious': ['额头渗出细密汗珠', '手指无意识地敲击', '眼神游移', '嘴角微微下压'],
  'calm': ['呼吸平稳', '眼神柔和', '肩膀自然放松', '嘴角中性'],
  'neutral': ['表情自然', '眼神平静', '面部肌肉放松'],
  'proud': ['下巴微微上扬', '眼神坚定', '嘴角自信上扬', '胸膛微微挺起'],
  'loving': ['眼神温柔如水', '嘴角带着宠溺的笑', '眉心舒展', '脸颊柔和'],
  'curious': ['眼睛微微睁大', '头微微歪向一侧', '眉毛轻挑', '嘴唇微张'],
  'confused': ['眉头轻蹙', '眼睛微微眯起', '头微微歪', '嘴角轻微下撇'],
  'excited': ['眼睛发亮', '嘴角大大上扬', '脸颊泛红', '身体微微前倾']
};

/**
 * 皮肤纹理指令集（按角色类型）
 */
const SKIN_TEXTURE_TEMPLATES = {
  infant: ['婴儿皮肤细腻', '可见微小毛孔', '透出自然红润气色', '脸颊有婴儿肥'],
  child: ['皮肤透出自然红润气色', '可见皮肤毛孔', '拒绝塑料陶瓷肌', '脸颊有自然光泽'],
  teen: ['皮肤保留毛孔和细纹', '透出自然红润气色', '拒绝过度磨皮效果', '可见皮肤纹理'],
  adult: ['皮肤保留毛孔、细纹等真实质感', '透出自然红润气色', '拒绝塑料陶瓷肌的过度磨皮效果', '可见皮肤纹理'],
  middle_age: ['眼角有自然细纹', '皮肤保留真实纹理', '拒绝过度磨皮', '透出健康气色'],
  elderly: ['皱纹自然', '皮肤纹理真实', '老年斑隐约可见', '拒绝磨皮']
};

/**
 * 质感真实化注入器
 * 根据角色和情绪注入皮肤纹理、生理反应、外观瑕疵
 */
function injectVividness(shot, options = {}) {
  const {
    characterAge = 'adult',
    emotionPhase = 'neutral',
    intensity = 'L2' // L1=极简, L2=含蓄, L3=自然, L4=强烈, L5=爆发
  } = options;

  const vividnessParts = [];
  
  // 1. 皮肤纹理（根据角色年龄）
  const ageGroup = ['infant', 'child', 'teen', 'adult', 'middle_age', 'elderly'].includes(characterAge) 
    ? characterAge : 'adult';
  const skinTemplate = SKIN_TEXTURE_TEMPLATES[ageGroup] || SKIN_TEXTURE_TEMPLATES['adult'];
  vividnessParts.push(...skinTemplate);
  
  // 2. 生理反应（根据情绪）
  const normalizedEmotion = (emotionPhase || 'neutral').toLowerCase().trim();
  const physiology = EMOTION_PHYSIOLOGY_MAP[normalizedEmotion] || EMOTION_PHYSIOLOGY_MAP['neutral'];
  
  // 根据强度选择反应数量
  const intensityMap = { 'L1': 1, 'L2': 2, 'L3': 2, 'L4': 3, 'L5': 4 };
  const count = intensityMap[intensity] || 2;
  vividnessParts.push(...physiology.slice(0, count));
  
  // 3. 动作细节（通用）
  vividnessParts.push('动作带重量感，身体运动符合物理规律');
  vividnessParts.push('眼神有灵魂，带符合情绪的微表情');
  
  return vividnessParts.join('，');
}

// ═══════════════════════════════════════════════════════════
// 核心API：增强Prompt（v6.5.35升级）
// ═══════════════════════════════════════════════════════════

/**
 * 增强单个镜头的Prompt
 * @param {Object} shot - 镜头对象
 * @param {Object} options - 配置选项
 * @returns {Object} 增强后的镜头对象
 */
function enhanceShotPrompt(shot, options = {}) {
  const {
    comboType = 'auto',        // 运镜组合类型，auto自动判断
    emotionCurve = null,       // 情绪曲线 [0-1, 0-1, ...]
    forceMultiSegment = true,   // 强制多段（禁止单一运镜超过4秒）
    maxSegmentDuration = 4,    // 最大单段时长
    lightingFollowEmotion = true, // 光影跟随情绪
    // v6.5.35: 新增人物鲜活度参数
    characterAge = 'adult',
    emotionPhase = 'neutral',
    emotionIntensity = 'L2'
  } = options;

  const originalPrompt = shot.prompt || shot.description || '';
  const duration = shot.duration || 8;
  
  // 🔥 v6.1-fix: 如果原始Prompt已包含镜头时间轴，跳过重复增强
  // 🔥 v6.2-patch49-fix: 同时检测v3运镜系统的"镜头时间轴"（无括号格式）
  if (originalPrompt.includes('【镜头时间轴') || originalPrompt.includes('【运镜与光影一致性约束】') || originalPrompt.includes('镜头时间轴：')) {
    return {
      ...shot,
      prompt: originalPrompt,
      _intraShotEnhanced: false,
      _enhancementVersion: INTRA_SHOT_VERSION,
      _skipReason: '原始Prompt已包含运镜时间轴'
    };
  }
  
  // 1. 判断运镜组合类型
  const detectedCombo = detectComboType(shot, comboType);
  const combo = CAMERA_COMBOS[detectedCombo] || CAMERA_COMBOS['opening'];
  
  // 2. 根据时长调整段数
  const segments = distributeSegments(combo.segments, duration, maxSegmentDuration);
  
  // 3. 为每段分配光影
  if (lightingFollowEmotion) {
    assignLightingToSegments(segments, shot.emotionTags || shot.emotion || ['宁静']);
  }
  
  // 4. 构建时间轴Prompt
  const timelinePrompt = buildTimelinePrompt(segments, shot);
  
  // v6.5.35: 注入人物鲜活度（皮肤纹理 + 生理反应 + 动作细节）
  const vividnessText = injectVividness(shot, {
    characterAge: shot.characterAge || 'adult',
    emotionPhase: shot.emotionPhase || shot.emotion || 'neutral',
    intensity: shot.emotionIntensity || 'L2'
  });
  
  // 5. 合并原始Prompt + 时间轴 + 鲜活度
  const enhancedPrompt = mergePrompts(originalPrompt, timelinePrompt + ' | 【人物鲜活度】' + vividnessText);
  
  // 6. 记录增强信息
  return {
    ...shot,
    prompt: enhancedPrompt,
    _intraShotEnhanced: true,
    _enhancementVersion: INTRA_SHOT_VERSION,
    segments: segments,  // 标准字段
    _segments: segments,  // 兼容旧字段
    _comboType: detectedCombo,
    _originalPrompt: originalPrompt
  };
}

/**
 * 自动判断运镜组合类型
 */
function detectComboType(shot, comboType) {
  if (comboType !== 'auto') return comboType;
  
  const type = shot.type || '';
  const sceneType = (shot.shotType || shot.type || '').toLowerCase();
  const description = (shot.description || '').toLowerCase();
  const prompt = (shot.prompt || '').toLowerCase();
  const sceneName = (shot.scene?.name || shot.scene || '').toLowerCase();
  const combined = `${type} ${description} ${prompt} ${sceneName}`;

  // 🔥 v6.5.32-fix5: generic 医疗科普专用组合
  // 根因：generic 镜头套用 Nirath 的 epic/intimate 等组合，时间轴不符合科普场景
  // 修复：generic / medical / education / documentary 模式使用专用科普组合
  const mode = shot.mode || shot.sceneMode || '';
  if (['generic', 'medical', 'education', 'documentary'].includes(mode)) {
    if (type === 'opening' || sceneType.includes('opening') || combined.includes('开场') || combined.includes('开始')) return 'educational_opening';
    if (type === 'closing' || sceneType.includes('closing') || combined.includes('结尾') || combined.includes('总结')) return 'reassurance_closing';
    if (type === 'demonstration' || sceneType.includes('demonstration') || combined.includes('演示') || combined.includes('步骤')) return 'clinical_demo';
    if (combined.includes('流程') || combined.includes('分解') || combined.includes('process')) return 'process_breakdown';
    if (type === 'explanation' || sceneType.includes('explanation') || combined.includes('讲解') || combined.includes('说明')) return 'medical_explain';

    return 'medical_explain'; // generic 默认
  }
  
  // 🔥 v6.2-patch101-fix: 场景类型差异化运镜（解决时间轴模板化）
  // 根因：所有场景套用相同组合类型（如epic），时间轴千篇一律
  // 修复：每个场景类型有独特的运镜组合（volcanic_epic/forest_intimate等）
  
  // 火山/熔岩场景：火山史诗
  if (sceneName.includes('火山') || sceneName.includes('熔岩') || sceneName.includes('岩浆') || 
      sceneType.includes('volcano') || sceneType.includes('lava')) {
    if (combined.includes('冲突') || combined.includes('对峙') || combined.includes('climax')) return 'confrontation';
    if (combined.includes('揭示') || combined.includes('真相') || combined.includes('revelation')) return 'revelation';
    return 'volcanic_epic'; // 火山场景专用
  }
  
  // 森林/丛林场景：森林亲密
  if (sceneName.includes('森林') || sceneName.includes('丛林') || sceneName.includes('树') || 
      sceneType.includes('forest') || sceneType.includes('jungle')) {
    if (combined.includes('对话') || combined.includes('dialogue')) return 'dialogue';
    if (combined.includes('回忆') || combined.includes('memory')) return 'memory';
    return 'forest_intimate'; // 森林场景专用
  }
  
  // 沼泽/湿地场景：沼泽恐怖
  if (sceneName.includes('沼泽') || sceneName.includes('湿地') || sceneName.includes('毒') || 
      sceneType.includes('swamp') || sceneType.includes('wetland')) {
    if (combined.includes('追逐') || combined.includes('chase')) return 'chase';
    return 'swamp_horror'; // 沼泽场景专用
  }
  
  // 荒原/沙漠场景：荒原悬疑
  if (sceneName.includes('荒原') || sceneName.includes('沙漠') || sceneName.includes('戈壁') || 
      sceneType.includes('wasteland') || sceneType.includes('desert')) {
    if (combined.includes('追逐') || combined.includes('chase')) return 'chase';
    return 'wasteland_suspense'; // 荒原场景专用
  }
  
  // 晶体/裂谷场景：晶体悬疑
  if (sceneName.includes('晶体') || sceneName.includes('裂谷') || sceneName.includes('晶') ||
      sceneType.includes('crystal') || sceneType.includes('canyon')) {
    if (combined.includes('冲突') || combined.includes('对峙')) return 'confrontation';
    return 'crystal_suspense'; // 晶体场景专用
  }
  
  // 骸骨/丛林场景：骸骨敬畏
  if (sceneName.includes('骸骨') || sceneName.includes('骨') || sceneName.includes('丛林') ||
      sceneType.includes('bone') || sceneType.includes('jungle')) {
    if (combined.includes('揭示') || combined.includes('真相')) return 'revelation';
    return 'bone_awe'; // 骸骨场景专用
  }
  
  // 祭坛/圣殿场景：史诗或对峙
  if (sceneName.includes('祭坛') || sceneName.includes('圣殿') || sceneName.includes('殿') ||
      sceneType.includes('altar') || sceneType.includes('temple')) {
    if (combined.includes('冲突') || combined.includes('对峙') || combined.includes('climax')) return 'confrontation';
    return 'epic'; // 祭坛场景
  }
  
  // 黎明/日出场景：真相揭示或史诗
  if (sceneName.includes('黎明') || sceneName.includes('日出') || sceneName.includes('曙光') ||
      sceneType.includes('dawn') || sceneType.includes('sunrise')) {
    if (combined.includes('揭示') || combined.includes('真相')) return 'revelation';
    return 'epic'; // 黎明场景
  }
  
  // 原始逻辑：基于内容关键词判断
  if (combined.includes('opening') || combined.includes('开场') || combined.includes('开始')) return 'opening';
  if (combined.includes('dialogue') || combined.includes('对话') || combined.includes('说')) return 'dialogue';
  if (combined.includes('chase') || combined.includes('追') || combined.includes('跑')) return 'chase';
  if (combined.includes('intimate') || combined.includes('浪漫') || combined.includes('爱')) return 'intimate';
  if (combined.includes('horror') || combined.includes('恐怖') || combined.includes('吓')) return 'horror';
  if (combined.includes('memory') || combined.includes('回忆') || combined.includes('过去')) return 'memory';
  if (combined.includes('epic') || combined.includes('史诗') || combined.includes('壮阔')) return 'epic';
  if (combined.includes('confront') || combined.includes('对峙') || combined.includes('冲突')) return 'confrontation';
  if (combined.includes('suspense') || combined.includes('悬疑') || combined.includes('紧张')) return 'suspense';
  if (combined.includes('reveal') || combined.includes('揭示') || combined.includes('真相')) return 'revelation';
  
  // 默认根据镜头类型
  if (type === 'opening') return 'opening';
  if (type === 'interaction' || type === 'dialogue') return 'dialogue';
  if (type === 'demonstration') return 'suspense';
  if (type === 'explanation') return 'intimate';
  if (type === 'closing') return 'epic';
  
  return 'opening';
}

/**
 * 根据总时长分配段数
 */
function distributeSegments(templateSegments, totalDuration, maxDuration) {
  const result = [];
  
  let remainingTime = totalDuration;
  let currentTime = 0;
  
  for (let i = 0; i < templateSegments.length; i++) {
    const template = templateSegments[i];
    
    // 计算本段时长
    let segDuration;
    if (i === templateSegments.length - 1) {
      segDuration = remainingTime; // 最后一段用剩余时间
    } else {
      const ratio = template.duration / templateSegments.reduce((s, t) => s + t.duration, 0);
      segDuration = Math.min(totalDuration * ratio, remainingTime * 0.6);
      segDuration = Math.max(segDuration, 1.5); // 最少1.5秒
      segDuration = Math.min(segDuration, maxDuration); // 不超过最大
    }
    
    segDuration = Math.round(segDuration * 10) / 10; // 保留1位小数
    
    result.push({
      ...template,
      timeRange: [Math.round(currentTime * 10) / 10, Math.round((currentTime + segDuration) * 10) / 10],
      duration: segDuration
    });
    
    currentTime += segDuration;
    remainingTime -= segDuration;
  }
  
  // 如果还有剩余时间，加到最后一段
  if (remainingTime > 0.1 && result.length > 0) {
    const last = result[result.length - 1];
    last.duration = Math.round((last.duration + remainingTime) * 10) / 10;
    last.timeRange[1] = Math.round((last.timeRange[1] + remainingTime) * 10) / 10;
  }
  
  return result;
}

/**
 * 为段分配光影（跟随情绪）
 */
// ═══════════════════════════════════════════════════════════
// v6.5.35: 光影智能决策系统（基于外部专家方案）
// 8种专业光效与情绪映射
// ═══════════════════════════════════════════════════════════

const CINEMATIC_LIGHTING_EFFECTS = {
  'golden_hour': {
    name: '黄金时刻',
    prompt: '此时正好是落日的黄金时刻，夕阳光线柔和温暖，逆光勾勒出人物身影轮廓，画面呈现温暖氛围，dusty atmosphere',
    emotions: ['joy', 'happy', 'warm', 'loving', 'proud', 'calm'],
    scenes: ['outdoor', 'sunset', 'beach', 'grassland', 'proposal']
  },
  'blue_hour': {
    name: '蓝调时刻',
    prompt: '此时正好是日出前/日落后的蓝调时刻，整个画面色调偏冷，呈现低调蓝色紫色，光线昏暗，低调照明，营造冷静忧郁氛围',
    emotions: ['sad', 'grief', 'lonely', 'calm', 'anxious'],
    scenes: ['night', 'city', 'sea', 'platform', 'afterglow']
  },
  'rembrandt': {
    name: '伦勃朗光',
    prompt: '对人物脸部使用伦勃朗光照明，光源从侧面45度角打来，受光侧脸颊明亮，暗部在眼睛下方形成小的三角形亮斑，暗部眼睛依然能看到眼神光，电影级画面',
    emotions: ['calm', 'proud', 'neutral', 'loving', 'contemplative'],
    scenes: ['portrait', 'interview', 'closeup', 'studio']
  },
  'top_light': {
    name: '顶光',
    prompt: '对人物使用顶光照明，光源垂直在头顶，在人物眼窝处形成明显阴影，下巴和鼻翼下方有深色阴影，制造压迫神秘感觉，画面光影对比强烈',
    emotions: ['anger', 'fear', 'tense', 'mysterious', 'serious'],
    scenes: ['interrogation', 'prison', 'office', 'dark_room']
  },
  'back_light': {
    name: '逆光',
    prompt: '夕阳逆光照射在人物身上，勾勒出人物边缘金色轮廓，形成人物剪影，光线从后方照入，画面呈现温暖氛围，电影级画面',
    emotions: ['joy', 'happy', 'sad', 'loving', 'hopeful', 'nostalgic'],
    scenes: ['sunset', 'silhouette', 'farewell', 'romantic']
  },
  'hard_light': {
    name: '硬光',
    prompt: '对人物使用硬光照明，光线质感硬朗，阴影边缘锋利，明暗对比极大，画面偏冷色调，凸显危险压迫氛围，电影级画面',
    emotions: ['anger', 'fear', 'danger', 'tense', 'serious'],
    scenes: ['ruins', 'action', 'military', 'night', 'chase']
  },
  'tyndall': {
    name: '丁达尔光',
    prompt: '光线从窗户/屋顶/缝隙照入，穿过烟雾/灰尘/水汽出现丁达尔效应，显现出光线的体积和路径，光柱清晰可见，画面明暗对比强烈，电影级画面',
    emotions: ['mysterious', 'sacred', 'dreamy', 'healing', 'curious'],
    scenes: ['church', 'forest', 'room', 'ruins', 'morning']
  },
  'film_noir': {
    name: '黑色电影',
    prompt: '光照使用黑色电影风格，对人物使用侧顶光照明，单一光源，投射出浓厚人物阴影，画面昏暗，光影对比强烈，营造悬疑阴谋感觉',
    emotions: ['mysterious', 'suspicious', 'danger', 'tense', 'serious'],
    scenes: ['night', 'street', 'detective', 'retro', 'conspiracy']
  }
};

/**
 * 光影智能决策器
 * 根据场景类型、情绪、时间段选择最佳光效
 */
function selectCinematicLighting(shot, options = {}) {
  const {
    sceneType = 'generic',
    emotionPhase = 'neutral',
    timeOfDay = 'day',
    setting = 'indoor'
  } = options;
  
  const normalizedEmotion = (emotionPhase || 'neutral').toLowerCase().trim();
  const normalizedScene = (sceneType || 'generic').toLowerCase().trim();
  
  // 1. 先按时间选择
  if (timeOfDay === 'sunset' || timeOfDay === 'sunrise') {
    return CINEMATIC_LIGHTING_EFFECTS['golden_hour'];
  }
  if (timeOfDay === 'blue_hour' || timeOfDay === 'dawn' || timeOfDay === 'dusk') {
    return CINEMATIC_LIGHTING_EFFECTS['blue_hour'];
  }
  if (timeOfDay === 'night' || setting === 'dark') {
    return CINEMATIC_LIGHTING_EFFECTS['film_noir'];
  }
  
  // 2. 按情绪匹配（找匹配度最高的）
  let bestMatch = null;
  let bestScore = -1;
  
  for (const [key, effect] of Object.entries(CINEMATIC_LIGHTING_EFFECTS)) {
    let score = 0;
    
    // 情绪匹配
    if (effect.emotions.includes(normalizedEmotion)) score += 3;
    
    // 场景匹配
    if (effect.scenes.some(s => normalizedScene.includes(s) || s.includes(normalizedScene))) score += 2;
    
    // 默认fallback
    if (key === 'rembrandt') score += 0.5;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = effect;
    }
  }
  
  return bestMatch || CINEMATIC_LIGHTING_EFFECTS['rembrandt'];
}

function assignLightingToSegments(segments, emotionTags) {
  if (!emotionTags || emotionTags.length === 0) {
    emotionTags = ['宁静'];
  }
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const emotion = emotionTags[Math.min(i, emotionTags.length - 1)];
    
    // v6.5.35: 使用光影智能决策器
    const cinematicLight = selectCinematicLighting(segment, {
      sceneType: segment.sceneType || 'generic',
      emotionPhase: emotion,
      timeOfDay: segment.timeOfDay || 'day',
      setting: segment.setting || 'indoor'
    });
    
    if (cinematicLight) {
      segment.primaryLight = {
        id: 'cinematic_' + cinematicLight.name,
        name: cinematicLight.name,
        colorTemp: 5000, // 默认值
        prompt: cinematicLight.prompt
      };
    }
    
    // 如果有动态光变需求（段内光变）
    if (i < segments.length - 1 && segment.emotion !== segments[i + 1]?.emotion) {
      // 两段情绪不同，推荐动态光变
      const nextEmotion = segments[i + 1].emotion;
      if (segment.emotion === '宁静' && nextEmotion === '紧张') {
        segment.lightingTransition = 'LIT-V01'; // 渐亮
      } else if (segment.emotion === '温暖' && nextEmotion === '忧伤') {
        segment.lightingTransition = 'LIT-V03'; // 色温漂移
      }
    }
  }
}

/**
 * 构建时间轴Prompt（v6.2-patch59: 粗粒度时间轴）
 * 将精确秒级改为相对阶段（早期/中期/后期）
 */
function buildTimelinePrompt(segments, shot) {
  const lines = [];
  lines.push('');
  lines.push('【镜头时间轴 — 电影级运镜与光影递进】');
  lines.push('');
  
  // v6.2-patch59: 使用相对阶段代替精确秒级
  const phaseLabels = ['早期', '中期', '后期'];
  const transitionLabels = ['→', '→', ''];
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const phaseLabel = phaseLabels[i] || `阶段${i + 1}`;
    
    // 运镜描述
    const camAtom = CAMERA_ATOMS[seg.camera];
    let camDesc = camAtom ? camAtom.prompt : seg.camera;
    
    // 填充参数
    for (const [key, val] of Object.entries(camAtom?.params || {})) {
      camDesc = camDesc.replace(`{{${key}}}`, seg[key] || val);
    }
    
    // 光影描述
    let lightDesc = '';
    if (seg.primaryLight) {
      lightDesc = `${seg.primaryLight.name}（${seg.primaryLight.prompt}）`;
    }
    
    // 动态光变
    if (seg.lightingTransition) {
      const transLight = LIGHTING_ATOMS[seg.lightingTransition];
      if (transLight) {
        lightDesc += ` → ${transLight.name}过渡`;
      }
    }
    
    lines.push(`【${phaseLabel}】${camDesc}${lightDesc ? '，' + lightDesc : ''}${seg.emotion ? '，情绪：' + seg.emotion : ''}${transitionLabels[i] || ''}`);
  }
  
  lines.push('');
  lines.push('【运镜与光影一致性约束】');
  lines.push('⚠️ 以上时间轴内的运镜变化、光影递进必须在镜头内自然连续呈现');
  lines.push('⚠️ 相邻阶段之间禁止突兀跳切，必须通过运镜运动自然过渡');
  lines.push('⚠️ 光影色温变化必须渐变，禁止突然跳变');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * 合并Prompt
 * 策略：保留原始Prompt的主体/场景描述，追加时间轴运镜光影描述
 * 不清理原始内容，因为主体描述（如"女主角面部中景"）需要保留
 */
function mergePrompts(originalPrompt, timelinePrompt) {
  // 简单清理：移除原始Prompt末尾的运镜词（避免与时间轴冲突）
  // 但保留主体描述、场景描述、角色描述等核心内容
  let cleaned = originalPrompt.trim();
  
  // 如果原始Prompt已经很长（超过200字），直接追加时间轴
  // 如果较短，说明主要是运镜描述，需要清理重复
  if (cleaned.length < 100) {
    // 短Prompt通常是简单运镜描述，清理独立运镜词
    const cameraKeywords = ['缓慢推近', '固定机位', '镜头向左', '镜头向右', '镜头上摇', 
      '镜头下摇', '镜头环绕', '镜头升起', '镜头下降', '拉远', '移焦'];
    const lightKeywords = ['自然光', '侧光', '顶光', '底光', '逆光', '顺光', '柔光', '硬光'];
    
    for (const kw of [...cameraKeywords, ...lightKeywords]) {
      cleaned = cleaned.replace(new RegExp(kw + '[,，.。;；]?', 'g'), '');
    }
    
    // 清理多余标点
    cleaned = cleaned.replace(/[,，]{2,}/g, '，').replace(/[。.]{2,}/g, '。');
    cleaned = cleaned.replace(/^[,，。.]+|[,，。.]+$/g, '');
  }
  
  return cleaned + '\n\n' + timelinePrompt;
}

// ═══════════════════════════════════════════════════════════
// 批量增强API
// ═══════════════════════════════════════════════════════════

/**
 * 批量增强镜头列表
 */
function enhanceShots(shots, options = {}) {
  return shots.map(shot => enhanceShotPrompt(shot, options));
}

/**
 * 获取可用的运镜组合列表
 */
function getAvailableCombos() {
  return Object.entries(CAMERA_COMBOS).map(([key, combo]) => ({
    id: key,
    name: combo.name,
    description: combo.description,
    segmentCount: combo.segments.length
  }));
}

/**
 * 获取情绪-光源推荐
 */
function getLightingForEmotion(emotion) {
  const lights = EMOTION_LIGHTING_MAP[emotion] || [];
  return lights.map(id => ({
    id,
    ...LIGHTING_ATOMS[id]
  })).filter(l => l.name);
}

/**
 * 验证镜头是否已增强
 */
function isEnhanced(shot) {
  return shot._intraShotEnhanced === true;
}

/**
 * 检查单一运镜警告（P19检查用）
 */
function checkSingleCameraWarning(shot) {
  if (!shot._segments || shot._segments.length <= 1) {
    return {
      pass: false,
      level: 'warning',
      message: `镜头 ${shot.id || 'unknown'} 仅有 ${shot._segments?.length || 1} 段运镜，视觉可能单调。建议拆分为多段运镜变化。`,
      suggestion: '建议使用 push_in + orbit_right 或 static + push_in + static 组合'
    };
  }
  
  const maxSegDuration = Math.max(...shot._segments.map(s => s.duration));
  if (maxSegDuration > 5) {
    return {
      pass: false,
      level: 'warning',
      message: `镜头 ${shot.id || 'unknown'} 存在 ${maxSegDuration}秒 单一运镜段，超过建议最大4秒。`,
      suggestion: '拆分为更短的多段，增加运镜变化'
    };
  }
  
  return { pass: true };
}

/**
 * 检查光影情绪递进（P20检查用）
 */
function checkLightingProgression(shot) {
  if (!shot._segments) {
    return {
      pass: false,
      level: 'error',
      message: `镜头 ${shot.id || 'unknown'} 未进行镜头内细分，无法检查光影递进。`
    };
  }
  
  const hasLightingChange = shot._segments.some((seg, i) => {
    if (i === 0) return false;
    const prev = shot._segments[i - 1];
    return seg.primaryLight?.id !== prev.primaryLight?.id;
  });
  
  if (!hasLightingChange) {
    return {
      pass: false,
      level: 'warning',
      message: `镜头 ${shot.id || 'unknown'} 全程使用单一光源（${shot._segments[0]?.primaryLight?.name || '未指定'}），缺乏光影情绪递进。`,
      suggestion: '根据情绪曲线变化切换光源（如：晨光侧射→暖色侧光→逆光轮廓）'
    };
  }
  
  return { pass: true };
}

// ═══════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════

module.exports = {
  // 核心API
  enhanceShotPrompt,
  enhanceShots,
  
  // 查询API
  getAvailableCombos,
  getLightingForEmotion,
  isEnhanced,
  
  // v6.5.35: 新增人物鲜活度与光影智能API
  injectVividness,
  selectCinematicLighting,
  
  // 检查API（预生产用）
  checkSingleCameraWarning,
  checkLightingProgression,
  
  // 数据
  CAMERA_ATOMS,
  LIGHTING_ATOMS,
  EMOTION_LIGHTING_MAP,
  CAMERA_COMBOS,
  // v6.5.35: 新增数据导出
  EMOTION_PHYSIOLOGY_MAP,
  SKIN_TEXTURE_TEMPLATES,
  CINEMATIC_LIGHTING_EFFECTS,
  INTRA_SHOT_VERSION
};
