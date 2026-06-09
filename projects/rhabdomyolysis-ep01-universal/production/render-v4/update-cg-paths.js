const fs = require('fs').promises;
const fss = require('fs');

const renderDir = '/root/.openclaw/workspace/projects/rhabdomyolysis-ep01-universal/production/render-v4';
const tasks = JSON.parse(fss.readFileSync(renderDir + '/render-tasks.json', 'utf8'));

// 新CG定妆照路径映射
const cgPaths = {
  'chen-nurse': {
    front: '/root/.openclaw/workspace/characters/chen-nurse/portraits/chen-cg-v1-front.png',
    threeQuarter: '/root/.openclaw/workspace/characters/chen-nurse/portraits/chen-nurse-cg-v1-threeQuarter.png',
    closeup: '/root/.openclaw/workspace/characters/chen-nurse/portraits/chen-nurse-cg-v1-closeup.png'
  },
  'xiaoG': {
    front: '/root/.openclaw/workspace/characters/xiaoG/portraits/xiaoG-cg-v1-front.png',
    threeQuarter: '/root/.openclaw/workspace/characters/xiaoG/portraits/xiaoG-cg-v1-threeQuarter.png',
    closeup: '/root/.openclaw/workspace/characters/xiaoG/portraits/xiaoG-cg-v1-closeup.png'
  },
  'coach-li': {
    front: '/root/.openclaw/workspace/characters/coach-li/portraits/coach-cg-v1-front.png',
    threeQuarter: '/root/.openclaw/workspace/characters/coach-li/portraits/coach-li-cg-v1-threeQuarter.png',
    closeup: '/root/.openclaw/workspace/characters/coach-li/portraits/coach-li-cg-v1-closeup.png'
  }
};

// 旧路径到新路径的映射
const pathMapping = {
  '/root/.openclaw/workspace/characters/chen-nurse/portraits/chen-police-v1-front.png': cgPaths['chen-nurse'].front,
  '/root/.openclaw/workspace/characters/chen-nurse/portraits/chen-police-v1-threeQuarter.png': cgPaths['chen-nurse'].threeQuarter,
  '/root/.openclaw/workspace/characters/chen-nurse/portraits/chen-police-v1-closeup.png': cgPaths['chen-nurse'].closeup,
  '/root/.openclaw/workspace/characters/xiaoG/portraits/xiaoG-v8-production-front.png': cgPaths['xiaoG'].front,
  '/root/.openclaw/workspace/characters/xiaoG/portraits/xiaoG-v8-production-threeQuarter.png': cgPaths['xiaoG'].threeQuarter,
  '/root/.openclaw/workspace/characters/xiaoG/portraits/xiaoG-v8-production-closeup.png': cgPaths['xiaoG'].closeup,
  '/root/.openclaw/workspace/characters/coach-li/portraits/coach-li-v1-front.png': cgPaths['coach-li'].front,
  '/root/.openclaw/workspace/characters/coach-li/portraits/coach-li-v1-threeQuarter.png': cgPaths['coach-li'].threeQuarter,
  '/root/.openclaw/workspace/characters/coach-li/portraits/coach-li-v1-closeup.png': cgPaths['coach-li'].closeup
};

tasks.forEach(task => {
  if (task.referenceImages) {
    task.referenceImages = task.referenceImages.map(oldPath => {
      const newPath = pathMapping[oldPath];
      if (newPath) {
        console.log(`${task.id}: ${oldPath.split('/').pop()} -> ${newPath.split('/').pop()}`);
        return newPath;
      }
      return oldPath;
    });
  }
});

fss.writeFileSync(renderDir + '/render-tasks-v5.json', JSON.stringify(tasks, null, 2));
console.log('\n✅ 已保存到 render-tasks-v5.json');
