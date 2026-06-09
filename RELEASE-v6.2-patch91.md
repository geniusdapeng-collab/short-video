# RELEASE v6.2-patch91 - 渲染核心修复：API参数名+分辨率+角色绑定

## 版本信息
- **版本**: v6.2-patch91
- **基于**: v6.2-patch89
- **发布日期**: 2026-06-01
- **优先级**: P0（系统级修复）

## 修复内容

### 1. 渲染API参数名修复（P0）
**问题**: `submit-s04-s05-patch90.js` 使用了错误的API参数名，导致Seedance 2.0忽略比例设置，默认使用 `adaptive` 生成竖屏视频。

**错误代码**:
```javascript
generation_configs: {
  video_duration: 15,  // ❌ API不认识
  aspect_ratio: '16:9' // ❌ API不认识
}
```

**修复后**:
```javascript
{
  ratio: '16:9',      // ✅ 正确参数名
  duration: 12,        // ✅ 正确参数名
  resolution: '720p' // ✅ 新增，明确指定分辨率
}
```

**影响**: 修复后渲染输出将严格保持16:9横屏（1248×704@720p），彻底消除竖屏畸变拉伸问题。

### 2. 核心渲染模块强化
- `render-submitter-core.js` 新增 `resolution: '720p'` 参数
- 新增角色绑定日志：`📎 绑定角色: ${charId}`
- xiaoG 别名增加 `小G`（大写G），匹配prompt实际写法

### 3. S03/S04/S05角色绑定排查
**问题**: S03的 `characters` 数组仅含 `["tao-tie"]`，但prompt包含"小G"，导致小G定妆照未绑定。

**根因**: 预生产环节 `characters` 数组提取不完整，但渲染核心已增加prompt文本兜底提取（`extractCharactersFromShot`），确保即使 `characters` 数组遗漏也能从prompt文本识别角色。

## 修改文件
1. `scripts/submit-s04-s05-patch90.js` — API参数名修复
2. `scripts/render-submitter-core.js` — 分辨率+角色绑定日志+别名补全

## 验证方式
1. 重新渲染测试镜头，确认输出分辨率 ≈ 1248×704（16:9）
2. 确认参考图数量正确：xiaoG 4张 + tao-tie 4张 = 8张
3. 确认角色绑定日志输出正常

## 关联任务
- [ ] 重新渲染 S03/S04/S05（使用 v6.2-patch91 修复后参数）
- [ ] 验证输出无畸变拉伸
- [ ] 验证小G角色形象正确

---
发布人: 小G
发布日期: 2026-06-01
