const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf-8'));
const apiKey = config.apiKey;
const endpoint = config.models['seedance-2-0'].customEndpointId;
const baseUrl = 'https://' + config.baseUrl + '/api/v3/contents/generations/tasks';

/**
 * 串行渲染引擎
 * 按镜头顺序逐个渲染，前一镜头完成后提取尾帧作为下一镜头的first_frame
 */
class SequentialRenderEngine {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '/root/.openclaw/workspace/short-video-system/output/videos';
    this.framesDir = options.framesDir || '/root/.openclaw/workspace/short-video-system/output/frames';
    this.portraitsDir = options.portraitsDir || '/root/.openclaw/workspace/short-video-system/characters';
    this.productDir = options.productDir || '/root/.openclaw/workspace/short-video-system/products';
    
    // 确保目录存在
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    if (!fs.existsSync(this.framesDir)) fs.mkdirSync(this.framesDir, { recursive: true });
  }

  // 读取prompt文件
  readPromptFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/```\n([\s\S]*?)\n```/);
    return match ? match[1].trim() : content;
  }

  // 图片转base64
  imageToBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return 'data:image/png;base64,' + data.toString('base64');
  }

  // 加载角色定妆照
  loadCharacterPortraits() {
    const portraits = {};
    
    // 饕餮定妆照
    const taotieDir = path.join(this.portraitsDir, 'taotie/portraits');
    if (fs.existsSync(taotieDir)) {
      const files = fs.readdirSync(taotieDir).filter(f => f.endsWith('.png'));
      if (files.length > 0) {
        const portrait = files.find(f => f.includes('face_closeup')) || files[0];
        portraits.taotie = this.imageToBase64(path.join(taotieDir, portrait));
      }
    }
    
    // 小G定妆照
    const xiaoGDir = path.join(this.portraitsDir, 'xiaoG/portraits');
    if (fs.existsSync(xiaoGDir)) {
      const files = fs.readdirSync(xiaoGDir).filter(f => f.endsWith('.png'));
      if (files.length > 0) {
        const portrait = files.find(f => f.includes('closeup')) || files[0];
        portraits.xiaoG = this.imageToBase64(path.join(xiaoGDir, portrait));
      }
    }
    
    return portraits;
  }

  // 加载商品定妆照
  loadProductPortrait(productId) {
    const productDir = path.join(this.productDir, productId, 'portraits');
    if (fs.existsSync(productDir)) {
      const files = fs.readdirSync(productDir).filter(f => f.endsWith('.png'));
      if (files.length > 0) {
        return this.imageToBase64(path.join(productDir, files[0]));
      }
    }
    return null;
  }

  // 提交渲染任务（支持first_frame）
  async submitTask(prompt, shotId, duration, portraits, productImage, firstFrame) {
    const content = [{ type: 'text', text: prompt }];
    
    // 添加角色定妆照
    if (portraits.taotie) {
      content.push({ type: 'image_url', image_url: { url: portraits.taotie }, role: 'reference_image' });
    }
    if (portraits.xiaoG) {
      content.push({ type: 'image_url', image_url: { url: portraits.xiaoG }, role: 'reference_image' });
    }
    
    // 添加商品定妆照（S03不包含，避免版权）
    if (productImage && !shotId.includes('S03')) {
      content.push({ type: 'image_url', image_url: { url: productImage }, role: 'reference_image' });
    }
    
    // 添加首帧（前一镜头的尾帧）
    if (firstFrame) {
      content.push({ type: 'image_url', image_url: { url: firstFrame }, role: 'first_frame' });
      console.log(`  🔗 添加首帧: 前一镜头尾帧`);
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
    
    console.log(`\n🎬 提交 ${shotId}...`);
    console.log(`  内容项: ${content.length} (文本 + ${content.length - 1} 图片)`);
    console.log(`  时长: ${duration}s`);
    console.log(`  首帧: ${firstFrame ? '✅' : '❌'}`);
    
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
      console.log(`  ❌ ${shotId} 失败:`, result.error.message || result.error);
      return { success: false, error: result.error };
    }
    
    const taskId = result.id || result.task_id;
    console.log(`  ✅ ${shotId} 已提交: ${taskId}`);
    return { success: true, taskId };
  }

  // 查询任务状态
  async checkTaskStatus(taskId) {
    const response = await fetch(baseUrl + '/' + taskId, {
      headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    return await response.json();
  }

  // 下载视频
  async downloadVideo(url, outputPath) {
    console.log(`  📥 下载视频...`);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`  ✅ 已保存: ${outputPath}`);
    return outputPath;
  }

  // 提取尾帧（最后一帧）
  extractLastFrame(videoPath, outputFramePath) {
    console.log(`  🎬 提取尾帧...`);
    
    // 使用ffmpeg提取最后一帧（倒数第2帧，避免黑帧）
    const cmd = `ffmpeg -i "${videoPath}" -sseof -0.1 -vframes 1 "${outputFramePath}" -y 2>/dev/null`;
    execSync(cmd);
    
    console.log(`  ✅ 尾帧已提取: ${outputFramePath}`);
    return outputFramePath;
  }

  // 将帧转为base64
  frameToBase64(framePath) {
    const data = fs.readFileSync(framePath);
    return 'data:image/png;base64,' + data.toString('base64');
  }

  // 等待任务完成
  async waitForCompletion(taskId, shotId) {
    console.log(`\n⏳ 等待 ${shotId} 渲染完成...`);
    let attempts = 0;
    const maxAttempts = 60; // 最多等待10分钟
    
    while (attempts < maxAttempts) {
      const status = await this.checkTaskStatus(taskId);
      
      if (status.status === 'succeeded') {
        console.log(`  ✅ ${shotId} 渲染完成！`);
        return { success: true, videoUrl: status.content?.video_url };
      } else if (status.status === 'failed') {
        console.log(`  ❌ ${shotId} 渲染失败:`, status.error?.message || status.error);
        return { success: false, error: status.error };
      }
      
      attempts++;
      process.stdout.write(`  ⏳ 等待中... (${attempts}/${maxAttempts})\r`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // 每10秒检查一次
    }
    
    console.log(`\n  ❌ ${shotId} 超时`);
    return { success: false, error: 'timeout' };
  }

  // 串行渲染主流程
  async renderSequential(shots, projectName) {
    console.log(`\n🎬🔥 串行渲染引擎启动`);
    console.log(`项目: ${projectName}`);
    console.log(`镜头数: ${shots.length}`);
    console.log(`模式: 首尾帧连续渲染\n`);
    
    const results = [];
    let lastFrameBase64 = null; // 上一镜头的尾帧
    
    // 加载定妆照
    const characterPortraits = this.loadCharacterPortraits();
    const productImage = this.loadProductPortrait('千问ai智能眼镜');
    
    console.log('=== 定妆照加载 ===');
    console.log('角色:', Object.keys(characterPortraits).join(', '));
    console.log('商品:', productImage ? '✅' : '❌');
    
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🎬 镜头 ${i + 1}/${shots.length}: ${shot.shotId}`);
      console.log(`${'='.repeat(50)}`);
      
      // 1. 提交渲染（带首帧）
      const submitResult = await this.submitTask(
        shot.prompt,
        shot.shotId,
        shot.duration,
        characterPortraits,
        productImage,
        lastFrameBase64 // 上一镜头的尾帧作为首帧
      );
      
      if (!submitResult.success) {
        console.log(`\n❌ ${shot.shotId} 提交失败，停止串行渲染`);
        break;
      }
      
      // 2. 等待渲染完成
      const renderResult = await this.waitForCompletion(submitResult.taskId, shot.shotId);
      
      if (!renderResult.success) {
        console.log(`\n❌ ${shot.shotId} 渲染失败，停止串行渲染`);
        break;
      }
      
      // 3. 下载视频
      const videoPath = path.join(this.outputDir, `${shot.shotId}-${projectName}.mp4`);
      await this.downloadVideo(renderResult.videoUrl, videoPath);
      
      // 4. 提取尾帧
      const framePath = path.join(this.framesDir, `${shot.shotId}-last-frame.png`);
      this.extractLastFrame(videoPath, framePath);
      
      // 5. 转为base64，作为下一镜头的首帧
      lastFrameBase64 = this.frameToBase64(framePath);
      
      results.push({
        shotId: shot.shotId,
        taskId: submitResult.taskId,
        videoPath,
        framePath,
        hasFirstFrame: i > 0, // 第一个镜头没有首帧
        hasLastFrame: true
      });
      
      console.log(`\n✅ ${shot.shotId} 完成！尾帧已提取，准备下一镜头...`);
    }
    
    // 保存渲染报告
    const report = {
      project: projectName,
      renderedAt: new Date().toISOString(),
      totalShots: shots.length,
      completedShots: results.length,
      sequential: true,
      firstFrameEnabled: true,
      results
    };
    
    fs.writeFileSync(
      path.join(this.outputDir, `sequential-render-report-${projectName}.json`),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎉 串行渲染完成！`);
    console.log(`完成镜头: ${results.length}/${shots.length}`);
    console.log(`首尾帧: ✅ 启用`);
    console.log(`报告已保存: sequential-render-report-${projectName}.json`);
    console.log(`${'='.repeat(50)}`);
    
    return results;
  }
}

// 导出
module.exports = { SequentialRenderEngine };

// 如果直接运行，执行测试
if (require.main === module) {
  async function test() {
    const engine = new SequentialRenderEngine();
    
    // 定义镜头序列
    const shots = [
      {
        shotId: 'S01',
        duration: 3,
        prompt: engine.readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S01-prompt.md')
      },
      {
        shotId: 'S02',
        duration: 7,
        prompt: engine.readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S02-prompt.md')
      },
      {
        shotId: 'S03',
        duration: 5,
        prompt: engine.readPromptFile('/root/.openclaw/workspace/short-video-system/output/prompts/S03-prompt.md')
      }
    ];
    
    await engine.renderSequential(shots, 'taotie-qwen-glasses-sequential');
  }
  
  test().catch(e => {
    console.error('Error:', e.message);
    console.error(e.stack);
  });
}
