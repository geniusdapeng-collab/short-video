# 视频生成统一平台 v6.0 生产发布

**发布日期**: 2026-05-22
**版本号**: v6.0
**前一版本**: v5.1（山海经）/ v4.1（通用视频）
**发布状态**: 已发布

---

## 本次发布核心目标

**系统大合并**: 将"通用视频制作系统"与"山海经导演系统"合并为统一的**Seedance视频生成统一平台**。

合并前：两个独立系统，版本号分别演进
合并后：一套基础设施 + 两个业务系列（通用视频 / 山海经），统一版本号管理

---

## 合并内容清单

### 一、通用视频系统模块（全部纳入统一平台）

| 模块 | 文件 | 功能 |
|------|------|------|
| 渲染引擎 | `systems/render-direct-api.js` | Seedance 2.0 API调用，支持横屏16:9+时长参数 |
| 角色管理v2 | `systems/character-manager-v2.js` | 7维角色分析+自动合规+字数智能分配 |
| 角色合规检查 | `systems/character-compliance-checker.js` | L1禁止/L2模糊/L3注意三级审查 |
| 角色Prompt构建 | `systems/character-prompt-builder.js` | 6层结构（主体→服装→配饰→表情→环境→技术） |
| 角色年代指南 | `systems/character-era-guide.js` | 1920s-2020s服装速查，支持混搭验证 |
| 时长分配Agent | `systems/shot-duration-allocator.js` | 对象重要性驱动时长分配（critical/high/medium/low） |
| 运镜控制系统v2 | `systems/camera-movement-system-v2.js` | 六大基础运镜+景别层级+速度修饰+情绪峰值 |
| 故事板验证器 | `systems/storyboard-validator.js` | 角色/时长/字数/运镜/嘴部动作校验 |
| 渲染前置验证 | `systems/pre-render-validation.js` | 故事板审核 + 一镜到底强制检查 + 时长验证 |
| 时长计算器 | `systems/duration-calculator.js` | narration字数→自动计算时长（开场4.0/讲解4.5/互动5.0字/秒） |
| 后期合成管线 | `systems/post-production-pipeline.js` | 视频合并+字幕烧录+交付 |
| 通用风格注入 | `systems/universal-style-injector.js` | 画面文字禁止+横版输出强制+字幕对齐 |
| 连续性引擎 | `systems/continuity-engine.js` | 跨镜头角色一致性保障 |
| 生产引擎 | `systems/production-engine.js` | 批量渲染任务调度 |

### 二、山海经专属业务模块（全部纳入统一平台）

| 模块 | 文件 | 功能 |
|------|------|------|
| 导演系统 | `shanhaijing-director/director.js` | 剧本→时长分配→故事板→Prompt→运镜→角色→渲染全链路 |
| 世界观一致性引擎 | `systems/worldview-consistency-engine.js` | 禁用词完整词汇匹配+文化基因注入+异兽原文校验 |
| FPV经验包总库 | `systems/fpv-experience-library.js` | 15标杆案例+通用方法论+六大支柱+检索索引+速查清单+14种特殊技法 |
| FPV链路集成 | `systems/fpv-experience-integration.js` | 经验包自动选择+导演系统集成+渲染前置集成 |
| 山海经一镜到底模板 | `systems/shanhai-one-shot-templates.js` | 5异兽专属模板（帝江/烛龙/旋龟/白泽/九尾狐） |
| 节奏模板库 | `systems/rhythm-template-library.js` | 五段式节奏+6种情绪模板+音效铁律（纯环境音） |
| Nirath主管线 | `systems/nirath-master-pipeline.js` | 角色档案+异兽数据+渲染引擎整合 |
| Nirath角色增强 | `systems/nirath-character-enhancement.js` | 角色一致性增强 |
| 管线完整性验证 | `systems/pipeline-integrity-validator.js` | 端到端链路校验 |
| 异兽数据库 | `data/nirath-creature-data.js` | 山海经×Nirath双重视觉数据 |
| 异兽档案馆 | `shanhaijing-bestiary/bestiary.js` | 异兽查询+拼音ID映射层 |
| 肖像强制执行 | `systems/character-portrait-enforcer.js` / `v2.js` | 定妆照强制引用+校验 |
| Prompt优化器 | `shanhaijing-director/scripts/prompt-optimizer.js` | Prompt质量优化+一镜到底关键词保留 |

### 三、角色档案库（统一纳入）

