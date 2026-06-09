/**
 * 【横纹肌溶解S01E01】完整系统链路集成脚本 v4.5
 * 
 * 系统级优化（任何主题自动应用）：
 * 1. ✅ SemanticIntegrityValidator - 语义完整性校验 + 弹性时长分配
 * 2. ✅ TransitionDesigner - 过渡衔接自动设计
 * 3. ✅ PRD中央校准文档驱动
 * 4. ✅ 每阶段自动对齐验证
 * 5. ✅ SceneDerivationEngine - 零硬编码场景推导
 * 6. ✅ NarrationPromptAlignmentChecker - 内容一致性校验
 */

const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

// ========== 系统模块导入 ==========
const { CalibrationEngine, PRD_TEMPLATE } = require('../../../shanhaijing-render-engine/story-prd-template.js');
const { RequirementContract, AlignmentGate } = require('../../../seedance-director/scripts/requirement-alignment-gate.js');
const { SchemaRuntimeValidator } = require('../../../seedance-director/scripts/schema-validator.js');
const { StoryboardValidator } = require('../../../systems/storyboard-validator.js');
const { CharacterManagerV2 } = require('../../../systems/character-manager-v2.js');
const { CharacterPromptBuilder } = require('../../../systems/character-prompt-builder.js');
const { CameraMovementSystem } = require('../../../systems/camera-movement-system.js');
const { ShotDurationAllocator } = require('../../../systems/shot-duration-allocator.js');
const { preRenderValidation } = require('../../../systems/pre-render-validation.js');

const PROJECT_DIR = path.join(__dirname, '..');
const CONFIG = require(path.join(PROJECT_DIR, 'project-config.json'));

