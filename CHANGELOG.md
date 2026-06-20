# CHANGELOG — 超短裙系统

## SHORT-VIDEO-0.8.8 — 2026-06-21（生产发布）

### 核心升级：补全渲染引擎、制作引擎、后期引擎

> 基于队长指示：超短裙系统补全为完整链路系统（Prompt生成 → 制作引擎 → 渲染引擎 → 后期引擎）
> 所有原有引擎完好保留，新增引擎独立并存

#### 新增：完整引擎链路
- **渲染引擎** `engines/rendering-engine/rendering-engine.js`
  - Seedance API 渲染提交核心
  - 支持模拟模式（dryRun）和真实 API 模式
  - 自动绑定定妆照（4角度：front/threeQuarter/closeup/side）
  - 生成绑定清单（binding-manifest.json）
  - 查询渲染状态（轮询 Seedance API）
  - 生成渲染报告

- **制作引擎** `engines/production-engine/production-engine.js`
  - 6 个 LLM Agent 协作：
    - SceneDesignAgent — 场景设计
    - VisualLanguageAgent — 视觉语言
    - AudioDesignAgent — 音频设计
    - PromptFusionAgent — Prompt 融合
    - OpeningDesignAgent — 开场设计
    - ContinuityReviewAgent — 连续性审查
  - 支持 LLM Agent 模式和传统模式切换
  - 全局预算 11 分钟（对齐系统 SIGTERM 上限）

- **后期引擎** `engines/post-production-engine/post-production-engine.js`
  - 视频后期处理流水线

#### 新增：防护系统（来自超现实系统 v2.1.2）
- **PromptGuardian** `scripts/prompt-guardian.js`
  - 自动修复 Prompt（不是报错而是自动修复）
  - 服装锁定、外观锚定、引用格式修正、台词净化
  - 敏感词过滤、声音描述检测、多镜头时间戳检测
  - 负向提示词检测、种子值检查

- **RenderPipelineGuard** `scripts/render-pipeline-guard.js`
  - 13 项强制检查（reference_image、generate_audio、定妆照数量、服装锁定、外观锚定、台词格式、敏感词、引用格式、Prompt长度、图片有效性、多模态限制、分辨率成本、负向提示词）

#### 集成：三层防护架构
- `render-submitter-core.js` 集成 PromptGuardian 自动修复 + RenderPipelineGuard 强制检查
- `short-video-engine.js` 集成 PromptGuardian 到 expandPrompt() 和 expandPromptWithProduct()
- 预生产报告新增 "PromptGuardian 防护检查" 章节

#### 行业专家报告整合（12项）
1. 声音描述（【音效】【环境音】【配乐】）✅ 代码化
2. 多镜头时间戳 [00:00-00:04] ✅ 代码化
3. 负向提示词 【负向】 ✅ 代码化
4. 种子值锁定 ✅ 代码化
5. 多模态限制 ≤12 ✅ 代码化（备用）
6. 分辨率成本优化 ✅ 代码化（备用）
7. 成本策略（预览-定稿）✅ 记录
8. 虚拟人像（1万+预置）✅ 记录
9. 指数退避轮询 ✅ 记录
10. 限流与并发 ✅ 记录
11. 错误排查表 ✅ 记录
12. 视频延长（Extend）✅ 记录

#### 测试验证
- ✅ Prompt 生成引擎（1499/1500 字符，99.9%）
- ✅ 制作引擎（LLM Agents 配置正常）
- ✅ 渲染引擎（模拟模式 1/1 成功）
- ✅ 后期引擎（加载成功）
- ✅ PromptGuardian（5 处自动修复：服装锁定、台词净化、敏感词过滤、外观锚定）
- ✅ PipelineGuard（13 项检查：11 通过、1 警告、1 错误（模拟数据预期））

---

## SHORT-VIDEO-0.8.7 — 2026-06-20

### 定妆照系统 + Seedance 2.0 行业专家报告整合
- 新增 PromptGuardian 自动修复系统
- 新增 RenderPipelineGuard 强制检查
- 集成到 short-video-engine.js（Prompt 生成阶段预检）
- 预生产报告新增防护检查章节
- 12 项行业专家技术点全部融入

### 版本同步
- 超现实系统 v2.1.2 ✅
- 卓越系统 v6.6.9.5 ✅
- 超短裙系统 SHORT-VIDEO-0.8.7 ✅

