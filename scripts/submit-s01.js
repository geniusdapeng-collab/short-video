const fs = require('fs');

const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf-8'));
const apiKey = config.apiKey;
const endpoint = config.models['seedance-2-0'].customEndpointId;
const baseUrl = 'https://' + config.baseUrl + config.endpoints.video;

const prompt = fs.readFileSync('/root/.openclaw/workspace/short-video-system/output/prompts/S01-prompt.md', 'utf-8');
const match = prompt.match(/```\n([\s\S]*?)\n```/);
const cleanPrompt = match ? match[1].trim() : prompt;

function imageToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  return 'data:image/png;base64,' + data.toString('base64');
}

const referenceImages = [
  imageToBase64('/root/.openclaw/workspace/short-video-system/products/千问ai智能眼镜/portraits/closeup.png')
];

async function submitTask() {
  const body = {
    model: endpoint,
    content: [{ type: 'text', text: cleanPrompt }],
    width: 1080,
    height: 1920,
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
  console.log('S01 retry result:', result.id || result.task_id || JSON.stringify(result).substring(0, 200));
  return result;
}

submitTask().catch(e => console.error('Error:', e.message));
