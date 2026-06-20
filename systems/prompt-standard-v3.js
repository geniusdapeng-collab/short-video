/**
 * Seedance Prompt 标准模块 v3.0 — 实战驱动升级
 * 
 * 升级背景：v2.0 在实际运行中成为"摆设"，原因：
 * 1. 格式不匹配：系统使用【】区块格式，v2.0 定义的是 | 分隔格式
 * 2. 审核不切实际：要求英文关键词（boy/girl），但系统使用中文角色名（小G/饕餮）
 * 3. 集成不强制：Standard 引入后仅 smartTrim 被使用，validate/buildPrompt/assemble 全部闲置
 * 4. 检查不实用：无法检测空视觉、模板化环境、未消费运镜等真实问题
 * 
 * v3.0 核心升级：
 * 1. 双格式兼容：同时支持标准格式（|）和区块格式（【】）
 * 2. 字段映射：将【视觉】【环境布景】【运镜】等映射到10个标准字段
 * 3. 实用审核：8项实战检查，检测真实问题而非形式合规
 * 4. 自动修复：检测到空视觉/超长 narration/未消费运镜时自动修复
 * 5. 强制集成：在 STAGE-11 渲染核心和 STAGE-12 合规检查中强制生效
 * 6. 字符硬控制：1470-1500 字符区间强制执行，超限自动按优先级裁剪
 * 
 * 适用范围：Seedance 2.0 文生视频，山海经系列，Nirath 世界观
 * 总字符控制：1470-1500 字符（绝对上限 1500，低于 1470 提示浪费）
 * 核心理念：每一字符必须服务于画面生成，无空视觉，无模板化，无未消费字段
 * 
 * @module prompt-standard-v3
 * @version 3.0
 * @date 2026-06-02
 */

'use strict';

const VERSION = '3.0';
const MAX_PROMPT_LENGTH = 1500;
const MIN_PROMPT_LENGTH = 1470;
const TARGET_PROMPT_LENGTH = 965;

// ============================================================
// 一、字段定义（10个维度）— 适配【】区块格式
// ============================================================

const FIELD_DEFINITIONS = {
  CHARACTER: {
    priority: 'P0',
    label: '角色锚点',
    required: true,
    targetLength: 30,
    minLength: 10,
    trimStrategy: 'never',
    // v3.0: 映射到【视觉】中的角色描述和【角色约束】
    blockMapping: ['【视觉】', '【角色约束】'],
    baselineChars: '角色ID引用不可删',
    checkRegex: /【视觉】.*(?:小G|xiaoG|饕餮|taotie| protagonist|主角)/i
  },
  ACTION: {
    priority: 'P1',
    label: '动作表演',
    required: true,
    targetLength: 85,
    minLength: 40,
    trimStrategy: 'protect',
    blockMapping: ['【视觉】', '【异兽动作】', '【嘴部动作】'],
    baselineChars: '核心动作动词+交互对象不可删',
    checkRegex: /【视觉】.*(?:动作|执行|姿态|表情|gesture|movement)|【嘴部动作】/i
  },
  SCENE: {
    priority: 'P1',
    label: '场景环境',
    required: true,
    targetLength: 175,
    minLength: 100,
    trimStrategy: 'protect',
    blockMapping: ['【环境布景】', '【环境质感】'],
    baselineChars: '核心地点+≥2种材质细节不可删',
    checkRegex: /【环境布景】/,
    // v3.0: 检测模板化描述（禁止"原始发光毯"等通用模板重复出现）
    templateCheck: /原始发光毯覆盖地表，随磁场脉动明暗/g
  },
  MOOD: {
    priority: 'P1',
    label: '情绪氛围',
    required: true,
    targetLength: 35,
    minLength: 15,
    trimStrategy: 'protect',
    blockMapping: ['emotion', 'mood', '情绪'],
    baselineChars: '至少保留3个核心词',
    checkRegex: /(?:emotion|mood|情绪|情感|氛围)/i
  },
  CAMERA: {
    priority: 'P1',
    label: '运镜控制',
    required: true,
    targetLength: 115,
    minLength: 60,
    trimStrategy: 'protect',
    blockMapping: ['【运镜】', '【镜头时间轴】'],
    baselineChars: '景别+核心运镜词不可删',
    checkRegex: /【(?:运镜|镜头时间轴)】/
  },
  LIGHTING: {
    priority: 'P1',
    label: '光影方案',
    required: true,
    targetLength: 95,
    minLength: 50,
    trimStrategy: 'protect',
    blockMapping: ['光照', '光影', '色温', 'K'],
    baselineChars: '主光方向+色温数值不可删',
    checkRegex: /(?:\d+K|光照|光影|色温|lighting|Aurelius|Silvana)/i
  },
  NEGATIVE: {
    priority: 'P2',
    label: '负面提示',
    required: true,
    targetLength: 70,
    minLength: 40,
    trimStrategy: 'moderate',
    blockMapping: ['【全局负面约束】', '【负面约束】'],
    baselineChars: '项目级标准排除项不可删',
    checkRegex: /【(?:全局负面约束|负面约束)】/
  },
  AUDIO: {
    priority: 'P2',
    label: '音频叙事',
    required: true,
    targetLength: 65,
    minLength: 30,
    trimStrategy: 'moderate',
    // 🔊 v2.0-B+: 支持自然语言格式（伴随/动作产生/氛围弥漫/音乐线索/声画精准同步）
    blockMapping: ['【环境音效】', '【神兽人声签名】', '【旁白/台词】', '伴随', '动作产生', '氛围弥漫', '音乐线索', '声画精准同步'],
    baselineChars: '核心台词+声音标识不可删',
    checkRegex: /【(?:环境音效|神兽人声签名|旁白\/台词|音频)】|伴随|动作产生|氛围弥漫|音乐线索|声画精准同步/
  },
  RENDER: {
    priority: 'P2',
    label: '渲染风格',
    required: true,
    targetLength: 45,
    minLength: 20,
    trimStrategy: 'moderate',
    blockMapping: ['【ASTRALIS】', '【技术规格】', '【风格锁】'],
    baselineChars: '风格核心词不可删',
    checkRegex: /【(?:ASTRALIS|技术规格|风格锁)】/
  },
  DIRECTOR: {
    priority: 'P3',
    label: '导演风格',
    required: true,
    targetLength: 30,
    minLength: 15,
    trimStrategy: 'aggressive',
    blockMapping: ['导演', '风格', 'Cameron', 'Villeneuve', 'Spielberg', 'Jackson'],
    baselineChars: '导演标识不可删',
    checkRegex: /(?:Cameron|Villeneuve|Spielberg|Jackson|导演|风格化)/i
  }
};

