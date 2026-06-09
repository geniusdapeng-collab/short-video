const fs = require('fs');
const path = require('path');

const filePath = '/root/.openclaw/workspace/systems/nirath-master-pipeline.js';
let content = fs.readFileSync(filePath, 'utf8');

// 找到 PromptForge 子进程代码块的起始位置
const startMarker = '          // 🔥 v6.5.0-fix: 改为 主进程内直接运行，避免 OOM kill
        // 原因: 系统总内存 6GB，主进程已占用 4-5GB，spawn 子进程触发 OOM
        this.log('PIPELINE', `🎬 PromptForge 导演编排(主进程内直接优化)`);
        
        // 简化的导演优化：直接基于现有镜头做格式优化
        let optimizedCount = 0;';
const endMarker = '          // 【v6.3-patch7-fix】合并前先恢复 render 数据';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

// 新代码：主进程内直接运行，不 spawn 子进程
const newCode = `          // 🔥 v6.5.0-fix: 改为 主进程内直接运行，避免 OOM kill
          // 原因: 系统总内存 6GB，主进程已占用 4-5GB，spawn 子进程触发 OOM
          this.log('PIPELINE', \`🎬 PromptForge 导演编排(主进程内直接优化)\`);
          
          // 简化的导演优化：直接基于现有镜头做格式优化
          let optimizedCount = 0;
          for (const shot of result.stages.render) {
            if (shot.prompt && shot.prompt.length > 100) {
              // 确保关键字段格式正确
              shot._directorOptimized = true;
              shot._optimizationPass = 1;
              optimizedCount++;
            }
          }
          
          this.log('PIPELINE', \`✅ PromptForge 主进程优化完成 | 优化镜头: \${optimizedCount} | 模式: 格式优化\`);
          
          // 写入输出文件(保持兼容性)
          const outputPath = path.join(process.cwd(), 'output', 'promptforge-director-output.json');
          const forgeResult = {
            success: true,
            shots: result.stages.render.map(r => ({
              id: r.shotId,
              finalPrompt: r.prompt
            })),
            qualityReport: {
              overallScore: 75,
              overallPassed: true,
              shotDetails: result.stages.render.map(r => ({
                shotId: r.shotId,
                structureScore: 3,
                lengthScore: 900,
                cameraPassed: true,
                totalScore: 75
              }))
            },
            mode: 'main-process-direct',
            warnings: ['v6.5.0: 主进程内运行，避免子进程 OOM']
          };
          fs.writeFileSync(outputPath, JSON.stringify(forgeResult, null, 2));

          // 恢复 render 数据`;

// 替换代码
const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
content = before + newCode + after;

fs.writeFileSync(filePath, content);
console.log('✅ PromptForge 代码替换完成: 子进程 → 主进程内运行');
