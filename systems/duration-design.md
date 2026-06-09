# 口播内容与时长分配系统设计方案

## 问题分析

**问题1：narration 在哪个环节生成？**
- 当前：台词散落在各处，没有统一的 `narration` 字段
- 需要：明确链路中哪个环节负责生成口播内容

**问题2：时长固定5秒，无视内容长短**
- 当前：每镜固定5秒，不管台词是10字还是50字
- 需要：根据 narration 字数动态计算每镜时长

---

## 完整链路设计

```
【剧本创作 Script Creation】
  ↓ 输出：script.json（含 narration_lines[] 口播文本）
  
【故事板设计 Storyboard Design】
  ↓ 分配 narration → 每镜字段
  |   - narration：口播原文（新增字段）
  |   - line：字幕显示文本（可精简）
  |   - mouth_action：嘴部动作描述
  |   - duration：镜头时长（自动计算）
  
【时长计算 Duration Calculator】（新增环节）
  ↓ 输入：narration 文本
  ↓ 计算：字数 / 语速 = 基础时长
  ↓ 约束：clamp(向上取整, 最小3秒, API最大限制)
  ↓ 输出：duration（整秒）
  
【验证环节 Storyboard Validator】
  ↓ 检查项：
  |   ✅ mouth_action 已设置
  |   ✅ 角色完整性
  |   |   ✅ narration 与 duration 匹配（新增）
  |   |   ✅ 字数合规（450-490字）
  |   
【渲染环节 Rendering】
  ↓ 使用计算出的 duration 提交 Seedance API
  |   - 不再是固定5秒
  |   - 每镜根据内容长短动态分配
  
【后期环节 Post-Production】
  ↓ 字幕时长 = narration 实际时长
  ↓ 总视频时长 = sum(每镜duration)
```

---

## 时长计算规则

### 语速标准
| 场景类型 | 语速 | 适用 |
|---------|------|------|
| 开场白/欢迎 | 4.0字/秒 | S01 |
| 科普讲解 | 4.5字/秒 | S02-S03, S05-S09 |
| 互动对话 | 5.0字/秒 | S04, S10 |
| 总结收尾 | 4.0字/秒 | S11 |

### 计算公式
```
基础时长(秒) = narration字数(不含标点) / 语速(字/秒)
实际时长 = clamp(ceil(基础时长), 3秒, MAX_API_DURATION)

如果 基础时长 > MAX_API_DURATION:
  ⚠️ 警告：narration过长，无法在当前镜头内说完
  💡 建议：
    1. 精简 narration 到 MAX_API_DURATION * 语速 字以内
    2. 拆分为多镜（推荐）
```

### API限制
- Seedance 2.0 当前最大支持 **5秒**
- 如果计算结果 > 5秒，系统发出警告

---

## EP01当前问题分析

### S01 narration
```
"AI主播小陈，继续给大家讲解健康科普知识。今天我们来聊聊一个和运动密切相关的健康问题——横纹肌溶解。"
```
- **字数**：约40字
- **语速**：4.0字/秒（开场白偏慢，亲切感）
- **计算**：40 / 4.0 = **10秒** ❌ 远超API限制
- **问题**：5秒内绝对说不完！

### S02 narration
```
"横纹肌溶解，简单来说，就是我们的肌肉细胞发生了破裂。"
```
- **字数**：约20字
- **语速**：4.5字/秒
- **计算**：20 / 4.5 = **4.4秒** → 向上取整 **5秒** ✅

### S03 narration
```
"肌肉里的蛋白质和有害物质，漏到了血液里。"
```
- **字数**：约16字
- **语速**：4.5字/秒
- **计算**：16 / 4.5 = **3.6秒** → 向上取整 **4秒** ✅

---

## 修复建议

### 方案A：精简 narration（保持11镜）
将过长的 narration 精简到5秒内能说完：

| 镜号 | 原narration字数 | 建议精简后 | 精简后字数 | 计算时长 |
|------|----------------|-----------|-----------|---------|
| S01 | 40字 | "大家好，今天聊聊横纹肌溶解。" | 12字 | 3秒 ✅ |
| S02 | 20字 | "横纹肌溶解，就是肌肉细胞破裂。" | 14字 | 4秒 ✅ |
| S03 | 16字 | "蛋白质和有害物质漏到血液里。" | 14字 | 4秒 ✅ |
| S05 | 32字 | "第一个信号：肌肉酸痛无力。" | 12字 | 3秒 ✅ |

### 方案B：分镜拆分（保持完整 narration）
将长 narration 拆分到多镜：

```
原S01: "AI主播小陈，继续给大家讲解健康科普知识。今天我们来聊聊一个和运动密切相关的健康问题——横纹肌溶解。" (40字→10秒)

拆分为：
S01a: "大家好，我是AI主播小陈。" (10字→3秒)
S01b: "今天讲解横纹肌溶解。" (9字→3秒)
S01c: "一个和运动密切相关的健康问题。" (14字→4秒)
```

---

## 系统字段规范（v3.5）

### 每镜必填字段
```json
{
  "id": "S01",
  "narration": "口播原文（用于计算时长和配音）",
  "line": "字幕显示文本（可精简或加动作描述）",
  "mouth_action": "嘴部动作描述",
  "duration": 5,
  "characters": ["chen-nurse"],
  "prompt": "画面描述...",
  "chineseCharCount": 478
}
```

### 时长计算流程
```javascript
// 1. 计算字数（不含标点）
const charCount = narration.replace(/[^\u4e00-\u9fff]/g, '').length;

// 2. 根据场景选择语速
const speedMap = {
  'host': 4.0,      // 开场
  'explanation': 4.5, // 讲解
  'interaction': 5.0, // 互动
  'summary': 4.0    // 总结
};
const speed = speedMap[shot.type] || 4.5;

// 3. 计算时长
const baseDuration = charCount / speed;
const duration = Math.min(Math.max(Math.ceil(baseDuration), 3), MAX_DURATION);

// 4. 检查是否超限
if (baseDuration > MAX_DURATION) {
  console.warn(`${shot.id}: narration ${charCount}字需要${Math.ceil(baseDuration)}秒，超过API限制${MAX_DURATION}秒`);
  // 建议精简或拆分
}
```

---

## 实施计划

1. **新增 duration-calculator.js** - 时长计算系统
2. **更新 storyboard 结构** - 添加 `narration` 字段
3. **更新 validator** - 检查 narration 与 duration 匹配
4. **更新 render-v2.js** - 使用动态 duration
5. **更新 EP01 storyboard** - 精简 narration 或拆镜

---

**结论**：当前EP01的 narration 普遍过长（S01 40字需要10秒），需要精简或拆分。建议采用**方案A精简 narration**，保持11镜结构，每镜5秒内能说完。