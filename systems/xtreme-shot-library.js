/**
 * 极限运动镜头库 (Xtreme Shot Library)
 * 版本: v1.0.0
 * 定位：超短裙系统特色镜头库，提供肾上腺素飙升的瞬间镜头
 * 
 * 设计哲学：
 * - 第一视角 (POV) = 让人身临其境，代入感拉满
 * - 跟拍/侧拍/俯拍/仰拍 = 专业赛事感，视觉冲击力
 * - 慢动作 (Slo-mo) = 时间凝固，细节爆炸
 * - 快速切换 = 节奏感，短视频节奏核心
 * 
 * 使用方式：
 * 1. 从 getRandomShot() 获取随机镜头
 * 2. 从 getShotsBySport() 按运动类型获取
 * 3. 从 getShotsByAngle() 按视角类型获取
 * 4. 从 getComboSequence() 获取组合镜头序列
 */

'use strict';

// ==================== 核心镜头数据库 ====================

const XTREME_SHOTS = {
  // 高山滑雪 (Alpine Skiing)
  alpine: {
    name: '高山滑雪',
    description: '雪道飞驰，雪雾飞扬，速度感拉满',
    shots: [
      {
        id: 'alpine-pov-1',
        name: '雪道第一视角冲刺',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | 高山滑雪者视角 | 陡峭雪道俯冲 | 雪板切过粉雪扬起白色雪雾 | 速度感极强 | 两侧雪松飞速后退 | 镜头轻微震动模拟真实运动 | 阳光穿透雪雾形成光柱 | 肾上腺素飙升 | 极限运动质感',
        intensity: 9,
        tags: ['速度', '雪雾', '俯冲', '沉浸感']
      },
      {
        id: 'alpine-follow-1',
        name: '跟拍滑雪者飞跃',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | 滑雪者腾空跃起 | 背对镜头飞跃雪坡 | 雪板在空中划出优美弧线 | 雪花在身后炸开 | 蓝天背景 | 慢动作效果 | 运动摄影师水准 | 极限运动赛事画质',
        intensity: 9,
        tags: ['飞跃', '腾空', '慢动作', '专业']
      },
      {
        id: 'alpine-side-1',
        name: '侧拍高速过弯',
        angle: 'side',
        duration: 2,
        prompt: '【镜头】侧面高速拍摄 | 滑雪者急速过弯 | 雪板切入雪面激起雪浪 | 身体倾斜角度极大 | 速度线效果 | 竞技赛事感 | 雪花飞溅到镜头上 | 惊险刺激 | 极限运动摄影',
        intensity: 8,
        tags: ['过弯', '雪浪', '速度线', '竞技']
      },
      {
        id: 'alpine-top-1',
        name: '俯拍雪道全景',
        angle: 'top',
        duration: 3,
        prompt: '【镜头】航拍俯拍 | 滑雪者从山顶俯冲而下 | 蜿蜒雪道如白色丝带 | 人影在广阔雪场中快速移动 | 壮观全景 | 雪山背景 | 大自然震撼 | 人类挑战极限的渺小与伟大',
        intensity: 8,
        tags: ['全景', '壮观', '自然', '俯视']
      },
      {
        id: 'alpine-low-1',
        name: '仰拍腾空瞬间',
        angle: 'low',
        duration: 2,
        prompt: '【镜头】仰角拍摄 | 从雪面向上拍摄 | 滑雪者从头顶飞跃而过 | 雪板底部特写 | 雪花从空中洒落 | 逆光形成剪影 | 极限视角 | 惊险刺激 | 运动大片质感',
        intensity: 9,
        tags: ['仰拍', '剪影', '飞跃', '大片']
      }
    ]
  },

  // 跳伞/翼装飞行 (Skydiving / Wingsuit)
  skydiving: {
    name: '跳伞/翼装飞行',
    description: '自由落体，云端穿梭，生死一线的快感',
    shots: [
      {
        id: 'skydive-pov-1',
        name: '自由落体第一视角',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | 跳伞者自由落体 | 地面急速逼近 | 风声呼啸 | 云层在身旁飞速掠过 | 失重感极强 | 镜头剧烈震动 | 地平线旋转 | 生死一线的快感 | 极限运动记录',
        intensity: 10,
        tags: ['自由落体', '失重', '逼近', '恐惧']
      },
      {
        id: 'skydive-follow-1',
        name: '跟拍翼装飞行贴山',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | 翼装飞行者贴山飞行 | 距离岩壁仅数米 | 山谷在两侧飞速后退 | 飞行姿态完美 | 阴影在岩壁上掠过 | 惊险万分 | 人类飞行梦想 | 极限运动巅峰',
        intensity: 10,
        tags: ['翼装', '贴山', '飞行', '惊险']
      },
      {
        id: 'skydive-side-1',
        name: '侧拍开伞瞬间',
        angle: 'side',
        duration: 2,
        prompt: '【镜头】侧面高速拍摄 | 跳伞者开伞瞬间 | 降落伞砰然打开 | 身体被猛力向上拉 | 伞绳绷紧 | 速度骤减 | 从极速到悬停 | 震撼对比 | 极限运动关键时刻',
        intensity: 9,
        tags: ['开伞', '骤停', '对比', '震撼']
      },
      {
        id: 'skydive-top-1',
        name: '俯拍云层之上',
        angle: 'top',
        duration: 3,
        prompt: '【镜头】航拍俯拍 | 跳伞者在云层上方 | 脚下是云海如棉絮 | 从云端跃下 | 大地在远方 | 日出/日落金光 | 人类征服天空 | 史诗级画面 | 极限运动大片',
        intensity: 9,
        tags: ['云端', '金光', '史诗', '征服']
      },
      {
        id: 'skydive-low-1',
        name: '仰拍降落接近',
        angle: 'low',
        duration: 2,
        prompt: '【镜头】地面仰拍 | 跳伞者从天而降 | 降落伞如花朵般张开 | 快速接近镜头 | 身影越来越大 | 落地前的瞬间 | 尘土飞扬 | 完美着陆 | 极限运动完成感',
        intensity: 7,
        tags: ['降落', '接近', '尘土', '完成']
      }
    ]
  },

  // 冲浪 (Surfing)
  surfing: {
    name: '冲浪',
    description: '乘风破浪， tube ride，人与海洋的博弈',
    shots: [
      {
        id: 'surf-pov-1',
        name: '管浪内部第一视角',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | 冲浪者在管浪内部 | 浪壁如蓝色隧道环绕 | 前方是光亮出口 | 水花在身侧飞溅 | 浪管轰鸣 | 被大自然包围的震撼 | 极限运动沉浸感 | 蓝色视界',
        intensity: 10,
        tags: ['管浪', '隧道', '蓝色', '沉浸']
      },
      {
        id: 'surf-follow-1',
        name: '跟拍冲浪者骑浪',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】水上跟拍 | 冲浪者在巨浪上驰骋 | 从浪底转向浪尖 | 动作流畅优美 | 浪花在身后炸开 | 阳光照射水珠 | 慢动作 | 人与海洋的舞蹈 | 极限运动美学',
        intensity: 9,
        tags: ['骑浪', '浪尖', '水珠', '美学']
      },
      {
        id: 'surf-side-1',
        name: '侧拍浪壁切割',
        angle: 'side',
        duration: 2,
        prompt: '【镜头】侧面水上拍摄 | 冲浪者高速切割浪壁 | 冲浪板激起白色浪花 | 身体倾斜极限角度 | 浪壁如蓝色墙壁耸立 | 速度感 | 力量感 | 极限运动张力',
        intensity: 8,
        tags: ['切割', '浪壁', '速度', '力量']
      },
      {
        id: 'surf-top-1',
        name: '俯拍海浪与冲浪者',
        angle: 'top',
        duration: 3,
        prompt: '【镜头】航拍俯拍 | 碧蓝海浪如宝石 | 冲浪者在浪壁上如小黑点 | 浪阵整齐排列 | 冲浪者划水、起乘、飞驰 | 大海的壮美 | 人类的渺小与勇敢 | 极限运动宏大感',
        intensity: 8,
        tags: ['碧蓝', '浪阵', '宏大', '壮美']
      },
      {
        id: 'surf-low-1',
        name: '水面仰拍浪花',
        angle: 'low',
        duration: 2,
        prompt: '【镜头】水面仰拍 | 冲浪板从镜头上方掠过 | 水滴如雨般落下 | 逆光下水珠晶莹剔透 | 冲浪者身影逆光剪影 | 海水的蓝与阳光的金 | 极限运动诗意瞬间 | 震撼美感',
        intensity: 8,
        tags: ['水珠', '逆光', '诗意', '剪影']
      }
    ]
  },

  // 滑板 (Skateboarding)
  skateboarding: {
    name: '滑板',
    description: '街头极限，腾空翻转，城市地形的征服',
    shots: [
      {
        id: 'skate-pov-1',
        name: '滑板第一视角冲刺',
        angle: 'pov',
        duration: 2,
        prompt: '【镜头】第一视角 (POV) | 滑板者视角 | 滑板前端翘起 | 城市街道飞速后退 | 地砖纹理清晰可见 | 遇到台阶腾空跃起 | 落地冲击 | 街头极限感 | 极限运动街头风格',
        intensity: 7,
        tags: ['街头', '腾空', '冲击', '城市']
      },
      {
        id: 'skate-follow-1',
        name: '跟拍腾空翻转',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | 滑板者腾空做kickflip | 滑板在空中旋转 | 身体姿态完美 | 背景是城市建筑 | 慢动作 | 滑板在脚下翻转360度 | 稳稳落地 | 极限运动技巧',
        intensity: 9,
        tags: ['kickflip', '旋转', '技巧', '慢动作']
      },
      {
        id: 'skate-side-1',
        name: '侧拍滑轨 grinding',
        angle: 'side',
        duration: 2,
        prompt: '【镜头】侧面拍摄 | 滑板者在扶手上滑轨 | 滑板底部与金属摩擦产生火花 | 身体平衡极限 | 城市街头背景 | 火花四溅 | 街头极限运动 | 酷劲十足',
        intensity: 8,
        tags: ['grinding', '火花', '滑轨', '酷']
      },
      {
        id: 'skate-low-1',
        name: '仰拍滑板从头顶飞过',
        angle: 'low',
        duration: 2,
        prompt: '【镜头】仰角拍摄 | 滑板者从镜头上方腾空 | 滑板底部特写 | 轮子旋转 | 蓝天背景 | 身体悬空 | 重力似乎消失 | 极限运动瞬间 | 街头大片',
        intensity: 8,
        tags: ['腾空', '底部', '蓝天', '街头']
      }
    ]
  },

  // BMX/小轮车 (BMX)
  bmx: {
    name: 'BMX/小轮车',
    description: '腾空飞跃，特技旋转，街头与赛场的极限',
    shots: [
      {
        id: 'bmx-pov-1',
        name: 'BMX第一视角腾空',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | BMX骑手视角 | 从坡道腾空而起 | 车把在眼前 | 地面远离 | 空中俯瞰赛场 | 极速坠落 | 冲击感 | 极限运动第一视角 | 肾上腺素',
        intensity: 9,
        tags: ['腾空', '坡道', '俯瞰', '坠落']
      },
      {
        id: 'bmx-follow-1',
        name: '跟拍360度旋转',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | BMX骑手腾空做360度旋转 | 身体和单车在空中旋转 | 背景是赛场/滑板公园 | 慢动作 | 旋转中的完美姿态 | 稳稳落地 | 极限运动技巧大片',
        intensity: 9,
        tags: ['360度', '旋转', '技巧', '赛场']
      },
      {
        id: 'bmx-side-1',
        name: '侧拍腾空最高点',
        angle: 'side',
        duration: 2,
        prompt: '【镜头】侧面高速拍摄 | BMX骑手在腾空最高点 | 身体完全舒展 | 单车在身下 | 背景是天空 | 时间似乎凝固 | 极限运动巅峰瞬间 | 力量与美感 | 震撼',
        intensity: 8,
        tags: ['最高点', '凝固', '力量', '巅峰']
      }
    ]
  },

  // 攀岩 (Rock Climbing)
  climbing: {
    name: '攀岩',
    description: '绝壁之上，力量与意志的较量',
    shots: [
      {
        id: 'climb-pov-1',
        name: '攀岩第一视角俯视',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | 攀岩者俯视下方 | 双脚踩在岩点上 | 下面是百米深渊 | 手抓岩点 | 岩壁纹理清晰 | 风吹发丝 | 恐惧与勇气并存 | 极限运动心理感 | 沉浸感',
        intensity: 9,
        tags: ['俯视', '深渊', '恐惧', '心理']
      },
      {
        id: 'climb-follow-1',
        name: '跟拍攀岩者动态',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | 攀岩者在绝壁上动态移动 | 肌肉线条紧绷 | 汗水闪烁 | 岩粉飞扬 | 阳光照射岩壁 | 力量感 | 极限运动人体美学 | 震撼',
        intensity: 8,
        tags: ['肌肉', '汗水', '力量', '人体']
      },
      {
        id: 'climb-top-1',
        name: '俯拍绝壁全景',
        angle: 'top',
        duration: 3,
        prompt: '【镜头】航拍俯拍 | 攀岩者在巨大岩壁上如蚂蚁 | 岩壁垂直如刀削 | 下方是山谷/河流 | 人类挑战自然 | 壮观 | 极限运动宏大感 | 大自然的威严',
        intensity: 9,
        tags: ['绝壁', '壮观', '自然', '威严']
      }
    ]
  },

  // 摩托车特技 (Motocross)
  motocross: {
    name: '摩托车特技',
    description: '引擎轰鸣，腾空飞跃，钢铁与勇气的结合',
    shots: [
      {
        id: 'moto-pov-1',
        name: '摩托车手第一视角',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | 摩托车手视角 | 车把前方 | 越野赛道飞速后退 | 腾空跃起 | 前轮高高抬起 | 落地冲击 | 引擎轰鸣感 | 极限运动速度 | 泥土飞溅',
        intensity: 9,
        tags: ['引擎', '泥土', '速度', '轰鸣']
      },
      {
        id: 'moto-follow-1',
        name: '跟拍腾空飞跃',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | 摩托车腾空飞跃 | 车手在空中控制车身 | 后轮甩出泥土 | 背景是赛场/自然 | 慢动作 | 车身在空中倾斜 | 极限运动大片 | 震撼',
        intensity: 9,
        tags: ['飞跃', '泥土', '慢动作', '大片']
      },
      {
        id: 'moto-side-1',
        name: '侧拍弯道漂移',
        angle: 'side',
        duration: 2,
        prompt: '【镜头】侧面高速拍摄 | 摩托车高速过弯 | 车身倾斜接近地面 | 膝盖几乎触地 | 轮胎摩擦产生烟雾 | 速度线 | 极限运动竞技 | 惊险刺激',
        intensity: 8,
        tags: ['漂移', '烟雾', '竞技', '惊险']
      }
    ]
  },

  // 跑酷 (Parkour)
  parkour: {
    name: '跑酷',
    description: '城市飞檐走壁，人体极限的流动',
    shots: [
      {
        id: 'parkour-pov-1',
        name: '跑酷第一视角飞跃',
        angle: 'pov',
        duration: 3,
        prompt: '【镜头】第一视角 (POV) | 跑酷者视角 | 从屋顶跃向另一屋顶 | 脚下是城市街道 | 风在耳边呼啸 | 落地翻滚 | 连续动作 | 城市极限运动 | 沉浸感 | 肾上腺素',
        intensity: 9,
        tags: ['屋顶', '飞跃', '城市', '流动']
      },
      {
        id: 'parkour-follow-1',
        name: '跟拍跑酷流畅动作',
        angle: 'follow',
        duration: 3,
        prompt: '【镜头】专业跟拍 | 跑酷者在城市流畅穿梭 | 翻越高墙 | 穿越栏杆 | 动作连贯如流水 | 城市背景 | 慢动作突出关键动作 | 人体极限运动 | 美感',
        intensity: 8,
        tags: ['穿梭', '连贯', '美感', '流畅']
      },
      {
        id: 'parkour-low-1',
        name: '仰拍从头顶飞跃',
        angle: 'low',
        duration: 2,
        prompt: '【镜头】仰角拍摄 | 跑酷者从镜头上方跃过 | 身体在空中舒展 | 城市建筑背景 | 逆光剪影 | 重力挑战 | 极限运动瞬间 | 街头大片',
        intensity: 8,
        tags: ['舒展', '剪影', '街头', '挑战']
      }
    ]
  }
};

