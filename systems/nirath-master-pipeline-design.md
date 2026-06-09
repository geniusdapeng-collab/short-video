# Nirath Master Pipeline v1.0 — 架构设计文档

## 目标
构建Nirath原生集成的世界级IP短片生成引擎主链路入口

## 架构原则
1. **主链路完整性**：16个系统模块全部保留，一个都不能少
2. **Nirath原生集成**：Nirath不是外挂，是引擎核心的一部分
3. **向后兼容**：已有项目（横纹肌溶解）继续可用
4. **可扩展性**：未来新增场景/角色/模块容易扩展

## 主链路完整模块清单（16个）

### 核心层（5个）
1. `story-prd-template.js` — PRD中央校准文档生成器
2. `requirement-alignment-gate.js` — 需求对齐闸机
3. `schema-validator.js` — Schema运行时校验器
4. `storyboard-validator.js` — 故事板校验器
5. `pre-render-validation.js` — 渲染前置验证

### 角色层（4个）
6. `character-manager-v2.js` — 角色管理器v2
7. `character-prompt-builder.js` — 角色提示词构建器
8. `character-compliance-checker.js` — 角色合规检查器
9. `character-era-guide.js` — 年代服装指南

### 渲染层（4个）
10. `orient-primordial-core-v24.js` — Nirath渲染核心（原生集成）
11. `camera-movement-system-v2.js` — Nirath运镜系统（原生集成）
12. `nirath-character-enhancement.js` — Nirath角色增强（原生集成）
13. `universal-style-injector.js` — 通用风格注入器

### 辅助层（3个）
14. `shot-duration-allocator.js` — 镜头时长分配器
15. `duration-calculator.js` — 时长计算器
16. `continuity-engine.js` — 连续性引擎

## Nirath集成点

### 集成点1：渲染核心（主入口）
- 位置：Prompt生成阶段
- 逻辑：调用OrientPrimordialCoreV24生成Nirath风格Prompt
- 保留：原有校验、验证、合规检查全部保留

### 集成点2：运镜系统
- 位置：故事板设计阶段
- 逻辑：调用CameraMovementSystem v2生成Nirath运镜
- 保留：原有故事板校验器继续校验

### 集成点3：角色增强
- 位置：角色提示词构建阶段
- 逻辑：调用NirathCharacterEnhancer增强角色描述
- 保留：原有CharacterManagerV2和CharacterPromptBuilder继续工作

### 集成点4：风格注入
- 位置：最终Prompt输出阶段
- 逻辑：调用UniversalStyleInjector注入Nirath Master Parameters
- 保留：原有合规检查继续执行

## 执行计划

### Phase 1：创建Nirath主链路入口（今天）
1. 创建 `systems/nirath-master-pipeline.js`
2. 集成所有16个模块
3. 定义Nirath集成点

### Phase 2：更新Mock测试（今天）
1. 创建 `tests/v5.0-nirath-master-pipeline-test.js`
2. 测试完整链路（16个模块全部覆盖）
3. 5轮压测验证

### Phase 3：生产验证（明天）
1. 用Nirath主链路生成一个测试Prompt
2. 验证所有模块都被调用
3. 队长验收

## 文件清单

### 新增文件
- `systems/nirath-master-pipeline.js` — Nirath主链路入口
- `tests/v5.0-nirath-master-pipeline-test.js` — 完整链路测试

### 修改文件
- `shanhaijing-render-engine/orient-primordial-core-v24.js` — 增加Negative Prompt支持
- `tests/v5.0-nirath-e2e-full-test.js` — 废弃，替换为新的完整测试

## 关键设计决策

1. **模块调用顺序**：保持与主链路一致，只在特定环节插入Nirath增强
2. **错误处理**：任何模块失败都中断链路，返回详细错误信息
3. **配置化**：通过projectConfig启用/禁用Nirath模式
4. **日志**：全链路日志记录，每个模块的输入输出都记录

## 与主链路的差异

| 环节 | 主链路 | Nirath主链路 |
|------|--------|-------------|
| 渲染核心 | 通用Prompt生成 | OrientPrimordialCoreV24 |
| 运镜系统 | CameraMovementSystem v1 | CameraMovementSystem v2 |
| 角色增强 | CharacterManagerV2 | + NirathCharacterEnhancer |
| 风格注入 | UniversalStyleInjector | + Nirath Master Parameters |
| 场景库 | 通用 | Nirath Scene Library v2 |
| 禁止词 | 通用 | Nirath专用（水墨/古风等） |
| 负面提示词 | 通用 | Nirath专用（排除水墨/古风） |
| 后期规则 | 通用 | 山海经专用（原声保留） |

## 向后兼容

```javascript
// 通用项目（横纹肌溶解）
const pipeline = new NirathMasterPipeline({ mode: 'generic' });
// → 使用主链路全部模块，不注入Nirath参数

// Nirath项目（山海经）
const pipeline = new NirathMasterPipeline({ mode: 'nirath' });
// → 使用主链路全部模块 + Nirath增强
```
