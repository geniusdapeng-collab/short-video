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

// 加载定妆照
function loadPortraits() {
  const portraits = {
    characters: {},
    product: null
  };
  
  // 饕餮定妆照
  const taotieDir = '/root/.openclaw/workspace/short-video-system/characters/taotie/portraits';
  if (fs.existsSync(taotieDir)) {
    const taotieFiles = fs.readdirSync(taotieDir).filter(f => f.endsWith('.png'));
    if (taotieFiles.length > 0) {
      const taotiePortrait = taotieFiles.find(f => f.includes('face_closeup')) || taotieFiles[0];
      portraits.characters.taotie = imageToBase64(path.join(taotieDir, taotiePortrait));
      console.log('✅ 饕餮定妆照:', taotiePortrait);
    }
  }
  
  // 小G定妆照
  const xiaoGDir = '/root/.openclaw/workspace/short-video-system/characters/xiaoG/portraits';
  if (fs.existsSync(xiaoGDir)) {
    const xiaoGFiles = fs.readdirSync(xiaoGDir).filter(f => f.endsWith('.png'));
    if (xiaoGFiles.length > 0) {
      const xiaoGPortrait = xiaoGFiles.find(f => f.includes('closeup')) || xiaoGFiles[0];
      portraits.characters.xiaoG = imageToBase64(path.join(xiaoGDir, xiaoGPortrait));
      console.log('✅ 小G定妆照:', xiaoGPortrait);
    }
  }
  
  // 商品定妆照
  const productDir = '/root/.openclaw/workspace/short-video-system/products/千问ai智能眼镜/portraits';
  if (fs.existsSync(productDir)) {
    const productFiles = fs.readdirSync(productDir).filter(f => f.endsWith('.png'));
    if (productFiles.length > 0) {
      portraits.product = imageToBase64(path.join(productDir, productFiles[0]));
      console.log('✅ 商品定妆照:', productFiles[0]);
    }
  }
  
  return portraits;
}

// 提交任务（支持首尾帧）
async function submitTask(prompt, shotId, duration, portraits, options = {}) {
  const { firstFrame, lastFrame } = options;
  
  // 构建content数组
  const content = [{ type: 'text', text: prompt }];
  
  // 添加角色定妆照
  if (portraits.characters.taotie) {
    content.push({
      type: 'image_url',
      image_url: { url: portraits.characters.taotie },
      role: 'reference_image'
    });
  }
  if (portraits.characters.xiaoG) {
    content.push({
      type: 'image_url',
      image_url: { url: portraits.characters.xiaoG },
      role: 'reference_image'
    });
  }
  
  // 添加商品定妆照（带强约束）
  if (portraits.product) {
    content.push({
      type: 'image_url',
      image_url: { url: portraits.product },
      role: 'reference_image'
    });
  }
  
  // 修改prompt，增加商品强约束
  if (portraits.product) {
    // 在商品植入部分增加强约束前缀
    prompt = prompt.replace(
      '【商品植入】千问AI智能眼镜',
      '【商品植入】千问AI智能眼镜（⚠️ 外观必须与参考图完全一致，禁止修改镜框形状、颜色、Logo位置、镜片效果）'
    );
  }
  
  // 更新content中的文本
  content[0] = { type: 'text', text: prompt };
  
  // 添加首帧（first_frame）
  if (firstFrame) {
    content.push({
      type: 'image_url',
      image_url: { url: firstFrame },
      role: 'first_frame'
    });
  }
  
  // 添加尾帧（last_frame）
  if (lastFrame) {
    content.push({
      type: 'image_url',
      image_url: { url: lastFrame },
      role: 'last_frame'
    });
  }
  
  const body = {
    model: endpoint,
    content: content,
    width: 1080,
    height: 1920,
    seconds: String(duration),  // Seedance 2.0使用seconds参数
    ratio: '9:16',
    generate_audio: true
  };
  
  console.log(`\n🎬 Submitting ${shotId}...`);
  console.log(`  Content items: ${content.length} (text + ${content.length - 1} images)`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  First frame: ${firstFrame ? 'YES' : 'NO'}`);
  console.log(`  Last frame: ${lastFrame ? 'YES' : 'NO'}`);
  
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
    console.log(`  ❌ ${shotId} failed:`, result.error.message || result.error);
    return { success: false, error: result.error };
  }
  
  const taskId = result.id || result.task_id;
  console.log(`  ✅ ${shotId} submitted: ${taskId}`);
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
  // 读取prompts
  const prompts = {
    S01: readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S01-prompt.md'),
    S02: readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S02-prompt.md'),
    S03: readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S03-prompt.md')
  };
  
  // 加载定妆照
  const portraits = loadPortraits();
  
  console.log('\n=== 定妆照加载完成 ===');
  console.log('角色:', Object.keys(portraits.characters).join(', ') || '无');
  console.log('商品:', portraits.product ? '有' : '无');
  
  // 提交所有镜头（先不启用首尾帧，验证基础功能）
  console.log('\n=== 提交渲染任务 ===');
  
  const r1 = await submitTask(prompts.S01, 'S01', 3, portraits);
  if (!r1.success) {
    console.log('S01 failed, retrying without seconds...');
    // 如果失败，尝试不带seconds参数
    const r1Retry = await submitTask(prompts.S01, 'S01', 3, portraits);
    if (!r1Retry.success) return;
  }
  
  const r2 = await submitTask(prompts.S02, 'S02', 7, portraits);
  const r3 = await submitTask(prompts.S03, 'S03', 5, portraits);
  
  // 保存任务ID
  const tasks = {
    project: 'taotie-qwen-glasses-v2',
    submittedAt: new Date().toISOString(),
    apiVersion: 'seedance-2.0-content-array',
    features: {
      characterPortraits: Object.keys(portraits.characters),
      productPortrait: !!portraits.product,
      firstFrame: false,
      lastFrame: false
    },
    tasks: [
      { shotId: 'S01', duration: 3, taskId: r1.taskId, status: 'submitted' },
      { shotId: 'S02', duration: 7, taskId: r2.taskId, status: 'submitted' },
      { shotId: 'S03', duration: 5, taskId: r3.taskId, status: 'submitted' }
    ]
  };
  
  fs.writeFileSync(
    '/root/.openclaw/workspace/short-video-system/output/render-tasks-v2.json',
    JSON.stringify(tasks, null, 2)
  );
  
  console.log('\n=== 全部提交完成 ===');
  console.log('S01:', r1.taskId);
  console.log('S02:', r2.taskId);
  console.log('S03:', r3.taskId);
  
  // 等待并检查状态
  console.log('\n⏳ 等待30秒后检查状态...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  for (const t of tasks.tasks) {
    const status = await checkTaskStatus(t.taskId);
    console.log(`${t.shotId}: ${status.status || 'unknown'}`);
    if (status.content?.video_url) {
      console.log(`  Video URL: ${status.content.video_url}`);
    }
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
});