// ==================== 视角类型定义 ====================

const ANGLE_TYPES = {
  pov: {
    name: '第一视角 (POV)',
    description: '运动员视角，身临其境，沉浸感最强',
    intensityBoost: 1.2,
    bestFor: ['速度感', '沉浸感', '恐惧', '刺激']
  },
  follow: {
    name: '专业跟拍',
    description: '摄影师跟随拍摄，专业赛事感，动作完整',
    intensityBoost: 1.0,
    bestFor: ['动作完整', '专业感', '技巧展示', '美感']
  },
  side: {
    name: '侧面高速拍摄',
    description: '侧面捕捉速度感和力量感',
    intensityBoost: 1.0,
    bestFor: ['速度线', '力量', '竞技', '张力']
  },
  top: {
    name: '航拍俯拍',
    description: '上帝视角，展现宏大场景和人与自然的关系',
    intensityBoost: 0.9,
    bestFor: ['宏大', '壮观', '自然', '史诗']
  },
  low: {
    name: '仰角拍摄',
    description: '从低处向上，突出腾空感和视觉冲击力',
    intensityBoost: 1.1,
    bestFor: ['腾空', '冲击', '剪影', '大片']
  }
};

// ==================== 组合镜头序列 ====================

const COMBO_SEQUENCES = {
  // 经典三段式：建立→高潮→回落
  classic: {
    name: '经典三段式',
    description: '建立场景 → 高潮瞬间 → 回落/完成',
    sequence: [
      { angle: 'top', duration: 2, purpose: '建立场景' },
      { angle: 'pov', duration: 3, purpose: '高潮瞬间' },
      { angle: 'follow', duration: 2, purpose: '完成/回落' }
    ]
  },

  // 肾上腺素爆发：快速切换
  adrenaline: {
    name: '肾上腺素爆发',
    description: '多角度快速切换，制造紧张感和兴奋感',
    sequence: [
      { angle: 'pov', duration: 1, purpose: '进入' },
      { angle: 'side', duration: 1, purpose: '加速' },
      { angle: 'low', duration: 1, purpose: '腾空' },
      { angle: 'follow', duration: 2, purpose: '高潮' },
      { angle: 'top', duration: 2, purpose: '释放' }
    ]
  },

  // 慢动作特写：时间凝固
  slowmo: {
    name: '慢动作特写',
    description: '关键时刻慢动作，细节放大',
    sequence: [
      { angle: 'follow', duration: 2, purpose: '起势' },
      { angle: 'side', duration: 3, purpose: '慢动作高潮' },
      { angle: 'low', duration: 2, purpose: '完成' }
    ]
  },

  // 沉浸式体验：POV主导
  immersive: {
    name: '沉浸式体验',
    description: 'POV为主，让观众成为运动员',
    sequence: [
      { angle: 'pov', duration: 3, purpose: '进入场景' },
      { angle: 'pov', duration: 3, purpose: '高潮' },
      { angle: 'pov', duration: 2, purpose: '完成' }
    ]
  },

  // 电影感：多角度叙事
  cinematic: {
    name: '电影感叙事',
    description: '多角度切换，完整叙事',
    sequence: [
      { angle: 'top', duration: 2, purpose: '环境建立' },
      { angle: 'follow', duration: 2, purpose: '人物引入' },
      { angle: 'side', duration: 2, purpose: '加速' },
      { angle: 'pov', duration: 3, purpose: '高潮' },
      { angle: 'low', duration: 2, purpose: '完成' },
      { angle: 'top', duration: 2, purpose: '释放' }
    ]
  }
};

