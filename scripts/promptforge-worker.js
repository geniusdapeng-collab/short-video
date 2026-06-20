// scripts/promptforge-worker.js - 单镜头子进程

const fs = require('fs');
const path = require('path');
const { LLMEngine } = require('../systems/llm-reasoning-engine');
const {
  extractBestPrompt,
  sanitizePrompt,
  compressPrompt,
  buildFallbackPrompt,
  removeExistingRenderSection
} = require('./promptforge-utils');

function readShotMeta(promptContent) {
  const sceneMatch = promptContent.match(/\*\*场景\*\*:\s*(.+)/);
  const typeMatch = promptContent.match(/\*\*类型\*\*:\s*(.+)/);
  const visualMatch = promptContent.match(/【视觉】([\s\S]+?)(?=【|$)/);

  return {
    scene: sceneMatch ? sceneMatch[1].trim() : 'unknown',
    type: typeMatch ? typeMatch[1].trim() : 'unknown',
    visualDesc: visualMatch ? visualMatch[1].replace(/\s+/g, ' ').trim().slice(0, 600) : ''
  };
}

function buildOptimizationPrompt({ scene, type, visualDesc }) {
  return `
You are a cinematic prompt optimizer for AI video rendering.

Return exactly ONE final English prompt line.

Rules:
- Output the prompt only.
- No analysis.
- No reasoning.
- No bullet points.
- No labels.
- No quotation marks.
- No character count.
- Keep under 900 characters if possible.
- Include subject, environment, lighting, camera movement, and atmosphere.
- Emphasize Nirath traits: twin suns, bioluminescent ecosystem, low gravity.
- Keep character consistency: xiaoG, taotie if present.
- Avoid anime, cartoon, ink wash, traditional Chinese symbols.

Preferred structure:
Cinematic shot, [subject/action], [Nirath environment], [lighting], [camera], [atmosphere], [quality tags].

Input:
Scene: ${scene}
Type: ${type}
Visual: ${visualDesc}

Output:
`.trim();
}

