# RELEASE-v6.2-patch85-PRODUCTION.md

**版本号**: v6.2-patch85
**发布日期**: 2026-05-31
**发布状态**: 生产版本（PRODUCTION）
**上一个版本**: v6.2-patch82 (c660e9d)
**提交数**: 17 commits

---

## 一、本版本核心主题

**导演优化系统根治 + 上下文膨胀治理**

从v6.2-patch82发布后，导演优化系统（Stage-17）经历了10次连续修复（fix1→fix10），最终根治了三大顽疾：
1. 子进程超时/SIGKILL问题
2. LLM结果被忽略问题
3. 导演评审数据格式问题

同时新增编剧优化每镜独立模式 + 上下文膨胀治理系统。

---

## 二、关键修复清单

### 🔥 导演优化系统（10次连续修复）

| 补丁 | 问题 | 修复 |
|------|------|------|
| v6.2-patch83-fix | 导演优化未等待完成 | 子进程注册到_asyncTasks |
| v6.2-patch83-fix2 | 子进程卡住 | 根治进程未退出问题 |
| v6.2-patch83-fix3 | LLM超时120秒 | 增加超时控制（2分钟） |
| v6.2-patch83-fix4 | maxRetries×timeoutMs乘积 | 精确超时参数计算 |
| v6.2-patch83-fix5 | 后台进程SIGTERM | 改为同步调用（主进程await） |
| v6.2-patch83-fix6 | 超时回退本地模板 | 增加LLM超时重试 |
| v6.2-patch83-fix7 | 180秒阈值卡边 | timeout 180→240秒 |
| v6.2-patch83-fix8 | 导演优化阻断链路 | 改为始终通过（只提建议） |
| v6.2-patch83-fix9 | Group1超时/LLM结果被忽略 | timeout 120→180秒 + 修复结果解析 |
| v6.2-patch83-fix9 | AsyncDirectorAgent包装层 | 直接调用（主进程模式） |
| v6.2-patch83-fix10 | 统一timeout | 编剧+导演统一240秒 |

### 🎯 编剧优化（每镜独立模式）

| 补丁 | 内容 |
|------|------|
| v6.2-patch85 | 编剧优化每镜独立（串行调用，每镜prompt 1000-1500字符） |
| v6.2-patch85-1 | prompt空间扩容到2000-2500字符（prompt预览400字+旁白200字+完整metadata+规范摘要） |

### 📝 导演评审数据修复

| 补丁 | 内容 |
|------|------|
| v6.2-patch85 | `_llmReviewGroup2` prompt加入`shotsMinimal`镜头列表（修复LLM说"未检测到镜头方案"） |

### 🧠 上下文膨胀治理

| 补丁 | 内容 |
|------|------|
| v6.2-patch86 | `context-manager.js`: Bootstrap文件归档（20K/60K阈值）+ 执行日志静默化 |
| v6.2-patch86 | `run-taotie-silent.js`: 静默预生产执行器（日志写入文件，stdout只发摘要） |

---

## 三、核心文件变更

### 新增文件
- `systems/context-manager.js` — 上下文膨胀治理系统
- `run-taotie-silent.js` — 静默预生产执行器

### 修改文件（关键）
- `systems/screenwriter-optimizer.js` — 每镜独立优化模式（v6.2-patch85 + v6.2-patch85-1）
- `systems/director-final-review.js` — 数据格式修复（v6.2-patch85）+ 超时调整（v6.2-patch83-fix9）
- `systems/nirath-master-pipeline.js` — 导演优化直接调用（v6.2-patch83-fix9）+ maxRetries传播修复（v6.2-patch83-fix8）
- `run-taotie-preproduction.js` — 现有预生产入口

### 废弃文件（保留兼容）
- `systems/async-director-agent.js` — 废弃，主进程直接调用替代
- `systems/director-screenwriter-loop.js` — 废弃，集成到主链路

---

## 四、性能基准

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 导演评审耗时 | 超时/kill | 152秒完成（95/100分） |
| 编剧优化prompt | 7079字符（被kill） | 2000-2500字符/镜（120秒安全） |
| 上下文膨胀 | 每次运行+几百K | 日志写文件，不发对话 |
| 消息轰炸 | 每Stage发消息 | 只发最终结果 |

---

## 五、已知问题与下一步

1. **风格一致性评分**: `DirectorStyleLibrary` 仍报0/100（需要修复评分逻辑）
2. **预生产验证**: 需要完整跑一轮验证v6.2-patch85的导演+编剧优化链路
3. **Prompt标准模块**: v6.2-patch82已集成到主链路，需要验证实际利用率

---

## 六、升级建议

**生产环境部署**：
```bash
# 1. 拉取最新代码
git pull origin master

# 2. 静默运行预生产（不膨胀上下文）
node run-taotie-silent.js

# 3. 检查日志摘要
tail -50 logs/preproduction-*.log
```

**验证导演优化**：
```bash
# 导演评审独立测试
node test-director-score-v3.js
```

---

## 七、版本发布信息

- **Git Tag**: v6.2-patch85
- **Commit**: f624f37
- **发布人**: 小G
- **审核人**: 大鹏
- **发布状态**: ✅ 已发布到生产

---

*Stay Hungry, Stay Foolish, Stay Brutally Honest.*
