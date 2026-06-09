# SHORT-VIDEO-0.6.1-social-media-fix 发布记录

## 发布版本
- **版本号**: `SHORT-VIDEO-0.6.1-social-media-fix`
- **上一版本**: `SHORT-VIDEO-0.6.0-social-media`
- **发布时间**: 2026-06-09
- **Git 提交**: `68e675c`

## 修复内容

### 1. @image 绑定修复（核心）
**问题**: 角色定妆照注入使用 `@Image`（大写I），但 `reference-image-gate.js` 闸机检查 `@image`（小写），导致判定为"缺少绑定"，即使实际注入成功。

**修复**:
- `nirath-master-pipeline.js`: 注入格式改为小写 `@imageN`
- `opening-system-v3.js`: 同步改为小写 `@image`
- 确保与闸机检查逻辑一致

### 2. charCoreDesc 自动提取（不再硬编码）
**问题**: 之前只硬编码 `xiaoG` 和 `tao-tie` 两个角色，香香/小卓等新角色无法生成核心特征描述。

**修复**:
- 新增 `_buildCharCoreDesc(character)`: 从 `character-card.json` 自动提取核心视觉锚点（最多3个）
- 新增 `_getCharDisplayName(charId)`: 从角色档案读取显示名称，支持所有角色
- 新增 `_characterCache` 缓存: Stage 4 加载后缓存，供后续使用

### 3. 角色档案更新
- `xiangXiang/character-card.json`: 
  - `gender`: boy → girl
  - `role`: audience → protagonist

### 4. 片头系统同步扩展
- `opening-system-v3.js`: 支持 `xiangXiang` / `xiaoZhuo` 的核心特征映射和名称映射

## 验证结果
- 香香 coreDesc: `['7个月女孩']` ✅
- 显示名称: `xiangXiang` → `香香` ✅
- `xiaoG` → `小G` ✅  
- `tao-tie` → `饕餮` ✅

## 文件变更
- `systems/nirath-master-pipeline.js` - @image绑定 + 自动特征提取
- `systems/opening-system-v3.js` - 片头同步修复
- `characters/xiangXiang/character-card.json` - gender/role修正
- `memory/2026-06-09.md` - 记录更新

## 下一步（v0.6.2 计划中）
1. 质量门 `quality-gate.js` 加载 `quality-dimensions-social.js`
2. 计分器 `quality-reporter.js` 支持社媒加权
3. 时长分配器支持1-3镜头灵活配置
4. 输入配置改为 `videoType: 'social'`
5. 重新跑预生产验证效果

## 发布检查清单
- [x] 版本号更新 (.current-version)
- [x] Git 提交
- [x] 发布记录
- [x] 远程仓库推送 (待完成 - 需新仓库地址)