const FIELD_ORDER = [
  'CHARACTER', 'ACTION', 'SCENE', 'MOOD', 'CAMERA', 'LIGHTING',
  'NEGATIVE', 'AUDIO', 'RENDER', 'DIRECTOR'
];

const PRIORITY_ORDER = ['P3', 'P2', 'P1', 'P0'];

// ============================================================
// 二、分隔符规范（双格式）
// ============================================================

const SEPARATOR = ' | ';
const FIELD_PREFIX = ': ';
const BLOCK_START = '【';
const BLOCK_END = '】';

// ============================================================
// 二.5、定妆照引用规范（Seedance 2.0 Official）
// ============================================================

const CHARACTER_REFERENCE_RULES = {
  // 官方API格式
  apiFormat: {
    role: 'reference_image',           // 官方API角色
    promptSyntax: '@Image{N}',         // Prompt中引用语法
    firstFrameLock: '[first_frame_lock]', // 首帧锁定标签
    identityLock: '[identity_lock]',   // 身份锁定标签
    compositionLock: '[composition_lock]' // 构图锁定标签
  },
  
  // 3角度规则（官方推荐）
  angles: {
    required: ['front', 'threeQuarter', 'profile'],
    optional: ['closeup', 'side'],
    description: '正面、3/4侧面、侧面三个角度为必需，特写/侧面为可选'
  },
  
  // 图像质量标准
  imageQuality: {
    resolution: '≥1024x1024',        // 最低分辨率
    lighting: '中性光照，无极端阴影',  // 光照要求
    expression: '中性表情，无夸张表情',  // 表情要求
    background: '纯色或简单背景',      // 背景要求
    features: '高对比度特征清晰可见'     // 特征要求
  },
  
  // Prompt引用模板
  promptTemplates: {
    singleCharacter: '@Image1 as the main character reference, maintain character appearance exactly consistent with @Image1',
    multiCharacter: '@Image1 as [characterA], @Image2 as [characterB], maintain each character appearance exactly consistent with their reference',
    firstFrame: '[first_frame_lock] @Image1 as the opening frame, preserve composition and character',
    identity: '[identity_lock] @Image1, the character walks through [scene], maintain exact appearance'
  },
  
  // 多角色引用规则（官方关键）
  multiCharacter: {
    maxReferences: 3,                  // 最多同时引用3个角色
    separationStrategy: '每个角色独立引用，避免描述混叠',
    promptFormat: '@Image1 as [角色A描述], @Image2 as [角色B描述]',
    criticalRule: '多角色时必须分别引用，不能用"they"或"both"模糊指代'
  },
  
  // 常见错误（官方FAQ）
  commonErrors: [
    '未使用@语法引用，导致模型忽略参考图',
    '多角色时只用一张参考图，导致形象混淆',
    '参考图有文字水印或复杂背景，干扰识别',
    'Prompt描述与参考图冲突（如发色、服装颜色矛盾）',
    '未使用identity_lock标签，导致帧间形象漂移'
  ],
  
  // 官方最佳实践
  bestPractices: [
    'Prompt中asset引用放在最前面（@Image1在最前）',
    '动作描述具体但简洁，避免与参考图特征冲突',
    '多角色场景：先描述主体，再分别引用参考',
    '光照/风格词不覆盖参考图特征，只增强氛围',
    '使用"maintain character appearance exactly consistent"强化一致性'
  ]
};

// ============================================================
// 三、模板库（v3.0 精简版，只保留最实用的）
// ============================================================