// ==================== API 函数 ====================

class XtremeShotLibrary {
  constructor() {
    this.shots = XTREME_SHOTS;
    this.angles = ANGLE_TYPES;
    this.sequences = COMBO_SEQUENCES;
  }

  // 获取所有运动类型
  getSports() {
    return Object.keys(this.shots).map(key => ({
      id: key,
      name: this.shots[key].name,
      description: this.shots[key].description
    }));
  }

  // 获取所有视角类型
  getAngles() {
    return Object.keys(this.angles).map(key => ({
      id: key,
      ...this.angles[key]
    }));
  }

  // 按运动类型获取镜头
  getShotsBySport(sport) {
    if (!this.shots[sport]) return [];
    return this.shots[sport].shots;
  }

  // 按视角类型获取镜头（跨运动类型）
  getShotsByAngle(angle) {
    const results = [];
    for (const sport of Object.values(this.shots)) {
      for (const shot of sport.shots) {
        if (shot.angle === angle) {
          results.push({
            ...shot,
            sportName: sport.name
          });
        }
      }
    }
    return results;
  }

  // 获取单个镜头
  getShot(sportId, shotId) {
    const sport = this.shots[sportId];
    if (!sport) return null;
    return sport.shots.find(s => s.id === shotId) || null;
  }

