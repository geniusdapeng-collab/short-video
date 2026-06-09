#!/usr/bin/env node
/**
 * 【横纹肌溶解S01E01】全新端到端链路 — 从零开始
 * 第一集：横纹肌溶解的症状以及实验室检查
 */

const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, '..');
const CONFIG = require(path.join(PROJECT_DIR, 'project-config.json'));

// ============================================================
// STEP 1: 剧本创作 — 从零全新编写
// ============================================================

const SCRIPT = {
  title: "什么是横纹肌溶解",
  episode: "第一集：症状与实验室检查",
  opening: "AI主播小陈，继续给大家讲解健康科普知识。",
  
  scenes: [
    {
      id: "S01",
      type: "opening",
      narration: "AI主播小陈，继续给大家讲解健康科普知识。大家好，我是小陈。今天我们来聊聊一个听起来吓人、但很多人其实都遇到过的问题——横纹肌溶解。",
      characters: ["chen-nurse"],
      duration: 6,
      priority: "critical"
    },
    {
      id: "S02",
      type: "explanation",
      narration: "横纹肌溶解，简单来说就是肌肉细胞破了。我们全身的肌肉——尤其是大腿、小腿和腰部的肌肉——里面有很多肌细胞。",
      characters: ["chen-nurse"],
      duration: 6,
      priority: "high"
    },
    {
      id: "S03",
      type: "explanation",
      narration: "当这些肌细胞因为剧烈运动、外伤或者药物等原因破裂之后，细胞里面的肌红蛋白、钾离子这些物质就会跑到血液里面去。",
      characters: ["chen-nurse"],
      duration: 6,
      priority: "high"
    },
    {
      id: "S04",
      type: "demonstration",
      narration: "我们的身体就会发出三个典型信号。第一个信号——肌肉酸痛、浑身没劲儿。你会感觉大腿、手臂或者腰部肌肉又酸又胀，像被人打了一顿一样，连走路都费劲。",
      characters: ["chen-nurse", "coach-li"],
      duration: 8,
      priority: "critical"
    },
    {
      id: "S05",
      type: "demonstration",
      narration: "第二个信号——小便颜色变深。正常的尿是淡黄色的，但如果肌细胞破裂了，肌红蛋白混进尿液，尿液会变成浓茶色，甚至像酱油一样黑。",
      characters: ["chen-nurse", "coach-li"],
      duration: 7,
      priority: "critical"
    },
    {
      id: "S06",
      type: "explanation",
      narration: "第三个信号——肌肉肿胀和压痛。用手按一下大腿或者小腿，会感觉到明显的胀痛，有时候皮肤还会发红发热。",
      characters: ["chen-nurse", "coach-li"],
      duration: 6,
      priority: "high"
    },
    {
      id: "S07",
      type: "interaction",
      narration: "小陈老师，这三个症状如果出现了，是不是要立即去医院检查？",
      characters: ["xiaoG", "chen-nurse"],
      duration: 4,
      priority: "medium"
    },
    {
      id: "S08",
      type: "explanation",
      narration: "对，没错！一旦你发现这三个症状同时出现——肌肉酸痛无力、小便颜色加深、肌肉肿胀压痛——一定要马上去医院。",
      characters: ["chen-nurse"],
      duration: 5,
      priority: "critical"
    },
    {
      id: "S09",
      type: "explanation",
      narration: "到了医院之后，医生会做几项关键的实验室检查。首先抽血查肌酸激酶，英文叫CK。正常值是几十到一两百，但如果横纹肌溶解了，CK值会飙升到几千甚至几万。",
      characters: ["chen-nurse"],
      duration: 7,
      priority: "high"
    },
    {
      id: "S10",
      type: "explanation",
      narration: "同时医生还会查肾功能和电解质。因为肌红蛋白会堵住肾脏，导致急性肾损伤；钾离子跑出来还会引起心律失常，严重的时候心跳会突然停止。",
      characters: ["chen-nurse"],
      duration: 7,
      priority: "high"
    },
    {
      id: "S11",
      type: "explanation",
      narration: "另外，尿液检查也很重要。医生会看你的尿液里面有没有肌红蛋白，尿蛋白是不是阳性。如果尿蛋白很高，就说明肾脏已经在受损了。",
      characters: ["chen-nurse"],
      duration: 6,
      priority: "medium"
    },
    {
      id: "S12",
      type: "closing",
      narration: "所以记住——三个症状要警惕，两项检查不能少。CK值飙升、肾功能异常、尿液变色，这些都是身体在报警。千万别硬扛，及时就医才能保住肌肉和肾脏！",
      characters: ["chen-nurse", "xiaoG"],
      duration: 7,
      priority: "critical"
    }
  ]
};