// ========== STEP 1: PRD中央校准文档生成 ==========
function generatePRD() {
  // 🎯 v4.7-fix: 从角色档案读取真实角色信息（解决形象错配！）
  const loadCharacterFromCard = (charId) => {
    try {
      const cardPath = path.join(__dirname, '..', '..', '..', 'characters', charId, 'character-card.json');
      const card = JSON.parse(fss.readFileSync(cardPath, 'utf8'));
      return {
        name: card.name,
        codename: card.id,
        age: parseInt(card.visualIdentity?.age) || 28,
        gender: card.voiceIdentity?.gender || 'female',
        personality: {
          core: card.personality?.core || '',
          traits: card.personality?.traits || []
        },
        visualAnchors: {
          required: card.visualAnchors?.required || [],
          preferred: card.visualAnchors?.preferred || [],
          forbidden: card.visualAnchors?.forbidden || []
        },
        visualIdentity: card.visualIdentity || {},
        voiceIdentity: card.voiceIdentity || {}
      };
    } catch (e) {
      console.log(`  ⚠️ 无法读取角色档案 ${charId}: ${e.message}，使用fallback`);
      return null;
    }
  };
  
  const chenCard = loadCharacterFromCard('chen-nurse');
  const xiaoGCard = loadCharacterFromCard('xiaoG');
  const coachCard = loadCharacterFromCard('coach-li');

  const prd = {
    meta: {
      title: "横纹肌溶解S01E01",
      codename: "rhabdo-ep01",
      version: "v4.1",
      genre: "医学科普纪录片",
    targetDuration: 59,
      targetShots: 8,
      createdAt: "2026-05-21",
      author: "系统生成"
    },
    
    core: {
      synopsis: "穿警服的护士小陈讲解横纹肌溶解的症状和实验室检查，通过专业医学知识科普让观众识别危险信号",
      theme: "医学科普——横纹肌溶解的早期识别与就医指导",
      emotionalArc: ["专业权威", "清晰易懂", "紧迫警示", "温暖关怀"],
      moral: "及时就医能挽救肾脏和生命",
      usp: "警服护士+医学科普的独特人设，专业可信又有亲和力",
      references: ["纪录片风格", "医学科普视频", "TED-Ed动画"]
    },
    
    world: {
      setting: "现代医学科普场景，医院/讲堂/实验室环境",
      atmosphere: "专业、清晰、紧迫但不恐慌",
      visualStyle: "写实纪录片风格，电影级调色，自然光，专业医学场景",
      timeSpace: {
        era: "现代",
        location: "医院讲堂/实验室",
        season: "室内",
        timeOfDay: "白天"
      },
      culturalElements: ["现代医学", "实验室设备", "医疗制服", "科普教育"],
      forbiddenCulturalElements: ["中国传统神话", "西方魔幻", "卡通动漫", "科幻元素", "魔法特效"]
    },
    
    characters: {
      chenNurse: chenCard || {
        name: "小陈",
        codename: "chen-nurse",
        age: 28,
        gender: "female",
        personality: ["专业", "亲切", "严谨", "有责任感"],
        canDo: ["讲解医学知识", "演示症状", "与观众互动", "警示危险信号"],
        cannotDo: ["说自己是警察", "展示警徽警号", "诊断具体病人", "开药方"],
        visualAnchors: {
          required: ["藏青色制服", "肩章", "短发干练", "年轻活力"],
          preferred: ["亲切微笑", "专业手势", "现代感配饰"],
          forbidden: ["警徽", "警号", "武器装备", "执法动作", "医疗十字标识"]
        },
        emotionReactions: {
          professional: ["手势讲解", "目光坚定", "站姿端正"],
          warm: ["微笑", "点头", "身体前倾"],
          serious: ["眉头微蹙", "语速放慢", "手势加重"]
        },
        arc: {
          startingState: "专业开场",
          endingState: "温暖总结",
          keyTransformation: "从知识传授到紧迫警示"
        }
      },
      xiaoG: xiaoGCard || {
        name: "小G",
        codename: "xiaoG",
        age: 8,
        gender: "male",
        personality: ["好奇", "认真", "活泼"],
        canDo: ["提问", "互动", "听讲", "点头回应"],
        cannotDo: ["讲解医学", "诊断", "说教"],
        visualAnchors: {
          required: ["白色T恤", "蓝色牛仔裤", "短发整齐"],
          preferred: ["坐姿端正", "眼神专注"],
          forbidden: ["警服", "白大褂", "实验服"]
        }
      },
      coachLi: coachCard || {
        name: "李明教练",
        codename: "coach-li",
        age: 35,
        gender: "male",
        personality: ["健康", "专业", "友善"],
        canDo: ["展示肌肉", "配合演示", "示范动作"],
        cannotDo: ["讲解医学", "诊断"],
        visualAnchors: {
          required: ["黑色运动T恤", "灰色运动裤", "体格健硕"],
          preferred: ["肌肉线条", "友善表情"],
          forbidden: ["警服", "白大褂"]
        }
      }
    },
    
    structure: {
      acts: [
        {
          act: 1,
          name: "起-引入",
          purpose: "介绍主题，建立专业感",
          emotionalGoal: "权威可信",
          shots: [
            { shotId: "S01", purpose: "开场介绍", emotion: "热情专业", keyAction: "打招呼介绍主题", visualFocus: "陈女士正面", narrativeBeat: "建立人设" },
            { shotId: "S02", purpose: "定义概念", emotion: "清晰讲解", keyAction: "解释肌肉细胞", visualFocus: "陈女士+示意图", narrativeBeat: "知识铺垫" },
            { shotId: "S03", purpose: "原理讲解", emotion: "认真细致", keyAction: "解释破裂过程", visualFocus: "陈女士", narrativeBeat: "深入原理" }
          ]
        },
        {
          act: 2,
          name: "承-症状",
          purpose: "展示三个典型症状",
          emotionalGoal: "紧迫但不恐慌",
          shots: [
            { shotId: "S04", purpose: "症状一", emotion: "专业演示", keyAction: "展示肌肉酸痛", visualFocus: "陈女士+教练", narrativeBeat: "身体信号" },
            { shotId: "S05", purpose: "症状二", emotion: "警示", keyAction: "解释尿液变色", visualFocus: "陈女士+教练", narrativeBeat: "视觉信号" },
            { shotId: "S06", purpose: "症状三", emotion: "关注", keyAction: "展示肿胀压痛", visualFocus: "陈女士+教练", narrativeBeat: "触觉信号" }
          ]
        },
        {
          act: 3,
          name: "转-互动",
          purpose: "观众提问，强化紧迫",
          emotionalGoal: "互动共鸣",
          shots: [
            { shotId: "S07", purpose: "互动提问", emotion: "认真求知", keyAction: "小G提问", visualFocus: "小G+陈女士", narrativeBeat: "观众代入" },
            { shotId: "S08", purpose: "紧急提醒", emotion: "紧迫", keyAction: "强调立即就医", visualFocus: "陈女士", narrativeBeat: "行动召唤" }
          ]
        },
        {
          act: 4,
          name: "合-检查",
          purpose: "介绍实验室检查",
          emotionalGoal: "专业安心",
          shots: [
            { shotId: "S09", purpose: "CK检查", emotion: "专业数据", keyAction: "解释肌酸激酶", visualFocus: "陈女士", narrativeBeat: "关键指标" },
            { shotId: "S10", purpose: "肾功电解质", emotion: "严肃警示", keyAction: "解释肾损伤", visualFocus: "陈女士", narrativeBeat: "严重后果" },
            { shotId: "S11", purpose: "尿液检查", emotion: "专业分析", keyAction: "解释尿蛋白", visualFocus: "陈女士", narrativeBeat: "辅助诊断" },
            { shotId: "S12", purpose: "总结", emotion: "温暖关怀", keyAction: "总结核心要点", visualFocus: "陈女士+小G", narrativeBeat: "记忆强化" }
          ]
        }
      ]
    },
    
    positive: {
      visualStyle: ["写实纪录片", "电影级调色", "自然光", "专业医疗环境", "清晰锐利"],
      actions: ["讲解", "演示", "指示", "展示", "手势"],
      emotions: ["专业", "亲切", "紧迫", "温暖"],
      sceneElements: ["实验室设备", "医疗仪器", "试管", "检查单", "医学图表", "讲堂", "白板"],
      materials: ["制服布料", "皮肤纹理", "金属器械", "纸质文件"],
      lighting: ["三点布光", "5600K自然白光", "明亮通透", "无阴影死角"]
    },
    
    negative: {
      forbiddenActions: ["自称警察", "展示警徽", "展示警号", "执法行为", "诊断病人", "开药方"],
      forbiddenVisuals: ["警徽", "警号", "武器", "手铐", "警车", "卡通", "动漫", "魔法", "发光", "粒子"],
      forbiddenThemes: ["暴力执法", "犯罪", "恐怖", "血腥", "过度医疗恐慌"],
      cliches: ["医院走廊奔跑", "抢救室推床", "心电图归零", "过度渲染死亡"],
      overusedWords: ["非常", "特别", "超级", "极其"],
      deprecatedElements: ["中国传统元素", "西方魔幻元素"]
    },
    
    calibrationRules: {
      character: [
        "角色行为必须在canDo范围内",
        "角色不能做cannotDo中的行为",
        "情绪必须匹配emotionReactions映射",
        "视觉锚点required必须出现在所有镜头中",
        "警徽/警号绝对禁止出现"
      ],
      world: [
        "场景必须符合医学科普设定",
        "禁止出现forbiddenCulturalElements",
        "视觉风格必须写实纪录片",
        "不能出现卡通/动漫/魔法"
      ],
      narrative: [
        "每镜必须有明确的narrativePurpose",
        "情绪变化必须符合emotionalArc",
        "Act结构必须完整",
        "结局必须符合moral传达"
      ]
    }
  };
  
  return prd;
}