  // 随机获取一个镜头
  getRandomShot() {
    const sports = Object.keys(this.shots);
    const randomSport = sports[Math.floor(Math.random() * sports.length)];
    const shots = this.shots[randomSport].shots;
    const randomShot = shots[Math.floor(Math.random() * shots.length)];
    return {
      ...randomShot,
      sportName: this.shots[randomSport].name
    };
  }

  // 获取指定强度以上的镜头
  getShotsByIntensity(minIntensity = 8) {
    const results = [];
    for (const [sportId, sport] of Object.entries(this.shots)) {
      for (const shot of sport.shots) {
        if (shot.intensity >= minIntensity) {
          results.push({
            ...shot,
            sportName: sport.name
          });
        }
      }
    }
    return results.sort((a, b) => b.intensity - a.intensity);
  }

  // 获取组合镜头序列
  getComboSequence(sequenceName = 'classic') {
    const sequence = this.sequences[sequenceName];
    if (!sequence) return null;

    // 为每个序列步骤匹配合适的镜头
    return sequence.sequence.map((step, index) => {
      // 找到所有匹配视角的镜头
      const candidates = this.getShotsByAngle(step.angle);
      // 随机选择一个
      const selected = candidates[Math.floor(Math.random() * candidates.length)] || this.getRandomShot();
      
      return {
        step: index + 1,
        purpose: step.purpose,
        angle: this.angles[step.angle],
        shot: selected,
        duration: step.duration
      };
    });
  }