const NEGATIVE_TEMPLATES = {
  nirath: 'no metal armor, no metallic sheen, no metal texture, no anime eyes, no glowing eyes, no deformed hands, no extra fingers, no cartoon style, no flat lighting, no modern objects, no text watermark, no traditional Chinese architecture, no yin-yang, no bagua, no ink wash',
  fantasy: 'no deformed hands, no extra fingers, no modern objects, no text watermark, no cartoon style, no flat lighting, no oversaturated colors, no anime eyes, no glowing eyes, no metal armor, no metal texture, no metallic sheen',
  realistic: 'no anime, no illustration, no 3D render look, no oversaturation, no deformed hands, no extra limbs, no shaky cam, no cartoon style, no flat lighting'
};

const RENDER_TEMPLATES = {
  cinematic: '写实电影级, 4K超清, 胶片颗粒, 色彩分级',
  hyperrealistic: '超写实, 8K超清, 体积光, 光线追踪反射',
  nirath: '超写实渲染, 电影级光影, 16:9, 物理真实世界, 35mm胶片颗粒, 轻微噪点, 4K高清, 电影质感'
};

const DIRECTOR_TEMPLATES = {
  cameron: 'Cameron-scale epic contrast, bioluminescent ecosystems, grand environmental storytelling',
  villeneuve: 'Villeneuve-scale negative space, contemplative pacing, monolithic architecture, atmospheric fog',
  spielberg: 'Spielberg-scale emotional warmth, dappled golden light, intimate character moments, wonder',
  jackson: 'Jackson-scale epic fantasy, sweeping aerial vistas, detailed worldbuilding, mythic grandeur'
};

// ============================================================
// 四、实战审核检查清单（8项，替代原来的15项）
// ============================================================

const CHECKLIST = [
  { id: 'emptyVisual', name: '空视觉检测', severity: 'error', check: checkEmptyVisual },
  { id: 'templateScene', name: '场景模板化检测', severity: 'error', check: checkTemplateScene },
  { id: 'narrationLength', name: '旁白字数匹配', severity: 'warning', check: checkNarrationLength },
  { id: 'cameraConsumed', name: '运镜被消费', severity: 'error', check: checkCameraConsumed },
  { id: 'characterPresent', name: '角色出现', severity: 'error', check: checkCharacterPresent },
  { id: 'nirathAnchor', name: 'Nirath锚点', severity: 'warning', check: checkNirathAnchor },
  { id: 'promptLength', name: '提示词长度', severity: 'error', check: checkPromptLength },
  { id: 'negativeComplete', name: '负面约束完整', severity: 'warning', check: checkNegativeComplete },
  { id: 'characterReference', name: '定妆照引用规范', severity: 'error', check: checkCharacterReference }
];

/**
 * 检查1：空视觉检测
 * 检测【视觉】区块是否为空或只有占位符
 */
function checkEmptyVisual(prompt, fields, context) {
  const visualMatch = prompt.match(/【视觉】([^【]*)/);
  const visualContent = visualMatch ? visualMatch[1].trim() : '';
  const isEmpty = !visualContent || visualContent.length < 10 || /content|null|undefined/.test(visualContent);
  
  return {
    passed: !isEmpty,
    severity: 'error',
    message: isEmpty ? '【视觉】区块为空或仅包含占位符，buildPromptV3 未输出有效视觉内容' : '视觉内容正常',
    detail: { visualLength: visualContent.length, visualContent: visualContent.substring(0, 50) }
  };
}

/**
 * 检查2：场景模板化检测
 * 检测【环境布景】是否使用了通用模板（如"原始发光毯覆盖地表"重复出现）
 */
function checkTemplateScene(prompt, fields, context) {
  const envMatch = prompt.match(/【环境布景】([^【]*)/);
  const envContent = envMatch ? envMatch[1].trim() : '';
  
  // 检测模板化描述：如果包含"原始发光毯覆盖地表，随磁场脉动明暗"且没有场景特异性描述
  const hasGenericTemplate = /原始发光毯覆盖地表，随磁场脉动明暗/.test(envContent);
  const hasSceneSpecific = /(废墟|钩吾|饕餮|涿鹿|战场|裂缝|熔岩|地热|磁丝|孢子|晶状|共振)/.test(envContent);
  
  const isTemplate = hasGenericTemplate && !hasSceneSpecific;
  
  return {
    passed: !isTemplate,
    severity: 'error',
    message: isTemplate ? '【环境布景】使用了通用模板，缺少场景特异性描述（晶状菌丝、共振波纹、孢子微粒等）' : '场景描述场景化',
    detail: { hasGenericTemplate, hasSceneSpecific }
  };
}

/**
 * 检查3：旁白字数匹配
 * 检测 narration 字数是否超过时长容量（4.5字/秒）
 */
function checkNarrationLength(prompt, fields, context) {
  const narration = context.narration || '';
  const duration = context.duration || 15;
  const capacity = Math.floor(duration * 4.5); // 4.5字/秒
  const length = narration.length;
  const excess = length - capacity;
  
  return {
    passed: excess <= 0,
    severity: 'warning',
    message: excess > 0 ? `narration ${length}字 > 容量 ${capacity}字（${duration}秒），超标 ${excess}字` : `narration ${length}字 ≤ 容量 ${capacity}字`,
    detail: { length, capacity, duration, excess }
  };
}

/**
 * 检查4：运镜被消费检测
 * 检测 cameraMovement 是否以正确格式出现在 Prompt 中
 */
