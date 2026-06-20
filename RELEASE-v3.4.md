# 生产版本发布 v3.4

**发布时间**: 2026-05-20  
**项目**: rhabdomyolysis-ep01-new  
**状态**: ✅ 已通过Mock测试

---

## 本次升级内容（3大系统级修复）

### 1. 口播动作字段 mouth_action（新增）

**问题**: 视频人物嘴部静止，没有"说话"的感觉  
**解决**: 每镜新增 `mouth_action` 字段描述嘴部动作

**字段设计:**
```json
{
  "id": "S01",
  "mouth_action": "嘴部微微张开正在自然说话自我介绍，口型动作柔和亲切，嘴角上扬微笑",
  "prompt": "..."  // mouth_action 已合并到 prompt
}
```

**规则:**
- 所有镜头必须设置 `mouth_action`
- 描述嘴部动作 + 表情状态
- 合并到 prompt 末尾，确保视频生成时嘴巴在动

---

### 2. 开场白动作强制检查（修复）

**问题**: S01开场只有静态站立，没有开场白动作  
**解决**: 验证器自动检测开场镜头动作

**检测规则:**
- 开场镜头必须有"打招呼/说话/手势"动作
- 禁止纯静态描述（"双手交叠"/"端庄站立"）
- 未通过=渲染拦截

**S01修复:**
- ❌ 删除: "双手自然交叠放在身前腹部位置"、"端庄站立"
- ✅ 新增: "右手抬起做打招呼手势"、"嘴部微微张开正在说话介绍"、"头部微微前倾像在欢迎观众到来"

---

### 角色完整性自动验证（修复）

**问题**: 李明教练在EP01中0出场  
**解决**: 渲染前检查必需角色是否出场

**⚠️ 通用性设计（重要修正）:**
- **角色检查是可选的**，由项目配置决定，不是强制规则
- 通用项目（宣传片/纯主播）**不需要配置必需角色**
- 只有配置了 `projectConfig.requiredCharacters` 的项目才会检查

**配置方式:**
```json
{
  "projectConfig": {
    "requiredCharacters": ["chen-nurse", "xiaoG", "coach-li"],
    "description": "横纹肌溶解科普：主播+小G互动+教练演示",
    "type": "health-education"
  }
}
```

**EP01修复:**
- S04（小G提问）: 加入李明教练站在身后
- S10（小G确认）: 加入李明教练站在身后

**通用项目示例（不强制教练）:**
```json
{
  "projectConfig": {
    "requiredCharacters": ["host-a"],
    "type": "promo"
  }
}
```

---

## 新增系统文件

1. `systems/storyboard-validator.js` - 故事板审核器（v3.4增强）
   - 新增 `validateMouthAction()` 口播字段检查
   - **角色检查改为可选配置**（由 `projectConfig.requiredCharacters` 决定，未配置则跳过）
   - 原有5项检查保留

2. `systems/pre-render-validation.js` - 渲染前置验证
   - 自动拦截不合规故事板
   - 支持 `--skip-validation` 强制渲染
   - **默认不强制角色检查**（除非显式传入 `requiredCharacters`）

3. `systems/duration-calculator.js` - 时长计算器（v3.4新增）
   - 根据 narration 字数 + 场景语速自动计算镜头时长
   - 支持 `host`/`explanation`/`interaction`/`symptom`/`lab`/`summary` 等场景类型
   - 检测 narration 是否能在 API 限制内说完

4. `mock-test-v34.js` - Mock测试脚本
   - 4项系统级验证
   - 不调用真实API

## 修改文件

1. `render-v2.js` - 集成前置验证
2. `storyboard-v6.json` - 新增mouth_action + 修复S01/S04/S10
3. `render-tasks.json` - 同步更新（含coach参考图）

---

## 验证结果

```
✅ 故事板验证（含mouth_action+角色完整）- 通过
✅ 渲染任务生成（角色参考+字数合规）- 通过
✅ 前置验证拦截 - 通过
✅ Prompt嘴部动作 - 通过

通过: 4/4 | 失败: 0/4
```

---

## 技术规范更新