  // 生成提示词（用于超短裙系统）
  generatePrompt(options = {}) {
    const { sport, angle, intensity = 7, combo = false } = options;
    
    if (combo) {
      // 生成组合序列
      const sequence = this.getComboSequence('adrenaline');
      return sequence.map(step => ({
        ...step,
        prompt: step.shot.prompt
      }));
    }

    // 获取符合条件的镜头
    let candidates = [];
    if (sport && angle) {
      candidates = this.getShotsBySport(sport).filter(s => s.angle === angle);
    } else if (sport) {
      candidates = this.getShotsBySport(sport);
    } else if (angle) {
      candidates = this.getShotsByAngle(angle);
    } else {
      candidates = [this.getRandomShot()];
    }

    // 过滤强度
    candidates = candidates.filter(s => s.intensity >= intensity);
    
    if (candidates.length === 0) {
      return this.getRandomShot().prompt;
    }

    return candidates[Math.floor(Math.random() * candidates.length)].prompt;
  }

  // 生成超短裙系统镜头配置
  generateShortVideoShots(options = {}) {
    const { 
      sport = 'alpine', 
      sequence = 'adrenaline', 
      totalDuration = 15 
    } = options;

    const seq = this.sequences[sequence];
    if (!seq) return null;

    const shots = [];
    let currentTime = 0;

    for (const step of seq.sequence) {
      const candidates = this.getShotsBySport(sport).filter(s => s.angle === step.angle);
      const selected = candidates[Math.floor(Math.random() * candidates.length)] || this.getRandomShot();
      
      shots.push({
        id: selected.id,
        name: selected.name,
        startTime: currentTime,
        duration: step.duration,
        angle: step.angle,
        prompt: selected.prompt,
        intensity: selected.intensity,
        purpose: step.purpose
      });
      
      currentTime += step.duration;
      if (currentTime >= totalDuration) break;
    }

    return {
      totalDuration: currentTime,
      shots,
      sport: this.shots[sport]?.name || '混合',
      sequence: seq.name
    };
  }
}

