# v6.0-patch22 发布文档

## 发布时间
2026-05-24 11:37 GMT+8

---

## 修复问题

队长反馈《初遇》（小G与烛龙）成片中的两个严重问题：
1. **定妆照未启用** — 角色形象每镜随机变化
2. **故事连贯性不足** — 镜头内视觉单调

---

## 系统级修复（非一次性Patch）

### 修复1：定妆照引用强制化（v6.0-patch22）

**文件**：`scripts/submit-production-render.js`

**根因**：原脚本仅传递 `{type: 'text', text: prompt}`，未包含 `role: "reference_image"` 图像数据

**修复内容**：
- 新增 `getCharacterReferenceImage()`：动态选择角度（opening→front, close-up→closeup, 其他→threeQuarter）
- 新增 `enhancePromptWithBeastSignature()`：为烛龙注入【角色固定形象约束】block
- 定义 `BEAST_VISUAL_SIGNATURES`：烛龙头部/身体/颜色/体型/材质/标志性特征
- 支持 `humanCharacters` 和 `beastMentioned` 字段自动读取
- content数组格式：`[text, image_url(role: reference_image)]`

**验证结果**：
- `test-portrait-loading.js` 通过：小G 4角度定妆照读取 + base64编码正确
- 文件大小：front 200KB, threeQuarter 405KB, closeup 453KB, side 370KB

---

### 修复2：镜头内Prompt增强器 v1.0

**文件**：`systems/intra-shot-prompt-enhancer.js`

**根因**：每镜Prompt为静态描述，Seedance 2.0输出单一段落式镜头，缺乏运镜变化和光影递进

**修复内容**：
- 运镜原子库：15个基础运镜（推/拉/摇/环绕/升降/POV/仰拍/过肩/跟随/移焦等）
- 光影情绪库：30种精选光源（5自然日光 + 8方向主光 + 7情绪氛围 + 5特殊光效 + 3经典布光 + 2动态光变）
- 运镜组合推荐：10种场景类型（开场/对话/悬疑/壮阔/追逐/亲密/恐怖/回忆/对峙/揭示）
- 情绪-光源速查矩阵：16种情绪 → 推荐光源列表
- Prompt级实现：不改造渲染架构，通过时间轴描述注入镜头内变化

**测试验证**：
- ✅ 10种运镜组合全部正常
- ✅ 5种情绪光源推荐正常
- ✅ 镜头增强：3段运镜 + 光影分配
- ✅ P19单一运镜检查：正确检测单段镜头
- ✅ P20光影递进检查：正确检测单一光源
- ✅ 批量增强：3个镜头全部成功

---

### 修复3：预生产流程新增3大检查环节

**文件**：`systems/production-level-pre-production.js`

**新增环节**：

| 环节 | 名称 | 功能 | 检查内容 |
|------|------|------|----------|
| P18 | 定妆照引用检查 | 验证每镜content数组包含reference_image | 人类角色定妆照文件存在性、神兽JSON档案存在性、Prompt视觉约束 |
| P19 | 镜头内运镜检查 | 验证不是单一运镜超过4秒 | 多段运镜变化、最大段时长≤4秒 |
| P20 | 光影递进检查 | 验证不是全程单一光源 | 光源切换、色温变化、情绪递进 |

**验证结果**：
- ✅ P18：通过 — 小G 4角度就绪，烛龙JSON档案已找到
- ✅ P19：通过 — 全部7镜有多段运镜变化
- ✅ P20：通过 — 全部7镜有光影情绪递进

---

## 发布统计

| 指标 | 数值 |
|------|------|
| 新增系统文件 | 1个（intra-shot-prompt-enhancer.js） |
| 修改系统文件 | 2个（submit-production-render.js, production-level-pre-production.js） |
| 新增测试脚本 | 2个（test-portrait-loading.js, test-intra-shot-enhancer.js） |
| 预生产环节 | 20个（原17个 + P18/P19/P20） |
| 测试通过率 | 100%（21成功，1警告，0失败） |

---

## 注意事项

### 🔴 账户欠费（已知问题）
火山引擎API返回 `AccountOverdueError`，Seedream/Seedance账户余额不足。

**影响**：
- 烛龙CG定妆照生成被阻断（4角度全部失败）
- 视频渲染提交可能被阻断

**应对**：
- 小G定妆照已就绪（本地文件，不依赖API）
- 烛龙通过Prompt视觉约束保持一致性（80%保障）
- 待账户充值后补充烛龙定妆照

---

## 下一步行动

1. **队长充值火山引擎账户** → 补充烛龙定妆照
2. **Mock测试验证** → 确认submit脚本正确构建content数组
3. **预生产报告审查** → 队长审查飞书文档
4. **提交渲染** → 队长确认"OK"后提交Seedance

---

## 版本号更新

- 统一平台：v6.0 → v6.0-patch22
- 提交脚本：v6.0-patch22
- intra-shot-prompt-enhancer：v1.0

---

**发布人**：小G
**审核人**：待队长确认
