#!/bin/bash
set -e

echo "📥 下载饕餮EP01渲染视频..."

# S00
wget -O S00-opening.mp4 "https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023443621800000000000000000000ffffac17783fb1f61b.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133909Z&X-Tos-Expires=86400&X-Tos-Signature=7eb3f1465237c57f066bc41a161d6a"

# S01
wget -O S01-intro.mp4 "https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023442761600000000000000000000ffffac17407c5e3989.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133925Z&X-Tos-Expires=86400&X-Tos-Signature=38fd10a8c234b387c97b9706655310"

# S02
wget -O S02-progress.mp4 "https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023443132200000000000000000000ffffac17407c2e1cd0.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T134208Z&X-Tos-Expires=86400&X-Tos-Signature=d196d8978bb7a88ca50f517ecce3d8"

# S03
wget -O S03-appearance.mp4 "https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023445101300000000000000000000ffffac18235bc8b4f3.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133849Z&X-Tos-Expires=86400&X-Tos-Signature=d1c6ce9d50d6f983ee6847b0c0933b"

# S04
wget -O S04-climax.mp4 "https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023519575300000000000000000000ffffac17783f6a4cfa.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T135120Z&X-Tos-Expires=86400&X-Tos-Signature=94c6fc1ab7f5fe2e3ce73e0d250d04"

# S05
wget -O S05-ending.mp4 "https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023444969900000000000000000000ffffac15a473e140fe.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133811Z&X-Tos-Expires=86400&X-Tos-Signature=a9a1baabfd133c922a84c0c7b9dd85"

echo "✅ 下载完成"
ls -lh *.mp4