// ==================== 导出 ====================

module.exports = {
  XtremeShotLibrary,
  XTREME_SHOTS,
  ANGLE_TYPES,
  COMBO_SEQUENCES
};

// 如果是直接运行，输出示例
if (require.main === module) {
  const lib = new XtremeShotLibrary();
  
  console.log('🎬 极限运动镜头库 (Xtreme Shot Library) v1.0.0\n');
  console.log('📋 支持运动类型:', lib.getSports().map(s => s.name).join(' | '));
  console.log('📷 支持视角:', lib.getAngles().map(a => a.name).join(' | '));
  console.log('🎞️ 组合序列:', Object.keys(COMBO_SEQUENCES).join(' | '));
  
  console.log('\n--- 示例输出 ---\n');
  
  // 示例1：随机镜头
  console.log('🎲 随机镜头:');
  console.log(lib.getRandomShot());
  
  // 示例2：按运动类型
  console.log('\n⛷️ 高山滑雪镜头 (3个):');
  console.log(lib.getShotsBySport('alpine').slice(0, 3));
  
  // 示例3：按视角
  console.log('\n👁️ 第一视角镜头 (3个):');
  console.log(lib.getShotsByAngle('pov').slice(0, 3));
  
  // 示例4：高肾上腺素镜头
  console.log('\n🔥 高肾上腺素镜头 (intensity >= 9):');
  console.log(lib.getShotsByIntensity(9).slice(0, 3));
  
  // 示例5：组合序列
  console.log('\n🎬 肾上腺素爆发序列:');
  console.log(lib.getComboSequence('adrenaline'));
  
  // 示例6：超短裙15秒配置
  console.log('\n🩲 超短裙15秒配置 (高山滑雪):');
  console.log(lib.generateShortVideoShots({ sport: 'alpine', totalDuration: 15 }));
}
