const fs = require('fs');

console.log('🔧 Fix script started');

// Fix 1: Replace slimPipelineResult function in nirath-master-pipeline.js
const pipelinePath = '/root/.openclaw/workspace/systems/nirath-master-pipeline.js';
const pipelineContent = fs.readFileSync(pipelinePath, 'utf-8');

// Find all promptText occurrences
const lines = pipelineContent.split('\n');
const promptTextLines = lines.filter(line => line.includes('promptText'));
console.log('Found promptText occurrences:');
promptTextLines.forEach((line, index) => {
  console.log(`  ${index + 1}: ${line.trim()}`);
});

// Find the old function
const oldFunctionStart = pipelineContent.indexOf('function slimPipelineResult(result) {');
if (oldFunctionStart === -1) {
  console.error('❌ Old function not found');
  process.exit(1);
}

// Find the end of the function
let braceCount = 1;
let i = oldFunctionStart + 'function slimPipelineResult(result) {'.length;
while (i < pipelineContent.length && braceCount > 0) {
  if (pipelineContent[i] === '{') braceCount++;
  else if (pipelineContent[i] === '}') braceCount--;
  i++;
}

const oldFunction = pipelineContent.substring(oldFunctionStart, i);
console.log(`Found old function: ${oldFunction.length} characters`);

const newFunction = `function slimPipelineResult(result) {
  const stages = result?.stages || {};
  const prompts = stages.output?.prompts || [];
  const storyboardShots = stages.storyboard?.shots || [];

  const getPrompt = (p) => {
    if (!p || typeof p !== 'object') return '';
    return p.prompt || p.text || p.content || p.visualPrompt || p.description || '';
  };

  const getLength = (p) => {
    if (p && p.length) return p.length;
    const text = getPrompt(p);
    return text ? text.length : 0;
  };

  return {
    success: result?.success ?? false,
    errors: result?.errors || [],
    integrityReport: result?.integrityReport || null,
    stages: {
      output: {
        prompts: prompts.map(p => ({
          shotId: p?.shotId,
          scene: p?.scene,
          type: p?.type,
          duration: p?.duration,
          prompt: getPrompt(p),
          length: getLength(p),
          lengthStatus: getPromptLengthStatus(getLength(p)),
          utilization: p?.utilization,
          utilizationStatus: p?.utilizationStatus,
          qualityScore: p?.qualityScore,
          characters: p?.characters,
          mouthAction: p?.mouthAction,
          referenceImages: Array.isArray(p?.referenceImages)
            ? p.referenceImages.map(r => ({ shotType: r?.shotType || r?.type || 'unknown' }))
            : []
        }))
      },
      storyboard: {
        shots: storyboardShots.map(s => ({
          id: s?.id,
          scene: s?.scene,
          type: s?.type,
          duration: s?.duration,
          timeline: s?._timeline || s?.cameraMovement?.timeline || null
        }))
      },
      stageList: Object.keys(stages)
    }
  };
}`;

const newPipelineContent = pipelineContent.replace(oldFunction, newFunction);
if (newPipelineContent === pipelineContent) {
  console.error('❌ Replacement failed - old function not found');
  process.exit(1);
}

fs.writeFileSync(pipelinePath, newPipelineContent);
console.log('✅ slimPipelineResult function replaced');

// Fix 2: Update package.json to add --expose-gc and --max-old-space-size
const packagePath = '/root/.openclaw/workspace/package.json';
const packageContent = fs.readFileSync(packagePath, 'utf-8');
const packageJson = JSON.parse(packageContent);

if (packageJson.scripts && packageJson.scripts.preproduction) {
  const oldScript = packageJson.scripts.preproduction;
  if (!oldScript.includes('--expose-gc')) {
    packageJson.scripts.preproduction = oldScript.replace('node ', 'node --expose-gc --max-old-space-size=2048 ');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated: added --expose-gc and --max-old-space-size=2048');
  } else {
    console.log('ℹ️ package.json already has --expose-gc');
  }
} else {
  console.error('❌ preproduction script not found in package.json');
}

console.log('Done!');
