const path = require('path');

// Mock PRD和角色数据
const testPRD = {
  meta: { title: '横纹肌溶解S01E01', version: 'v4.7-patch1', duration: 59 },
  characters: {
    chenNurse: {
      name: '小陈',
      visualAnchors: { required: ['藏青色制服', '短发干练'], preferred: [] },
      visualIdentity: {
        style: '超写实3D数字人渲染，毛孔级皮肤纹理',
        age: '28岁',
        baseIdentity: '亚洲面孔，中国人，年轻女性护士',
        appearance: {
          hair: { promptFragment: '黑色短发干练时尚发尾微卷' },
          face: { promptFragment: '鹅蛋脸年轻肌肤杏仁眼双眼皮' },
          eyes: { promptFragment: '深棕色瞳孔眼神明亮' },
          uniform: { promptFragment: '藏青色制服外套肩章整齐' },
          accessories: { promptFragment: '蓝色皮质工作证卡套黑色手表' },
          build: { promptFragment: '身材匀称身高165cm站姿端正' },
          expression: { promptFragment: '专业亲和目光坚定温暖微笑' }
        },
        angles: {
          closeup: { description: '面部特写深棕色瞳孔杏仁眼' },
          threeQuarter: { description: '3/4侧面经典人像角度' },
          front: { description: '正面全身半身面部清晰' }
        }
      },
      voiceIdentity: {
        gender: 'female',
        promptFragment: '温柔女声语速适中吐字清晰健康科普主持人亲和力权威感',
        style: '科普播音腔',
        mood: '温暖专业'
      },
      personality: {
        core: '专业亲和温暖权威',
        traits: ['耐心讲解', '善于用比喻', '关心听众']
      }
    },
    xiaoG: {
      name: '小G',
      visualAnchors: { required: ['亮黄色连帽外套', '内双棕色眼睛'], preferred: [] },
      visualIdentity: {
        style: '极致写实照片级渲染真人CG风格',
        age: '8岁（身高1米25）',
        baseIdentity: '中国杭州8岁男孩',
        appearance: {
          hair: { promptFragment: '黑色短发蓬松额前呆毛翘起' },
          face: { promptFragment: '圆脸婴儿肥内双棕色眼睛' },
          eyes: { promptFragment: '内双棕色眼睛清澈有神' },
          clothing: { promptFragment: '亮黄色连帽外套橙色条纹' },
          body: { promptFragment: '标准8岁男孩身材头身比1:5' }
        },
        angles: {
          closeup: { description: '面部特写圆脸婴儿肥' },
          threeQuarter: { description: '3/4侧面经典人像角度' }
        }
      },
      // voiceIdentity: undefined
      personality: {
        core: '倔强与温柔并存外柔内刚',
        traits: ['好奇心极强', '观察力敏锐']
      }
    }
  }
};

const testShots = [
  {
    id: 'S01',
    type: 'opening',
    characters: ['chen-nurse'],
    emotion: '热情专业',
    mouthAction: '嘴部微张正在说话，表情亲切专业',
    action: '小陈讲解肾功能和肾损伤原理',
    sceneSpecific: '科普讲堂开场区',
    cameraMovement: { shotSize: 'medium' },
    narration: 'AI主播小陈，继续给大家讲解健康科普知识'
  },
  {
    id: 'S04',
    type: 'interaction',
    characters: ['chen-nurse', 'xiaoG'],
    emotion: '认真好奇',
    mouthAction: '嘴部微张正在说话',
    action: '小G提问，小陈倾听并准备回答',
    sceneSpecific: '互动问答区',
    cameraMovement: { shotSize: 'medium' },
    narration: '小陈老师，出现这些症状要立即去医院吗？'
  }
];

function extractThemeKeywords(narration, prd) {
  if (!narration) return '';
  const text = narration.toLowerCase();
  const keywordMap = {
    '横纹肌溶解': '横纹肌溶解的症状识别',
    '症状': '症状识别与判断',
    '就医': '紧急就医指导',
    '检查': '医学检查流程',
    '总结': '核心知识总结',
    '记住': '健康知识要点'
  };
  for (const [key, value] of Object.entries(keywordMap)) {
    if (text.includes(key)) return value;
  }
  return '';
}

