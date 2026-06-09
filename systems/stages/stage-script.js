'use strict';

const { createLogger } = require('../logger');
const { ValidationError } = require('../errors');

class StageScriptService {
  constructor(options = {}) {
    this.logger = options.logger || createLogger('stage-script');
    this.pipeline = options.pipeline || null;
  }

  async run(ctx) {
    const input = ctx.getInput();

    if (!input) {
      throw new ValidationError('StageScript 缺少输入');
    }

    // 优先调用 pipeline 已有方法，减少侵入
    if (this.pipeline && typeof this.pipeline.stageScript === 'function') {
      this.logger.info('调用已有 pipeline.stageScript');
      const output = await this.pipeline.stageScript(input);
      return normalizeScriptOutput(output, input);
    }

    // 兜底：如果没有 stageScript，就尝试从 scenes 直接构造
    this.logger.warn('未找到 pipeline.stageScript，使用兜底脚本构造');
    return buildFallbackScript(input);
  }
}

function normalizeScriptOutput(output, input) {
  if (!output) {
    return buildFallbackScript(input);
  }

  // 常见兼容：有些实现可能直接返回 scenes
  if (Array.isArray(output)) {
    return { scenes: output };
  }

  if (output.scenes && Array.isArray(output.scenes)) {
    return output;
  }

  return buildFallbackScript(input);
}

function buildFallbackScript(input) {
  const scenes = Array.isArray(input.scenes) ? input.scenes : [];

  return {
    scenes: scenes.map((scene, index) => ({
      id: scene.id || `S${String(index + 1).padStart(2, '0')}`,
      scene: scene.scene || scene.title || `场景${index + 1}`,
      narration: scene.narration || '',
      type: scene.type || 'building',
      characters: scene.characters || [],
      duration: scene.duration || 5,
      emotionPhase: scene.emotionPhase || 'exposition'
    }))
  };
}

module.exports = { StageScriptService };
