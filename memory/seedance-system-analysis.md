# Seedance v6.0-Peng 系统深度解剖报告

> 小G 对现有系统的完整理解 — 2026-05-15
> 基于 249 个文件 / 53,301 行代码的全面扫描

---

## 一、系统总览

**Seedance v6.0-Peng** 是一套基于 OpenClaw 平台的 AI 视频生成系统，由 16 个子技能模块组成，通过 `director.js` 总指挥协调，完成从"用户一句话需求"到"飞书交付成片"的完整流水线。

### 核心数据流

```
用户请求（标题+大纲+时长+风格）
  ↓
[Phase 0] director.js → 角色定妆照生成（Seedream API）
  ↓
[Phase 1] story-engine.js → 多方案生成（3-5 个变体）
  ↓
[Phase 1.5] pitch-evaluation.js → 四大维度评测（≥7.5 通过）
  ↓  ← 未通过 → 返回修改意见 → story-engine 重生成（最多 3 轮）
[Phase 2] requirement-alignment-gate.js → 对齐闸机（≥40 分通过）
  ↓  ← 未通过 → 阻断渲染，返回上游
[Phase 3] seedance-render-engine.js → 片段合并 + Multi-Shot 策略
  ↓
[Phase 4] seedance-wrapper.js → 调用豆包 Seedance API 渲染
  ↓  ← 429/500 → 自动降级（缩短 prompt + 降低 motionStrength）
[Phase 5] post-production.js → 后期合成（ffmpeg 拼接 + 调色 + 字幕）
  ↓
[Phase 6] sound-design.js → 4 层音轨（环境/音效/音乐/对白）
  ↓
[Phase 7] delivery-engine.js → 飞书消息交付成片
  ↓
[Phase 8] 战报生成
```

### 16 个子技能模块

| 技能 | 文件数 | 职责 | 必需 |
|------|--------|------|------|
| seedance-director | 30 | 总指挥 + 配置中心 + 对白引擎 + 合规Agent + 对齐闸机 | ✅ |
| pitch-evaluation | 3 | 比稿评测 + 质量闸门 | ✅ |
| seedance-story-engine | 4 | 故事方案生成（内部调用 StoryForge Pro） | ✅ |
| seedance-render-engine | 2 | 批量渲染 + 片段合并 + 降级策略 | ✅ |
| seedance-post-production | 117 | 后期合成（ffmpeg 核心） | ✅ |
| seedance-sound-design | 3 | 4 层音轨设计 | ✅ |
| seedance-character-manager | 2 | 角色资产 + 定妆照 | ✅ |
| seedance-micromotion | 16 | 微动作增强（呼吸/眼神/表情） | ✅ |
| byted-ark-seedance-skill | 5 | 豆包 API 封装 + 待办任务管理 | ✅ |
| seedance-shot-design | 15 | 镜头设计规范 + 导演风格参考 | ✅ |
| seedance2-storyboard-generator | 5 | 分镜可视化 | ❌ |
| seedance-choreography | 2 | 舞蹈编排 | ❌ |
| seedance-delivery-engine | 2 | 交付引擎 | ❌ |
| storyforge-pro | 25 | 专业剧本系统（原创/IP重构/系列短剧） | ❌ |
| persona-vault | 9 | 角色灵魂铸造 + 情感挖掘 | ❌ |
| voice-craft | 9 | 声纹设计 + 潜台词 + 对白增强 | ❌ |

---

## 二、核心模块深度解析

### 2.1 director.js — 导演主控（1,984 行）

**职责**：生产总指挥，协调所有 Phase 的执行

**Phase 流水线**：
- Phase 0: 角色定妆照（Seedream v5.0）
- Phase 1-Multi: 多方案生成（3 个变体）
- Phase 1-Eval: 比稿评测
- Phase 2: 对齐闸机（v1.0-Peng，评分<40 阻断渲染）
- Phase 3: 故事板生成
- Phase 4: 批量渲染（严格单并发，避免 429）
- Phase 5: 对白引擎
- Phase 6: 后期合成
- Phase 7: 交付

**关键机制**：
- **模型优先级队列**：4 级自动降级（2.0 → 2.0-fast → 1.5-pro → 1.0-pro）
- **严格单并发**：`MAX_CONCURRENT = 1`，避免 429
- **Prompt 保真修复**：v5.7-Peng 移除 60/30 字符截断，保留完整中文描述
- **中文主体**：英文动作仅追加补充，不做替换