function checkCameraConsumed(prompt, fields, context) {
  const cameraMovement = context.cameraMovement || '';
  const hasTimeline = /【镜头时间轴】/.test(prompt);
  const hasMovement = /【运镜】/.test(prompt);
  
  // 如果 cameraMovement 存在但 Prompt 中未消费
  const isNotConsumed = cameraMovement && typeof cameraMovement === 'string' && cameraMovement.length > 0 && !hasTimeline && !hasMovement;
  
  return {
    passed: !isNotConsumed,
    severity: 'error',
    message: isNotConsumed ? 'cameraMovement 存在但未被 Prompt 消费（缺少【镜头时间轴】或【运镜】区块）' : '运镜已消费',
    detail: { cameraMovementType: typeof cameraMovement, hasTimeline, hasMovement }
  };
}

/**
 * 检查5：角色出现检测
 * 检测主角和异兽是否出现在 Prompt 中
 */
function checkCharacterPresent(prompt, fields, context) {
  const protagonist = context.protagonist || '小G';
  const beast = context.beast || '饕餮';
  const hasProtagonist = prompt.includes(protagonist) || prompt.includes('xiaoG');
  const hasBeast = prompt.includes(beast) || prompt.includes('taotie');
  
  const missing = [];
  if (!hasProtagonist) missing.push(protagonist);
  if (!hasBeast) missing.push(beast);
  
  return {
    passed: missing.length === 0,
    severity: 'error',
    message: missing.length > 0 ? `角色未出现在Prompt中: ${missing.join(', ')}` : '全部角色已出现',
    detail: { hasProtagonist, hasBeast }
  };
}

/**
 * 检查6：Nirath锚点检测
 * 检测是否包含 Nirath 世界观锚点词
 */
function checkNirathAnchor(prompt, fields, context) {
  const anchors = ['Aurelius', 'Silvana', '5800K', '6500K', '3.2Tesla', '0.82G', 'Nirath'];
  const found = anchors.filter(a => prompt.includes(a));
  const missing = anchors.filter(a => !prompt.includes(a));
  
  return {
    passed: found.length >= 3,
    severity: 'warning',
    message: found.length < 3 ? `Nirath锚点不足: 仅 ${found.length}/6 个（${found.join(', ')}），缺少 ${missing.join(', ')}` : `Nirath锚点完整: ${found.length}/6`,
    detail: { found, missing }
  };
}

/**
 * 检查7：提示词长度检测
 * 检测是否在 1470-1500 字符区间内
 */
function checkPromptLength(prompt, fields, context) {
  // 统一使用 Unicode 字符数（String.prototype.length），非字节数
  // 中文1字=1字符，英文1字母=1字符，符号=1字符，与Seedance API限制方式一致
  const len = prompt.length;
  const status = len >= MIN_PROMPT_LENGTH && len <= MAX_PROMPT_LENGTH ? 'ok' : 
                 len > MAX_PROMPT_LENGTH ? 'exceed' : 'under';
  
  return {
    passed: status === 'ok',
    severity: 'error',
    message: status === 'ok' ? `长度 ${len} 字符，在目标区间 ${MIN_PROMPT_LENGTH}-${MAX_PROMPT_LENGTH}` :
             status === 'exceed' ? `长度 ${len} 字符，超出上限 ${MAX_PROMPT_LENGTH}，需裁剪 ${len - MAX_PROMPT_LENGTH} 字符` :
             `长度 ${len} 字符，低于下限 ${MIN_PROMPT_LENGTH}，空间浪费`,
    detail: { length: len, status, excess: len > MAX_PROMPT_LENGTH ? len - MAX_PROMPT_LENGTH : 0 }
  };
}

/**
 * 检查8：负面约束完整检测
 * 检测【全局负面约束】是否包含关键排除项
 */
function checkNegativeComplete(prompt, fields, context) {
  const negativeMatch = prompt.match(/【全局负面约束】([^【]*)/);
  const negativeContent = negativeMatch ? negativeMatch[1].trim() : '';
  
  const requiredItems = ['metal', 'anime', 'cartoon', 'deformed', 'modern', 'text'];
  const found = requiredItems.filter(item => negativeContent.toLowerCase().includes(item));
  const missing = requiredItems.filter(item => !negativeContent.toLowerCase().includes(item));
  
  return {
    passed: missing.length <= 2,
    severity: 'warning',
    message: missing.length > 2 ? `负面约束缺失关键项: ${missing.join(', ')}` : `负面约束完整（${found.length}/6）`,
    detail: { found, missing }
  };
}

/**
 * 检查9：定妆照引用规范检测
 * 检测是否按Seedance 2.0官方规范引用角色参考图
 */
