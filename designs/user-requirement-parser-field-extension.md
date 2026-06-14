# v6.6.0 字段扩展计划

## 新增字段在各 Stage 的消费

### 1. `platform` (投放平台)
**影响 Stage**: Stage 2 (需求对齐), Stage 11 (渲染画幅)
**消费方式**:
- Stage 2: 验证平台与画幅比例一致性
- Stage 11: 根据平台选择默认画幅（抖音→9:16, B站→16:9）

### 2. `narrativeMode` (叙事方式)
**影响 Stage**: Stage 5 (剧本生成)
**消费方式**:
- dialogue: 对话式剧本（陈卓讲解模式）
- narration: 旁白式剧本（纪录片模式）
- drama: 剧情式剧本（短剧模式）
- interview: 访谈式剧本（采访模式）

### 3. `visualStyle` (视觉风格)
**影响 Stage**: Stage 11 (渲染核心)
**消费方式**:
- 在视觉提示词中注入风格描述
- 与 creativeIntensity 叠加，影响创意指数模块激活

### 4. `musicStyle` (音乐风格)
**影响 Stage**: Stage 15 (后期处理)
**消费方式**:
- 影响音乐和音效推荐
- 在 post-production 中注入音乐风格指令

### 5. `styleModifiers` (辅助风格)
**影响 Stage**: Stage 11 (渲染核心)
**消费方式**:
- 影响创意指数模块的附加激活
- 如 +LUX 激活奢华感模块，+VIV 激活活力感模块

### 6. `endingStyle` (结尾处理)
**影响 Stage**: Stage 5 (剧本生成)
**消费方式**:
- summary: 总结式结尾
- cliffhanger: 悬念式结尾（短剧）
- callToAction: 行动号召式结尾（广告）
- emotional: 情感升华式结尾
- open: 开放式结尾

---

## 实现优先级

| 字段 | 影响 Stage | 复杂度 | 优先级 |
|------|-----------|--------|--------|
| narrativeMode | Stage 5 | 中 | P1 |
| endingStyle | Stage 5 | 低 | P1 |
| platform | Stage 2, 11 | 低 | P2 |
| visualStyle | Stage 11 | 中 | P2 |
| styleModifiers | Stage 11 | 中 | P2 |
| musicStyle | Stage 15 | 低 | P3 |
