const { ProductionEngine } = require('./engines/production-engine/production-engine');

const blueprint = {
  config: {
    title: '山海经：白泽',
    featured_beast_id: 'bai-ze',
    opening_duration: 10,
    producer: 'Genius',
    style_notes: 'cinematic, hyperrealistic'
  },
  worldSetting: {
    world_id: 'nirath',
    name: 'Nirath',
    atmosphere: 'mysterious',
    time_of_day: 'golden hour',
    spatial_depth: 'atmospheric layers'
  },
  characters: [
    {
      character_id: 'xiaoG',
      name: '小G',
      species: 'Human',
      visual_anchor: { core_features: ['explorer', 'curious', 'brave'] }
    },
    {
      character_id: 'bai-ze',
      name: '白泽',
      species: 'Beast',
      visual_anchor: { core_features: ['white fur', 'mythical', 'wise'] }
    }
  ],
  scenes: [
    {
      scene_id: 'S01',
      scene_type: 'establishing',
      scene_function: 'establish',
      setting: '知识圣殿',
      timing: { start: 0, duration: 15, end: 15 },
      characters: ['xiaoG', 'bai-ze'],
      dialogue: {
        has_dialogue: true,
        lines: [
          { speaker: '小G', type: '独白', emotion: '好奇', text: '这就是白泽的领地吗？' }
        ]
      },
      emotional_target: { valence: 0.5, arousal: 0.6 },
      visual_direction: { style: 'cinematic' }
    }
  ]
};

async function test() {
  const engine = new ProductionEngine();
  const result = await engine.produce(blueprint);
  
  console.log('=== META ===');
  console.log(JSON.stringify(result.meta, null, 2));
  
  console.log('\n=== OPENING ===');
  console.log(JSON.stringify(result.opening, null, 2));
  
  console.log('\n=== SHOTS[0] ===');
  console.log(JSON.stringify(result.shots[0], null, 2));
  
  console.log('\n=== PROMPT ===');
  console.log(result.shots[0]?.prompt);
}

test().catch(console.error);
