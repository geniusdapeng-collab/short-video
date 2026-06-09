/** =============
 * 超短裙质量门配置（15秒极致化）
 * 版本: v0.1.0
 ============= */

'use strict';

module.exports = {
  // 超短裙专用维度：弱化"完整性"，强化"爆发力"
  dimensions: {
    // 核心：Prompt质量（15秒每字都是金子）
    promptQuality: {
      name: 'Prompt质量',
      weight: 0.25,      // 提升权重（0.20→0.25）
      passScore: 75,     // 降低及格线（70→75）但提高标准
      warnScore: 60
    },

    // 核心：钩子强度（黄金3秒定生死）
    hookStrength: {
      name: '钩子强度',
      weight: 0.20,      // 新增维度
      passScore: 80,
      warnScore: 65
    },

    // 核心：节奏紧凑度（15秒不能浪费1帧）
    rhythmTightness: {
      name: '节奏紧凑度',
      weight: 0.15,      // 新增维度
      passScore: 80,
      warnScore: 65
    },

    // 弱化：故事质量（15秒不讲复杂故事）
    storyQuality: {
      name: '故事质量',
      weight: 0.10,      // 降低权重（0.20→0.10）
      passScore: 60,    // 降低标准
      warnScore: 45
    },

    // 弱化：连续性（3镜头不需要复杂连续）
    continuityQuality: {
      name: '连续性质量',
      weight: 0.05,      // 大幅降低（0.15→0.05）
      passScore: 50,    // 降低标准
      warnScore: 35
    },

    // 弱化：导演质量（3镜头导演空间有限）
    directorQuality: {
      name: '导演质量',
      weight: 0.10,      // 降低权重（0.20→0.10）
      passScore: 65,
      warnScore: 50
    },

    // 保留：渲染就绪度
    renderReadiness: {
      name: '渲染就绪度',
      weight: 0.10,      // 降低权重（0.15→0.10）
      passScore: 75,     // 降低标准（80→75）
      warnScore: 55
    },

    // 🩲 v0.2.0-optimize: 新增：信息密度（15秒每帧满载）
    densityScore: {
      name: '信息密度',
      weight: 0.05,      // 新增维度，5%权重
      passScore: 70,
      warnScore: 50
    },

    // 🩲 v0.3.0: 新增：爆款潜力（15秒 viral 可能性）
    viralScore: {
      name: '爆款潜力',
      weight: 0.10,      // 新增维度，10%权重
      passScore: 70,
      warnScore: 50
    },

    // 弱化：系统完整性（15秒不考虑"完整"）
    systemIntegrity: {
      name: '系统完整性',
      weight: 0.05,      // 大幅降低（0.10→0.05）
      passScore: 50,     // 大幅降低（90→50）
      warnScore: 30
    }
  },

  // 超短裙及格线：80分（比正常75分高，因为标准不同）
  total: {
    passScore: 80,     // 超短裙及格线
    warnScore: 65
  },

  // 硬阻断规则：超短裙放宽
  hardBlockRules: {
    requireSystemIntegrity: false,  // 15秒不要求完整性
    requireRenderReadiness: true,   // 仍然需要可渲染
    requirePromptText: true,        // 必须有Prompt
    requireShots: true              // 必须有镜头
  }
};
