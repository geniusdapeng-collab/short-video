# 定妆照强制提交闸机设计文档

## 设计目标
**最严格的硬拦截**：任何含角色的镜头，不传对应角色的定妆照 → **完全无法提交渲染**

## 层级设计（三层防护）

### 第一层：预生产阶段预警（Stage 10.5）
- 检查必需角色的定妆照文件是否存在（4角度）
- 缺失 → 报告详细缺失清单（角色/角度/路径）
- 预生产模式下允许继续（提前告知风险）
- 生产模式下**硬拦截**

### 第二层：渲染前置硬拦截（Stage 13）
- 检查每个含角色镜头的 `content` 数组
- 必须包含 `role: "reference_image"` 的定妆照
- 必须包含该角色的 `front` 角度定妆照（最低要求）
- 缺失 → **抛出错误，完全阻断**，不进入 Stage 14

### 第三层：API提交最终防线（render-direct-api.js）
- 提交前最终检查 `content` 数组
- 验证 `role: "reference_image"` 存在且非空
- 验证图片 base64 有效
- 缺失 → **拒绝提交**，返回错误

## 硬拦截规则

```javascript
const MANDATORY_REFERENCE_IMAGE_RULES = {
  // 规则1: 含角色的镜头必须有定妆照
  roleRequired: true,
  
  // 规则2: 至少包含 front 角度
  minimumAngles: ['front'],
  
  // 规则3: reference_image 必须有效（非空、非占位符）
  validImage: true,
  
  // 规则4: 角色ID必须匹配（不能传错角色的定妆照）
  characterIdMatch: true,
  
  // 规则5: 生产模式下零容忍（预生产模式可降级为警告）
  productionMode: 'HARD_BLOCK',
  preProductionMode: 'WARN_AND_LOG'
};
```

## 错误信息格式

```javascript
const BLOCK_MESSAGE = `❌ RENDER_BLOCKED: 定妆照强制提交闸机拦截
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
镜头: {shotId}
角色: {characterId}
缺失项: {missingItems}

原因: 该镜头包含角色 "{characterId}"，但未在 content 数组中
      传入 role="reference_image" 的定妆照。

修复步骤:
1. 确认角色 "{characterId}" 的定妆照已生成
   - 路径: characters/{characterId}/portraits/
   - 必需文件: {characterId}-front.png, {characterId}-threeQuarter.png,
               {characterId}-closeup.png, {characterId}-side.png
2. 确认 Stage 11 渲染任务生成时正确引用了定妆照
3. 重新运行预生产链路

此拦截不可绕过。必须修复后才能提交渲染。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
```

## 集成点

### 1. Pipeline Stage 13（渲染前置验证）
```javascript
// stageRenderPreValidation 方法中新增
const referenceGate = new ReferenceImageGate({
  mode: pipelineMode, // 'production' | 'pre-production'
  requiredCharacters: projectConfig.requiredCharacters
});

const gateResult = referenceGate.validate(shots);
if (!gateResult.passed) {
  throw new Error(`RENDER_BLOCKED: ${gateResult.blockReason}`);
  // 硬拦截：不进入 Stage 14
}
```

### 2. render-direct-api.js（API提交层）
```javascript
// submitTask 方法中新增最终检查
if (!content.some(item => 
  item.role === 'reference_image' && 
  item.image_url?.url?.length > 100
)) {
  return {
    error: 'REFERENCE_IMAGE_REQUIRED',
    message: '该镜头包含角色，必须传入定妆照 reference_image',
    blocked: true
  };
}
```

### 3. 预生产脚本（run-taotie-pre-production.js）
- 新增 `--strict-reference-check` 标志
- 严格模式下，预生产也执行硬拦截

## 测试策略

### 测试用例1: 无定妆照 → 硬拦截
- 输入: 含角色的镜头，content 无 reference_image
- 预期: 抛出 RENDER_BLOCKED 错误，不提交

### 测试用例2: 有定妆照但角色不匹配 → 硬拦截
- 输入: 镜头角色=xiaoG，但传入的是tao-tie定妆照
- 预期: 拦截，报告角色ID不匹配

### 测试用例3: 有定妆照但 front 缺失 → 硬拦截
- 输入: 有 threeQuarter/closeup/side，无 front
- 预期: 拦截，报告缺少 front 角度

### 测试用例4: 完全合规 → 通过
- 输入: 含角色的镜头，content 含正确的 reference_image
- 预期: 正常通过，进入渲染

### 测试用例5: 纯环境镜头无角色 → 豁免
- 输入: 无角色的纯风景/空镜
- 预期: 跳过检查，直接通过

## 文件清单

| 文件 | 功能 |
|------|------|
| `systems/reference-image-gate.js` | 闸机核心逻辑 |
| `systems/render-direct-api.js` | API层最终防线 |
| `nirath-master-pipeline.js` | Stage 13 集成 |
| `mock-test-reference-gate.js` | 测试脚本 |

## 经验沉淀

**为什么必须硬拦截？**
- 踩过太多次坑：角色形象混乱、外来IP混入、每镜随机变化
- 警告不够：人类会忽略警告，继续提交
- 成本太高：Seedance 渲染失败浪费时间和金钱
- 一致性是命：没有定妆照 = 没有角色一致性 = 片子质量崩坏

**闸机哲学**：
- 宁可不让提交，也不让错误提交
- 宁可延迟渲染，也不浪费渲染
- 宁可让用户修复，也不让系统背锅
