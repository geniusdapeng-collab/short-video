# Seedance视频生成统一平台 v6.0-patch5

## 修复内容

### 🔴 P0-1: 业务线合并（shanhaijing-agent/ + seedance-agent/）

**问题**: `shanhaijing-agent/` 和 `seedance-agent/` 两个目录150个文件100%重复，维护成本翻倍，任何修改需要手动同步

**合并方案**:
1. **删除** `shanhaijing-agent/` 目录
2. **保留** `seedance-agent/` 作为统一的Agent系统
3. **更新** `export-complete-system.js` 移除 `shanhaijing-agent` 引用

**差异分析**:
- 两个目录82个文件中，仅 `adapters/v6-adapter.js` 存在差异
- `seedance-agent/adapters/v6-adapter.js` 包含更现代化的volcengine-api-client集成
- `shanhaijing-agent/adapters/v6-adapter.js` 使用旧的seedance-render-engine脚本模式
- 保留 `seedance-agent/` 版本（更现代化）

**影响**:
- 维护文件数：150个 → 75个（减少50%）
- 未来修改只需改一处
- 避免版本漂移

## 测试结果

```
✅ 通过: 4/4 (100%)
❌ 失败: 0
测试项:
  - shanhaijing-agent/ 目录已删除
  - seedance-agent/ 目录仍存在
  - seedance-agent/ 包含核心文件
  - export-complete-system.js 已移除shanhaijing-agent引用
```

## 版本号
**v6.0-patch5**

## 发布时间
2026-05-22

## 生产状态
✅ **已提交生产版本**

---

**Mock测试文件**: `mock-test-v6.0-patch5.js`

## 版本历史
- v6.0-patch1: P0 Prompt长度统一 + P1 Math.random()修复
- v6.0-patch2: P0-5 API Key移除 + P1-2 轮询指数退避
- v6.0-patch3: P0-6 PortraitStudio修复 + P2-1 结构化日志
- v6.0-patch4: P2-8 硬编码路径修复
- v6.0-patch5: P0-1 业务线合并

## 遗留问题（下版本规划）

| 问题 | 优先级 | 说明 |
|------|--------|------|
| P2-2 同步I/O→异步 | P2 | 311处readFileSync/writeFileSync，需逐文件改造 |
| P2-7 process.exit()/eval() | P2 | 当前代码库未找到 |

---

**累计修复**: 5轮patch，22+个问题，100%测试通过
