const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf-8'));
const apiKey = config.apiKey;
const endpoint = config.models['seedance-2-0'].customEndpointId;
const baseUrl = 'https://' + config.baseUrl + '/api/v3/contents/generations/tasks';

function readPromptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/```\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : content;
}

function imageToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  return 'data:image/png;base64,' + data.toString('base64');
}

async function submitTask(prompt, shotId, duration, includeProduct) {
  const content = [{ type: 'text', text: prompt }];
  
  // 添加角色定妆照
  const taotieDir = '/root/.openclaw/workspace/short-video-system/characters/taotie/portraits';
  const taotieFiles = fs.readdirSync(taotieDir).filter(f => f.endsWith('.png'));
  const taotiePortrait = taotieFiles.find(f => f.includes('face_closeup')) || taotieFiles[0];
  content.push({
    type: 'image_url',
    image_url: { url: imageToBase64(taotieDir + '/' + taotiePortrait) },
    role: 'reference_image'
  });
  
  const xiaoGDir = '/root/.openclaw/workspace/short-video-system/characters/xiaoG/portraits';
  const xiaoGFiles = fs.readdirSync(xiaoGDir).filter(f => f.endsWith('.png'));
  const xiaoGPortrait = xiaoGFiles.find(f => f.includes('closeup')) || xiaoGFiles[0];
  content.push({
    type: 'image_url',
    image_url: { url: imageToBase64(xiaoGDir + '/' + xiaoGPortrait) },
    role: 'reference_image'
  });
  
  // S01包含商品，S03不包含（避免版权）
  if (includeProduct) {
    const productDir = '/root/.openclaw/workspace/short-video-system/products/千问ai智能眼镜/portraits';
    const productFiles = fs.readdirSync(productDir).filter(f => f.endsWith('.png'));
    content.push({
      type: 'image_url',
      image_url: { url: imageToBase64(productDir + '/' + productFiles[0]) },
      role: 'reference_image'
    });
  }
  
  const body = {
    model: endpoint,
    content: content,
    width: 1080,
    height: 1920,
    seconds: String(duration),
    ratio: '9:16',
    generate_audio: true
  };
  
  console.log('\n🎬 Submitting ' + shotId + '...');
  console.log('  Content items: ' + content.length + ' (text + ' + (content.length-1) + ' images)');
  console.log('  Product: ' + (includeProduct ? 'YES' : 'NO'));
  
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const result = await response.json();
  
  if (result.error) {
    console.log('  ❌ ' + shotId + ' failed:', result.error.message || result.error);
    return { success: false, error: result.error };
  }
  
  const taskId = result.id || result.task_id;
  console.log('  ✅ ' + shotId + ' submitted: ' + taskId);
  return { success: true, taskId };
}

async function main() {
  // 读取最新prompts
  const s01Prompt = readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S01-prompt.md');
  const s03Prompt = readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S03-prompt.md');
  
  console.log('=== 重新提交 S01 + S03（最新版）===');
  
  // 提交S01（包含商品）
  const r1 = await submitTask(s01Prompt, 'S01-v4', 3, true);
  
  // 提交S03（不包含商品，避免版权）
  const r3 = await submitTask(s03Prompt, 'S03-v4', 5, false);
  
  console.log('\n=== 提交完成 ===');
  if (r1.success) console.log('S01-v4:', r1.taskId);
  if (r3.success) console.log('S03-v4:', r3.taskId);
  
  // 保存任务
  const tasks = {
    project: 'taotie-qwen-glasses-v4',
    submittedAt: new Date().toISOString(),
    tasks: [
      { shotId: 'S01-v4', duration: 3, taskId: r1.taskId, status: 'submitted', product: true },
      { shotId: 'S03-v4', duration: 5, taskId: r3.taskId, status: 'submitted', product: false }
    ]
  };
  
  fs.writeFileSync(
    '/root/.openclaw/workspace/short-video-system/output/render-tasks-v4.json',
    JSON.stringify(tasks, null, 2)
  );
}

main().catch(e => {
  console.error('Error:', e.message);
});
