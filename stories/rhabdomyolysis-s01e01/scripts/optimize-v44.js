const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const SemanticIntegrityValidator = require('../systems/semantic-integrity-validator.js');
const TransitionDesigner = require('../systems/transition-designer.js');
const SceneDerivationEngine = require('../systems/scene-derivation-engine.js');

const PROJECT_DIR = '/root/.openclaw/workspace/stories/rhabdomyolysis-s01e01';
const storyboard = JSON.parse(fss.readFileSync(path.join(PROJECT_DIR, 'production', 'storyboard.json')));
const prompts = JSON.parse(fss.readFileSync(path.join(PROJECT_DIR, 'production', 'prompts.json')));

const validator = new SemanticIntegrityValidator();
const designer = new TransitionDesigner();
const engine = new SceneDerivationEngine();

console.log('========================================');
console.log('🎬 v4.4 语义完整性 + 过渡衔接优化');
console.log('========================================');

// 1. 重新分配时长
console.log('\n📐 STEP 1: 语义完整性校验 + 弹性时长分配');
let totalRecommended = 0;
const newDurations = {};

for (const shot of storyboard) {
  const rec = validator.calculateRecommendedDuration(shot.narration, shot.type, true);
  newDurations[shot.id] = rec.recommended;
  totalRecommended += rec.recommended;
  console.log(`  ${shot.id}: ${shot.duration}秒 → ${rec.recommended}秒 (${shot.narration.length}字/${rec.rate}字每秒)`);
}

console.log(`\n📊 推荐总时长: ${totalRecommended}秒 | 弹性区间: 41-77秒`);

// 采用推荐时长
for (const shot of storyboard) {
  shot.duration = newDurations[shot.id];
}

// 2. 添加过渡镜头
console.log('\n🔗 STEP 2: 过渡衔接设计');
const newStoryboard = [];
const newPrompts = [];
let shotIndex = 0;

for (let i = 0; i < storyboard.length; i++) {
  const shot = storyboard[i];
  shotIndex++;
  
  // 添加主镜头
  newStoryboard.push(shot);
  
  // 检查是否需要过渡
  if (i < storyboard.length - 1) {
    const nextShot = storyboard[i + 1];
    const transition = designer.generateTransitionText(shot, nextShot);
    
    if (transition) {
      console.log(`  ✅ ${shot.id} → ${nextShot.id}: 添加过渡 "${transition.text}" (${transition.duration}秒)`);
      
      // 创建过渡镜头
      const transitionShot = {
        id: `T${shotIndex}`,
        type: 'transition',
        role: 'transition',
        narration: transition.text,
        narrationLength: transition.text.length,
        duration: transition.duration,
        characters: shot.characters,
        primaryCharacter: shot.primaryCharacter,
        secondaryCharacter: null,
        priority: 'medium',
        emotion: '自然过渡',
        action: '自然过渡衔接',
        mouthAction: '嘴部微张自然说话',
        sceneSpecific: '医学讲堂过渡区，镜头丝滑切换，氛围自然连贯',
        background: '医学讲堂过渡区，镜头丝滑切换',
        lighting: '自然光过渡',
        composition: '中景过渡构图'
      };
      
      newStoryboard.push(transitionShot);
      shotIndex++;
    }
  }
}

// 3. 重新生成prompts
console.log('\n📝 STEP 3: 重新生成Prompts');

for (const shot of newStoryboard) {
  if (shot.type === 'transition') {
    // 过渡镜头使用简化prompt
    const prompt = `写实纪录片摄影风格，电影级调色，自然光照明。画面中：${shot.characters.map(c => {
      if (c === 'chen-nurse') return '小陈：藏青色制服，肩章，短发干练，亲切微笑，自然过渡姿态';
      if (c === 'xiaoG') return '小G：年轻活力，认真专注，自然回应';
      return c;
    }).join('，')}，正在${shot.action}。${shot.sceneSpecific}。环境灯光明亮通透，氛围自然连贯。摄影棚三点布光，色温5600K自然白光。中景稳定构图。技术参数：景深适中，焦点锁定人物面部，ISO200低噪点，快门1/50秒动态模糊自然。画面要求：真实自然，写实风格`;
    
    newPrompts.push({
      id: shot.id,
      prompt: prompt,
      promptLength: prompt.length,
      narration: shot.narration,
      characters: shot.characters,
      duration: shot.duration,
      ratio: "16:9",
      type: shot.type
    });
  } else {
    // 主镜头从原prompts复制并更新duration
    const originalPrompt = prompts.find(p => p.id === shot.id);
    if (originalPrompt) {
      originalPrompt.duration = shot.duration;
      newPrompts.push(originalPrompt);
    }
  }
}

// 4. 验证总时长
const totalDuration = newStoryboard.reduce((sum, s) => sum + s.duration, 0);
console.log(`\n📊 新故事板: ${newStoryboard.length}镜（${storyboard.length}主镜 + ${newStoryboard.length - storyboard.length}过渡）`);
console.log(`📊 总时长: ${totalDuration}秒`);

// 5. 保存
fss.writeFileSync(
  path.join(PROJECT_DIR, 'production', 'storyboard-v44.json'),
  JSON.stringify(newStoryboard, null, 2)
);
fss.writeFileSync(
  path.join(PROJECT_DIR, 'production', 'prompts-v44.json'),
  JSON.stringify(newPrompts, null, 2)
);

console.log('\n✅ v4.4优化完成！');
console.log(`   故事板: production/storyboard-v44.json`);
console.log(`   Prompts: production/prompts-v44.json`);