### 2.2 config-center.js — 配置中心（~100 行）

**职责**：统一所有模块的配置管理

**配置项**：
- `SKILL_PATHS`: 16 个子技能路径统一引用
- `render`: 模型优先级 / 最大并发 / 重试延迟 / prompt 最大长度(490) / 降级步数
- `compliance`: 对齐阈值(40) / 比稿最低分(7.5) / 最大长度(490)
- `promptGen`: 最大 token(80) / 文件名最大字符(50)
- `timeouts`: 轮询(10s) / 下载(60s) / ffmpeg(300s)

**历史**：v5.6-Peng 引入，清理 P0/P1 级硬编码

### 2.3 story-engine.js — 故事引擎（~4,000 行）

**职责**：从用户大纲生成结构化故事方案

**核心能力**：
- **EMOTION_CAMERA_MAP**：情绪-运镜映射表，5 个张力区间 → 电影级运镜词汇
  - 0-20: 宁静 → 航拍缓慢下降, 全景构图, 固定机位
  - 21-40: 警觉 → 推轨缓推, 微晃手持
  - 41-60: 冲突 → 侧面跟拍, 快速横移
  - 61-80: 转折逼近 → 环绕 180 度, 仰拍低角度
  - 81-100: 高潮 → 子弹时间冻结环绕, 特写快速推进
  - 101+: 超高潮 → 极速甩镜+环绕冻结复合运镜
- **舞蹈检测**：15 种舞蹈类型自动识别（芭蕾/街舞/爵士/拉丁/K-pop 等）
- **大纲解析**：提取角色 / 场景 / 动作关键词 / 起承转合
- **中文标点修复**：v5.7-Peng 全角中文标点支持

**内部调用**：实际调用 `storyforge-pro/orchestrator.js`（v5.6-Peng 后）

### 2.4 pitch-evaluation.js — 比稿评测（~1,200 行）

**职责**：N 个候选方案中选出最佳

**四大维度 + 权重**：
1. **需求对齐度** (30%): 关键词匹配率 / 情绪匹配 / 时长匹配
2. **剧本质量** (25%): 结构完整性 / 冲突检测 / 角色弧光 / 记忆点
3. **规范符合** (25%): Prompt 长度 / 角色一致性 / 光影描述 / 风格描述
4. **艺术性** (20%): 景别多样性 / 运镜多样性 / 光影层次 / 情绪曲线

**通过标准**：总分 ≥ 7.5 且各维度 ≥ 6.0

**反馈闭环**：未通过时生成 `systemFeedback`，返回上游修改

### 2.5 requirement-alignment-gate.js — 对齐闸机（~800 行）

**职责**：渲染前最后一道防线，确保产出与用户需求一致

**核心机制**：
- **需求契约提取**：从用户大纲提取"不可协商元素"
  - 角色契约 / 场景契约 / 动作契约 / 道具契约 / 情绪契约 / 核心情节
- **三阶段验证**：story-plan / pitch-winner / pre-render
- **自动阻断**：pre-render 评分 < 40 时阻止渲染
- **反向追溯**：从最终 prompt 反推是否包含原始故事

### 2.6 seedance-render-engine.js — 渲染引擎（~1,000 行）

**职责**：将 story-plan 的镜头批量提交到 Seedance API

**核心算法**：
- **片段合并**：将 shots 合并为 segments（≤15 秒，≤6 个镜头/片段）
- **Multi-Shot 决策**：判断每个 segment 是否适合 Multi-Shot
- **Prompt Token 估算**：中文字符≈1token，英文≈0.5token
- **降级策略**：429 时逐步缩短 prompt + 降低 motionStrength + 降低 cfgScale
- **下载目录三级 fallback**：ARK_SEEDANCE_SAVE_PATH → Desktop → Home → CWD

### 2.7 post-production.js — 后期合成（~2,000 行）

**职责**：从 raw-shots 到成片

