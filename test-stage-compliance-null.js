const { NirathMasterPipeline } = require('./systems/nirath-master-pipeline.js');
const fs = require('fs');

async function testStageComplianceWithNull() {
  const data = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/output/taotie-ep01-preproduction-2026-06-12T02-21-09-217Z.json', 'utf8'));
  const renderResults = data.stages.render;
  
  // 插入 null 元素
  renderResults.splice(2, 0, null);
  
  const storyboard = { shots: renderResults.map(r => r && ({ id: r.id, prompt: r.prompt, isOpening: r.isOpening })) };
  
  console.log('renderResults length:', renderResults.length);
  
  const pipeline = new NirathMasterPipeline({ mode: 'nirath' });
  
  console.log('Testing stageCompliance with null element...');
  const start = Date.now();
  try {
    const result = await pipeline.stageCompliance(renderResults, storyboard);
    const end = Date.now();
    console.log('stageCompliance completed in', end - start, 'ms');
  } catch (e) {
    const end = Date.now();
    console.log('stageCompliance failed in', end - start, 'ms');
    console.log('Error:', e.message);
    console.log('Stack:', e.stack);
  }
}

testStageComplianceWithNull().catch(console.error);
