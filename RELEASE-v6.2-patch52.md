# RELEASE v6.2-patch52 — 预生产链路完整性修复

## 版本信息
- **版本**: v6.2-patch52
- **日期**: 2026-05-27
- **类型**: 系统级修复
- **前置版本**: v6.2-patch51

---

## 修复目标

解决预生产链路"15/16通过就报告"和"时长-字数不匹配"的系统性漏洞。

**队长反馈**:
> "你这么短是不可能跑完全预生产流程的" — 质疑链路没跑完
> "要从机制上去想怎么解决，不是解决这个case的问题"

---

## 修复项

### 问题1：Stage-8 校验器状态被覆盖

**根因**: Pipeline `stageStoryboardValidation` 方法最后强制覆盖 `validation.valid`:
```javascript
validation.valid = (validation.errors || []).filter(e => e.severity === 'error').length === 0;
```
这段代码覆盖了 storyboardValidator 返回的 `valid=false`。

**修复**: 保留原始 valid 状态:
```javascript
const originalValid = validation.valid !== false;
validation.valid = originalValid && !hasPipelineErrors;
```

**结果**: 链路完整性 16/16 ✅（之前15/16）

### 问题2：时长-字数不匹配（S05 11秒 < 需要12秒）

**根因**: Stage-6 基于估算字数分配时长，StoryCraft 生成后字数膨胀:
- Stage-6: S05 分配 11秒（基于41字估算）
- StoryCraft后: S05 narration 变为 61字
- Stage-8 校验: 需要 61/5 + 1 = 13.2秒 → 要求13秒

**修复**: 新增 Stage-7.4 DurationNarrationAlignment
- 检测 narration 字数与分配时长匹配度
- 不匹配时从低重要性镜头"借"时长（不增总预算）
- S05 从 S01 借调 2秒：11秒 → 13秒

**结果**: Stage-8 校验 `✅ 结尾镜 S05: 时长 13s ≥ 需要 12s`

### 问题3：字数统计口径不一致

**根因**: NarrationAutoTrim 使用 `countChineseChars`（仅匹配 `\u4e00-\u9fff`），与 Stage-8 校验器统计所有非空白字符不一致。

**修复**: 统一为 `countAllChars`（`text.replace(/\s/g, '').length`）

---

## 新增/修改文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `systems/duration-narration-alignment.js` | 新增 | Stage 7.4 时长-字数一致性校准器 |
| `systems/narration-auto-trim.js` | 修复 | countAllChars 统一字数统计 |
| `systems/nirath-master-pipeline.js` | 修复 | Stage-8 状态传递 + Stage-7.4 挂载 |

---

## Pipeline 挂载点

```
Stage-6  →  ShotDurationAllocatorV2（估算字数分配时长）
Stage-7  →  StoryCraft 生成 narration（字数膨胀）
Stage-7.3 → NarrationAutoTrim（精简 narration）
Stage-7.4 → DurationNarrationAlignment（校准时长-字数） ← 新增
Stage-8  →  StoryboardValidator（校验时长匹配）
```

---

## 验证结果

| 指标 | patch51 | patch52 | 变化 |
|------|---------|---------|------|
| 链路完整性 | 15/16 ❌ | 16/16 ✅ | +1 |
| 五要素评分 | 75/100 | 76/100 | +1 |
| S05 时长 | 11秒 | **13秒** | +2 |
| 系统错误 | 0 | 0 | — |
| 风险评级 | 低风险 | 低风险 | — |

---

## 修复后验证

- 预生产链路完整跑通 16/16 ✅
- 五要素全部通过 76/100 ✅
- Stage-8 校验器正确保留 `valid=false` 状态 ✅
- S05 时长校准成功（11s → 13s）✅

---

## 队长确认

> "好的，那你提交一下生产发布，把这个成果固化下来"

v6.2-patch52 预生产链路完整性修复已提交生产发布 ✅