// v4.7-patch1 修复版角色描述构建
function buildCharacterPrompts_v47p1(shot, prd) {
  const charDescs = [];
  
  for (const charId of shot.characters) {
    const charPRD = prd.characters[charId === 'chen-nurse' ? 'chenNurse' : 'xiaoG'];
    if (!charPRD) continue;
    
    const anchors = charPRD.visualAnchors?.required?.join('，') || '';
    const preferred = charPRD.visualAnchors?.preferred?.join('，') || '';
    const emotion = shot.emotion || '自然';
    const mouth = shot.mouthAction || '嘴部微张说话';
    
    const visualId = charPRD.visualIdentity || {};
    const appearance = visualId.appearance || {};
    
    const roleStyle = visualId.style || '';
    const ageInfo = visualId.age || '';
    const baseIdentity = visualId.baseIdentity || '';
    
    const hair = appearance.hair?.promptFragment || '';
    const face = appearance.face?.promptFragment || '';
    const eyes = appearance.eyes?.promptFragment || '';
    const uniform = appearance.uniform?.promptFragment || '';
    const accessories = appearance.accessories?.promptFragment || '';
    const build = appearance.build?.promptFragment || '';
    const expression = appearance.expression?.promptFragment || '';
    
    const angles = visualId.angles || {};
    const shotSize = shot.cameraMovement?.shotSize || '';
    let angleDesc = '';
    if (shotSize.includes('close') || shotSize.includes('extreme_close')) {
      angleDesc = angles.closeup?.description || '';
    } else if (shotSize === 'medium') {
      angleDesc = angles.threeQuarter?.description || '';
    } else if (shotSize === 'full' || shotSize === 'wide') {
      angleDesc = angles.front?.description || '';
    }
    
    const personalityCore = charPRD.personality?.core || '';
    const personalityTraits = (charPRD.personality?.traits || []).slice(0, 2).join('、');
    
    const voiceId = charPRD.voiceIdentity || {};
    const voiceGender = voiceId.gender || 'unknown';
    const voiceFragment = voiceId.promptFragment || '';
    const voiceStyle = voiceId.style || '';
    const voiceMood = voiceId.mood || '';
    
    // v4.7-patch1 修复：增强声音推断
    let genderVoiceAnchor = '';
    if (voiceFragment) {
      genderVoiceAnchor = voiceFragment;
    } else if (voiceGender === 'female' || baseIdentity.includes('女性')) {
      genderVoiceAnchor = '年轻女性，女声讲解，温柔女声';
    } else if (voiceGender === 'male' && (baseIdentity.includes('男孩') || ageInfo.includes('男孩'))) {
      genderVoiceAnchor = '8岁男孩，童声提问，清脆童声';
    } else if (voiceGender === 'male') {
      genderVoiceAnchor = '成年男性，男声讲解';
    } else if (voiceGender === 'unknown') {
      // 修复：unknown时用baseIdentity+age推断
      if (baseIdentity.includes('女性') || baseIdentity.includes('女孩')) {
        genderVoiceAnchor = '年轻女性，女声讲解，温柔女声';
      } else if (baseIdentity.includes('男孩') || ageInfo.includes('男孩')) {
        genderVoiceAnchor = '8岁男孩，童声提问，清脆童声';
      } else if (baseIdentity.includes('男性') || baseIdentity.includes('男')) {
        genderVoiceAnchor = '成年男性，男声讲解';
      }
    }
    
    const lookParts = [];
    if (roleStyle) lookParts.push(roleStyle);
    if (baseIdentity) lookParts.push(baseIdentity);
    if (ageInfo) lookParts.push(ageInfo);
    if (hair) lookParts.push(hair);
    if (face) lookParts.push(face);
    if (eyes) lookParts.push(eyes);
    if (uniform) lookParts.push(uniform);
    if (accessories) lookParts.push(accessories);
    if (build) lookParts.push(build);
    if (expression) lookParts.push(expression);
    if (angleDesc) lookParts.push(angleDesc);
    if (personalityCore) lookParts.push(`气质${personalityCore}`);
    if (personalityTraits) lookParts.push(`特征${personalityTraits}`);
    if (preferred) lookParts.push(preferred);
    
    // v4.7-patch1 修复：>=2（允许"28岁"通过）
    const anchorSet = new Set((anchors || '').split('，'));
    const uniqueLookParts = lookParts.filter(p => {
      const pClean = p.replace(/[，。]/g, '');
      return !anchorSet.has(pClean) && pClean.length >= 2;
    });
    
    const actionParts = [];
    if (genderVoiceAnchor) actionParts.push(genderVoiceAnchor);
    if (voiceStyle) actionParts.push(voiceStyle);
    if (voiceMood) actionParts.push(`语气${voiceMood}`);
    if (emotion) actionParts.push(`表情${emotion}`);
    if (mouth) actionParts.push(mouth);
    if (shot.action) {
      actionParts.push(`正在${shot.action}`);
      if (shot.type === 'interaction' && shot.narration) {
        const themeKeywords = extractThemeKeywords(shot.narration, prd);
        if (themeKeywords) actionParts.push(`围绕${themeKeywords}进行互动交流`);
      }
    }
    
    const descParts = [`${charPRD.name}：${anchors}`];
    if (uniqueLookParts.length > 0) descParts.push(uniqueLookParts.join('，'));
    descParts.push(actionParts.join('，'));
    const desc = descParts.filter(Boolean).join('，');
    
    charDescs.push(desc);
  }
  
  return charDescs;
}