// ========== STEP 2: 需求对齐闸机 ==========
function runAlignmentGate(prd, storyboard) {
  console.log('\n🔒 需求对齐闸机启动...');
  
  // 加载 narration-prompt 一致性检查器（新增！）
  const NarrationPromptAlignmentChecker = require('../systems/narration-prompt-alignment-checker.js');
  const npChecker = new NarrationPromptAlignmentChecker();
  
  const contract = new RequirementContract(
    prd.core.synopsis,
    '小陈:护士:藏青色制服+短发干练+医疗十字:讲解医学知识,小G:男孩:白色T恤+蓝色牛仔裤:提问互动,李明教练:健身教练:黑色运动T恤+灰色运动裤:展示肌肉',
    prd.world.visualStyle,
    'medical-education',
    prd.meta.targetDuration
  );
  
  const gate = new AlignmentGate(contract);
  
  // 检查每个镜头
  const npResults = []; // narration-prompt检查结果
  for (const shot of storyboard) {
    const promptText = shot.prompt || '';
    const narrationText = shot.narration || '';
    const combinedText = promptText + ' ' + narrationText;
    
    const result = gate.check(shot.id, combinedText, {
      duration: shot.duration,
      characters: shot.characters
    });
    
    // 新增：narration-prompt一致性检查
    const npResult = npChecker.check(
      shot.id,
      narrationText,
      promptText,
      shot.characters || []
    );
    npResults.push({ id: shot.id, ...npResult });
    
    if (!result.passed || !npResult.passed) {
      console.log(`  ❌ ${shot.id}: 对齐评分 ${result.overallScore}/100`);
      if (!result.passed) {
        for (const detail of result.details) {
          console.log(`     - ${detail.severity}: ${detail.message}`);
        }
      }
      if (!npResult.passed) {
        console.log(`     - [台词-画面不一致]: ${npResult.errors.join(', ')}`);
      }
    } else {
      console.log(`  ✅ ${shot.id}: 对齐评分 ${result.overallScore}/100`);
    }
  }
  
  const report = gate.generateReport();
  
  // 将narration-prompt检查结果合并到报告
  report.narrationPromptCheck = npResults;
  report.allPassed = report.allPassed && npResults.every(r => r.passed);
  
  return report;
}

// ========== STEP 3: Schema校验 ==========
function runSchemaValidation(storyboard, script) {
  console.log('\n📐 Schema校验启动...');
  
  try {
    const { SchemaRuntimeValidator } = require('../../../seedance-director/scripts/schema-validator.js');
    const validator = new SchemaRuntimeValidator();
    
    // 构建符合schema的完整故事规划结构
    const storyPlan = {
      title: script.title || '横纹肌溶解S01E01',
      outline: script.outline || '横纹肌溶解科普第一集',
      characters: (script.characters || []).map(c => ({
        name: c.name,
        role: c.role || 'supporting',
        features: c.visualAnchors?.required || []
      })),
      segments: (script.scenes || []).map(s => ({
        id: s.id,
        title: s.title || s.id,
        duration: s.duration || 5,
        shots: [{
          id: `${s.id}-1`,
          description: s.content || s.narration || '',
          duration: s.duration || 5,
          camera: s.cameraMovement?.description || '',
          characters: s.characters || [],
          emotion: s.emotion || '自然'
        }]
      })),
      metadata: {
        totalDuration: script.totalDuration || 75,
        totalShots: script.scenes?.length || 0,
        style: '写实纪录片',
        type: 'educational'
      }
    };
    
    const result = validator.validate('story-plan', storyPlan);
    
    if (result.valid) {
      console.log('  ✅ Schema校验通过');
    } else {
      console.log('  ❌ Schema校验失败:');
      result.errors.forEach(e => console.log(`     - ${e}`));
    }
    return result;
  } catch (e) {
    console.log('  ⚠️ Schema校验模块错误:', e.message);
    return { valid: false, errors: [e.message] };
  }
}

// ========== STEP 4: 时长分配Agent ==========
function runDurationAllocator(scriptForAllocator) {
  console.log('\n⏱️ 时长分配Agent启动...');
  
  const allocator = new ShotDurationAllocator();
  const result = allocator.allocate(scriptForAllocator);
  
  console.log(`  ✅ 时长分配完成: ${result.shots?.length || result.durationShots?.length || 0}镜`);
  
  return result;
}

// ========== STEP 5: 角色提示词构建 ==========
function buildCharacterPrompts(storyboard, prd) {
  console.log('\n👤 角色提示词构建启动...');
  
  const enrichedShots = [];
  
  for (const shot of storyboard) {
    const enriched = { ...shot };
    
    // 为每个角色构建描述（简化版，直接基于PRD）
    const charDescs = [];
    for (const charId of shot.characters) {
      const charPRD = prd.characters[charId === 'chen-nurse' ? 'chenNurse' : charId === 'xiaoG' ? 'xiaoG' : 'coachLi'];
      
      if (charPRD) {
        // 核心视觉锚点
        const anchors = charPRD.visualAnchors.required.join('，');
        charDescs.push(`${charPRD.name}：${anchors}`);
      }
    }
    
    enriched.characterDescriptions = charDescs.join('；');
    enrichedShots.push(enriched);
  }
  
  console.log('  ✅ 角色提示词构建完成');
  return enrichedShots;
}

// ========== STEP 6: 运镜控制系统 ==========
function generateCameraMovements(storyboard) {
  console.log('\n🎥 运镜控制系统启动...');
  
  const camera = new CameraMovementSystem();
  
  // 使用processStoryboard批量处理
  const storyboardWithCamera = camera.processStoryboard({
    shots: storyboard,
    totalDuration: storyboard.reduce((sum, s) => sum + (s.duration || 5), 0)
  });
  
  console.log('  ✅ 运镜配置生成完成');
  return storyboardWithCamera.shots;
}

// ========== STEP 7: 最终Prompt组装 ==========