async function main() {
  const shotFile = process.argv[2];
  if (!shotFile) {
    console.error('Usage: node promptforge-worker.js <shotFile>');
    process.exit(2);
  }

  let engine = null;
  let result = null;
  let raw = '';
  let promptContent = '';
  let meta = null;
  let attempts = 0;
  const maxAttempts = 3; // 网络重试机制

  try {
    promptContent = fs.readFileSync(shotFile, 'utf8');
    meta = readShotMeta(promptContent);
    const optimizationPrompt = buildOptimizationPrompt(meta);

    engine = new LLMEngine({ model: 'kimi-k2p6' });

    const MAX_ATTEMPTS = 3;
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        result = await engine.reasonRaw(optimizationPrompt, {
          maxTokens: 700,
          temperature: 1
        });
        const promptText = extractBestPrompt(result.content || result.reasoning_content || '');
        if (promptText && promptText.length >= 100) {
          attempts = attempt;
          break; // 成功
        }
      } catch (err) {
        lastError = err;
        console.log(`[Worker] 尝试${attempt}失败，${attempt < MAX_ATTEMPTS ? '重试...' : '放弃'}`);
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!result) {
      throw lastError || new Error('全部重试失败');
    }

    // 优先使用content，如果为空则使用reasoning_content
    raw = result.content || result.reasoning_content || '';
    attempts = result.attempt || 1;

    let finalPrompt = compressPrompt(
      sanitizePrompt(extractBestPrompt(raw)),
      990
    );

    // 质量检查：如果缺少主体、太短、有模板占位符、推理文本、或中文占比过高
    const chineseRatio = (finalPrompt.match(/[\u4e00-\u9fa5]/g) || []).length / finalPrompt.length;
    const isBadPrompt = !finalPrompt || finalPrompt.length < 80 || !/\bxiaoG\b/i.test(finalPrompt) || /\[.*?\]/.test(finalPrompt) || /^(The user wants|I need to|I will|Let me)/i.test(finalPrompt) || chineseRatio > 0.3;

    if (isBadPrompt) {
      console.log(`[Worker] ⚠️ 首次提取质量不佳(${finalPrompt.length}字符)，触发二次压缩...`);
      
      // 二次压缩：用更短的Prompt再调一次
      const refinePrompt = `Rewrite this as a single English prompt under 500 characters. Only output the prompt, no analysis:

${raw.slice(0, 800)}

Requirements: Cinematic shot, xiaoG, Nirath alien world, twin suns, bioluminescent flora, low gravity, camera movement, 8k.`;
      
      try {
        const refineResult = await engine.reasonRaw(refinePrompt, {
          maxTokens: 400,
          temperature: 1
        });
        
        const refineRaw = refineResult.content || refineResult.reasoning_content || '';
        const refinedPrompt = compressPrompt(
          sanitizePrompt(extractBestPrompt(refineRaw)),
          990
        );
        
        // 如果二次压缩结果更好，使用它
        const refinedChineseRatio = (refinedPrompt.match(/[\u4e00-\u9fa5]/g) || []).length / refinedPrompt.length;
        const refinedIsBad = !refinedPrompt || refinedPrompt.length < 80 || !/\bxiaoG\b/i.test(refinedPrompt) || /\[.*?\]/.test(refinedPrompt) || /^(The user wants|I need to|I will|Let me)/i.test(refinedPrompt) || refinedChineseRatio > 0.3;
        
        if (!refinedIsBad && refinedPrompt.length > finalPrompt.length) {
          console.log(`[Worker] ✅ 二次压缩成功，从${finalPrompt.length}提升到${refinedPrompt.length}字符`);
          finalPrompt = refinedPrompt;
        } else {
          console.log(`[Worker] ⚠️ 二次压缩未改善，使用fallback`);
          finalPrompt = buildFallbackPrompt(meta);
        }
      } catch (refineErr) {
        console.log(`[Worker] ⚠️ 二次压缩失败: ${refineErr.message}，使用fallback`);
        finalPrompt = buildFallbackPrompt(meta);
      }
    } else {
      console.log(`[Worker] ✅ 首次提取质量合格: ${finalPrompt.length}字符`);
    }

    const cleanContent = removeExistingRenderSection(promptContent);
    const section = `\n\n---\n\n**【精简渲染Prompt】**\n\n\`\`\`\n${finalPrompt}\n\`\`\`\n`;
    fs.writeFileSync(shotFile, cleanContent + section, 'utf8');

    const out = {
      ok: true,
      file: shotFile,
      promptLength: finalPrompt.length,
      prompt: finalPrompt,
      attempts: attempts,
      source: result.content ? 'content' : (result.reasoning_content ? 'reasoning_content' : 'unknown')
    };

    console.log(JSON.stringify(out, null, 2));

    raw = '';
    result = null;
    promptContent = '';
    engine = null;

    if (global.gc) global.gc();
    process.exit(0);
  } catch (err) {
    // 如果主流程失败，尝试fallback
    if (meta) {
      try {
        const fallbackPrompt = buildFallbackPrompt(meta);
        const cleanContent = removeExistingRenderSection(promptContent);
        const section = `\n\n---\n\n**【精简渲染Prompt】**\n\n\`\`\`\n${fallbackPrompt}\n\`\`\`\n`;
        fs.writeFileSync(shotFile, cleanContent + section, 'utf8');
        
        const fallbackOut = {
          ok: true,
          file: shotFile,
          promptLength: fallbackPrompt.length,
          prompt: fallbackPrompt,
          fallback: true,
          error: err.message
        };
        console.log(JSON.stringify(fallbackOut, null, 2));
        process.exit(0);
      } catch (writeErr) {
        // fallback也失败，返回错误
      }
    }
    
    const fail = {
      ok: false,
      file: shotFile,
      error: err && err.stack ? err.stack : String(err)
    };
    console.error(JSON.stringify(fail, null, 2));

    raw = '';
    result = null;
    promptContent = '';
    engine = null;

    if (global.gc) global.gc();
    process.exit(1);
  }
}

main();