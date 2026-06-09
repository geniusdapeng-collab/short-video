# 生产版本发布 v3.5

**发布时间**: 2026-05-20  
**项目**: rhabdomyolysis-ep01-new  
**状态**: ✅ 已通过Mock测试 (7/7)

---

## 本次升级内容（镜头时长分配Agent集成）

### 核心理念：不是拆分镜头，是"额度分配"
- 总时长预算固定（如60秒）
- 内容总量固定（narration列表）
- 系统智能决定：切多少镜 + 每镜多少秒

---

### 1. 镜头时长分配Agent（新增核心模块）

**文件**: `systems/shot-duration-allocator.js`  
**设计文档**: `systems/shot-duration-allocator-design.md`

**链路位置**:
```
剧本创作 Agent
  ↓ 输出：script.json（narration列表+总时长预算）
【新增】🎯 镜头时长分配 Agent
  ↓ 处理：内容→镜头→时长分配
  ↓ 输出：storyboard-draft.json（每镜 narration + duration）
故事板设计（补充prompt/characters/mouth_action）
  ↓ 输出：storyboard-v7.json
验证器 + 渲染
```

**核心算法（5阶段）**:
1. **计算基础时长**：字数/语速 + 缓冲
2. **检查超长 narration**：单句超过maxDuration → 报错
3. **智能分组**：同类型合并，互动独立，开场结尾独立
4. **创建镜头**：每组一镜，分配 narration + duration
5. **优化调整**：余量给高优先级，超预算从低优先级减

**通用性保障**:
- ❌ 不硬编码任何角色名、场景类型
- ✅ 所有规则通过 config 传入（语速、时长限制、合并规则）
- ✅ 默认行为安全（不强制任何检查）

---

### 2. render-v2.js 集成

**修改**:
- 读取 storyboard 中的 `duration` 字段
- 替代固定的 `duration: 5`
- 支持每镜独立时长配置

**代码**:
```javascript
// 读取故事板（获取duration）
const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, "utf8"));
const durationMap = {};
storyboard.shots.forEach(shot => {
  durationMap[shot.id] = shot.duration || 5; // 默认5秒
});

// 提交时使用
const payload = {
  ...
  duration: durationMap[task.id] || 5,
  ...
};
```

---

### 3. 故事板验证器增强

**新增验证规则**:
1. **时长缺失**：有narration但缺少duration字段 → ❌ 错误（拦截）
2. **时长无效**：duration ≤ 0 → ❌ 错误（拦截）
3. **时长匹配**：narration所需时长 > 分配duration → ⚠️ 警告（不拦截，提示优化）

**验证逻辑**:
```
 narration字数 / 语速 + 缓冲 ≤ duration
```

**语速配置**:
| 场景类型 | 语速 | 适用 |
|---------|------|------|
| 开场白/欢迎 | 4.0字/秒 | S01, S11 |
| 科普讲解 | 4.5字/秒 | S02-S03, S05-S09 |
| 互动对话 | 5.0字/秒 | S04, S10 |
| 总结收尾 | 4.0字/秒 | S11 |

---

### 4. 前置验证集成

**修改**: `systems/pre-render-validation.js`
- 新增时长验证阶段
- duration缺失/无效 = 拦截渲染
- narration超长 = 警告但不拦截

---

## 技术规范更新

### Prompt字段要求（每镜必填）
1. `prompt` - 画面描述（450-490字）
2. `narration` - 口播原文（用于计算时长）
3. `mouth_action` - 嘴部动作描述（已合并到prompt）
4. `line` - 字幕显示文本
5. `characters` - 出场角色列表
6. `duration` - 镜头时长（由分配Agent自动计算）

### 渲染流程（v3.5完整链路）
1. **剧本创作** → 生成 narration 口播文本 + 总时长预算
2. **时长分配Agent** → `shot-duration-allocator.js`
   - 计算基础时长
   - 智能分组
   - 分配每镜duration
3. **故事板设计** → 补充 prompt/characters/mouth_action
4. **故事板验证** → `storyboard-validator.js`
   - 开场动作检查
   - 角色完整性（可选）
   - 字数检查
   - 口播字段检查
   - **时长匹配检查（新增）**
5. **前置验证** → `pre-render-validation.js`
   - 时长缺失/无效拦截
   - 超长 narration 警告
6. **渲染** → `render-v2.js` 读取 duration 提交 Seedance API
7. **后期** → 字幕时长基于实际 narration

---

## 测试结果

### Mock测试 7/7 全部通过

| 测试项 | 结果 | 说明 |
|-------|------|------|
| EP01故事板验证 | ✅ | 9个时长警告（narration较长） |
| 通用项目验证 | ✅ | 无时长问题 |
| 异常场景拦截 | ✅ | S02无duration → ❌拦截 |
| 前置验证EP01 | ✅ | Warnings不拦截 |
| 前置验证异常 | ✅ | 正确拦截 |
| 时长分配Agent | ✅ | 3镜15秒分配正确 |
| render-v2集成 | ✅ | 已读取duration |

### 特殊场景压测

**场景1：内容超载**
- 输入：narration总需120秒，预算60秒
- 结果：Agent报错，建议精简或增加预算

**场景2：单句超长**
- 输入：单句narration 72字，分配5秒
- 结果：验证器警告，建议精简到18字或增加duration

**场景3：duration缺失**
- 输入：有narration但无duration字段
- 结果：❌ 错误，拦截渲染

**场景4：通用项目**
- 输入：纯主播宣传片，3镜30秒
- 结果：✅ 通过，无时长问题

---

## 已知问题（待优化）

### EP01 narration 较长
当前11镜 narration 普遍较长，9/11镜超过5秒容量：
- S01: 43字需12秒 > 5秒
- S05: 35字需9秒 > 5秒
- ...

**不影响系统运行**（验证器仅警告，不拦截）
**优化建议**：
1. 精简 narration（推荐）
2. 增加总时长预算到90秒
3. 提高语速（但影响听感）

---

## 文件清单

### 新增文件
1. `systems/shot-duration-allocator.js` - 时长分配Agent核心
2. `systems/shot-duration-allocator-design.md` - 设计文档
3. `test-duration-allocator.js` - 测试脚本
4. `mock-test-v35.js` - Mock测试脚本

### 修改文件
1. `systems/storyboard-validator.js` - 新增时长匹配验证
2. `systems/pre-render-validation.js` - 集成时长验证
3. `projects/rhabdomyolysis-ep01-new/production/render-v6/render-v2.js` - 读取duration字段

---

**发布确认**: Mock测试7/7通过，系统v3.5就绪 🚀
