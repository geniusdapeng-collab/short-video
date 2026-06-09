# 2026-05-22 系统级底层修复计划（路径2）

## 目标
从底层源码开始修复《山海经：帝江传》EP01的prompt模板化问题，让场景库DNA真正驱动差异化prompt构建。

## 发现的5个底层问题

### 问题1：buildPrompt() 模板化根因
- 文件：`orient-primordial-core-v24.js` 第720行
- 根因：`cinematicBuilder.build()` 不管传什么narration/scene，永远输出4要素模板（景别+运镜+光照+情绪）
- 影响：12镜prompt高度雷同，只有景别和情绪不同

### 问题2：场景库DNA未融入Prompt构建
- 文件：`orient-primordial-core-v24.js` Step 3/5
- 根因：场景库50KB完整数据已加载，但只用了background/materials/lighting，且被压缩到30-50字符
- 影响：孢子水母、银色湖泊、双恒星交织等特异性元素未充分进入prompt

### 问题3：运镜是"追加"不是"融入"
- 文件：`nirath-master-pipeline.js` stageRender()
- 根因：先生成prompt，再追加上去，超标时被截断
- 影响：运镜描述首当其冲被砍

### 问题4：Master Params开头注入侵占空间
- 文件：`orient-primordial-core-v24.js` buildPrompt() Step 1
- 根因：一上来注入200字符，留给场景/材质/背景的空间只剩780字符
- 影响：背景丰富化描述被严重压缩

### 问题5：人物锚定和场景描述完全分离
- 文件：`nirath-master-pipeline.js` + `di-jiang-ep01-v3-produce.js`
- 根因：Master Pipeline输出模板化prompt，脚本层只能后期覆盖
- 影响：两层逻辑冲突，v3脚本覆盖导致Stage-8对齐度0%

## 修复方案

### 修复1：重写buildPrompt() — 场景DNA驱动差异化
- 废弃`cinematicBuilder.build()`的4要素模板
- 改为根据`type`（opening/environment/discovery/interaction/closing）构建差异化结构
- 每个type有独立的prompt构建逻辑

### 修复2：场景库DNA前置融入
- 将background/materials从Step 3/5提前到Step 1
- 根据场景名直接提取特异性元素
- 场景描述占prompt空间的30-40%

### 修复3：运镜融入Prompt构建流程
- 修改`buildPrompt()`接收`movement`参数
- 构建时就融入运镜，不是后期追加

### 修复4：Master Params位置后移
- 从技术参数前部移到尾部
- 优先保证场景描述、人物动作、运镜核心空间

### 修复5：人物锚定融入角色系统
- 修改`CharacterPromptBuilder`
- Stage-4就注入面部锚定

## 修改文件清单
1. `shanhaijing-render-engine/orient-primordial-core-v24.js` — 重写buildPrompt()
2. `systems/camera-movement-system-v2.js` — 融入方式修改
3. `systems/nirath-master-pipeline.js` — stageRender()修改
4. `systems/character-prompt-builder.js` — 面部锚定融入

## 状态
- [ ] 修复1完成
- [ ] 修复2完成
- [ ] 修复3完成
- [ ] 修复4完成
- [ ] 修复5完成
- [ ] Mock测试验证
- [ ] 生产发布
