# RELEASE v6.0-patch12

**版本**: v6.0-patch12
**日期**: 2026-05-22
**状态**: 已发布

---

## 📦 本Patch内容：P2-2同步I/O + P2-7 eval()安全修复

### 修复脚本清单

| # | 脚本 | 修复内容 | 问题类型 |
|---|------|---------|----------|
| 1 | `poll-and-download.js` | existsSync/mkdirSync/writeFileSync → async | P2-2 |
| 2 | `scripts/clean-test-data.js` | 全量改为async I/O | P2-2 |
| 3 | `generate-nuanNuan-portraits-v3.js` | existsSync/mkdirSync/readFileSync/writeFileSync → async | P2-2 |
| 4 | `shanhaijing-post-production/scripts/post-production.js` | eval() → safeEvalFraction() | P2-7 |
| 5 | `seedance-post-production/scripts/post-production.js` | eval() → safeEvalFraction() | P2-7 |
| 6 | `utils/safe-eval-fraction.js` | 新建安全分数解析工具 | P2-7 |

**合计: 5处同步I/O + 2处eval() → 安全替代**

### 测试
`mock-test-v6.0-patch12.js` — 3/3通过（100%）

---

## 📊 累计修复统计（v6.0-patch5 ~ patch12）

| Patch | 核心内容 | 测试通过率 |
|-------|---------|-----------|
| patch5 | P0-1 业务线合并 150→75文件 | 100% |
| patch6 | P2-2 同步I/O→异步（核心系统14模块） | 100% |
| patch7 | 🛡️ 三重锁防呆机制 | 100% |
| patch8 | 🧹 Mock数据自动清理契约 | 100% |
| patch9 | 🔑 skip-validation授权码 | 100% |
| patch10 | 🗺️ Nirath场景映射修复 | 100% |
| patch11 | P2-2 同步I/O→异步（11个脚本） | 100% |
| patch12 | P2-2+P2-7 同步I/O+eval()清理 | 100% |

**累计: 99+ 问题修复，全部测试通过**

---

## 📝 待完成清单（剩余）

1. P2-2 同步I/O改造 — 剩余约150处非核心脚本
2. P2-7 `process.exit()` — 核心模块已确认合理（CLI入口块中），测试脚本保留
3. P1 操作审计日志持久化
4. P2 配置文件版本号校验
5. v8.0 Phase 2/3 推进

---

*Release by 小G | 2026-05-22*