| 角色 | 版本 | 定妆照角度 | 状态 |
|------|------|-----------|------|
| 小G（主角） | v12-production | 正面/3/4侧面/特写/侧面 | 已入库 |
| 暖暖（帝江） | v3-production | 正面/3/4侧面/特写/侧面 | 已入库 |
| 白泽（老师） | v2-production | 正面/3/4侧面/特写/侧面 | 已入库 |
| 陈女士（警官） | v2-cg | 正面/3/4侧面/特写/侧面 | 已入库 |
| 李明教练 | v2-cg | 正面/3/4侧面/特写/侧面 | 已入库 |

---

## v6.0 新增与升级内容

### 1. 统一平台架构
- 新建 `SYSTEM.md` — 系统总览文档，统一版本号管理
- 统一常量定义：`SYSTEM_VERSION = 'v6.0'`
- 双系列快速入口：通用视频 / 山海经系列

### 2. FPV经验包完整版对照补充（v5.1-patch）
- 补充14种特殊技法速查表到 `_methodology.specialTechniques`
- 补充24项创作速查清单到 `_methodology.creationChecklist`
  - 基础8项（视角/镜头/运动/单一镜头/德式斜角/畸变暗角色散/时长/音效）
  - 增强8项（尺度反差/元素映射/五段式节奏/光影叙事/擦肩而过/运动模糊/极端视差/特殊结尾）
  - 高级8项（场景转换/变速处理/专业技法/突发事件/灾难连锁/人群反应/材质强调/冷暖对比）

### 3. 一镜到底强制校验机制（v5.1已具备，v6.0确认覆盖双系列）
- 文件：`systems/pre-render-validation.js`
- 拦截级别：BLOCKING（无则渲染被强制拦截）
- 覆盖范围：山海经系列 + 通用视频系列（全部片子）
- 自动匹配：0个时尝试从FPV经验包自动匹配补救

---

## 系统链路图（统一后）

```
┌─────────────────────────────────────────────────────────┐
│           Seedance视频生成统一平台 v6.0                  │
│                   （一套基础设施）                        │
├─────────────────────────────────────────────────────────┤
│  基础设施层（通用共享）                                    │
│  ├── 渲染引擎（API调用+并发控制）                          │
│  ├── 角色系统（v2管理+合规+Prompt构建+年代指南）            │
│  ├── 运镜系统（六大动作+景别+速度+情绪）                   │
│  ├── 时长系统（分配Agent+计算器）                          │
│  ├── 验证系统（故事板审核+前置验证+一镜到底强制检查）       │
│  ├── 后期系统（合并+字幕+交付）                            │
│  └── 风格系统（通用约束注入）                              │
├─────────────────────────────────────────────────────────┤
│  业务层（差异化配置）                                     │
│  ├── 通用视频系列                                          │
│  │   └── 科普/纪录片/宣传片/剧情短片                       │
│  └── 山海经系列                                            │
│      ├── 导演系统（剧本→故事板→Prompt→运镜→渲染）          │
│      ├── 世界观引擎（禁用词+文化基因+异兽校验）              │
│      ├── FPV经验包（15案例+方法论+模板+清单）                │
│      ├── 节奏模板（五段式+情绪+音效铁律）                    │
│      └── Nirath主管线（角色+异兽+渲染整合）                 │
├─────────────────────────────────────────────────────────┤
│  数据层                                                   │
│  ├── 角色档案库（小G/暖暖/白泽/陈女士/教练）                │
│  ├── 异兽数据库（山海经×Nirath双重视觉）                    │
│  └── 经验包库（FPV 15标杆案例）                            │
└─────────────────────────────────────────────────────────┘
```

---

## 版本变更文件清单

1. 新增 `SYSTEM.md` — 统一平台总览文档
2. `systems/fpv-experience-library.js` — 补充特殊技法速查表+创作速查清单
3. `systems/pre-render-validation.js` — 一镜到底强制校验（已具备，确认覆盖双系列）

---

## 验证状态

- 模块Mock测试：全部通过（历史累计）
- 端到端Mock测试：5轮150项全部通过（v5.1验证）
- 一镜到底校验：BLOCKING级拦截已验证
- 双系列覆盖：通用视频+山海经均已纳入统一平台

---

**发布人**: 小G
**审核状态**: 自检通过，统一平台架构确认，双系列模块全部纳入
**下一目标**: 基于统一平台继续迭代业务层功能（新角色/新剧集/新模板）
