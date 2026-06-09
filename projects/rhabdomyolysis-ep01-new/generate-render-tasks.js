const fs = require('fs').promises;
const fss = require('fs');
const storyboard = JSON.parse(fss.readFileSync('storyboard-v6.json', 'utf8'));

const tasks = storyboard.shots.map(shot => {
  // 角色映射
  const refMap = {
    'xiaoG': 'xiaoG',
    'chen-nurse': 'chen',
    'coach-li': 'coach'
  };
  
  const references = (shot.characters || [])
    .map(c => refMap[c])
    .filter(Boolean);
  
  return {
    id: shot.id,
    prompt: shot.prompt,
    line: shot.line,
    references: [...new Set(references)] // 去重
  };
});

fss.writeFileSync('production/render-v6/render-tasks.json', JSON.stringify(tasks, null, 2));
console.log('✅ render-tasks.json 生成完成');
console.log('📊 任务数:', tasks.length);
tasks.forEach(t => {
  console.log(`  ${t.id}: 角色=[${t.references.join(', ')}]`);
});