// ============================================================
// STEP 2: 故事板 — 从零全新设计
// ============================================================

const STORYBOARD = SCRIPT.scenes.map((scene, i) => {
  const totalScenes = SCRIPT.scenes.length;
  
  // 角色分配
  const primaryRole = scene.characters[0];
  const secondaryRole = scene.characters[1] || null;
  
  // 运镜配置
  const cameraConfig = generateCameraConfig(scene.type, i, totalScenes, scene.duration);
  
  return {
    id: scene.id,
    type: scene.type,
    role: scene.type,
    narration: scene.narration,
    characters: scene.characters,
    primaryCharacter: primaryRole,
    secondaryCharacter: secondaryRole,
    duration: scene.duration,
    priority: scene.priority,
    mouthAction: generateMouthAction(scene.type, primaryRole),
    emotion: generateEmotion(scene.type),
    cameraMovement: cameraConfig,
    background: generateBackground(scene.type, scene.characters),
    lighting: generateLighting(scene.type),
    composition: generateComposition(scene.type, primaryRole, secondaryRole)
  };
});

function generateCameraConfig(type, index, total, duration) {
  const progress = index / (total - 1);
  
  // 基础运镜
  let shotSize, position, movement, speed;
  
  switch(type) {
    case 'opening':
      shotSize = 'medium'; position = 'center'; movement = 'steady'; speed = 'silky';
      break;
    case 'explanation':
      shotSize = 'medium'; position = 'center'; movement = 'subtle'; speed = 'smooth';
      break;
    case 'demonstration':
      shotSize = 'full'; position = 'center'; movement = 'tracking'; speed = 'smooth';
      break;
    case 'interaction':
      shotSize = 'medium_two_shot'; position = 'center'; movement = 'steady'; speed = 'silky';
      break;
    case 'closing':
      shotSize = 'medium'; position = 'center'; movement = 'slow_push'; speed = 'silky';
      break;
    default:
      shotSize = 'medium'; position = 'center'; movement = 'steady'; speed = 'smooth';
  }
  
  // 情绪阶段
  let emotionStage;
  if (progress < 0.15) emotionStage = 'establish';
  else if (progress < 0.45) emotionStage = 'rise';
  else if (progress < 0.75) emotionStage = 'build';
  else if (progress < 0.9) emotionStage = 'climax';
  else emotionStage = 'freeze';
  
  return {
    shotSize,
    position,
    movement,
    speed,
    emotionStage,
    timeRange: [0, duration],
    physics: false
  };
}

function generateMouthAction(type, character) {
  if (character === 'chen-nurse') {
    return '嘴部微张正在说话，表情亲切专业，嘴角带有微笑';
  } else if (character === 'xiaoG') {
    return '嘴部微张提问或回应，表情专注认真，眼神带有求知欲';
  } else if (character === 'coach-li') {
    return '嘴部微张配合演示动作，表情专注配合';
  }
  return '嘴部自然闭合';
}

function generateEmotion(type) {
  switch(type) {
    case 'opening': return '热情欢迎，亲切专业';
    case 'explanation': return '认真讲解，耐心细致';
    case 'demonstration': return '专注演示，配合默契';
    case 'interaction': return '积极互动，求知欲强';
    case 'closing': return '总结归纳，温暖关怀';
    default: return '自然平和';
  }
}

function generateBackground(type, characters) {
  if (characters.includes('chen-nurse') && characters.length === 1) {
    return '社区健康科普讲堂，背景有健康宣传海报墙，暖色灯光，简约现代装修风格，浅米色墙面配木质讲台，左侧有绿植装饰，右侧有"健康知识普及"大字背景板';
  } else if (characters.includes('coach-li')) {
    return '社区健康科普讲堂演示区，有演示台和人体模型/示意道具，暖色灯光，墙面挂有解剖示意图';
  } else if (characters.includes('xiaoG')) {
    return '社区健康科普讲堂听众区，小G坐在前排，身后有其他模糊听众剪影，暖色灯光';
  }
  return '社区健康科普讲堂';
}

