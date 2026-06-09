const fs = require('fs');
const path = require('path');

// Read API config
const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf-8'));
const apiKey = config.apiKey;
const endpoint = config.models['seedance-2-0'].customEndpointId;
const baseUrl = 'https://' + config.baseUrl + config.endpoints.video;

// Read prompts from files
function readPromptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Extract the prompt between ``` and ```
  const match = content.match(/```\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : content;
}

const prompts = {
  S01: readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S01-prompt.md'),
  S02: readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S02-prompt.md'),
  S03: readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S03-prompt.md')
};

// Convert images to base64
function imageToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  return 'data:image/png;base64,' + data.toString('base64');
}

const referenceImages = [
  imageToBase64('/root/.openclaw/workspace/short-video-system/products/千问ai智能眼镜/portraits/closeup.png')
];

console.log('API Endpoint:', endpoint);
console.log('Base URL:', baseUrl);
console.log('S01 Prompt length:', prompts.S01.length);
console.log('S02 Prompt length:', prompts.S02.length);
console.log('S03 Prompt length:', prompts.S03.length);
console.log('Reference images:', referenceImages.length);

// Submit task
async function submitTask(prompt, shotId, duration) {
  const body = {
    model: endpoint,
    content: [{ type: 'text', text: prompt }],
    width: 1080,
    height: 1920,
    duration: duration,
    ratio: '9:16',
    reference_images: referenceImages.map(img => ({ image: img, weight: 0.8 }))
  };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  console.log(shotId + ' submitted:', result.id || result.task_id || JSON.stringify(result).substring(0, 200));
  return result;
}

(async () => {
  try {
    console.log('\n🎬 Submitting S01 (3s)...');
    const r1 = await submitTask(prompts.S01, 'S01', 3);
    
    console.log('\n🎬 Submitting S02 (7s)...');
    const r2 = await submitTask(prompts.S02, 'S02', 7);
    
    console.log('\n🎬 Submitting S03 (5s)...');
    const r3 = await submitTask(prompts.S03, 'S03', 5);
    
    console.log('\n✅ All 3 tasks submitted!');
    console.log('S01:', r1.id || r1.task_id);
    console.log('S02:', r2.id || r2.task_id);
    console.log('S03:', r3.id || r3.task_id);
    
    // Save task IDs
    const tasks = {
      project: 'taotie-qwen-glasses',
      submittedAt: new Date().toISOString(),
      tasks: [
        { shotId: 'S01', duration: 3, taskId: r1.id || r1.task_id },
        { shotId: 'S02', duration: 7, taskId: r2.id || r2.task_id },
        { shotId: 'S03', duration: 5, taskId: r3.id || r3.task_id }
      ]
    };
    fs.writeFileSync('/root/.openclaw/workspace/short-video-system/output/render-tasks.json', JSON.stringify(tasks, null, 2));
    console.log('\nTask IDs saved to /root/.openclaw/workspace/short-video-system/output/render-tasks.json');
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
})();
