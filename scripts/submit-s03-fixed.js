const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf-8'));
const apiKey = config.apiKey;
const endpoint = config.models['seedance-2-0'].customEndpointId;
const baseUrl = 'https://' + config.baseUrl + config.endpoints.video;

// 读取prompt文件
function readPromptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/```\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : content;
}

// 图片转base64
function imageToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  return 'data:image/png;base64,' + data.toString('base64');
}

// 加载角色定妆照（不包含商品，避免版权）
function loadCharacterPortraits() {
  const portraits = {};
  
  // 饕餮定妆照
  const taotieDir = '/root/.openclaw/workspace/short-video-system/characters/taotie/portraits';
  if (fs.existsSync(taotieDir)) {
    const taotieFiles = fs.readdirSync(taotieDir).filter(f => f.endsWith('.png'));
    if (taotieFiles.length > 0) {
      const taotiePortrait = taotieFiles.find(f => f.includes('face_closeup')) || taotieFiles[0];
      portraits.taotie = imageToBase64(path.join(taotieDir, taotiePortrait));
      console.log('✅ 饕餮定妆照:', taotiePortrait);
    }
  }
  
  // 小G定妆照
  const xiaoGDir = '/root/.openclaw/workspace/short-video-system/characters/xiaoG/portraits';
  if (fs.existsSync(xiaoGDir)) {
    const xiaoGFiles = fs.readdirSync(xiaoGDir).filter(f => f.endsWith('.png'));
    if (xiaoGFiles.length > 0) {
      const xiaoGPortrait = xiaoGFiles.find(f => f.includes('closeup')) || xiaoGFiles[0];
      portraits.xiaoG = imageToBase64(path.join(xiaoGDir, xiaoGPortrait));
      console.log('✅ 小G定妆照:', xiaoGPortrait);
    }
  }
  
  return portraits;
}

// 提交S03（不包含商品定妆照，避免版权）
async function submitS03(prompt, duration, portraits) {
  // 构建content数组（仅角色，无商品）
  const content = [{ type: 'text', text: prompt }];
  
  // 添加角色定妆照
  if (portraits.taotie) {
    content.push({
      type: 'image_url',
      image_url: { url: portraits.taotie },
      role: 'reference_image'
    });
  }
  if (portraits.xiaoG) {
    content.push({
      type: 'image_url',
      image_url: { url: portraits.xiaoG },
      role: 'reference_image'
    });
  }
  
  // 注意：不包含商品定妆照，避免版权限制
  
  const body = {
    model: endpoint,
    content: content,
    width: 1080,
    height: 1920,
    seconds: String(duration),
    ratio: '9:16',
    generate_audio: true
  };
  
  console.log(`\n🎬 Submitting S03-v3-fixed...`);
  console.log(`  Content items: ${content.length} (text + ${content.length - 1} images)`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Product image: NO (to avoid copyright)`);
  
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
    console.log(`  ❌ S03 failed:`, result.error.message || result.error);
    return { success: false, error: result.error };
  }
  
  const taskId = result.id || result.task_id;
  console.log(`  ✅ S03 submitted: ${taskId}`);
  return { success: true, taskId };
}

// 查询任务状态
async function checkTaskStatus(taskId) {
  const response = await fetch(baseUrl + '/' + taskId, {
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  const result = await response.json();
  return result;
}

// 主流程
async function main() {
  // 读取S03 prompt（使用修改版，减少商品占比）
  const prompt = readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S03-prompt.md');
  
  // 加载角色定妆照
  const portraits = loadCharacterPortraits();
  
  console.log('\n=== 定妆照加载完成（仅角色） ===');
  console.log('角色:', Object.keys(portraits).join(', ') || '无');
  console.log('商品: 无（避免版权限制）');
  
  // 提交S03（不带商品定妆照）
  const r3 = await submitS03(prompt, 5, portraits);
  
  if (!r3.success) {
    console.log('S03 submission failed');
    return;
  }
  
  // 保存任务ID
  const tasks = {
    project: 'taotie-qwen-glasses-v3-s03-fixed',
    submittedAt: new Date().toISOString(),
    note: 'S03 without product image to avoid copyright restriction',
    tasks: [
      { shotId: 'S03', duration: 5, taskId: r3.taskId, status: 'submitted' }
    ]
  };
  
  fs.writeFileSync(
    '/root/.openclaw/workspace/short-video-system/output/render-tasks-v3-s03-fixed.json',
    JSON.stringify(tasks, null, 2)
  );
  
  console.log('\n=== S03提交完成 ===');
  console.log('Task ID:', r3.taskId);
  
  // 等待并检查状态
  console.log('\n⏳ 等待30秒后检查状态...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const status = await checkTaskStatus(r3.taskId);
  console.log('S03:', status.status || 'unknown');
  if (status.content?.video_url) {
    console.log('  Video URL:', status.content.video_url);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
});