console.log('========================================');
console.log('🧪 v4.7-patch1 修复验证');
console.log('========================================');

let pass = 0;
let fail = 0;

// 测试1: chen-nurse S01
console.log('\n📋 测试1: chen-nurse S01');
const s01Descs = buildCharacterPrompts_v47p1(testShots[0], testPRD);
const s01Desc = s01Descs[0];
const s01Chars = (s01Desc.match(/[\u4e00-\u9fff]/g) || []).length;
console.log('角色描述字数:', s01Chars);

const checks = [
  ['坑7-渲染风格', s01Desc.includes('超写实3D数字人渲染')],
  ['坑9-年龄', s01Desc.includes('28岁')],
  ['坑18-体型', s01Desc.includes('身材匀称')],
  ['坑19-表情', s01Desc.includes('专业亲和') || s01Desc.includes('目光坚定')],
  ['坑20-角度', s01Desc.includes('3/4侧面')],
  ['坑26-完整声音', s01Desc.includes('温柔女声语速适中')],
  ['坑28-气质', s01Desc.includes('气质')],
  ['坑29-特征', s01Desc.includes('特征')]
];

for (const [name, result] of checks) {
  if (result) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}`); fail++; }
}

// 测试2: S04
console.log('\n📋 测试2: S04 interaction');
const s04Descs = buildCharacterPrompts_v47p1(testShots[1], testPRD);
console.log('角色数:', s04Descs.length);

const s04Chen = s04Descs[0];
const s04XiaoG = s04Descs[1];

console.log('\n  chen-nurse:');
console.log('    字数:', (s04Chen.match(/[\u4e00-\u9fff]/g) || []).length);
const c4 = s04Chen.includes('温柔女声') ? '✅' : '❌';
const c5 = s04Chen.includes('症状识别') ? '✅' : '❌';
console.log('    ✅ 声音锚点:', c4);
console.log('    ✅ 主题锚点:', c5);
if (c4 === '✅') pass++; else fail++;
if (c5 === '✅') pass++; else fail++;

console.log('\n  xiaoG:');
console.log('    字数:', (s04XiaoG.match(/[\u4e00-\u9fff]/g) || []).length);
const x1 = s04XiaoG.includes('童声') ? '✅' : '❌';
const x2 = s04XiaoG.includes('8岁') ? '✅' : '❌';
const x3 = s04XiaoG.includes('标准8岁男孩') ? '✅' : '❌';
console.log('    ✅ 声音锚点:', x1);
console.log('    ✅ 年龄:', x2);
console.log('    ✅ 体型:', x3);
if (x1 === '✅') pass++; else fail++;
if (x2 === '✅') pass++; else fail++;
if (x3 === '✅') pass++; else fail++;

// 测试3: 字数
console.log('\n📋 测试3: 字数控制');
const totalS01 = `写实纪录片摄影风格，电影级调色。画面中：${s01Desc}。科普讲堂。环境细节。摄影棚三点布光。中景稳定构图。技术参数。画面要求`;
const totalS01Chars = (totalS01.match(/[\u4e00-\u9fff]/g) || []).length;
console.log('  S01完整prompt预估字数:', totalS01Chars);
console.log(totalS01Chars <= 490 ? '  ✅ 在490字限制内' : '  ⚠️ 可能超限');

// 测试4: 重复去重验证
console.log('\n📋 测试4: 去重验证');
const hasDuplicates = /([^，]{3,})，.*\1/.test(s01Desc);
console.log(hasDuplicates ? '  ⚠️ 发现重复内容' : '  ✅ 无重复内容');

// 总结
console.log('\n========================================');
console.log(`📊 测试结果: ${pass}/${pass+fail} 通过`);
console.log(fail === 0 ? '✅ 所有测试通过！' : `❌ ${fail}个失败`);
console.log('========================================');

// 输出完整描述供检查
console.log('\n--- S01完整角色描述 ---');
console.log(s01Desc.substring(0, 200) + '...');
console.log('\n--- xiaoG完整描述 ---');
console.log(s04XiaoG.substring(0, 200) + '...');