function generateLighting(type) {
  return '摄影棚三点布光，主光从右前方45度打亮面部，补光消除左脸阴影，轮廓光勾勒人物边缘，整体色温5600K自然白光，明亮通透，无阴影死角';
}

function generateComposition(type, primary, secondary) {
  if (secondary) {
    if (type === 'interaction') {
      return '双人构图，陈女士在画面左侧三分之一处，小G在右侧三分之一处，两人中间留交流空间，视线交汇形成对角线张力，中景半身';
    }
    return '双人构图，主角色在画面中央偏左，配角在右侧配合演示，中景全身';
  }
  return '单人构图，人物位于画面中央偏左三分之一处，背景环境交代清晰，中景半身，头顶留一指空间';
}

// ============================================================
// STEP 3: 提示词构建 — 从零全新生成（调用角色档案）
// ============================================================

function buildPrompt(shot, shotIndex, totalShots) {
  const parts = [];
  
  // 1. 系统约束（全局，精简版）
  parts.push("写实纪录片摄影，电影级调色，自然光");
  
  // 2. 画面主体描述（角色调用）— 精简
  const charDesc = buildCharacterDescription(shot);
  parts.push(charDesc);
  
  // 3. 角色动作与表情（合并为一行）
  parts.push(`${buildActionDescription(shot)}，${shot.emotion}，${shot.mouthAction}`);
  
  // 4. 环境与背景（精简，不再重复全描述）
  parts.push(buildBackgroundBrief(shot));
  
  // 5. 光影与质感（精简为关键词）
  parts.push("三点布光，5600K自然白光，皮肤纹理真实，毛孔可见，无美颜磨皮");
  
  // 6. 构图与运镜（合并）
  parts.push(`${shot.composition}，${buildCameraDescription(shot.cameraMovement)}`);
  
  // 7. 负面提示词（精简版）
  parts.push("禁止：卡通动漫奇幻科幻魔法特效发光粒子磨皮变形模糊水印文字");
  
  return parts.join("。 ");
}

function buildBackgroundBrief(shot) {
  if (shot.characters.includes('coach-li')) {
    return "社区健康讲堂演示区，演示台和人体模型，暖色灯光，墙面解剖示意图";
  } else if (shot.characters.includes('xiaoG') && shot.type === 'interaction') {
    return "社区健康讲堂听众区，小G坐前排，身后模糊听众剪影，暖色灯光";
  }
  return "社区健康科普讲堂，健康宣传海报墙，浅米色墙面木质讲台，绿植装饰";
}

function buildCharacterDescription(shot) {
  const descs = [];
  
  for (const charId of shot.characters) {
    switch(charId) {
      case 'chen-nurse':
        descs.push("一名年轻女性护士，身穿藏青色警官风格制服，肩章和臂章带有医疗十字标识，短发干练，面容清秀，气质亲切专业");
        break;
      case 'xiaoG':
        descs.push("一个8岁左右的小男孩，身穿白色T恤配蓝色牛仔裤，短发整齐，面容清秀，眼神专注认真，坐姿端正");
        break;
      case 'coach-li':
        descs.push("一名中年男性健身教练，身穿黑色运动T恤和灰色运动裤，体格健硕，肌肉线条分明，面容坚毅友善");
        break;
    }
  }
  
  return "画面中人物：" + descs.join("；");
}

function buildActionDescription(shot) {
  switch(shot.type) {
    case 'opening':
      return "陈女士右手自然抬起做欢迎手势，左手自然下垂，身体微微前倾面向镜头，头部端正，目光直视镜头";
    case 'explanation':
      return "陈女士双手在身前做讲解手势，手指自然舒展，动作优雅专业，身体保持直立，偶尔微微侧头示意";
    case 'demonstration':
      return "陈女士用手指向李明教练的身体部位做演示讲解，李明教练配合做出展示肌肉的动作，两人配合默契";
    case 'interaction':
      return "小G坐在座位上，身体微微前倾，右手举起提问，目光看向陈女士，表情认真专注；陈女士身体转向小G，面带微笑回应";
    case 'closing':
      return "陈女士双手合十做总结手势，表情温暖坚定，身体端正面向镜头，小G在旁点头微笑表示理解";
    default:
      return "人物自然站立，姿态端正";
  }
}

