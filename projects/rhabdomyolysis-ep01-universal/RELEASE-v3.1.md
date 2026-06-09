# 横纹肌溶解EP01 - 生产版本发布 v3.1

**发布日期**: 2026-05-20
**版本号**: v3.1
**发布人**: 小G (AI Assistant)

## 本次更新内容

### 🔴 系统级约束（全局生效）

1. **画面文字约束** (`UniversalStyleInjector`)
   - 禁止：小字清晰可辨、印刷工整、字迹清晰、上面写着...
   - 允许：大背景少量大字（如"健康知识讲堂"）
   - 所有项目通用

2. **横版输出** (`PostProductionPipeline`)
   - 默认输出：1280x720 (16:9)
   - 竖版素材自动横屏化
   - 字幕位置：底部居中

3. **字幕对齐** (基于实际时长)
   - 自动测量每个镜头实际时长
   - 生成精准SRT时间轴
   - 字幕样式：白色+黑色描边

### 🟡 项目类型配置（按项目选择）

4. **写实风格** → 科普/纪录片项目
   - 禁止：卡通、动漫、奇幻、发光等
   
5. **奇幻风格** → 山海经/Nirath项目（独立配置）
   - 允许：发光、魔法、粒子特效等

## 文件变更

### 新增
- `systems/post-production-pipeline.js` - 通用后期制作管线

### 修改
- `systems/universal-style-injector.js` - 新增画面文字约束
- `projects/rhabdomyolysis-ep01-universal/shots/shot-prompts.json` - 修复S02/S04/S05/S06/S07画面文字违规
- `projects/rhabdomyolysis-ep01-universal/shots/shot-prompts.json` - 优化S05/S06/S09字数

### 测试报告
- `production/mock-test-report-v3.json` - Mock测试全部通过

## 技术教训沉淀

1. **API格式**: Seedance 2.0要求 `content[0].type="text"` 而非 `"video_generation"`
2. **安全过滤**: 避免"尿液"、"采血"、"血液"等医疗敏感词
3. **画面文字**: AI生成文字容易出错，Prompt中禁止要求"小字清晰可辨"
4. **横竖屏**: API返回720x1280竖版，后期需转换横版
5. **字幕对齐**: 必须基于实际视频时长，不能按JSON设计时长

## 待办
- [ ] 山海经系列独立风格配置
- [ ] ASR音频转字幕方案评估
- [ ] 批量Prompt字数检查工具

---
**Status**: ✅ 已发布
**Next Release**: 等待队长新任务
