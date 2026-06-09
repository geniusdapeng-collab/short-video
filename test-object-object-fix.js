const { CharacterPromptBuilder } = require('./systems/character-prompt-builder.js');
const { PromptTierArchitecture } = require('./systems/prompt-tier-architecture.js');
const { PromptChannelSeparator } = require('./systems/prompt-channel-separator.js');
const { WorldviewAndSceneManager } = require('./systems/worldview-scene-manager.js');

// Test 1: CharacterPromptBuilder.build() returns object with .prompt property
const cpb = new CharacterPromptBuilder();
const mockChar = {
  id: 'xiaoG',
  name: '小G',
  visualIdentity: {
    baseIdentity: '东亚面孔短发年轻男性',
    appearance: { face: { consistency: 'strict', promptFragment: '短发' } },
    species: '人类'
  }
};
const buildResult = cpb.build(mockChar);
console.log('=== Test 1: CharacterPromptBuilder.build() returns ===');
console.log('Type:', typeof buildResult);
console.log('Has .prompt:', !!buildResult.prompt);
console.log('Has .layers:', !!buildResult.layers);
console.log('Prompt sample:', buildResult.prompt?.substring(0, 50));

// Test 2: Simulate stageCharacters storing prompt
const charPrompt = buildResult;
const extractedPrompt = charPrompt && typeof charPrompt === 'object' && charPrompt.prompt ? charPrompt.prompt : charPrompt;
console.log('\n=== Test 2: Extracted prompt string ===');
console.log('Type:', typeof extractedPrompt);
console.log('Value:', extractedPrompt?.substring(0, 50));

// Test 3: Simulate buildBasePrompt with extracted prompt
const characters = {
  xiaoG: { profile: mockChar, prompt: extractedPrompt, compliance: { passed: true } },
  'chen-nurse': { profile: mockChar, prompt: '护士, 30岁, female, 白大褂', compliance: { passed: true } }
};

const shot = {
  id: 'S01',
  scene: '开场介绍',
  narration: '欢迎来到康复科普',
  characters: ['chen-nurse', 'xiaoG'],
  emotionPhase: 'establishing',
  hasDialogue: true,
  cameraMovement: { type: 'static', description: '固定机位' }
};

const channelSep = new PromptChannelSeparator();
const channelResult = channelSep.separate({
  narration: shot.narration,
  scene: { name: shot.scene, sceneCore: 'realistic scene' },
  characters: shot.characters.map(cid => {
    const char = characters[cid];
    let promptText = char?.prompt;
    if (promptText && typeof promptText === 'object') {
      promptText = promptText.prompt || promptText.description || promptText.name || String(cid);
    }
    return { name: cid, appearance: (typeof promptText === 'string' ? promptText.substring(0, 50) : String(promptText || cid)).substring(0, 50) };
  }),
  emotionPhase: shot.emotionPhase,
  hasDialogue: shot.hasDialogue
});

console.log('\n=== Test 3: Channel Separator visualPrompt ===');
console.log('visualPrompt:', channelResult.visualPrompt.text);
console.log('Contains [object Object]:', channelResult.visualPrompt.text.includes('[object Object]'));

// Test 4: TierBuilder
const tierBuilder = new PromptTierArchitecture({ maxLength: 980 });
const tierResult = tierBuilder.build({
  sceneName: shot.scene,
  sceneCore: 'realistic scene',
  shotType: shot.cameraMovement?.type || '电影级镜头',
  subject: shot.characters.map(cid => {
    const char = characters[cid];
    let promptText = char?.prompt;
    if (promptText && typeof promptText === 'object') {
      promptText = promptText.prompt || promptText.description || promptText.name || String(cid);
    }
    return (typeof promptText === 'string' ? promptText.substring(0, 80) : String(promptText || cid)).substring(0, 80);
  }).join(', '),
  action: shot.action || channelResult.visualPrompt.text || '',
  cameraMovement: shot.cameraMovement,
  emotionPhase: shot.emotionPhase,
  environmentFeatures: [],
  mode: 'generic',
  isOpening: false,
  isFirstShot: true
});

console.log('\n=== Test 4: TierBuilder prompt ===');
console.log('Prompt:', tierResult.prompt);
console.log('Contains [object Object]:', tierResult.prompt.includes('[object Object]'));

// Summary
const allClean = !channelResult.visualPrompt.text.includes('[object Object]') && !tierResult.prompt.includes('[object Object]');
console.log('\n=== SUMMARY ===');
console.log('All clean:', allClean ? '✅ YES' : '❌ NO - still has [object Object]');
process.exit(allClean ? 0 : 1);