function checkCharacterReference(prompt, fields, context) {
  const hasReferenceSyntax = /@Image\d+/.test(prompt);
  const hasIdentityLock = /\[identity_lock\]/.test(prompt);
  const hasFirstFrameLock = /\[first_frame_lock\]/.test(prompt);
  const hasMaintainConsistent = /maintain character appearance exactly consistent/i.test(prompt);
  const hasMultiCharacterRef = prompt.match(/@Image\d+/g)?.length > 1;
  
  // 检测是否有角色引用需求（Prompt中有角色名）
  const hasCharacterNeed = /(?:小G|xiaoG|饕餮|taotie|主角|角色)/i.test(prompt);
  
  const issues = [];
  
  if (hasCharacterNeed && !hasReferenceSyntax) {
    issues.push('有角色但未使用@Image语法引用参考图');
  }
  
  if (hasMultiCharacterRef && !hasIdentityLock) {
    issues.push('多角色场景未使用[identity_lock]标签');
  }
  
  if (hasReferenceSyntax && !hasMaintainConsistent) {
    issues.push('引用参考图但未使用"maintain consistent"强化一致性');
  }
  
  return {
    passed: issues.length === 0,
    severity: 'error',
    message: issues.length > 0 ? `定妆照引用问题: ${issues.join('; ')}` : '定妆照引用规范',
    detail: { hasReferenceSyntax, hasIdentityLock, hasFirstFrameLock, hasMultiCharacterRef, issues }
  };
}

// ============================================================
// 五、智能裁剪引擎（v3.0 增强版）
// ============================================================

/**
 * 智能裁剪：按优先级保护字段，支持【】区块格式
 * @param {String} prompt - 原始Prompt
 * @param {Object} options - 裁剪选项
 * @returns {String} 裁剪后的Prompt
 */
function smartTrim(prompt, options = {}) {
  const { 
    targetLength = MAX_PROMPT_LENGTH, 
    shotType = 'medium',
    protectFields = [],
    strategy = 'balanced'
  } = options;
  
  if (prompt.length <= targetLength) return prompt;
  
  // v3.0: 保护所有【】包裹的独立区块（最高优先级）
  const protectedBlocks = [];
  let protectedPrompt = prompt;
  const blockRegex = /【[^】]+】[^【]*/g;
  let match;
  let blockIndex = 0;
  while ((match = blockRegex.exec(prompt)) !== null) {
    const placeholder = `__PROTECTED_BLOCK_${blockIndex}__`;
    protectedBlocks.push({ placeholder, content: match[0] });
    protectedPrompt = protectedPrompt.replace(match[0], placeholder);
    blockIndex++;
  }
  
  // 对去除保护区块后的prompt进行字段解析和裁剪
  const fields = parsePrompt(protectedPrompt);
  if (!fields) {
    let result = hardTrim(protectedPrompt, targetLength);
    protectedBlocks.forEach(({ placeholder, content }) => {
      result = result.replace(placeholder, content);
    });
    return result;
  }
  
  let excess = protectedPrompt.length - targetLength;
  
  // 按优先级顺序裁剪（P3 → P2 → P1 → P0）
  for (const priority of PRIORITY_ORDER) {
    if (excess <= 0) break;
    
    for (const fieldName of FIELD_ORDER) {
      if (excess <= 0) break;
      
      const fieldDef = FIELD_DEFINITIONS[fieldName];
      if (fieldDef.priority !== priority) continue;
      if (protectFields.includes(fieldName)) continue;
      
      const field = fields[fieldName];
      if (!field || !field.content) continue;
      
      const currentLen = field.content.length;
      const minLen = fieldDef.minLength;
      const maxTrim = currentLen - minLen;
      
      if (maxTrim <= 0) continue;
      
      let trimAmount = Math.min(excess, maxTrim);
      if (strategy === 'minimal') {
        trimAmount = Math.min(trimAmount, Math.floor(maxTrim * 0.3));
      } else if (strategy === 'aggressive') {
        trimAmount = Math.min(trimAmount, Math.floor(maxTrim * 0.8));
      } else {
        trimAmount = Math.min(trimAmount, Math.floor(maxTrim * 0.5));
      }
      
      field.content = trimFieldContent(field.content, trimAmount, fieldDef);
      excess -= (currentLen - field.content.length);
    }
  }
  
  // 重新组装
  let result = assembleFromFields(fields);
  
  // 恢复保护区块
  protectedBlocks.forEach(({ placeholder, content }) => {
    result = result.replace(placeholder, content);
  });
  
  // 如果仍然超长，优先裁剪P3/DIRECTOR字段
  if (result.length > targetLength) {
    const resultFields = parsePrompt(result);
    if (resultFields && resultFields.DIRECTOR) {
      const extra = result.length - targetLength;
      const dir = resultFields.DIRECTOR.content;
      if (dir.length > 15) {
        resultFields.DIRECTOR.content = dir.substring(0, Math.max(15, dir.length - extra));
        result = assembleFromFields(resultFields);
        protectedBlocks.forEach(({ placeholder, content }) => {
          if (!result.includes(content)) {
            result = result + ' ' + content;
          }
        });
      }
    }
    
    if (result.length > targetLength) {
      // 在保护区块之后截断
      let lastBlockEnd = 0;
      protectedBlocks.forEach(({ content }) => {
        const idx = result.indexOf(content);
        if (idx !== -1) {
          lastBlockEnd = Math.max(lastBlockEnd, idx + content.length);
        }
      });
      
      if (lastBlockEnd > 0 && lastBlockEnd < result.length) {
        const beforeBlocks = result.substring(0, lastBlockEnd);
        if (beforeBlocks.length <= targetLength) {
          result = beforeBlocks;
        } else {
          result = hardTrim(result, targetLength);
        }
      } else {
        result = hardTrim(result, targetLength);
      }
    }
  }
  
  return result;
}

