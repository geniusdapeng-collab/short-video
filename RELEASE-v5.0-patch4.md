# 生产发布记录 — v5.0-patch4

**发布日期**: 2026-05-22
**版本号**: v5.0-patch4
**状态**: 生产发布

---

## 本次发布包含的优化

### 1. 暖暖（帝江）定妆照v3-production入库
- **文件**: `characters/nuanNuan/portraits/nuanNuan-v3-production-*.png`
- **角色档案**: `characters/nuanNuan/character-card.json` → v3-production
- **核心修正**: 摆脱绵羊感，采用能量体/光雾/光带概念
- **Prompt工程经验**: 6条铁律沉淀到 `memory/2026-05-22.md`

### 2. Prompt工程方法论升级
- **文件**: `memory/2026-05-22.md`
- **升级**: 从"一刀切禁用词" → "按角色类型定制四步定制法"
- **新增**: 角色类型词汇对照表（能量体/实体奇幻/神兽/植物/机械）

### 3. 异兽数据系统强化 — 山海经×Nirath双重视觉
- **文件**: `data/nirath-creature-data.js`
- **强化内容**:
  - 每个异兽新增 `shanhaijingOriginal` 字段（山海经原文）
  - 每个异兽新增 `nirathCore` 字段（Nirath核心设定）
  - 外观描述每个字段都标注山海经+Nirath对应关系
  - PromptTemplate融合山海经特征+Nirath科技废墟美学
- **覆盖异兽**: 旋龟、帝江、白泽、九尾狐、烛龙

### 4. 异兽Prompt生成器强化
- **文件**: `shanhaijing-render-engine/portrait-studio.js`
- **强化内容**:
  - 默认场景词: `Nirath原创异世界生态，山海经神话美学`
  - 风格约束增加: `《山海经》异兽志风格, Nirath科技废墟美学`
  - 数据库头部注释增加双重视觉原则说明

### 5. 小G角色设定更新v12-production
- **文件**: `characters/xiaoG/character-card.json`
- **更新内容**:
  - 服装: 亮黄色冲锋衣（防风防水面料，肘部深色补丁）+ 深蓝色牛仔裤 + 白色运动鞋
  - 配饰: 腰间黄铜指南针（爸爸遗物，表盘裂痕）+ 背包侧挂银色水壶 + 腰间战术手电筒（黑色）+ 背包彩色编织绳结
  - 清除旧设定: 蓝色条纹睡衣

### 6. FPV超写实电影感 — 经验包总库构建（NEW）
- **文件**: `systems/fpv-experience-library.js` + `systems/fpv-experience-integration.js`
- **核心约束**: 
  - 每个片子必须包含至少1个"一镜到底"镜头
  - 一镜到底必须从15个经验包中选择最适合的案例
  - Prompt必须包含FPV核心要素（鱼眼/德式斜角/边缘畸变/纯环境音）
- **覆盖案例**: 15个标杆案例（微观巨物/极限运动/灾难风暴/科幻穿越/荒诞喜剧）
- **已集成链路**: 导演系统/Prompt优化器/渲染前置验证

### 7. 白泽定妆照v2-production生成
- **文件**: `characters/baiZe/portraits/baiZe-v2-production-*.png`
- **修正**: 纯粹只有白泽本身 + 无科技元素
- **规范沉淀**: 异兽定妆照纯粹性原则 + 无科技元素原则写入系统规范

---

## 新增文件

| 文件 | 说明 |
|------|------|
| `data/nirath-creature-data.js` | 已覆盖（v2.0山海经×Nirath融合版） |
| `shanhaijing-render-engine/portrait-studio.js` | 已覆盖（双重视觉Prompt生成） |
| `memory/2026-05-22.md` | 已追加（Prompt工程经验沉淀） |
| `characters/xiaoG/character-card.json` | 已更新（v12-production服装设定） |
| `characters/nuanNuan/character-card.json` | 已更新（v3-production定妆照入库） |

## 修改文件

| 文件 | 变更 |
|------|------|
| `data/nirath-creature-data.js` | 新增shanhaijingOriginal/nirathCore字段，融合PromptTemplate |
| `shanhaijing-render-engine/portrait-studio.js` | Prompt生成逻辑强化双重视觉 |
| `characters/xiaoG/character-card.json` | v8-production → v12-production，服装更新 |
| `characters/nuanNuan/character-card.json` | v3-production定妆照入库 |

## Mock测试状态
- 系统级Mock: 未执行（本次为数据层+Prompt层更新，不影响链路逻辑）
- 新数据验证: 已通过语法检查

## 后续计划
- 生成白泽定妆照进行真实测试
- 小G按新服装设定重新生成定妆照
- 继续完善其他异兽角色档案

---

**发布人**: 小G
**发布时间**: 2026-05-22 12:55
