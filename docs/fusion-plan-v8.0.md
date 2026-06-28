# 三系统融合方案 v8.0 — 超短裙系统底盘集成

**版本**: v1.0  
**日期**: 2026-06-28  
**底盘**: 超短裙系统 (short-video)  
**注入源**: 卓越系统 v7.0.0 (zhuoyue) + 暴风战斧系统 (StormaxeAIVideoSystem)  

---

## 一、现状诊断

### 1.1 超短裙系统（底盘）
- **Saga Orchestrator**: 硬编码 17 Stage，声明式配置，补偿事务，顾问 Stage
- **LLM Gateway**: 熔断器 + 统一重试 + JSON 安全解析 + 多 Provider 适配
- **Event Bus v2.0**: Mutations 追踪 + 事件回放 + 全生命周期事件
- **NIRATH BIBLE + MYTHOS ENGINE**: 科学级虚构世界，超短裙灵魂资产
- **skills/**: 已有 `battle-report-archivist`、`hollywood-cinematography` 等 Skill，但无统一基类
- **systems/**: `nirath-bible.js`、`mythos-engine.js`、`adventure-cinematography-system.js` 等

### 1.2 卓越系统 v7.0.0（注入源 A）
- **6 个 Skill** + 完整 Skill 基础设施（skill-base.js、skill-loader.js、skill-registry.js）
- **SkillOrchestratorAdapter**: 将 Skill 动态适配为 Saga Stage
- **ContextAccumulationStrategy**: 字段别名映射，跨 Skill 上下文传递
- **Docker + Metrics**: 生产部署就绪

### 1.3 暴风战斧系统（注入源 B）
- **~30 个 Skill**: storyforge-pro、persona-vault、voice-craft、quality-oracle、bestiary、world-engine、soul-forge 等
- **纯 Skill 架构**: 每个 Skill 独立入口文件，松耦合
- **中央融合器 (Integrator)**: 6 大标准化接口

---

## 二、融合架构

```
┌─────────────────────────────────────────────────────────────┐
│                    超短裙系统底盘                            │
│  Saga Orchestrator (17 Stage) + LLM Gateway + Event Bus    │
│  NIRATH BIBLE + MYTHOS ENGINE + 冒险运镜系统                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   融合适配层 (新增)       │
│  ┌──────────────────────────────────────────┐  │
│  │  UnifiedSkillRegistry                     │  │
│  │  • 自动发现三种来源的 Skill               │  │
│  │  • 依赖解析 + 拓扑排序                    │  │
│  │  • IO 契约验证                            │  │
│  │  • Context Accumulation（字段别名映射）   │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  SkillToSagaAdapter                       │  │
│  │  • Skill → Saga Stage 动态映射            │  │
│  │  • 顾问 Stage (blocking: false) 自动标注  │  │
│  │  • 补偿事务自动生成（Skill shutdown）     │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 卓越 Skill群  │  │ 暴风 Skill群  │  │ 原生 Skill群  │
│ (6个)        │  │ (核心10个)   │  │ (保留)       │
├──────────────┤  ├──────────────┤  ├──────────────┤
│•prompt-guard │  │•storyforge   │  │•battle-report│
│•render-guard │  │•persona-vault│  │•hollywood-cin│
│•commercial   │  │•voice-craft  │  │•find-skills  │
│•cinematic-cam│  │•quality-orac │  │•skillhub-pref│
│•continuity   │  │•soul-forge   │  │•time-aware   │
│•post-prod    │  │•bestiary     │  │•worker-safety│
│              │  │•world-engine │  │              │
│              │  │•narrative-con│  │              │
│              │  │•integrator   │  │              │
│              │  │•director     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 三、融合执行计划

### Phase 0: 基础设施统一（本周）
**目标**: 在超短裙建立统一的 Skill 注册表和适配层

| 任务 | 文件 | 说明 |
|---|---|---|
| T0.1 | `skills/skill-base.js` | 迁移卓越系统的 SkillBase 基类 |
| T0.2 | `skills/skill-loader.js` | 迁移 SkillLoader，支持三种格式 |
| T0.3 | `skills/skill-registry.js` | 迁移 SkillRegistry，统一注册三种来源 |
| T0.4 | `skills/fusion-adapter.js` | 新建：Skill → Saga Stage 适配器 |
| T0.5 | `skills/context-accumulation.js` | 迁移 ContextAccumulationStrategy |

### Phase 1: 卓越 Skill 迁移（本周）
**目标**: 将 v7.0.0 的 6 个 Skill 完整迁移到超短裙

| 任务 | 来源 | 目标路径 |
|---|---|---|
| T1.1 | `zhuoyue/skills/prompt-guardian-skill/` | `short-video/skills/prompt-guardian-skill/` |
| T1.2 | `zhuoyue/skills/render-pipeline-guard-skill/` | `short-video/skills/render-pipeline-guard-skill/` |
| T1.3 | `zhuoyue/skills/commercial-mode-skill/` | `short-video/skills/commercial-mode-skill/` |
| T1.4 | `zhuoyue/skills/cinematic-camera-skill/` | `short-video/skills/cinematic-camera-skill/` |
| T1.5 | `zhuoyue/skills/continuity-engine-skill/` | `short-video/skills/continuity-engine-skill/` |
| T1.6 | `zhuoyue/skills/post-production-skill/` | `short-video/skills/post-production-skill/` |

### Phase 2: 暴风战斧 Skill 迁移（下周）
**目标**: 将暴风战斧核心 Skill 适配到超短裙格式

| 任务 | 来源 | 目标路径 | 适配工作 |
|---|---|---|---|
| T2.1 | `Stormaxe/skills/shanhaijing-storyforge-pro/` | `short-video/skills/shanhaijing-storyforge-pro/` | 封装 config.json + index.js |
| T2.2 | `Stormaxe/skills/shanhaijing-persona-vault/` | `short-video/skills/shanhaijing-persona-vault/` | 封装 config.json + index.js |
| T2.3 | `Stormaxe/skills/shanhaijing-voice-craft/` | `short-video/skills/shanhaijing-voice-craft/` | 封装 config.json + index.js |
| T2.4 | `Stormaxe/skills/shanhaijing-quality-oracle/` | `short-video/skills/shanhaijing-quality-oracle/` | 封装 config.json + index.js |
| T2.5 | `Stormaxe/skills/shanhaijing-soul-forge/` | `short-video/skills/shanhaijing-soul-forge/` | 封装 config.json + index.js |
| T2.6 | `Stormaxe/skills/shanhaijing-narrative-consistency/` | `short-video/skills/shanhaijing-narrative-consistency/` | 封装 config.json + index.js |
| T2.7 | `Stormaxe/skills/shanhaijing-bestiary/` | `short-video/skills/shanhaijing-bestiary/` | 封装 config.json + index.js |
| T2.8 | `Stormaxe/skills/shanhaijing-world-engine/` | `short-video/skills/shanhaijing-world-engine/` | 封装 config.json + index.js |
| T2.9 | `Stormaxe/skills/shanhaijing-integrator/` | `short-video/skills/shanhaijing-integrator/` | 封装 config.json + index.js |
| T2.10 | `Stormaxe/skills/shanhaijing-director/` | `short-video/skills/shanhaijing-director/` | 封装 config.json + index.js |

### Phase 3: 融合验证（下周）
**目标**: 端到端验证三种来源的 Skill 可在超短裙 Saga 中协同工作

| 任务 | 验证内容 |
|---|---|
| T3.1 | 超短裙原生 17 Stage + 卓越 6 Skill 混合编排 |
| T3.2 | 暴风战斧 StoryForge Pro → 超短裙 Saga Stage 适配 |
| T3.3 | 上下文累积：NIRATH BIBLE 数据 → 卓越 commercial-mode → 暴风 quality-oracle |
| T3.4 | 错误注入 + 补偿事务：跨系统 Skill 失败回滚 |

---

## 四、关键设计决策

### 决策 1: Skill 格式统一
- **超短裙原生 Skill**: 保留现有格式（如 `hollywood-cinematography/cinematography-skill-router.js`），通过 wrapper 适配
- **卓越 Skill**: 完整迁移（config.json + index.js + SkillBase）
- **暴风战斧 Skill**: 每个 Skill 新增 `config.json` + `index.js`，内部调用原有入口文件

### 决策 2: Saga 编排器不改动
- 超短裙的 17 Stage 硬编码配置不变
- 新增 Stage 通过 `STAGE-18` ~ `STAGE-N` 动态注入
- Skill 失败时通过补偿事务回调 `shutdown()`

### 决策 3: 上下文累积策略
- 超短裙的 `nirath-bible.js` 输出字段 → 卓越 `commercial-mode-skill` 输入字段映射
- 卓越 `cinematic-camera-skill` 输出 → 暴风 `shanhaijing-director` 输入映射
- 通过 `ContextAccumulationStrategy` 的字段别名机制实现

### 决策 4: Event Bus 统一
- 超短裙的 `NirathEventBus` 作为唯一事件总线
- 卓越系统的 `CommercialEventBus` 事件 Schema 作为扩展注册到 NirathEventBus
- 暴风战斧的 Skill 状态事件通过 adapter 转换为 NirathEventBus 事件

---

## 五、保留清单（超短裙独特性不可触碰）

| 模块 | 原因 |
|---|---|
| Saga Orchestrator 17 Stage 定义 | 超短裙核心编排逻辑 |
| LLM Gateway 熔断器/重试/JSON 解析 | 生产级基础设施 |
| Event Bus v2.0 Mutations 追踪 | 可观测性核心 |
| NIRATH BIBLE | 超短裙灵魂资产 |
| MYTHOS ENGINE | 世界观构建核心 |
| 冒险感运镜系统 | 区别于商业广告的运镜语言 |
| Render Quality Feedback Loop | 自我改进闭环 |
| Immutable Shot + Field Lineage | 数据完整性保障 |

---

## 六、新增能力清单（融合后超短裙获得）

### 来自卓越系统
1. **Prompt Guardian（9 项自动修复）** — 自动修复 LLM 生成 prompt 的常见问题
2. **Render Pipeline Guard（13 项强制检查）** — 渲染前质量关卡
3. **商业广告逻辑闭环** — Hook→Problem→Solution→Proof→CTA
4. **4K 画质工坊 + 材质引擎** — 可交付级画质
5. **后期制作管线（VFX + 音频 + 标题排版）** — 视频→成品完整链路
6. **约束仲裁引擎 + 定妆照闸机** — 角色一致性硬保障

### 来自暴风战斧
1. **StoryForge Pro v3.6** — 原创/IP 重构/系列三种创作模式
2. **PersonaVault** — 角色灵魂铸造（Want/Need/Lie/Wound）
3. **VoiceCraft** — 声纹提取与注入（潜台词/失控/沉默）
4. **Quality Oracle** — 五维十八指标评测（S+~C 六级评分）
5. **Narrative Consistency Engine** — 64 集设定漂移防止
6. **Soul Forge** — 三层灵魂模型（本能/人性/灵性）
7. **World Engine + Bestiary** — 异兽视觉风格自动映射
8. **Director 多 Agent 协同** — 构图/光影/角色各负责一个 Agent

---

## 七、风险与缓解

| 风险 | 缓解措施 |
|---|---|
| 超短裙 Saga 硬编码 Stage 与动态 Skill 冲突 | Skill 通过 adapter 映射为动态 Stage，不修改原有 17 Stage |
| 三个系统事件 Schema 不兼容 | NirathEventBus 作为统一总线，其他 Schema 作为扩展注册 |
| 暴风战斧 Skill 代码量大，适配成本高 | 每个 Skill 只新增 config.json + index.js wrapper，不动原有代码 |
| 超短裙 skill-base.js 与现有 Skill 冲突 | 保留现有 Skill 不变，新增 wrapper 层兼容 |
| 融合后系统过于复杂 | 分 Phase 渐进，每 Phase 有独立验证脚本 |

---

## 八、验证脚本

```bash
# Phase 0 验证
node skills/validate-fusion-p0.js    # 基础设施加载 + Skill 注册

# Phase 1 验证  
node skills/validate-fusion-p1.js    # 卓越 6 Skill 在超短裙运行

# Phase 2 验证
node skills/validate-fusion-p2.js    # 暴风 10 Skill 在超短裙运行

# Phase 3 验证
node skills/validate-fusion-p3.js    # 端到端混合编排 + 错误注入
```

---

**下一步**: 开始执行 Phase 0 — 在超短裙建立统一的 Skill 基础设施。
