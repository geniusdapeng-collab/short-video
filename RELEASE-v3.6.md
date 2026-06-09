# RELEASE-v3.6 - 镜头时长分配Agent v2（对象重要性驱动）

**发布时间**: 2026-05-20
**升级性质**: 系统级架构升级（吸收外部AI设计精华）

## 核心升级

### 1. 对象重要性驱动（Object Importance Driven）★核心
- **独立于字数**：时长分配不再仅由narration字数决定
- **重要性等级**：critical(9-10) / high(7-8) / medium(4-6) / low(1-3)
- **重要性系数**：critical=2.0× / high=1.6× / medium=1.0× / low=0.6×
- **示例**：32字互动提问(importance=3) → 6秒；41字动作演示(importance=10) → 12秒上限

### 2. 3-12秒弹性区间
- 替代硬编码3-5秒，按角色类型自适应：
  - `opening`: 6-12秒 | `demonstration`: 6-12秒 | `explanation`: 5-12秒
  - `interaction`: 4-8秒 | `transition`: 3-6秒 | `closing`: 5-10秒

### 3. 双池模型（Dual Pool）
- **语音基线池**（60%）：保证每段narration"说得完"（极限语速5.0字/秒）
- **弹性加成池**（40%）：按对象重要性+视觉复杂度分配给关键镜头

### 4. 视觉复杂度评估（独立于字数）
- 评估镜头在视觉层面需要多长时间展示清楚
- 复杂度加成 = visualComplexity × 0.3秒
- `demonstration`(visual=8) → +2.4秒，确保看清每个动作阶段

### 5. 智能压缩（按重要性差异化）
- 压缩率 = 1.0 - (importance - 3) × 0.06
- critical(10): 压缩率0.58（最少压缩） | low(3): 压缩率1.00（不压缩但基数小）
- **视觉加成不压缩**：观众看清动作需要物理时间

### 6. 节奏曲线模板
- `classic`起承转合 | `progressive`渐进式 | `wave`波浪式 | `inverted`倒金字塔
- 节奏曲线拟合 + 相邻差异平滑 + 疲劳度检查

### 7. 三级自优化（L0-L3）
- **L0**正常分配 → **L1**智能压缩 → **L2**精简建议 → **L3**强制降级
- L2提供具体精简建议清单，L3取消所有加成只用语音基线

## 技术规范

### 输入接口（兼容现有）
```json
{
  "totalDuration": 60,
  "rhythmCurve": "classic",
  "narrations": [
    { "id": "N01", "text": "...", "type": "host", "priority": 1, "importance": 9, "visualComplexity": 2 }
  ]
}
```

### 输出接口
```json
{
  "shots": [{ "shot_id": "S01", "narrations": ["N01"], "duration": 12, "role": "opening", "importance": 9 }],
  "optimizationLevel": "L0",
  "totalAllocated": 60,
  "warnings": []
}
```

### 关键算法参数
- 极限语速：5.0字/秒（语音基线计算）
- 舒适语速：opening/closing 4.0字/秒，explanation/demonstration 4.5字/秒，interaction 5.0字/秒
- 缓冲时间：0.5秒
- 最大镜头数：20
- 单镜最多合并narration：3句

## 验证器适配

### storyboard-validator.js
- `durationConfig` 更新为 `{ minDuration: 3, maxDuration: 12, defaultDuration: 5 }`
- 时长硬约束检查：3-12秒区间
- 时长匹配警告：基于舒适语速的容量检查（warning级别，不拦截）

### pre-render-validation.js
- `validateDurations()` 适配3-12秒弹性区间
- duration < 3秒 或 > 12秒 → error（拦截渲染）
- narration字数 > duration容量 → warning（不拦截）

## Mock测试结果（11/11通过）

| # | 测试项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | Agent v2 EP01分配（60秒） | ✅ | 分配8镜，时长范围5-11秒，高importance优先 |
| 2 | Agent v2 通用项目（30秒） | ✅ | demonstration=7秒，视觉复杂度加成生效 |
| 3 | 内容超载（L1/L2触发） | ✅ | L2精简建议已生成 |
| 4 | EP01故事板验证（3-12秒区间） | ✅ | 0个duration硬约束错误 |
| 5 | 通用项目验证 | ✅ | 未配置必需角色，验证通过 |
| 6 | 异常场景拦截（duration缺失） | ✅ | S02无duration正确拦截 |
| 7 | 前置验证集成（EP01通过） | ✅ | warnings不拦截渲染 |
| 8 | 前置验证拦截异常场景 | ✅ | 异常场景正确拦截 |
| 9 | 节奏优化（起承转合） | ✅ | 边界情况处理正常 |
| 10 | L3强制降级 | ✅ | 4镜总20秒，已生成警告 |
| 11 | render-v2.js集成 | ✅ | durationMap读取兼容v2 |

## 文件清单

| 文件 | 变更 | 说明 |
|------|------|------|
| `systems/shot-duration-allocator.js` | 重写v2 | 核心Agent升级（三阶段流水线） |
| `systems/storyboard-validator.js` | 更新 | 适配3-12秒弹性区间 |
| `systems/pre-render-validation.js` | 更新 | 适配3-12秒弹性区间 |
| `projects/*/mock-test-v36.js` | 新增 | 11项Mock测试 |

## 已知问题

1. **EP01 narration较长**：当前9/11镜narration超过5秒舒适语速容量（验证器warning，不拦截）
   - 选项A：精简narration（需队长决策）
   - 选项B：增加总时长预算（如从55秒扩至90秒）
   - 选项C：使用Agent v2重新分配（60秒预算可合理分配，但需适配API最大限制）

2. **节奏优化边界情况**：当所有镜头均达到maxDuration（12秒）时，相邻差异平滑无法制造变化（已处理为warning，不阻断）

3. **疲劳度检查**：当前仅检测连续同角色，未自动拆分（输出warning供上层决策）

## 升级教训

1. **对象重要性是核心**：字数≠价值，41字动作演示(importance=10)应比32字互动(importance=3)获得更多时长
2. **视觉复杂度独立评估**：demonstration类镜头需要额外时间让观众看清动作
3. **弹性区间优于硬编码**：3-12秒比3-5秒更能适应不同内容类型
4. **差异化压缩**：重要内容少压缩，次要内容多压缩，比统一压缩更合理
5. **边界情况需特殊处理**：所有镜头卡上限时，相邻差异平滑应优雅降级

## 下一步建议

1. 队长确认v3.6发布
2. 如需优化EP01：使用Agent v2重新分配60秒预算，或精简narration
3. 后续可扩展：自动角色识别（从text内容推断role）、多语言支持、动态节奏曲线选择