### Prompt字段要求（每镜必填）
1. `prompt` - 画面描述（450-490字）
2. `narration` - 口播原文（用于计算时长和后期配音）
3. `mouth_action` - 嘴部动作描述（已合并到prompt）
4. `line` - 字幕显示文本（可精简或加动作描述）
5. `characters` - 出场角色列表
6. `duration` - 镜头时长（由 duration-calculator 自动计算）

### 角色出场要求（可选配置）
- 通用项目：不配置 `projectConfig.requiredCharacters`，不强制检查
- 多角色项目：配置 `projectConfig.requiredCharacters`，未出场角色=❌拦截
- 示例配置：
  - 纯主播宣传：`["host-a"]`
  - 家庭互动：`["parent", "child"]`
  - 科普三人组：`["chen-nurse", "xiaoG", "coach-li"]`

### 时长计算规则
| 场景类型 | 语速 | 适用 |
|---------|------|------|
| 开场白/欢迎 | 4.0字/秒 | S01, S11 |
| 科普讲解 | 4.5字/秒 | S02-S03, S05-S09 |
| 互动对话 | 5.0字/秒 | S04, S10 |
| 总结收尾 | 4.0字/秒 | S11 |

**公式：** `duration = ceil(narration字数 / 语速 + 0.5秒缓冲)`
**约束：** `clamp(duration, 3秒, API最大限制)`

### 渲染流程（v3.4完整链路）
1. **剧本创作** → 生成 narration 口播文本
2. **故事板设计** → 
   - 设置 `narration`（口播原文）
   - 设置 `mouth_action`（嘴部动作）
   - 配置 `projectConfig.requiredCharacters`（必需角色，可选）
3. **时长计算** → `duration-calculator.js` 自动分配每镜时长
4. **故事板验证** → `storyboard-validator.js` 审核
5. **前置验证** → `pre-render-validation.js` 拦截（可选跳过）
6. **渲染** → 使用动态 duration 提交 Seedance API
7. **后期** → 字幕时长 = narration 实际时长

---

## 通用性测试

### 测试1: EP01（配置必需角色）
```
✅ 开场动作: 通过
✅ 角色完整性: chen-nurse(11), xiaoG(2), coach-li(2)
✅ 口播字段: 11/11镜
✅ 字数合规: 11/11镜
```

### 测试2: 通用项目（无必需角色配置）
```
✅ 开场动作: 通过
ℹ️  角色检查: 未配置必需角色，跳过
✅ 口播字段: 通过
```

**结论：系统具备通用性，不强制任何特定角色出场。**

---

## 后续使用

**跑新任务时（EP02+）:**
1. 设计故事板时确保所有角色出场
2. 每镜添加 `mouth_action` 描述
3. 运行Mock测试验证
4. 系统会自动拦截常见问题

**EP01修复状态:**
- S01: 已修复（开场动作）
- S04: 已修复（加入教练）
- S10: 已修复（加入教练）
- 全部11镜: 已设置 `mouth_action`

---

**发布确认**: Mock测试4/4通过，系统v3.4就绪 🚀

---

## 镜头时长分配Agent（v3.4-preview）

**状态**: 设计完成，等待队长确认后集成

### 设计理念
- **不是拆分镜头，是"额度分配"**
- 总时长预算固定，内容总量固定
- 系统智能决定：切多少镜 + 每镜多少秒

### 链路位置
```
剧本创作 Agent
  ↓ 输出：script.json
【新增】镜头时长分配 Agent
  ↓ 输出：storyboard-draft.json（每镜 narration + duration）
故事板设计（补充prompt/characters/mouth_action）
  ↓ 输出：storyboard-v7.json
验证器 + 渲染
```

### 核心算法
1. **计算基础时长**：字数/语速 + 缓冲
2. **检查超长 narration**：单句超过API限制→报错
3. **智能分组**：同类型合并，互动独立，开场结尾独立
4. **创建镜头**：每组一镜，分配 narration + duration
5. **优化调整**：余量给高优先级，超预算从低优先级减

### 文件
- `systems/shot-duration-allocator-design.md` - 设计文档
- `systems/shot-duration-allocator.js` - Agent核心代码
- `test-duration-allocator.js` - 测试脚本

### 测试结果
- 通用项目（30秒）：✅ 4镜20秒通过
- EP01（60秒）：⚠️ 检测到2句超长 narration（N02 23字→6秒，N09 27字→7秒）