**Stage 流水线**：
1. 素材校验：匹配 story-plan 中的镜头与实际文件
2. 动态转场：根据情绪变化自动选择（硬切/叠化/闪白/擦除/黑场）
3. 镜头排序 + ffmpeg 拼接
4. 调色（LUT）
5. 字幕 + 标题
6. 音画合成（4 层音轨：环境-20dB / 音效-10dB / 对白-3dB / 音乐-20dB）
7. 输出成片

### 2.8 sound-design.js — 声音设计（~800 行）

**职责**：为每个镜头规划完整音轨

**4 层音轨**：
- **环境音层（Ambience）**：空间氛围音（森林风声/城市车流/战场炮火）
- **音效层（SFX）**：动作音效（脚步声/打击声/爆炸声）
- **音乐层（Music）**：情绪配乐（史诗铜管/紧张弦乐/悲伤钢琴）
- **对白层（Dialogue）**：角色台词（旁白/对话/喊叫）

**15 种舞蹈音乐库**：街舞嘻哈 / 芭蕾古典 / 爵士摇摆 / 拉丁热情 / K-pop / 霹雳舞 / 探戈 / 华尔兹 / 弗拉门戈 / 机械舞 / 甩手舞 等

**情感声学映射**：情绪 → 频率特征 / 混响 / 空间感 / 动态 / 质感

### 2.9 seedance-wrapper.js — API 包装器（~1,500 行）

**职责**：豆包 Seedance API 的 Agent 原生状态管理

**关键特性**：
- **待办任务列表**：`.pending-tasks.json`，原子写（临时文件 + rename）
- **参数兼容层**：自动把 `--key=value` 拆分 + 下划线转中划线
- **安全 JSON 解析**：从混合输出中智能截取有效 JSON
- **三级下载目录 fallback**

### 2.10 StoryForge Pro — 专业剧本系统（~3,000 行 orchestrator.js）

**职责**：v5.6-Peng 后替代原 story-engine 的核心创作系统

**三种模式**：
- **原创模式** (`create`)：主题提炼 → 世界观 → 并行叙事层 → 情节编织 → 剧本层 → 组装 Universe
- **IP 重构模式** (`adapt`)：IP 解析五步 → 同原创流程
- **系列短剧模式** (`series`)：系列化架构 + 卡点设计 + 钩子工厂

**集成 PersonaVault + VoiceCraft**：角色灵魂铸造 + 声纹设计

---

## 三、系统特征总结

### 3.1 架构特征

| 特征 | 现状 |
|------|------|
| **执行模式** | 预定义 Phase 流水线，脚本式顺序执行 |
| **状态传递** | 文件系统 JSON（candidates.json → story-plan.json → shots 目录 → 成片） |
| **技能调用** | Shell spawn（`node xxx.js --arg1 --arg2`） |
| **并发模型** | 渲染严格单并发，StoryForge Pro 内有限并行（Promise.all） |
| **错误恢复** | Try-catch + 模型降级 + 最多 3 轮比稿循环 |
| **配置管理** | config-center.js 集中化（v5.6-Peng 引入） |

### 3.2 设计亮点

1. **情绪-运镜映射 (EMOTION_CAMERA_MAP)**：将抽象的"张力值"转化为具体的电影运镜指令
2. **比稿评测 + 反馈闭环**：用 LLM 生成多方案 → 自动化评测 → 选出最优 → 反馈上游
3. **对齐闸机**：渲染前最后一道质量防线，避免浪费 API 额度
4. **模型自动降级**：4 级 fallback + 429 降级策略
5. **动态转场**：根据情绪变化自动选择转场类型
6. **4 层音轨设计**：从无声视频片段到完整声画体验
7. **硬编码清理**：v5.5-Peng 开始系统性清理，v5.6-Peng 配置中心化

### 3.3 核心痛点（Claude Code 改造要解决的）

| # | 痛点 | 影响 |
|---|------|------|
| 1 | **Pipeline 僵化** | 固定 Phase 顺序，无法动态调整。某一步出错必须从头或人工干预 |
| 2 | **黑盒执行** | 全自动跑完，用户无法在关键节点介入决策 |
| 3 | **上下文溢出** | 长任务（25 镜头完整流程）无 Token 管理，可能溢出 |
| 4 | **无状态恢复** | 任务中断后无法 resume，必须从头开始 |
| 5 | **无跨会话记忆** | 每次生产独立，不积累"这个角色上次渲染失败了"的经验 |
| 6 | **有限并行** | 渲染串行或有限并发，25 个镜头逐个提交效率低 |
| 7 | **技能调用分散** | 16 个技能各自 CLI 入口，无统一接口 |
| 8 | **无 Agent 决策** | 所有决策在代码中硬编码（何时降级、何时重试），无动态规划 |

