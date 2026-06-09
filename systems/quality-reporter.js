'use strict';

const qualityConfig = require('../config/quality-dimensions');

function normalizeScore(score, defaultValue = 0) {
  const num = Number(score);
  if (!Number.isFinite(num)) return defaultValue;
  return Math.max(0, Math.min(100, num));
}

function calcWeightedScore(scores, context) {
  let total = 0;
  let totalWeight = 0;

  // 🩲 v0.2.0: 超短裙模式使用专用权重
  // 📱 v1.0.0-social: 社媒营销模式使用专用权重
  const config = (context && context.isSocialMediaMode)
    ? require('../config/quality-dimensions-social')
    : (context && context.isShortVideoMode)
      ? require('../config/quality-dimensions-short')
      : qualityConfig;

  for (const [key, dim] of Object.entries(config.dimensions)) {
    const score = normalizeScore(scores[key]?.score, 0);
    const weight = dim.weight || 0;
    total += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(total / totalWeight);
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

function getStatus(score, context) {
  const config = (context && context.isSocialMediaMode)
    ? require('../config/quality-dimensions-social')
    : (context && context.isShortVideoMode)
      ? require('../config/quality-dimensions-short')
      : qualityConfig;
  if (score >= config.total.passScore) return 'PASS';
  if (score >= config.total.warnScore) return 'WARN';
  return 'BLOCK';
}

function buildQualityReport(input) {
  const scores = input.scores || {};
  const issues = input.issues || [];
  const blockers = input.blockers || [];
  const context = input.context || {};

  const totalScore = calcWeightedScore(scores, context);
  const grade = getGrade(totalScore);
  const status = blockers.length > 0 ? 'BLOCK' : getStatus(totalScore, context);

  return {
    generatedAt: new Date().toISOString(),
    context,
    totalScore,
    grade,
    status,
    scores,
    issues,
    blockers,
    summary: {
      dimensionCount: Object.keys(scores).length,
      issueCount: issues.length,
      blockerCount: blockers.length
    }
  };
}

module.exports = {
  buildQualityReport,
  normalizeScore,
  calcWeightedScore,
  getGrade,
  getStatus
};
