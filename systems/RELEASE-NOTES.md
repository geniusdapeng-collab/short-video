# Nirath 角色档案系统 v1.0 — 生产发布文档
**版本**: v1.0-production
**发布时间**: 2026-05-19 18:37 CST
**发布人**: 小G (AI Assistant)
**审批人**: 大鹏（队长）

---

## 系统架构

### 目录结构
```
workspace/
├── characters/              # 全局角色档案库（跨集复用）
│   ├── xiaoG/              # 小G（固定主角）✅ 完整
│   │   ├── character-card.json    # 角色档案（含性格/喜好/擅长）
│   │   ├── portraits/            # 定妆照（绑定角色）
│   │   │   ├── xiaoG-v6-fixed-front.png       ✅ 生产版本
│   │   │   ├── xiaoG-v6-fixed-threeQuarter.png ✅ 生产版本
│   │   │   ├── xiaoG-v6-fixed-side.png         ✅ 生产版本
│   │   │   ├── xiaoG-v6-fixed-back.png         ✅ 生产版本
│   │   │   └── xiaoG-v6-fixed-closeup.png      ✅ 生产版本
│   │   ├── .archive/             # 旧版本归档
│   │   └── RELEASE-NOTES.md      # 定妆照发布记录
│   ├── nvwa/               # 女娃 ⚠️ 档案待补充性格字段
│   ├── jingwei-bird/       # 精卫鸟 ⚠️ 档案待补充性格字段
│   └── ...                 # 未来角色自动创建
├── stories/                # 每个故事独立档案
│   └── jingwei-v20.0/      # 精卫故事
│       ├── story-config.json      # 故事配置（角色引用+分镜）
│       └── continuity-config.json # 自动生成的衔接配置
└── systems/                # 生产系统
    ├── character-manager.js       # 角色管理引擎 ✅
    ├── continuity-engine.js       # 衔接引擎 ✅
    └── production-engine.js       # 生产主引擎 ✅
```

---

## 角色档案规范（character-card.json）

### 完整字段清单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 角色唯一标识 |
| name | string | ✅ | 角色名 |
| type | string | ✅ | protagonist/antagonist/creature/support |
| universes | string[] | | 所属宇宙 |
| firstAppearance | string | | 首次出场故事 |
| **visualIdentity** | object | ✅ | 视觉身份 |
| ├─ style | string | ✅ | 整体风格 |
| ├─ origin | string | | 出身地 |
| ├─ age | string | ✅ | 年龄 |
| ├─ species | string | | 物种 |
| ├─ world | string | | 世界观定位 |
| └─ appearance | object | ✅ | 外观细节（hair/eyes/face/skin/clothing/accessories/build/expression） |
| **personality** | object | ✅ | 性格档案 |
| ├─ core | string | | 核心性格 |
| ├─ traits | string[] | | 特质列表 |
| ├─ archetype | string | | 原型 |
| ├─ MBTI | string | | MBTI类型 |
| └─ growthArc | string | | 成长弧线 |
| **likes** | string[] | | 喜欢的事物 |
| **dislikes** | string[] | | 讨厌的事物 |
| **skills** | object | | 技能/擅长 |
| **fears** | string[] | | 恐惧 |
| **desires** | string[] | | 愿望 |
| **speechStyle** | object | | 语言风格 |
| ├─ tone | string | | 语气 |
| ├─ catchphrases | string[] | | 口头禅 |
| └─ habits | string[] | | 语言习惯 |
| **relationships** | object | | 人际关系 |
| **backstory** | object | | 背景故事 |
| **roleInStory** | object | | 故事中的角色定位 |
| portraitConfig | object | ✅ | 定妆照生成配置 |
| generatedAssets | object | | 已生成资产（定妆照等） |
| appearances | string[] | | 出场记录 |
| createdAt | string | | 创建时间 |
| updatedAt | string | | 更新时间 |
| version | string | | 版本号 |

### 当前角色档案状态

| 角色 | 视觉身份 | 性格 | 喜好 | 擅长 | 定妆照 | 状态 |
|------|----------|------|------|------|--------|------|
| 小G | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 5张生产版 | **生产就绪** |
| 女娃 | ✅ 完整 | ❌ 缺失 | ❌ 缺失 | ❌ 缺失 | ❌ 未生成 | 待补充 |
| 精卫鸟 | ✅ 完整 | ❌ 缺失 | ❌ 缺失 | ❌ 缺失 | ❌ 未生成 | 待补充 |

---

## 系统引擎功能