---

## 四、与 Claude Code 架构的差距映射

| Claude Code 组件 | Seedance 对应物 | 差距 |
|------------------|----------------|------|
| **Agent Loop** (`queryLoop`) | director.js Phase 流水线 | 🔴 固定顺序 vs 动态决策 |
| **Permission System** | 无 | 🔴 全自动 vs Human-in-the-loop |
| **Context Manager** (5层压缩) | 无 | 🔴 无 Token 管理 |
| **Tool Pool** (统一 Tool Interface) | Shell spawn CLI | 🟡 分散 CLI vs 统一 Schema |
| **State & Persistence** | 松散 JSON 文件 | 🟡 无 resume/fork/rewind |
| **Memory System** (CLAUDE.md) | 无 | 🟡 无跨会话学习 |
| **Agent Swarm** | 有限 Promise.all | 🟢 可扩展到 sessions_spawn |

---

## 五、改造优先级矩阵

| 优先级 | 模块 | 改造收益 | 实施复杂度 |
|--------|------|----------|-----------|
| 🔴 P0 | Agent Loop 核心 | 从 Pipeline 到动态决策，最大架构升级 | 中 |
| 🔴 P0 | Permission Gate | 关键决策点 Human-in-the-loop | 低 |
| 🔴 P0 | Context Manager | 解决长任务上下文溢出 | 中 |
| 🟡 P1 | Tool Pool 统一封装 | 16 个技能 → 统一 Tool Schema | 低 |
| 🟡 P1 | State Machine + 持久化 | resume / fork / rewind | 中 |
| 🟡 P1 | Memory System | 跨会话学习 + 自动经验积累 | 中 |
| 🟢 P2 | Agent Swarm | 并行渲染 25 镜头 | 中 |
| 🟢 P2 | Claude Code 交互模式 | 对话式生产（"再加一个特写镜头"） | 高 |

---

## 六、Claude Code 架构深度研究（第二份材料核心发现）

> 基于 Claude Code v2.1.88 泄露的 512,000 行 TypeScript 源码的深度逆向分析
> 来源：大鹏提供的《Seedance视频制作系统 × Claude Code架构升级方案》
> 日期：2026-05-15

### 6.1 核心数据：98.4%基础设施 vs 1.6%AI逻辑

| 子系统 | 代码占比 | 核心功能 |
|--------|---------|---------|
| 权限系统 + ML分类器 | ~20% | 七层安全机制、deny-first评估、自动模式分类 |
| 上下文管理 + 五层压缩 | ~18% | 上下文组装、渐进压缩、缓存感知优化 |
| 工具路由 + 54个工具 | ~15% | 工具池组装、MCP集成、去重处理 |
| 子代理委托 + 隔离 | ~12% | Worktree隔离、会话管理、仅摘要返回 |
| 会话持久化 + 恢复 | ~10% | 追加式JSONL、fork/resume、链修补 |
| 扩展架构（4种机制） | ~12% | Hooks、Skills、Plugins、MCP分层 |
| CLI/IDE界面层 | ~8% | 交互式CLI、无头模式、Agent SDK |
| Hook管道（27个事件） | ~3.4% | 生命周期事件、四种执行类型 |
| **Agent循环本身** | **~1.6%** | **模型调用、工具分发** |

### 6.2 九大架构模式 → 视频制作映射（镜面思想）

| 原始模式 | 视频领域映射 | 核心价值 |
|----------|-------------|----------|
| 确定性基础设施包围AI | 确定性渲染管线包围AI创意 | 创意失误不破坏生产管线 |
| 五层上下文压缩 | 五级素材分辨率管理 | 480p预览→4K成片渐进升级 |
| 三层内存架构 | 三级项目知识管理 | PROJECT.md + memory.md + topic文件 |
| 七层安全权限 | 七级内容安全审批 | 版权→合规→品牌→法律→伦理→质量→发布 |
| 子代理委托编排 | 制作角色委托编排 | 导演/摄影/剪辑/调色/声音/QA并行 |
| 成本感知设计 | 渲染成本感知调度 | CAPO度量（Cost-per-Accepted-Deliverable）|
| 追加式持久化 | 非破坏性编辑链 | 编辑事件追加，原始素材永不修改 |
| Feature Flag扩展 | 效果预设分层系统 | Hooks(零)→Skills(低)→Plugins(中)→MCP(高) |
| KAIROS后台守护 | 智能渲染农场守护 | 焦点感知渲染，15秒阻塞预算 |