/**
 * 裁剪字段内容：优先在句子/短语边界裁剪
 */
function trimFieldContent(content, trimAmount, fieldDef) {
  const targetLen = content.length - trimAmount;
  
  // 优先在中文标点处裁剪
  const punctuationMarks = /[。，；！？.，;!?]/g;
  let lastIndex = -1;
  let match;
  
  while ((match = punctuationMarks.exec(content)) !== null) {
    if (match.index <= targetLen) {
      lastIndex = match.index + 1;
    } else {
      break;
    }
  }
  
  if (lastIndex > 0) {
    return content.substring(0, lastIndex).trim();
  }
  
  // 其次在英文标点处
  const enPunctuation = /[.,;!?]/g;
  lastIndex = -1;
  while ((match = enPunctuation.exec(content)) !== null) {
    if (match.index <= targetLen) {
      lastIndex = match.index + 1;
    } else {
      break;
    }
  }
  
  if (lastIndex > 0) {
    return content.substring(0, lastIndex).trim();
  }
  
  // 最后在空格处
  const spaceIndex = content.lastIndexOf(' ', targetLen);
  if (spaceIndex > 0) {
    return content.substring(0, spaceIndex).trim();
  }
  
  // 最后手段硬截断
  return content.substring(0, targetLen).trim();
}

/**
 * 硬截断：在分隔符处截断
 */
function hardTrim(prompt, maxLength) {
  if (prompt.length <= maxLength) return prompt;
  
  let lastSeparator = -1;
  let pos = 0;
  while (pos < prompt.length) {
    const sepIndex = prompt.indexOf(SEPARATOR, pos);
    if (sepIndex === -1 || sepIndex > maxLength) break;
    lastSeparator = sepIndex;
    pos = sepIndex + SEPARATOR.length;
  }
  
  if (lastSeparator > 0) {
    return prompt.substring(0, lastSeparator);
  }
  
  return prompt.substring(0, maxLength);
}

// ============================================================
// 六、Prompt解析器（双格式兼容）
// ============================================================

/**
 * 解析标准格式Prompt为字段对象
 * 支持 | 分隔格式和【】区块格式
 */
function parsePrompt(prompt) {
  // 首先尝试标准格式解析
  const fields = {};
  const parts = prompt.split(SEPARATOR);
  
  for (const part of parts) {
    const colonIndex = part.indexOf(FIELD_PREFIX);
    if (colonIndex === -1) continue;
    
    const fieldName = part.substring(0, colonIndex).trim();
    const content = part.substring(colonIndex + FIELD_PREFIX.length).trim();
    
    if (FIELD_DEFINITIONS[fieldName]) {
      fields[fieldName] = {
        content: content,
        original: part
      };
    }
  }
  
  // 如果标准格式解析失败，尝试【】区块格式映射
  if (Object.keys(fields).length === 0) {
    for (const [fieldName, def] of Object.entries(FIELD_DEFINITIONS)) {
      for (const blockPattern of def.blockMapping) {
        const blockRegex = new RegExp(`${blockPattern}([^【]*)`, 'i');
        const blockMatch = prompt.match(blockRegex);
        if (blockMatch) {
          fields[fieldName] = {
            content: blockMatch[1].trim(),
            original: blockMatch[0]
          };
          break;
        }
      }
    }
  }
  
  // 🔊 v2.0-B+: 识别自然语言格式的音频层（伴随/动作产生/氛围弥漫/音乐线索/声画精准同步）
  if (!fields.AUDIO) {
    const audioKeywords = ['伴随', '动作产生', '氛围弥漫', '音乐线索', '声画精准同步'];
    for (const keyword of audioKeywords) {
      const keywordRegex = new RegExp(`${keyword}([^,，.。;；！!]*[,，.]?)`, 'i');
      const keywordMatch = prompt.match(keywordRegex);
      if (keywordMatch) {
        // 收集所有音频片段
        const audioParts = [];
        for (const kw of audioKeywords) {
          const kwRegex = new RegExp(`${kw}([^,，.。;；！!]*[,，.]?)`, 'gi');
          let kwMatch;
          while ((kwMatch = kwRegex.exec(prompt)) !== null) {
            audioParts.push(kwMatch[0]);
          }
        }
        if (audioParts.length > 0) {
          fields.AUDIO = {
            content: audioParts.join('，'),
            original: audioParts.join('，')
          };
        }
        break;
      }
    }
  }
  
  return Object.keys(fields).length > 0 ? fields : null;
}

/**
 * 从字段对象重新组装Prompt
 */
function assembleFromFields(fields) {
  const parts = [];
  for (const fieldName of FIELD_ORDER) {
    if (fields[fieldName] && fields[fieldName].content) {
      parts.push(`${fieldName}${FIELD_PREFIX}${fields[fieldName].content}`);
    }
  }
  return parts.join(SEPARATOR);
}

// ============================================================
// 七、验证引擎（8项实战检查）
// ============================================================

/**
 * 验证Prompt是否符合v3.0标准
 * @param {String} prompt - Prompt字符串
 * @param {Object} context - 上下文（narration, duration, cameraMovement, protagonist, beast等）
 * @returns {Object} {passed, errors, warnings, details, score}
 */