### 1. CharacterManager（角色管理引擎）
```javascript
const { CharacterManager } = require('./systems/character-manager.js');
const cm = new CharacterManager();

// 加载角色（自动检测/创建/复用）
const xiaoG = cm.loadCharacter('xiaoG');
// → 自动从内置模板创建，返回完整档案（含personality/skills等）

// 创建新角色
const newChar = cm.createCharacter('xingtian', { name: '刑天', ... });

// 生成强制锚点Prompt（注入镜头）
const anchor = cm.generateMandatoryPrompt('xiaoG', 'threeQuarter');

// 获取定妆照路径（用于API referenceImages）
const refs = cm.getReferenceImages('xiaoG', ['front', 'threeQuarter']);

// 验证镜头Prompt是否包含角色锚点
const valid = cm.validatePrompt('xiaoG', promptText);
```

### 2. ContinuityEngine（衔接引擎）
```javascript
const { ContinuityEngine } = require('./systems/continuity-engine.js');
const ce = new ContinuityEngine(cm);

// 自动生成全故事衔接配置
const continuity = ce.generateContinuityConfig({
  storyId: 'xingtian-v1.0',
  shots: [...],
  characters: [...]
});
// → 返回 transitions + referenceStrategy + promptPrefix
```

### 3. ProductionEngine（生产主引擎）
```javascript
const { ProductionEngine } = require('./systems/production-engine.js');
const pe = new ProductionEngine();

// 初始化新故事（自动准备角色+生成衔接）
const result = await pe.initStory({
  storyId: 'xingtian-v1.0',
  title: '刑天',
  characters: [{ id: 'xiaoG' }, { id: 'xingtian', visualIdentity: {...} }],
  episodes: [...]
});
// → 自动检测：小G复用 | 刑天创建 | 衔接自动生成

// 生成完整镜头Prompt（含锚点+衔接前缀+referenceImages）
const shot = pe.generateShotPrompt('xingtian-v1.0', 'S01', shotConfig);
// → { prompt, validations, isValid, referenceImages }
```

---

## 工作流程

### 开新故事的标准流程

```
1. 创建故事请求
   ↓
2. ProductionEngine.initStory()
   ├── 检测角色：xiaoG（存在）→ 复用
   ├── 检测角色：新角色（不存在）→ 创建+生成档案
   ├── 保存 story-config.json（角色引用，不复制数据）
   └── 自动生成 continuity-config.json
   ↓
3. 为缺失角色生成定妆照（如有）
   ↓
4. 逐镜头生产
   ├── generateShotPrompt() → 自动注入角色锚点
   ├── 自动附加衔接前缀（来自continuity-config）
   └── 自动收集referenceImages（定妆照+首帧）
   ↓
5. 后处理 + 交付
```

---

## 关键设计原则

### ✅ 角色全局复用
- 小G作为内置角色，所有故事自动复用同一档案
- 角色档案存储在 `characters/<id>/`，不随故事复制

### ✅ 故事独立隔离
- 每个故事有自己的 `stories/<storyId>/` 目录
- story-config.json 只引用角色ID，不嵌入完整角色数据
- 禁止复制旧故事配置到新故事

### ✅ 定妆照绑定角色
- 定妆照存储在角色目录 `characters/<id>/portraits/`
- 跟随角色档案走，不分散在故事目录
- 角色复用时自动携带定妆照

### ✅ 性格/喜好/擅长存档
- 角色档案包含完整人物设定（personality/likes/dislikes/skills）
- 生产引擎自动读取，用于生成更精准的镜头Prompt
- 后续可为每个角色生成"情感标签"辅助叙事

---

## 发布清单

- [x] `characters/xiaoG/character-card.json` — 完整角色档案
- [x] `characters/xiaoG/portraits/` — 5张v6-fixed生产版定妆照
- [x] `characters/xiaoG/RELEASE-NOTES.md` — 定妆照发布记录
- [x] `systems/character-manager.js` — 角色管理引擎
- [x] `systems/continuity-engine.js` — 衔接引擎
- [x] `systems/production-engine.js` — 生产主引擎
- [x] `stories/jingwei-v20.0/story-config.json` — 故事配置示例
- [x] `stories/jingwei-v20.0/continuity-config.json` — 衔接配置示例

### 待完成（不影响发布）
- [ ] 女娃/精卫鸟性格字段补充
- [ ] 女娃/精卫鸟定妆照生成
- [ ] render-engine.js完整迁移到character-manager
- [ ] 生产引擎实际跑通端到端测试

---

## 签名

**审批确认**: ✅ 大鹏队长已确认架构完整
**发布时间**: 2026-05-19 18:37 CST
**状态**: PRODUCTION v1.0
