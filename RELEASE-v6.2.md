# Nirath主生产链路 v6.2 发布说明

> 版本: v6.2
> 发布时间: 2026-05-23
> 前一版本: v6.1（定妆照检查 + 字段对齐修复）
> 状态: ✅ 生产就绪

---

## 本次升级（2项）

### 1. 前置检查流程 preFlightCheck（v6.2）

**队长需求**: 定妆照确认作为前置流程（非主流程内环节），有定妆照就继续，没有就停止并通知队长。

**实现**:
- 新增 `NirathMasterPipeline.preFlightCheck(input)` 方法
- 执行顺序：调用方先 `preFlightCheck()` → 通过后再 `execute()`
- 检查内容：
  - 角色定妆照存在性（front、threeQuarter、closeup、side）
  - 基本输入完整性（projectName、scenes、characters）
- 返回结构：
  ```javascript
  {
    canProceed: true/false,
    issues: [{ type, charId, missingAngles, message }],
    portraits: [{ charId, exists, foundAngles, missingAngles }],
    characterCount: N
  }
  ```

**使用方式**:
```javascript
const pipeline = new NirathMasterPipeline({ mode: 'nirath' });
const preCheck = await pipeline.preFlightCheck(input);
if (!preCheck.canProceed) {
  // 发送飞书消息给队长，等待确认
  return;
}
// 通过后再执行完整链路
const result = await pipeline.execute(input);
```

### 2. 镜头内秒级时间轴（v2.2运镜系统升级）

**队长需求**: 每个镜头好多秒，可以告诉AI几秒到几秒应该怎么转场、怎么运镜，把镜头拆得更细。

**实现**:
- `NirathCinematographyAgent.generateTimeline(movement, duration, emotionPhase)` 方法
- 根据情绪阶段自动分配时间轴策略：

| 情绪阶段 | 时间轴策略 |
|---------|-----------|
| establishing | 0-30% establish → 30-70% 推进 → 70-100% 定格 |
| rising | 0-25% 远景 → 25-60% 加速 → 60-100% 锁定 |
| building | 0-30% 切入 → 30-70% 环绕 → 70-100% 特写 |
| climax | 0-20% 加速 → 20-60% 极限 → 60-100% 定格 |
| resolve | 0-30% 收束 → 30-70% 拉远 → 70-100% 远景 |

- 时长≤5秒自动压缩为2段
- 时间轴融入运镜描述：
  ```
  镜头时间轴：0-2s: 远景establish，环境交代 → 2-5s: 加速推进，情绪升温 → 5-8s: 中景锁定，发现/揭示瞬间
  ```
- 时间轴通过 `movement.description` 自然流入 Stage 11 Prompt

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `systems/nirath-master-pipeline.js` | 新增 `preFlightCheck()` 方法 |
| `systems/camera-movement-system-v2.js` | v2.2：新增 `generateTimeline()` + 描述融入 |
| `shanhaijing-render-engine/orient-primordial-core-v24.js` | 版本号更新 v24.3 |

---

## 版本号管理

**Nirath主生产链路**: v6.2
- v6.0: 17 Stage链路重组 + v24.3渲染核心
- v6.1: 定妆照检查 + 字段对齐修复
- v6.2: 前置检查流程 + 镜头内时间轴（本次）

**运镜系统**: v2.2
- v2.0: 六大基础运镜 + 景别 + 速度
- v2.1: FPV电影感增强
- v2.2: 镜头内秒级时间轴（本次）

**渲染核心**: v24.3
- v24.0: Nirath风格强制约束 + 双星光照
- v24.1: narration融入修复
- v24.2: narration作为核心内容
- v24.3: Nirath风格前置化 + 运镜时间轴支持（本次）

---

## 测试验证

| 测试项 | 结果 |
|--------|------|
| preFlightCheck - 有定妆照 | ✅ 通过（xiaoG 4/4角度） |
| preFlightCheck - 无定妆照 | ✅ 正确拦截（canProceed: false） |
| generateTimeline - 8秒 rising | ✅ 3段：0-2s/2-5s/5-8s |
| generateTimeline - 4秒 establishing | ✅ 2段：0-2s/2-4s |
| 时间轴融入运镜描述 | ✅ description包含"镜头时间轴" |

---

*发布者: 小G | 审核: 队长（大鹏） | 状态: 生产发布 ✅*
