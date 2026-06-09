# TOOLS.md - 本地环境配置速查

## 火山引擎API (Volcengine Ark)

### 密钥
- 环境变量: `VOLCENGINE_ARK_API_KEY`
- 配置: `~/.openclaw/config/volcengine.json`

### 接入点
| 模型 | 类型 | 接入点 | 用途 |
|------|------|--------|------|
| Seedance-2.0 | 视频 | `ep-20260518004622-jp46s` | 高质量渲染 |
| Seedance-2.0-fast | 视频 | `ep-20260518003432-n8v8f` | 快速渲染 |
| Seedream-5.0-lite | 图片 | `ep-20260518004750-lz76f` | 定妆照/概念图 |

### 端点与限制
- 视频: `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`
- 图片: `https://ark.cn-beijing.volces.com/api/v3/images/generations`
- 最大并发: **3**
- 支持: referenceImages/Videos/Audios

### 关键经验
1. `model`字段填接入点ID或模型ID
2. 提交后返回taskId，轮询查状态
3. 项目: default，按Token付费

---

> 详细示例代码、SSH/TTS/摄像头配置 → 按需补充
