/**
 * ShortVideoFieldAdapter - 超短裙系统字段适配器
 * 作用: 将超短裙系统的 shots 字段 ↔ 超现实系统25字段 双向映射
 * 位置: Field Quality Pipeline 注入前后
 * 
 * 核心映射策略:
 * 1. 超短裙字段 → 25字段 (适配检查)
 * 2. 25字段修复 → 超短裙字段 (修复回写)
 * 3. render_prompt ↔ prompt 转换
 */

const { safeSlice } = require('../field-standardizer');

// ============================================================
// 字段映射表
// ============================================================

const SHORT_VIDEO_TO_25FIELD_MAP = {
  // 超短裙字段 → 25字段
  'environment_traits': 'scene',
  'primary_action': 'action',
  'camera_movement': 'camera_movement',
  'camera_position': 'camera_movement', // 合并到 camera_movement
  'dialogue': 'dialogue',
  'sound_events': 'audio',
  'transition_intent': 'transition',
  'render_prompt': 'prompt',
  'character_bindings': 'character',
  'shot_size': 'composition',
  'light_tier': 'lighting', // 部分映射
  'color_temp': 'lighting', // 部分映射
  'spatial_relation': 'depth_of_field', // 部分映射
  'rhythm_level': 'pacing', // 部分映射
  'motion_intensity': 'pacing', // 部分映射
  'narrative_purpose': 'director_instruction', // 部分映射
  'performance_goal': 'mood', // 部分映射
  'emotion_target': 'mood', // 部分映射
  'primary_poi': 'baseline', // 部分映射
  'ofa': 'baseline', // 部分映射
  'efa': 'baseline', // 部分映射
  'info_density': 'constraint', // 部分映射
};

const FIELD_25_TO_SHORT_VIDEO_MAP = Object.fromEntries(
  Object.entries(SHORT_VIDEO_TO_25FIELD_MAP).map(([k, v]) => [v, k])
);

// 多对一映射（25字段 → 超短裙字段列表）
const REVERSE_MULTI_MAP = {
  'camera_movement': ['camera_movement', 'camera_position'],
  'lighting': ['light_tier', 'color_temp'],
  'pacing': ['rhythm_level', 'motion_intensity'],
  'mood': ['performance_goal', 'emotion_target'],
  'baseline': ['primary_poi', 'ofa', 'efa'],
  'constraint': ['info_density'],
};

// ============================================================
// 适配器核心类
// ============================================================

class ShortVideoFieldAdapter {
  constructor() {
    this.mapping = SHORT_VIDEO_TO_25FIELD_MAP;
    this.reverseMapping = FIELD_25_TO_SHORT_VIDEO_MAP;
    this.reverseMultiMap = REVERSE_MULTI_MAP;
  }

  /**
   * 将超短裙系统 shots 转换为25字段格式
   * 用于 Field Quality Pipeline 检查
   */
  to25FieldFormat(shots) {
    return shots.map(shot => {
      const adapted = JSON.parse(JSON.stringify(shot)); // 深拷贝
      
      // 映射字段
      for (const [svField, field25] of Object.entries(this.mapping)) {
        if (svField in adapted && adapted[svField] !== undefined && adapted[svField] !== null) {
          // 如果25字段已存在且不为空，保留原值（优先）
          if (!adapted[field25] || (typeof adapted[field25] === 'string' && !adapted[field25].trim())) {
            adapted[field25] = adapted[svField];
          }
        }
      }

      // 特殊处理: render_prompt → prompt
      if (adapted.render_prompt && !adapted.prompt) {
        adapted.prompt = adapted.render_prompt;
      }

      // 特殊处理: camera_position + camera_movement → camera_movement
      if (adapted.camera_position && adapted.camera_movement) {
        adapted.camera_movement = `${adapted.camera_position}, ${adapted.camera_movement}`;
      }

      // 特殊处理: light_tier + color_temp → lighting
      if (adapted.light_tier || adapted.color_temp) {
        const lightParts = [];
        if (adapted.light_tier) lightParts.push(`Light tier: ${adapted.light_tier}`);
        if (adapted.color_temp) lightParts.push(`Color temperature: ${adapted.color_temp}`);
        if (lightParts.length > 0) {
          adapted.lighting = lightParts.join(', ');
        }
      }

      // 标记: 这是适配后的数据
      adapted._adapted_from_short_video = true;
      adapted._original_fields = Object.keys(shot);

      return adapted;
    });
  }

  /**
   * 将25字段修复结果映射回超短裙系统字段
   * 用于修复回写
   */
  from25FieldFormat(adaptedShots, originalShots) {
    return adaptedShots.map((adapted, index) => {
      const original = originalShots[index] || {};
      const result = JSON.parse(JSON.stringify(original)); // 从原始数据开始

      // 只回写被修改过的字段
      if (!adapted._adapted_from_short_video) {
        return adapted; // 如果不是适配数据，直接返回
      }

      // 映射回超短裙字段
      for (const [field25, svField] of Object.entries(this.reverseMapping)) {
        if (adapted[field25] !== undefined && adapted[field25] !== original[field25]) {
          // 检查是否是多对一映射
          const multiFields = this.reverseMultiMap[field25];
          if (multiFields && multiFields.length > 1) {
            // 多对一: 将修复后的内容分配给第一个字段
            result[multiFields[0]] = adapted[field25];
          } else {
            result[svField] = adapted[field25];
          }
        }
      }

      // 特殊处理: prompt → render_prompt
      if (adapted.prompt && adapted.prompt !== original.render_prompt) {
        result.render_prompt = adapted.prompt;
      }

      // 保留适配日志
      result._field_quality_adapted = true;
      result._adapted_at = new Date().toISOString();

      return result;
    });
  }

  /**
   * 检查 shots 是否需要适配
   */
  needsAdaptation(shots) {
    if (!Array.isArray(shots) || shots.length === 0) return false;
    const firstShot = shots[0];
    // 检查是否有超短裙系统特有的字段
    const shortVideoFields = ['shot_id', 'shot_type', 'render_prompt', 'primary_action', 'environment_traits'];
    return shortVideoFields.some(f => f in firstShot);
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  ShortVideoFieldAdapter,
  SHORT_VIDEO_TO_25FIELD_MAP,
  FIELD_25_TO_SHORT_VIDEO_MAP,
};
