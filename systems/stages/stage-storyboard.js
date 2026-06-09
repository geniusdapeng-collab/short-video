'use strict';

const { createLogger } = require('../logger');
const { ValidationError } = require('../errors');

class StageStoryboardService {
  constructor(options = {}) {
    this.logger = options.logger || createLogger('stage-storyboard');
    this.pipeline = options.pipeline || null;
  }

  async run(ctx) {
    const durationPlan = ctx.getShared('durationPlan');
    const input = ctx.getInput();

    if (!durationPlan) {
      throw new ValidationError('StageStoryboard 缺少 durationPlan');
    }

    if (this.pipeline && typeof this.pipeline.stageStoryboard === 'function') {
      this.logger.info('调用已有 pipeline.stageStoryboard');
      return await this.pipeline.stageStoryboard(durationPlan, input);
    }

    this.logger.warn('未找到 pipeline.stageStoryboard，使用兜底故事板');
    return buildFallbackStoryboard(durationPlan);
  }
}

function buildFallbackStoryboard(durationPlan) {
  const shots = Array.isArray(durationPlan.shots) ? durationPlan.shots : [];

  return {
    shots: shots.map((shot, index) => ({
      id: shot.id || `S${String(index + 1).padStart(2, '0')}`,
      shotId: shot.id || `S${String(index + 1).padStart(2, '0')}`,
      sequence: index + 1,
      scene: shot.scene || `场景${index + 1}`,
      type: shot.type || 'building',
      duration: shot.duration || 5,
      narration: shot.narration || '',
      characters: shot.characters || [],
      visualPrompt: shot.visualPrompt || shot.narration || shot.scene || '',
      emotionPhase: shot.emotionPhase || 'exposition'
    }))
  };
}

module.exports = { StageStoryboardService };