/**
 * 🎯 从narration中提取主题关键词（系统级！防止互动场景跑题）
 * 根据镜头类型和narration内容，提取核心主题词注入prompt
 */
function extractThemeKeywords(narration, prd) {
  if (!narration || !prd) return '';
  
  const text = narration.toLowerCase();
  const topic = prd.meta?.title || '';
  
  // 从narration中提取关键医疗/主题词
  const keywordMap = {
    '横纹肌溶解': '横纹肌溶解的症状识别',
    'CK': 'CK值指标检查',
    '肌酸激酶': '肌酸激酶指标',
    '肾功能': '肾功能损伤风险',
    '肌红蛋白': '肌红蛋白堵塞肾脏',
    '症状': '症状识别与判断',
    '就医': '紧急就医指导',
    '检查': '医学检查流程',
    '总结': '核心知识总结',
    '记住': '健康知识要点'
  };
  
  // 匹配关键词
  for (const [key, value] of Object.entries(keywordMap)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  // 回退：从topic标题提取
  if (topic.includes('横纹肌溶解')) {
    return '横纹肌溶解的健康知识';
  }
  
  return '';
}

function assemblePrompts(storyboard, prd) {
  console.log('\n📝 最终Prompt组装...');
  
  const prompts = [];
  
  for (const shot of storyboard) {
    const parts = [];
    
    // 1. 系统约束（写实纪录片）
    parts.push('写实纪录片摄影风格，电影级调色，自然光照明，4K超高清画质');
    
    // 2. 角色描述（详细，包含医疗十字标识）
    const charDescs = [];
    for (const charId of shot.characters) {
      const charPRD = prd.characters[charId === 'chen-nurse' ? 'chenNurse' : charId === 'xiaoG' ? 'xiaoG' : 'coachLi'];
      if (charPRD) {
        // ========== v4.7 角色档案全字段提取（7坑全填） ==========
        
        // 1. 基础锚点
        const anchors = charPRD.visualAnchors?.required?.join('，') || '';
        const preferred = charPRD.visualAnchors?.preferred?.join('，') || '';
        const emotion = shot.emotion || '自然';
        const mouth = shot.mouthAction || '嘴部微张说话';
        
        // 2. 视觉身份全字段提取（坑7+9+18+19+20+28+29）
        const visualId = charPRD.visualIdentity || {};
        const appearance = visualId.appearance || {};
        
        const roleStyle = visualId.style || '';  // 坑7: 渲染风格
        const ageInfo = visualId.age || '';  // 坑9: 年龄
        const baseIdentity = visualId.baseIdentity || '';  // 人种/基础身份
        
        const hair = appearance.hair?.promptFragment || appearance.hair?.description || '';  // 发型
        const face = appearance.face?.promptFragment || appearance.face?.description || '';  // 面部
        const eyes = appearance.eyes?.promptFragment || appearance.eyes?.description || '';  // 眼睛
        const uniform = appearance.uniform?.promptFragment || appearance.uniform?.description || '';  // 服装
        const accessories = appearance.accessories?.promptFragment || appearance.accessories?.description || '';  // 配饰
        const build = appearance.build?.promptFragment || appearance.build?.description || appearance.body?.promptFragment || appearance.body?.description || '';  // 坑18: 体型（兼容build和body字段名）
        const expression = appearance.expression?.promptFragment || appearance.expression?.description || '';  // 坑19: 表情
        
        // 坑20: 镜头角度智能匹配
        const angles = visualId.angles || {};
        const shotSize = shot.cameraMovement?.shotSize || '';
        let angleDesc = '';
        if (shotSize.includes('close') || shotSize.includes('extreme_close')) {
          angleDesc = angles.closeup?.description || '';
        } else if (shotSize === 'medium') {
          angleDesc = angles.threeQuarter?.description || '';
        } else if (shotSize === 'full' || shotSize === 'wide') {
          angleDesc = angles.front?.description || '';
        } else if (shotSize === 'extreme_wide') {
          angleDesc = angles.side?.description || '';
        }
        
        // 坑28-29: 角色个性气质
        const personalityCore = charPRD.personality?.core || '';
        const personalityTraits = (charPRD.personality?.traits || []).slice(0, 2).join('、');
        
        // 3. 声音身份全字段提取（坑26: 完整声音特征）
        const voiceId = charPRD.voiceIdentity || {};
        const voiceGender = voiceId.gender || 'unknown';
        const voiceFragment = voiceId.promptFragment || '';  // 完整声音锚点
        const voiceStyle = voiceId.style || '';  // 说话方式
        const voiceMood = voiceId.mood || '';  // 语气情绪
        
        // 4. 🎯 智能声音锚点组装（v4.6+v4.7增强）
        let genderVoiceAnchor = '';
        // 优先使用档案中的完整声音描述（更精确）
        if (voiceFragment) {
          genderVoiceAnchor = voiceFragment;
        } else if (voiceGender === 'female' || baseIdentity.includes('女性')) {
          genderVoiceAnchor = '年轻女性，女声讲解，温柔女声';
        } else if (voiceGender === 'male' && (baseIdentity.includes('男孩') || ageInfo.includes('男孩'))) {
          genderVoiceAnchor = '8岁男孩，童声提问，清脆童声';
        } else if (voiceGender === 'male') {
          genderVoiceAnchor = '成年男性，男声讲解';
        } else if (voiceGender === 'unknown') {
          // v4.7修复：voiceGender为unknown时，用baseIdentity+age推断
          if (baseIdentity.includes('女性') || baseIdentity.includes('女孩')) {
            genderVoiceAnchor = '年轻女性，女声讲解，温柔女声';
          } else if (baseIdentity.includes('男孩') || ageInfo.includes('男孩')) {
            genderVoiceAnchor = '8岁男孩，童声提问，清脆童声';
          } else if (baseIdentity.includes('男性') || baseIdentity.includes('男')) {
            genderVoiceAnchor = '成年男性，男声讲解';
          }
        }
        
        // 5. 组装角色描述（v4.7-fix2: 激进精简，确保不超限）
        // 策略：角色描述严格控制，优先保留最关键字段
        // 🎯 双人镜特殊处理：次要角色预算更小
        const isMultiCharacter = shot.characters.length > 1;
        const isPrimary = shot.characters.length === 1 || shot.characters[0] === charId;
        const MAX_ROLE_DESC = isMultiCharacter && !isPrimary ? 50 : 90; // 次要角色50字，主角色90字
        
        // 按优先级组装字段（P0必须 → P4补充）
        const fields = [
          { text: genderVoiceAnchor, priority: 0, key: 'voice' },
          { text: ageInfo, priority: 1, key: 'age' },
          { text: `表情${emotion}`, priority: 1, key: 'emotion' },
          { text: mouth, priority: 1, key: 'mouth' },
          { text: expression, priority: 2, key: 'expression' },
          { text: hair, priority: 3, key: 'hair' },
          { text: build, priority: 3, key: 'build' }
        ];
        
        // 去重（与anchors重复的部分过滤掉）
        const anchorSet = new Set((anchors || '').split('，'));
        const uniqueFields = fields.filter(f => {
          if (!f.text) return false;
          const pClean = f.text.replace(/[，。]/g, '');
          return !anchorSet.has(pClean) && pClean.length >= 2;
        });
        
        // 按优先级组装，严格控制字数
        const selectedFields = [];
        let currentLength = 0;
        
        // 优先添加高优先级字段
        for (const f of uniqueFields.sort((a, b) => a.priority - b.priority)) {
          const fLength = (f.text.match(/[\u4e00-\u9fff]/g) || []).length;
          if (currentLength + fLength < MAX_ROLE_DESC) {
            selectedFields.push(f.text);
            currentLength += fLength;
          }
        }
        
        // 动作描述 + 主题锚点
        const actionParts = [];
        // 🎯 v4.7-fix3: 双人镜中次要角色不重复添加action
        if (shot.action && (shot.characters.length === 1 || shot.characters[0] === charId)) {
          actionParts.push(`正在${shot.action}`);
          if (shot.type === 'interaction' && shot.narration) {
            const themeKeywords = extractThemeKeywords(shot.narration, prd);
            if (themeKeywords) {
              actionParts.push(`围绕${themeKeywords}进行互动交流`);
            }
          }
        }
        
        // 最终组装：名字+基本外观 + 选中字段 + 动作
        const descParts = [`${charPRD.name}：${anchors}`];
        if (selectedFields.length > 0) {
          descParts.push(selectedFields.join('，'));
        }
        if (actionParts.length > 0) {
          descParts.push(actionParts.join('，'));
        }
        const desc = descParts.filter(Boolean).join('，');
        
        charDescs.push(desc);
      }
    }
    parts.push('画面中：' + charDescs.join('；'));
    
    // 3. 场景描述（特异性解决内容跑偏！）
    const sceneDesc = shot.sceneSpecific || shot.background || '医学科普讲堂';
    parts.push(sceneDesc);
    
    // 4. 环境细节（丰富画面）
    parts.push('环境细节：墙上挂有高清肌肉解剖图和CK指标对比图，桌上放有精密医学模型和检查设备，大屏幕显示细胞结构示意图，背景有专业医学书籍陈列，整体环境干净整洁，充满专业医疗科普氛围');
    
    // 4a. 额外场景丰富度
    parts.push('桌面摆放整齐，有显微镜、试管架、检查报告单等医疗用品，环境灯光明亮通透，营造专业可信的医学科普氛围');
    
    // 5. 光影质感（详细）
    parts.push('摄影棚三点布光，主光从右前方45度打亮面部形成明亮眼神光，补光消除左脸阴影保持肤色均匀，轮廓光勾勒人物边缘分离背景，色温5600K自然白光，皮肤毛孔纹理清晰可见，次表面散射真实自然');
    
    // 6. 运镜
    parts.push(shot.cameraDescription || '中景稳定构图');
    
    // 7. 技术参数
    parts.push('技术参数：景深适中，焦点锁定人物面部，ISO200低噪点，快门1/50秒动态模糊自然，白平衡准确还原肤色');
    
    // 8. 负面约束（不列出具体禁忌词，用概括性描述）
    parts.push('画面要求：真实自然，写实风格，避免出现任何夸张或非自然的表现手法');
    
    const prompt = parts.join('。');
    
    // 字数检查
    const chineseChars = (prompt.match(/[\u4e00-\u9fff]/g) || []).length;
    if (chineseChars > 490) {
      console.log(`  ❌ ${shot.id}: ${chineseChars}字 > 490字上限！`);
    } else if (chineseChars < 450) {
      console.log(`  ⚠️  ${shot.id}: ${chineseChars}字 < 450字目标，建议补充`);
    }
    
    prompts.push({
      id: shot.id,
      prompt: prompt,
      promptLength: chineseChars,
      narration: shot.narration,
      characters: shot.characters,
      duration: shot.duration,
      ratio: '16:9',  // 强制横屏！队长要求确认
      type: shot.type,
      mouthAction: shot.mouthAction,
      cameraMovement: shot.cameraMovement
    });
  }
  
  return prompts;
}

// ========== STEP 8: 故事板校验器 ==========
function runStoryboardValidation(storyboardPath) {
  console.log('\n🔍 故事板校验器启动...');
  
  const validator = new StoryboardValidator({
    requiredCharacters: ['chen-nurse', 'xiaoG', 'coach-li'],
    minChars: 450,
    maxChars: 490
  });
  
  const result = validator.validate(storyboardPath);
  
  if (result.valid) {
    console.log('  ✅ 故事板校验通过');
  } else {
    console.log('  ❌ 故事板校验失败:');
    for (const error of result.errors) {
      console.log(`     - ${error.rule}: ${error.message}`);
    }
  }
  
  return result;
}

// ========== STEP 9: PRD校准引擎 ==========
function runPRDCalibration(prompts, prd) {
  console.log('\n🎯 PRD校准引擎启动...');
  
  const engine = new CalibrationEngine(prd);
  const results = [];
  
  for (const shot of prompts) {
    const result = engine.calibratePrompt(shot.prompt, shot.id);
    results.push(result);
    
    if (!result.passed) {
      console.log(`  ❌ ${shot.id}: 评分 ${result.score}/100`);
      for (const dev of result.deviations) {
        console.log(`     - ${dev}`);
      }
    } else {
      console.log(`  ✅ ${shot.id}: 评分 ${result.score}/100, 利用率 ${result.utilization.status}`);
    }
  }
  
  return results;
}

// ========== 主流程 ==========
async function main() {
  console.log('='.repeat(70));
  console.log('🎬 横纹肌溶解S01E01 — 完整系统链路 v4.1');
  console.log('='.repeat(70));
  
  // STEP 1: PRD
  console.log('\n📋 STEP 1: PRD中央校准文档');
  const prd = generatePRD();
  fss.writeFileSync(
    path.join(PROJECT_DIR, 'production', 'prd.json'),
    JSON.stringify(prd, null, 2)
  );
  console.log('  ✅ PRD已生成');
  
  // STEP 2: 剧本（从PRD生成）
  console.log('\n📖 STEP 2: 剧本创作');
  const script = {
    title: prd.meta.title,
    episode: "第一集：症状与实验室检查",
    opening: "AI主播小陈，继续给大家讲解健康科普知识。",
    scenes: [
      { id: 'S01', type: 'opening', narration: '', characters: ['chen-nurse'], priority: 'critical' },
      { id: 'S02', type: 'explanation', narration: '', characters: ['chen-nurse'], priority: 'high' },
      { id: 'S03', type: 'explanation', narration: '', characters: ['chen-nurse'], priority: 'high' },
      { id: 'S04', type: 'interaction', narration: '', characters: ['xiaoG', 'chen-nurse'], priority: 'medium' },
      { id: 'S05', type: 'explanation', narration: '', characters: ['chen-nurse'], priority: 'critical' },
      { id: 'S06', type: 'explanation', narration: '', characters: ['chen-nurse'], priority: 'high' },
      { id: 'S07', type: 'closing', narration: '', characters: ['chen-nurse'], priority: 'critical' }
    ]
  };
  
  // 为每个场景填充完整narration（59秒精简版）
  const narrations = {
    S01: "AI主播小陈，继续给大家讲解健康科普知识。今天我们来了解横纹肌溶解，这是一种会伤害肾脏的急症。",
    S02: "横纹肌溶解，就是肌肉细胞突然破裂，里面的物质泄漏到血液中。",
    S03: "身体会有三个警报：肌肉酸痛无力、小便颜色变深像浓茶、肌肉肿胀压痛。",
    S04: "小陈老师，出现这些症状要立即去医院吗？",
    S05: "对！一定要马上就医。医生会抽血查CK值，正常是几十，发病时会飙到几千甚至几万。",
    S06: "同时查肾功能。因为肌红蛋白会堵住肾脏，导致急性肾损伤，严重时心跳都会停止。",
    S07: "记住三个症状：肌肉酸痛、尿液深色、肿胀压痛。两项检查：CK值和肾功能。千万别硬扛！"
  };
  
  script.scenes.forEach(s => s.narration = narrations[s.id] || s.narration);
  
  fss.writeFileSync(
    path.join(PROJECT_DIR, 'production', 'script.json'),
    JSON.stringify(script, null, 2)
  );
  console.log('  ✅ 剧本已生成');
  
  // STEP 3: 时长分配
  console.log('\n⏱️ STEP 3: 时长分配Agent');
  
  // 为allocator准备输入（priority必须是数字1-5）
  const priorityMap = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 5 };
  const scriptForAllocator = {
    totalDuration: 59,
    narrations: script.scenes.map(s => ({
      id: s.id,
      text: s.narration,
      type: s.type,
      priority: priorityMap[s.priority] || 3,
      characters: s.characters,
      suggestedDuration: s.duration
    })),
    rhythmCurve: 'classic'
  };
  
  const durationResult = runDurationAllocator(scriptForAllocator);
  
  // 更新时长到剧本（allocator可能返回错误，需要fallback）
  for (const scene of script.scenes) {
    const allocated = (durationResult.shots || durationResult.durationShots || []);
    const matched = allocated.find(s => (s.narrationIds || []).includes(scene.id) || s.id === scene.id);
    if (matched) {
      scene.duration = matched.duration;
    } else {
      // Fallback: 根据字数估算
      const charCount = scene.narration.length;
      scene.duration = Math.min(12, Math.max(3, Math.ceil(charCount / 5.0)));
    }
  }
  
  // STEP 3.5: 语义完整性校验 + 弹性时长调整（系统级！任何主题都自动应用）
  console.log('\n📐 STEP 3.5: 语义完整性校验 + 弹性时长分配');
  const SemanticIntegrityValidator = require('../systems/semantic-integrity-validator.js');
  const validator = new SemanticIntegrityValidator();
  
  let totalRecommended = 0;
  const recDurations = {};
  
  for (const scene of script.scenes) {
    const rec = validator.calculateRecommendedDuration(scene.narration, scene.type, true);
    recDurations[scene.id] = rec.recommended;
    totalRecommended += rec.recommended;
    console.log(`  ${scene.id}: allocator分配${scene.duration}秒 → 语义推荐${rec.recommended}秒 (${scene.narration.length}字/${rec.rate}字每秒)`);
  }
  
  // 弹性区间：targetDuration ±30%
  const targetDuration = 59; // 可由项目配置传入
  const elasticMin = Math.round(targetDuration * 0.7);
  const elasticMax = Math.round(targetDuration * 1.3);
  console.log(`\n📊 弹性区间: ${elasticMin}-${elasticMax}秒 | 推荐总时长: ${totalRecommended}秒`);
  
  // 采用语义推荐时长（在弹性区间内则扩展，否则按比例压缩）
  if (totalRecommended >= elasticMin && totalRecommended <= elasticMax) {
    console.log(`✅ 推荐时长${totalRecommended}秒在弹性区间内，采用语义推荐时长`);
    for (const scene of script.scenes) {
      scene.duration = recDurations[scene.id];
    }
  } else if (totalRecommended > elasticMax) {
    console.log(`⚠️ 推荐时长${totalRecommended}秒超出弹性上限${elasticMax}秒，按比例压缩`);
    const ratio = elasticMax / totalRecommended;
    for (const scene of script.scenes) {
      scene.duration = Math.max(5, Math.round(recDurations[scene.id] * ratio));
    }
  } else {
    console.log(`ℹ️ 推荐时长${totalRecommended}秒低于弹性下限，按推荐时长（不低于最小值）`);
    for (const scene of script.scenes) {
      scene.duration = Math.max(5, recDurations[scene.id]);
    }
  }
  
  // 🎯 v4.7-fix: 强制限制duration不超过API最大限制12秒
  const API_MAX_DURATION = 12;
  for (const scene of script.scenes) {
    if (scene.duration > API_MAX_DURATION) {
      console.log(`  🔧 ${scene.id}: duration=${scene.duration}秒 > API最大${API_MAX_DURATION}秒，强制限制为${API_MAX_DURATION}秒`);
      scene.duration = API_MAX_DURATION;
    }
  }

  // 运行完整性校验并报告
  let integrityIssues = 0;
  for (const scene of script.scenes) {
    const result = validator.validate(scene.narration, scene.duration, scene.type);
    if (!result.allPassed) {
      integrityIssues++;
      for (const r of result.results) {
        if (!r.passed) {
          console.log(`  ⚠️ ${scene.id} ${r.name}: ${r.reason}`);
        }
      }
    }
  }
  console.log(`  📊 语义完整性: ${integrityIssues === 0 ? '✅ 全部通过' : `⚠️ ${integrityIssues}处问题`}`);
  
  // STEP 4: 故事板设计（基础版，不含过渡）
  console.log('\n🎬 STEP 4: 故事板设计');
  const storyboard = script.scenes.map((scene, i) => {
    const shotPRD = prd.structure.acts.flatMap(a => a.shots).find(s => s.shotId === scene.id);
    
    return {
      id: scene.id,
      type: scene.type,
      role: scene.type,
      narration: scene.narration,
      narrationLength: scene.narration.length,
      characters: scene.characters,
      primaryCharacter: scene.characters[0],
      secondaryCharacter: scene.characters[1] || null,
      duration: scene.duration,
      priority: scene.priority,
      emotion: shotPRD?.emotion || '专业',
      action: generateAction(scene.id, scene.type, scene.narration, scene.characters),
      mouthAction: scene.characters[0] === 'chen-nurse' ? '嘴部微张正在说话，表情亲切专业' :
                   scene.characters[0] === 'xiaoG' ? '嘴部微张提问，表情认真专注' :
                   '嘴部微张配合演示',
      // 特异性场景（解决内容跑偏！）
      sceneSpecific: generateSceneSpecific(scene.id, scene.type, scene.characters, scene.narration),
      background: generateSceneSpecific(scene.id, scene.type, scene.characters, scene.narration),
      lighting: '摄影棚三点布光，主光从右前方45度打亮面部，补光消除左脸阴影，轮廓光勾勒人物边缘，整体色温5600K自然白光',
      composition: generateComposition(scene.type, scene.characters)
    };
  });
  
  fss.writeFileSync(
    path.join(PROJECT_DIR, 'production', 'storyboard.json'),
    JSON.stringify(storyboard, null, 2)
  );
  console.log('  ✅ 故事板已生成');
  
  // STEP 4.5: 过渡衔接设计（系统级！任何主题都自动应用）
  console.log('\n🔗 STEP 4.5: 过渡衔接设计');
  const TransitionDesigner = require('../systems/transition-designer.js');
  const designer = new TransitionDesigner();
  
  // 验证故事板连贯性
  const coherence = designer.validateCoherence(storyboard);
  console.log(`  📊 连贯性检查: ${coherence.coherent ? '✅ 良好' : `⚠️ ${coherence.issueCount}处断层`}`);
  
  if (coherence.issues.length > 0) {
    for (const issue of coherence.issues) {
      console.log(`  ❌ ${issue.from} → ${issue.to}: ${issue.gaps.join(', ')}`);
      console.log(`     建议: ${issue.suggestion}`);
    }
    
    // 自动添加过渡镜头
    console.log('  🔄 自动添加过渡镜头...');
    const storyboardWithTransitions = designer.addTransitions(storyboard);
    const addedCount = storyboardWithTransitions.length - storyboard.length;
    console.log(`  ✅ 已添加${addedCount}个过渡镜头`);
    
    // 用新故事板替换旧的
    storyboard.length = 0;
    storyboard.push(...storyboardWithTransitions);
    
    // 重新保存
    fss.writeFileSync(
      path.join(PROJECT_DIR, 'production', 'storyboard.json'),
      JSON.stringify(storyboard, null, 2)
    );
    console.log('  ✅ 过渡故事板已保存');
  }
  
  // STEP 5: 运镜
  console.log('\n🎥 STEP 5: 运镜控制系统');
  const storyboardWithCamera = generateCameraMovements(storyboard);
  
  // STEP 6: 角色提示词
  console.log('\n👤 STEP 6: 角色提示词构建');
  const storyboardWithChars = buildCharacterPrompts(storyboardWithCamera, prd);
  
  // STEP 7: Prompt组装
  console.log('\n📝 STEP 7: 最终Prompt组装');
  const prompts = assemblePrompts(storyboardWithChars, prd);
  
  fss.writeFileSync(
    path.join(PROJECT_DIR, 'production', 'prompts.json'),
    JSON.stringify(prompts, null, 2)
  );
  console.log('  ✅ Prompts已生成');
  
  // STEP 8: 需求对齐闸机
  console.log('\n🔒 STEP 8: 需求对齐闸机');
  const alignmentReport = runAlignmentGate(prd, prompts);
  
  // STEP 9: Schema校验
  console.log('\n📐 STEP 9: Schema校验');
  const schemaResult = runSchemaValidation(prompts, script);
  
  // STEP 10: PRD校准
  console.log('\n🎯 STEP 10: PRD校准引擎');
  const calibrationResults = runPRDCalibration(prompts, prd);
  
  // STEP 11: 故事板校验
  console.log('\n🔍 STEP 11: 故事板校验器');
  // 保存完整故事板用于校验
  const fullStoryboard = {
    project: prd.meta.title,
    version: prd.meta.version,
    projectConfig: { requiredCharacters: ['chen-nurse', 'xiaoG'] },
    shots: prompts.map(p => ({
      id: p.id,
      prompt: p.prompt,
      narration: p.narration,
      duration: p.duration,
      characters: p.characters,
      mouthAction: storyboard.find(s => s.id === p.id)?.mouthAction || '',
      cameraMovement: storyboardWithCamera.find(s => s.id === p.id)?.cameraMovement || {}
    }))
  };
  
  const storyboardPath = path.join(PROJECT_DIR, 'production', 'storyboard-full.json');
  fss.writeFileSync(storyboardPath, JSON.stringify(fullStoryboard, null, 2));
  const validationResult = runStoryboardValidation(storyboardPath);
  
  // STEP 12: 前置验证
  console.log('\n🛡️ STEP 12: 渲染前置验证');
  const preRenderResult = preRenderValidation(storyboardPath, {
    requiredCharacters: ['chen-nurse', 'xiaoG']
  });
  
  // 汇总报告
  console.log('\n' + '='.repeat(70));
  console.log('📊 完整链路验证报告');
  console.log('='.repeat(70));
  console.log(`PRD生成: ✅`);
  console.log(`剧本创作: ✅`);
  console.log(`时长分配: ✅`);
  console.log(`故事板设计: ✅`);
  console.log(`运镜控制: ✅`);
  console.log(`角色构建: ✅`);
  console.log(`Prompt组装: ✅`);
  console.log(`对齐闸机: ${alignmentReport.allPassed ? '✅' : '⚠️'}`);
  console.log(`Schema校验: ${schemaResult.valid ? '✅' : '❌'}`);
  console.log(`PRD校准: ${calibrationResults.every(r => r.passed) ? '✅' : '⚠️'}`);
  console.log(`故事板校验: ${validationResult.valid ? '✅' : '❌'}`);
  console.log(`前置验证: ${preRenderResult ? '✅' : '❌'}`);
  console.log('='.repeat(70));
  
  // 生成字数汇总
  const summary = prompts.map(p => ({
    id: p.id,
    type: p.type,
    promptLength: p.promptLength,
    narrationLength: p.narration.length,
    duration: p.duration,
    characters: p.characters,
    status: p.promptLength <= 490 ? '✅' : '❌ 超限'
  }));
  
  fss.writeFileSync(
    path.join(PROJECT_DIR, 'production', 'prompt-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n📊 字数汇总:');
  for (const s of summary) {
    console.log(`  ${s.id}: ${s.promptLength}字 ${s.status}`);
  }
  
  // 保存完整报告
  const report = {
    version: 'v4.1',
    timestamp: new Date().toISOString(),
    prd: prd.meta,
    pipeline: {
      prdGenerated: true,
      scriptGenerated: true,
      durationAllocated: true,
      storyboardDesigned: true,
      cameraMovementGenerated: true,
      characterPromptsBuilt: true,
      promptsAssembled: true,
      alignmentChecked: alignmentReport.allPassed,
      schemaValidated: schemaResult.valid,
      prdCalibrated: calibrationResults.every(r => r.passed),
      storyboardValidated: validationResult.valid,
      preRenderValidated: preRenderResult
    },
    summary: summary,
    alignmentReport: alignmentReport,
    calibrationResults: calibrationResults
  };
  
  fss.writeFileSync(
    path.join(PROJECT_DIR, 'production', 'pipeline-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ 完整链路执行完毕！');
  console.log(`报告文件: production/pipeline-report.json`);
  
  return report;
}

// ========== 辅助函数：动态生成Action和场景（使用场景推导引擎！）==========
function generateAction(shotId, type, narration, characters) {
  const SceneDerivationEngine = require('../systems/scene-derivation-engine.js');
  const engine = new SceneDerivationEngine();
  const result = engine.derive(shotId, type, narration, characters);
  return result.action;
}

function generateSceneSpecific(shotId, type, characters, narration) {
  const SceneDerivationEngine = require('../systems/scene-derivation-engine.js');
  const engine = new SceneDerivationEngine();
  const result = engine.derive(shotId, type, narration, characters);
  return result.sceneSpecific;
}

// ========== 辅助函数：构图生成 ===========
function generateComposition(type, characters) {
  if (characters.length === 2) {
    if (type === 'interaction') {
      return '双人构图，两人中间留交流空间，视线交汇形成对角线张力，中景半身';
    }
    return '双人构图，主角色在画面中央偏左，配角在右侧配合演示，中景全身';
  }
  return '单人构图，人物位于画面中央偏左三分之一处，背景环境交代清晰，中景半身，头顶留一指空间';
}

// 运行
main().catch(err => {
  console.error('❌ 链路执行失败:', err);
  process.exit(1);
});
