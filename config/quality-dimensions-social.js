/** =============
 * 社媒营销短片质量门配置（抖音/短视频/转化率导向）
 * 版本: v1.0.0
 * 定位：干的就是转化率，用户喜欢啥我们给他们制作啥
 ============= */

'use strict';

module.exports = {
  // 社媒营销短片专用维度：爆发力 > 完整性，节奏 > 叙事
  dimensions: {
    // 核心：Prompt质量（每字都是金子，信息密度拉满）
    promptQuality: {
      name: 'Prompt质量',
      weight: 0.20,
      passScore: 75,
      warnScore: 60
    },

    // 核心：钩子强度（黄金3秒定生死，不抓人就死）
    hookStrength: {
      name: '钩子强度',
      weight: 0.20,
      passScore: 80,
      warnScore: 65
    },

    // 核心：视觉爆发力（冲击力、张力、景别切换、镜头语言）
    visualImpact: {
      name: '视觉爆发力',
      weight: 0.20,      // 新增维度，社媒核心
      passScore: 75,
      warnScore: 60
    },

    // 核心：节奏紧凑度（咔咔咔节奏要快，不能浪费1帧）
    rhythmTightness: {
      name: '节奏紧凑度',
      weight: 0.15,
      passScore: 80,
      warnScore: 65
    },

    // 重要：信息密度（15秒每帧满载，时间轴细分叠上去）
    densityScore: {
      name: '信息密度',
      weight: 0.10,
      passScore: 70,
      warnScore: 50
    },

    // 弱化：故事质量（社媒不讲故事，讲情绪）
    storyQuality: {
      name: '故事质量',
      weight: 0.05,
      passScore: 50,
      warnScore: 35
    },

    // 弱化：连续性（1-3镜头不需要复杂连续）
    continuityQuality: {
      name: '连续性质量',
      weight: 0.03,
      passScore: 50,
      warnScore: 35
    },

    // 弱化：导演质量（社媒导演空间极小）
    directorQuality: {
      name: '导演质量',
      weight: 0.03,
      passScore: 50,
      warnScore: 35
    },

    // 保留：渲染就绪度
    renderReadiness: {
      name: '渲染就绪度',
      weight: 0.05,
      passScore: 75,
      warnScore: 55
    },

    // 保留：系统完整性
    systemIntegrity: {
      name: '系统完整性',
      weight: 0.03,
      passScore: 50,
      warnScore: 30
    }
  },

  // 社媒营销短片及格线：80分（转化率导向，高标准）
  total: {
    passScore: 80,
    warnScore: 65
  },

  // 硬阻断规则：社媒放宽完整性，强化爆发力
  hardBlockRules: {
    requireSystemIntegrity: false,
    requireRenderReadiness: true,
    requirePromptText: true,
    requireShots: true,
    // 社媒特有：必须包含时间轴细分标记
    requireTimelineSegments: false  // 建议级别，非强制
  }
};