function validate(prompt, context = {}) {
  const errors = [];
  const warnings = [];
  const details = {};
  
  if (!prompt || prompt.length === 0) {
    return {
      passed: false,
      score: 0,
      errors: ['Prompt为空'],
      warnings: [],
      details: {}
    };
  }
  
  // 执行所有检查项
  for (const checkItem of CHECKLIST) {
    try {
      const result = checkItem.check(prompt, null, context);
      details[checkItem.id] = result;
      
      if (!result.passed) {
        if (result.severity === 'error') {
          errors.push(`${checkItem.name}: ${result.message}`);
        } else {
          warnings.push(`${checkItem.name}: ${result.message}`);
        }
      }
    } catch (e) {
      errors.push(`${checkItem.name}: 检查执行失败 - ${e.message}`);
    }
  }
  
  // 计算分数（100分制）
  const totalChecks = CHECKLIST.length;
  const passedChecks = Object.values(details).filter(d => d.passed).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  return {
    passed: errors.length === 0,
    score,
    errors,
    warnings,
    details,
    version: VERSION
  };
}

// ============================================================
// 八、自动修复引擎（v3.0 新增）
// ============================================================

/**
 * 自动修复常见问题
 * @param {String} prompt - 原始Prompt
 * @param {Object} issues - 检测到的问题列表
 * @param {Object} context - 上下文
 * @returns {Object} {prompt, fixed, fixes}
 */
function autoFix(prompt, issues, context = {}) {
  let fixedPrompt = prompt;
  const fixes = [];
  
  for (const issue of issues) {
    switch (issue.id) {
      case 'emptyVisual':
        // 注入默认视觉描述（基于场景）
        const scene = context.scene || 'Nirath异世界场景';
        const defaultVisual = `【视觉】xiaoG在${scene}中，超写实，电影级光影，推进剧情发展。`;
        fixedPrompt = defaultVisual + fixedPrompt;
        fixes.push({ issue: 'emptyVisual', fix: '注入默认视觉描述' });
        break;
        
      case 'templateScene':
        // 替换模板化描述为场景化描述
        const sceneSpecific = context.sceneSpecific || '晶状菌丝覆盖的废墟深处，地热裂缝透出橙红光芒，磁铁矿岩壁发出幽微电磁光';
        fixedPrompt = fixedPrompt.replace(
          /【环境布景】中景原始发光毯覆盖地表，随磁场脉动明暗。生态活跃：原始单细胞发光毯覆盖地表；矿物结晶生长过程缓慢可见。禁止塑料\/CG质感，禁止光秃秃\/荒芜\/寸草不生。/g,
          `【环境布景】${sceneSpecific}。`
        );
        fixes.push({ issue: 'templateScene', fix: '替换为场景化环境描述' });
        break;
        
      case 'cameraNotConsumed':
        // 将 cameraMovement 格式化为【镜头时间轴】
        const cameraMovement = context.cameraMovement || '';
        if (typeof cameraMovement === 'string' && cameraMovement.length > 0) {
          fixedPrompt += `【镜头时间轴】${cameraMovement}`;
          fixes.push({ issue: 'cameraNotConsumed', fix: '注入【镜头时间轴】区块' });
        }
        break;
        
      case 'promptLength':
        // 如果超长，执行智能裁剪
        if (fixedPrompt.length > MAX_PROMPT_LENGTH) {
          fixedPrompt = smartTrim(fixedPrompt, { targetLength: MAX_PROMPT_LENGTH });
          fixes.push({ issue: 'promptLength', fix: `智能裁剪至 ${MAX_PROMPT_LENGTH} 字符` });
        }
        break;
    }
  }
  
  return {
    prompt: fixedPrompt,
    fixed: fixes.length > 0,
    fixes,
    length: fixedPrompt.length
  };
}

// ============================================================
// 九、组装器（供渲染引擎调用）
// ============================================================

/**
 * 组装最终渲染Prompt
 * @param {Object} shot - 镜头对象
 * @param {Object} options - 选项
 * @returns {Object} {prompt, audit, length}
 */
function assemble(shot, options = {}) {
  const { 
    shotType = 'medium',
    projectType = 'nirath',
    directorStyle = 'cameron',
    context = {}
  } = options;
  
  // 提取字段（兼容多种字段名格式）
  const fields = {};
  for (const fieldName of FIELD_ORDER) {
    const lowerName = fieldName.toLowerCase();
    if (shot[fieldName] || shot[lowerName]) {
      fields[fieldName] = shot[fieldName] || shot[lowerName];
    }
  }
  
  // 自动填充缺失的模板字段
  if (!fields.NEGATIVE) fields.NEGATIVE = getNegativeTemplate(projectType);
  if (!fields.RENDER) fields.RENDER = getRenderTemplate(projectType === 'nirath' ? 'nirath' : 'cinematic');
  if (!fields.DIRECTOR) fields.DIRECTOR = getDirectorTemplate(directorStyle);
  
  // 构建Prompt
  const prompt = buildPrompt(fields, { shotType, projectType });
  
  // 验证
  const audit = validate(prompt, context);
  
  return {
    prompt,
    audit,
    length: prompt.length,
    shotType,
    version: VERSION
  };
}

