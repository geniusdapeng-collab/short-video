const fs = require('fs');
const path = require('path');

const { PipelineIntegrityValidator } = require('./systems/pipeline-integrity-validator.js');

async function test() {
  const resultPath = path.join(__dirname, 'output/health-edu-ep01-v664/preproduction-result.json');
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
  
  // 构建 stages 对象
  const stages = {
    prd: result.prd,
    characters: result.characters,
    script: result.script,
    storyboard: result.storyboard,
    camera: result.cameraMovements,
    render: result.prompts,
    style: result.prompts,
    postProduction: result.postProduction,
    alignment: result.validation?.alignment,
    schema: result.validation?.schema,
    storyboardValidation: result.validation?.storyboard,
    compliance: result.validation?.compliance,
    preRender: result.validation?.preRender,
    integrityValidation: result.validation?.integrity
  };
  
  const validator = new PipelineIntegrityValidator({ mode: 'generic' });
  const validation = await validator.validatePipeline(stages);
  
  console.log('Validation Result:');
  console.log('  Valid:', validation.valid);
  console.log('  Total checks:', validation.summary?.totalChecks);
  console.log('  Passed:', validation.summary?.passed);
  console.log('  Errors:', validation.summary?.errorCount);
  console.log('  Warnings:', validation.summary?.warningCount);
  
  if (!validation.valid) {
    console.log('\nFailed checks:');
    for (const check of validation.checks.filter(c => !c.passed)) {
      console.log(`  ❌ ${check.stage}: ${check.name}`);
      for (const detail of check.details) {
        console.log(`      → ${detail}`);
      }
    }
  }
}

test().catch(console.error);