### 6.3 实施路线图（v7.0 + v8.0）

**Phase 1（1-2月）— 基础设施升级：**
- PROJECT.md四级配置体系（Global/User/Project/Local）
- 追加式操作日志系统（非破坏性编辑链基础设施）
- 五级素材分辨率管理管道（代理文件→片段裁剪→智能缓存→缩略图投影→AI摘要）
- 工具注册三层结构（Always Active / Conditionally Active / Feature Flag-gated）

**Phase 2（2-3月）— 核心引擎改造：**
- Director Core Agent Loop重构（while-loop + 9步turn pipeline）
- 子Agent编排系统（Worktree隔离、摘要返回、权限单向棘轮）
- Context Manager五层压缩管道
- 安全权限前三层（Tool Pre-filtering / Deny-first Rules / Permission Modes）

**Phase 3（2-3月）— 扩展性架构：**
- 四层扩展机制完整实现（Hooks→Skills→Plugins→MCP）
- 安全权限后四层（ML Classifier / 渲染沙箱 / 会话不恢复 / Hook拦截）
- MCP协议适配层（双向工具暴露和消费）

**Phase 4（2-3月）— 智能化升级：**
- KAIROS Daemon（心跳驱动、焦点感知、Sleep/Wake经济节流）
- ML合规分类器（两阶段评估：快速过滤+详细分析）
- 多Agent协作网络（6角色：导演/编剧/分镜/选角/场景/配乐/QA）
- 持续学习系统（实时记忆捕获 / autoDream整合 / 跨项目风格迁移）

### 6.4 十三条设计原则视频领域适配

1. **Deny-first with Human Escalation** → 素材与操作默认拒绝，高风险渲染强制确认
2. **Graduated Trust Spectrum** → 七级审批模式渐进谱系（strict-review → standard → semi-auto → auto-preview → full-auto → bypass → internal）
3. **Defense in Depth** → 七级独立内容安全审批，单层可独立阻止
4. **Externalized Programmable Policy** → PROJECT.md + .seedance/rules/ + 生命周期Hook
5. **Context as Scarce Resource** → 五级素材分辨率渐进降级
6. **Append-only Durable State** → 非破坏性编辑链，支持任意点分叉回退
7. **Minimal Scaffolding, Maximal Harness** → 3% AI创意 + 97%确定性管线
8. **Values over Rules** → 上下文创意判断 + 确定性技术护栏
9. **Composable Multi-mechanism Extensibility** → 效果按成本分层
10. **Reversibility-weighted Risk Assessment** → 可逆操作轻监督，不可逆操作重监督
11. **Transparent File-based Config and Memory** → Markdown项目文件，人类可编辑审计
12. **Isolated Subagent Boundaries** → 角色Agent隔离，独立时间线分支
13. **Graceful Recovery and Resilience** → 分层渲染恢复（降级→重试→备用节点→分帧渲染）

### 6.5 预期收益量化

| 维度 | 当前状态 | 改造后目标 | 提升幅度 |
|------|----------|-----------|----------|
| 系统稳定性 | Pipeline单点故障 | Agent Loop + 5级恢复，弹性自愈 | **10倍提升** |
| 渲染成本 | 无成本感知，全分辨率输出 | 五级渐进质量 + 智能调度 | **降低50-80%** |
| 制作效率 | 单线程串行 | 多Agent并行 + StreamingToolExecutor | **提升3-5倍** |
| 内容安全 | 单层人工审批 | 七层独立审批 + ML分类器 | **风险降低90%** |
| 知识复用 | 无持久化，每次从零开始 | 三级知识管理 + 自修复记忆 | **质的飞跃** |

---

*两份材料融合完成。小G — 2026-05-15*
