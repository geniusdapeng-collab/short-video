# Acceptance Checklist v1

## A. 主链路验收

- [ ] 最终渲染 prompt 已通过 FinalPromptBuilderV3 产出
- [ ] 不再存在多个最终 prompt 出口
- [ ] 旧 render 提交逻辑只负责 submit，不再负责拼 prompt
- [ ] old `prompt +=` 逻辑已不再作为主出口使用

## B. 字段标准化验收

- [ ] 最终输出采用 10 字段结构
- [ ] CHARACTER / ACTION / SCENE 必不为空
- [ ] CAMERA / LIGHTING / AUDIO 已进入结构字段，而不是混在整段文字中
- [ ] NEGATIVE 只通过 NegativeFieldBuilder 构建
- [ ] closing 镜头增强只改字段，不直接污染整段 prompt

## C. 子系统发挥验收

- [ ] 运镜系统通过 CameraMovementSystemV3Bridge 接入
- [ ] 环境音通过 AmbientSoundDesignerBridge 接入
- [ ] 异兽出场通过 BeastEntranceAgentBridge 接入
- [ ] opening 镜头可调用神兽开场白
- [ ] closing 镜头可触发情绪增强

## D. LLM 验收

- [ ] opening / reveal / climax 镜头会调用 CreativeLLMRouter
- [ ] fallback 逻辑存在，LLM失败不会导致整条链崩溃
- [ ] LLM 输出会被 sanitize + normalize

## E. 长度与校验验收

- [ ] 最终 prompt 长度 <= 1500
- [ ] 超长时先裁 DIRECTOR / RENDER / AUDIO / NEGATIVE
- [ ] 最终校验器会拦住缺字段或超长问题
- [ ] trim 在 validate 前执行

## F. Debug 验收

- [ ] debug-shot-records 目录正常生成
- [ ] 每个镜头都有独立 json
- [ ] json 中能看到 rawShot / subsystemFields / llmFields / finalPrompt
- [ ] 可以据此定位哪个模块没生效

## G. 稳定性验收

- [ ] async 高危文件已替换 fixed 版本或完成人工修复
- [ ] health check 报告无 errors
- [ ] regression test failed = 0