/**
 * 构建标准格式Prompt
 */
function buildPrompt(fields, options = {}) {
  const { shotType = 'medium', projectType = 'nirath' } = options;
  
  const enrichedFields = { ...fields };
  if (!enrichedFields.NEGATIVE) {
    enrichedFields.NEGATIVE = getNegativeTemplate(projectType);
  }
  if (!enrichedFields.RENDER) {
    enrichedFields.RENDER = getRenderTemplate(projectType === 'nirath' ? 'nirath' : 'cinematic');
  }
  if (!enrichedFields.DIRECTOR) {
    enrichedFields.DIRECTOR = getDirectorTemplate('cameron');
  }
  
  const parts = [];
  for (const fieldName of FIELD_ORDER) {
    const content = enrichedFields[fieldName];
    if (content && content.trim && content.trim()) {
      parts.push(`${fieldName}${FIELD_PREFIX}${content.trim()}`);
    }
  }
  
  const prompt = parts.join(SEPARATOR);
  
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return smartTrim(prompt, { targetLength: MAX_PROMPT_LENGTH, shotType });
  }
  
  return prompt;
}

// ============================================================
// 十、模板获取函数
// ============================================================

function getNegativeTemplate(projectType) {
  return NEGATIVE_TEMPLATES[projectType] || NEGATIVE_TEMPLATES.nirath;
}

function getRenderTemplate(style) {
  return RENDER_TEMPLATES[style] || RENDER_TEMPLATES.cinematic;
}

function getDirectorTemplate(director) {
  return DIRECTOR_TEMPLATES[director] || DIRECTOR_TEMPLATES.cameron;
}

// ============================================================
// 十一、统计与分析
// ============================================================

function analyze(prompt) {
  const fields = parsePrompt(prompt);
  if (!fields) return null;
  
  const total = prompt.length;
  const analysis = {
    totalLength: total,
    fieldCount: 0,
    fields: {},
    priority: { P0: 0, P1: 0, P2: 0, P3: 0 },
    utilization: 0,
    recommendations: []
  };
  
  for (const fieldName of FIELD_ORDER) {
    if (fields[fieldName]) {
      const len = fields[fieldName].content.length;
      const def = FIELD_DEFINITIONS[fieldName];
      analysis.fieldCount++;
      analysis.fields[fieldName] = {
        length: len,
        target: def.targetLength,
        min: def.minLength,
        priority: def.priority,
        status: len >= def.minLength ? 'ok' : 'under',
        utilization: Math.round(len / def.targetLength * 100)
      };
      analysis.priority[def.priority] += len;
    }
  }
  
  analysis.utilization = Math.round(total / MAX_PROMPT_LENGTH * 100);
  
  if (total < MIN_PROMPT_LENGTH) {
    analysis.recommendations.push(`总长度仅${total}字符，低于${MIN_PROMPT_LENGTH}下限，建议补充内容`);
  }
  if (total > MAX_PROMPT_LENGTH) {
    analysis.recommendations.push(`总长度${total}字符，超出${MAX_PROMPT_LENGTH}上限，建议精简`);
  }
  
  for (const [fieldName, info] of Object.entries(analysis.fields)) {
    if (info.status === 'under') {
      analysis.recommendations.push(`${fieldName}仅${info.length}字符，低于最低${info.min}字符要求`);
    }
  }
  
  return analysis;
}

// ============================================================
// 十二、导出
// ============================================================

module.exports = {
  // 常量
  VERSION,
  MAX_PROMPT_LENGTH,
  MIN_PROMPT_LENGTH,
  TARGET_PROMPT_LENGTH,
  FIELD_DEFINITIONS,
  FIELD_ORDER,
  SEPARATOR,
  BLOCK_START,
  BLOCK_END,
  NEGATIVE_TEMPLATES,
  RENDER_TEMPLATES,
  DIRECTOR_TEMPLATES,
  CHECKLIST,
  
  // 核心函数
  buildPrompt,
  getNegativeTemplate,
  getRenderTemplate,
  getDirectorTemplate,
  smartTrim,
  validate,
  assemble,
  autoFix,
  analyze,
  
  // 工具函数
  parsePrompt,
  assembleFromFields,
  trimFieldContent,
  hardTrim,
  
  // 检查函数（单独导出，供外部调用）
  checkEmptyVisual,
  checkTemplateScene,
  checkNarrationLength,
  checkCameraConsumed,
  checkCharacterPresent,
  checkNirathAnchor,
  checkPromptLength,
  checkNegativeComplete,
  checkCharacterReference,
  
  // 定妆照引用规范
  CHARACTER_REFERENCE_RULES
};

// ============================================================
// 版本记录
// ============================================================
// v3.0 (2026-06-02): 实战驱动升级
//   - 双格式兼容（标准格式 + 【】区块格式）
//   - 8项实战检查（替代15项形式检查）
//   - 自动修复引擎（空视觉/模板化/未消费运镜）
//   - 强制字符控制（1470-980硬区间）
//   - 集成点：STAGE-11 渲染核心 + STAGE-12 合规检查
// v2.0 (2026-05-31): 初始版本，10字段标准，全链路模块化