function buildCameraDescription(camera) {
  const { shotSize, position, movement, speed } = camera;
  const sizeMap = {
    'extreme_wide': '极远景',
    'wide': '远景',
    'full': '全景',
    'medium': '中景',
    'medium_two_shot': '双人中景',
    'close_up': '特写',
    'extreme_close': '极特写'
  };
  
  const movementMap = {
    'steady': '稳定固定机位',
    'subtle': '轻微呼吸感晃动',
    'tracking': '平稳跟拍',
    'slow_push': '缓慢推进',
    'slow_pull': '缓慢拉远'
  };
  
  const speedMap = {
    'silky': '丝滑匀速',
    'smooth': '平滑流畅',
    'gentle': '轻柔缓慢'
  };
  
  return `${sizeMap[shotSize] || shotSize}构图，${movementMap[movement] || movement}，${speedMap[speed] || speed}，画面稳定无抖动`;
}

// ============================================================
// 生成完整数据
// ============================================================

const promptData = STORYBOARD.map((shot, i) => {
  const prompt = buildPrompt(shot, i, STORYBOARD.length);
  return {
    id: shot.id,
    prompt: prompt,
    promptLength: prompt.length,
    narration: shot.narration,
    narrationLength: shot.narration.length,
    characters: shot.characters,
    duration: shot.duration,
    type: shot.type
  };
});

// 统计
const totalDuration = STORYBOARD.reduce((sum, s) => sum + s.duration, 0);
const totalNarrationChars = SCRIPT.scenes.reduce((sum, s) => sum + s.narration.length, 0);

// 输出报告
console.log('\n' + '='.repeat(70));
console.log('🎬 横纹肌溶解 S01E01 — 全新端到端链路报告');
console.log('='.repeat(70));
console.log(`📋 项目: ${CONFIG.title}`);
console.log(`📺 集数: ${CONFIG.episode}`);
console.log(`⏱️ 总时长: ${totalDuration}秒 (目标: ${CONFIG.duration}秒)`);
console.log(`🎬 镜头数: ${STORYBOARD.length}个`);
console.log(`📝 总台词: ${totalNarrationChars}字`);
console.log('='.repeat(70));

console.log('\n🎬 故事板详情：');
console.log('-'.repeat(70));
for (const shot of promptData) {
  const status = shot.promptLength <= 490 ? '✅' : '❌ 超限';
  console.log(`${shot.id} [${shot.type}] ${shot.duration}s | 提示词${shot.promptLength}字 ${status}`);
  console.log(`   角色: ${shot.characters.join(', ')}`);
  console.log(`   台词: ${shot.narration.substring(0, 50)}... (${shot.narrationLength}字)`);
  console.log('');
}

console.log('='.repeat(70));
console.log('\n📝 各镜头完整提示词（字数统计）：');
console.log('='.repeat(70));
for (const shot of promptData) {
  const warn = shot.promptLength > 490 ? ' ⚠️ 超过490字上限！' : '';
  console.log(`\n${shot.id} — ${shot.promptLength}字${warn}`);
  console.log(shot.prompt);
  console.log('');
}

// 保存文件
fss.writeFileSync(
  path.join(PROJECT_DIR, 'production', 'storyboard.json'),
  JSON.stringify(STORYBOARD, null, 2)
);
fss.writeFileSync(
  path.join(PROJECT_DIR, 'production', 'prompts.json'),
  JSON.stringify(promptData, null, 2)
);
fss.writeFileSync(
  path.join(PROJECT_DIR, 'production', 'script.json'),
  JSON.stringify(SCRIPT, null, 2)
);

console.log('\n✅ 文件已保存:');
console.log(`   ${path.join(PROJECT_DIR, 'production', 'storyboard.json')}`);
console.log(`   ${path.join(PROJECT_DIR, 'production', 'prompts.json')}`);
console.log(`   ${path.join(PROJECT_DIR, 'production', 'script.json')}`);

// 导出字数汇总给队长
const summary = promptData.map(s => ({
  id: s.id,
  type: s.type,
  promptLength: s.promptLength,
  narrationLength: s.narrationLength,
  duration: s.duration,
  characters: s.characters,
  status: s.promptLength <= 490 ? '✅' : '❌ 超限'
}));

fss.writeFileSync(
  path.join(PROJECT_DIR, 'production', 'prompt-summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('\n📊 字数汇总表（发给队长确认）：');
console.log(JSON.stringify(summary, null, 2));
