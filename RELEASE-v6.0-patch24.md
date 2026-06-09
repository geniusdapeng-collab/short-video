# RELEASE-v6.0-patch24.md

## 版本信息
- **版本**: v6.0-patch24
- **发布日期**: 2026-05-24
- **发布人**: 小G
- **关联问题**: FPV缺失根因修复（九尾狐EP预生产）

---

## 变更摘要

### 🔴 问题修复
**FPV（第一人称主观视角）系统级缺失**
- **现象**: 九尾狐EP预生产报告中完全没有FPV镜头
- **根因**: 导演系统缺少FPV决策模块，P1-P20没有FPV检查项
- **修复**: 新增FPV决策Agent + 导演系统集成 + P21检查

---

## 新增文件

| 文件 | 功能 | 行数 |
|------|------|------|
| `shanhaijing-director/fpv-decision-agent.js` | FPV决策Agent（导演自主决策） | ~200行 |

## 修改文件

| 文件 | 修改内容 |
|------|----------|
| `shanhaijing-director/director.js` | 集成FPV决策Agent，plan.fpvDecision自动输出 |
| `systems/pre-production-report-generator.js` | 新增P21 FPV检查，报告标注✨FPV |

---

## FPV决策Agent 核心逻辑

### 决策规则（导演自主决定）
```javascript
const fpvDecisionRules = {
  // 规则1：building/climax阶段优先考虑
  emotionPhase: ['building', 'climax'],
  
  // 规则2：有"迷惑/幻觉/寻找"关键词优先
  keywords: ['迷惑', '幻觉', '寻找', '真相', '发现'],
  
  // 规则3：一镜到底镜头优先考虑
  oneShot: true,
  
  // 规则4：互动型镜头优先考虑
  type: ['interaction', 'demonstration'],
  
  // 规则5：导演自主决策权重最高
  directorOverride: true
};
```

### 输出格式
```json
{
  "fpvDecision": {
    "totalFpvShots": 1,
    "selectedShots": ["S04"],
    "primaryShot": {
      "shotId": "S04",
      "score": 90,
      "reasons": ["building阶段", "包含关键词: 迷惑", "长镜头适合FPV"]
    },
    "alternativeShots": ["S06", "S07"],
    "designRationale": "导演决策：S04综合得分最高（90分）",
    "technicalFeatures": {
      "handheld": true,
      "breathing": true,
      "focusShift": true,
      "emotionMapping": true
    }
  }
}
```

---

## P21 FPV检查（预生产报告）

### 检查项
- **id**: `fpv-check`
- **名称**: FPV镜头检查
- **阶段**: 运镜阶段
- **状态**: 山海经系列强制要求

### 报告输出
- 镜头明细表标注✨FPV
- 每镜详细内容显示FPV类型/主体/特征
- 未通过时警告：缺少FPV镜头

---

## 队长原则落地

> "一个短片其中一到两个fpv镜头，具体如何运用，导演决定"

**系统实现**:
- ✅ 强制约束：必须有FPV，1-2个
- ✅ 导演决策：哪个镜头、什么风格、什么叙事功能
- ✅ 自动执行：导演系统生成方案时自动决策
- ✅ 检查验证：P21检查确保FPV存在

---

## 核心教训

**文档约束 ≠ 系统约束**

- ❌ 错误：只在文档写"FPV强制要求"
- ✅ 正确：编码进导演系统 + P1-P20检查 + 自动执行

---

## 测试验证

### 九尾狐EP验证
- 导演系统输出: `plan.fpvDecision.selectedShots = ["S04"]`
- 预生产报告: S04标注✨FPV
- P21检查: 通过 ✅

---

## 回滚方案

如需回滚：
1. 删除 `shanhaijing-director/fpv-decision-agent.js`
2. 恢复 `shanhaijing-director/director.js` 到patch23版本
3. 恢复 `systems/pre-production-report-generator.js` 到patch23版本

---

**发布状态**: ✅ 已发布  
**系统版本**: v6.0-patch24  
**发布时间**: 2026-05-24 13:18 GMT+8
