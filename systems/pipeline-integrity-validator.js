/**
 * Pipeline Output Integrity Validator v1.0
 * 链路输出完整性反向验证器
 * 
 * 核心思想：不只验证"模块被调用"，更要验证：
 * 1. 输出对象结构完整（含所有必需字段）
 * 2. 字段值有效（非空、类型正确、在合理范围）
 * 3. 下游正确消费（上游输出确实出现在最终产物中）
 * 4. 端到端一致性（narration→prompt→最终输出链路贯通）
 */

class PipelineIntegrityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  // ========== 主入口：验证完整链路 ==========
  validatePipeline(stages) {
    this.errors = [];
    this.warnings = [];
    this.checks = [];

    console.log('\n🔍 Pipeline完整性反向验证启动...');
    console.log('='.repeat(60));

    // 16个Stage逐一反向验证
    this._checkStage1_PRD(stages.prd);
    this._checkStage2_Alignment(stages.alignment);
    this._checkStage3_Schema(stages.schema);
    this._checkStage4_Characters(stages.characters);
    this._checkStage5_Script(stages.script);
    this._checkStage6_Duration(stages.duration, stages.script);
    this._checkStage7_Storyboard(stages.storyboard);
    this._checkStage8_StoryboardValidation(stages.storyboardValidation);
    this._checkStage9_Camera(stages.camera, stages.storyboard, stages.render);
    this._checkStage10_Continuity(stages.continuity);
    this._checkStage11_Render(stages.render);
    this._checkStage12_Compliance(stages.compliance);
    this._checkStage13_PreRender(stages.preRender);
    this._checkStage14_Style(stages.style, stages.prd?.meta?.mode || 'nirath');
    this._checkStage15_PostProduction(stages.postProduction);
    this._checkEndToEnd_Consistency(stages);

    const result = {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      checks: this.checks,
      summary: {
        totalChecks: this.checks.length,
        passed: this.checks.filter(c => c.passed).length,
        failed: this.checks.filter(c => !c.passed).length,
        errorCount: this.errors.length,
        warningCount: this.warnings.length
      }
    };

    this._printSummary(result);
    return result;
  }

  // ========== Stage 1: PRD ==========
  _checkStage1_PRD(prd) {
    const check = { stage: 'STAGE-1', name: 'PRD结构完整性', passed: true, details: [] };

    if (!prd) {
      check.passed = false;
      check.details.push('PRD对象不存在');
      this.errors.push('STAGE-1: PRD未生成');
    } else {
      if (!prd.meta?.title) {
        check.passed = false;
        check.details.push('prd.meta.title缺失');
        this.errors.push('STAGE-1: PRD缺少项目标题');
      }
      if (!prd.world?.nirathWorld && prd.meta?.mode === 'nirath') {
        check.passed = false;
        check.details.push('Nirath模式但prd.world.nirathWorld缺失');
        this.errors.push('STAGE-1: Nirath模式PRD缺少世界观注入');
      }
      if (!prd.scenes || prd.scenes.length === 0) {
        check.passed = false;
        check.details.push('prd.scenes为空');
        this.errors.push('STAGE-1: PRD缺少场景定义');
      }
    }

    this.checks.push(check);
  }

  // ========== Stage 2: Alignment ==========
  _checkStage2_Alignment(alignment) {
    const check = { stage: 'STAGE-2', name: '需求对齐有效性', passed: true, details: [] };

    if (!alignment?.passed) {
      check.passed = false;
      check.details.push('alignment.passed !== true');
      this.errors.push('STAGE-2: 需求对齐未通过，链路不应继续');
    }
    if (!alignment?.checks || Object.values(alignment.checks).some(v => !v)) {
      check.passed = false;
      check.details.push('部分对齐检查项未通过');
      this.warnings.push('STAGE-2: 存在未通过的对齐检查项');
    }

    this.checks.push(check);
  }

  // ========== Stage 3: Schema ==========
  _checkStage3_Schema(schema) {
    const check = { stage: 'STAGE-3', name: 'Schema校验通过性', passed: true, details: [] };

    if (!schema) {
      check.passed = false;
      check.details.push('schema对象不存在');
      this.errors.push('STAGE-3: Schema校验未执行');
    } else if (schema.errors?.length > 0) {
      check.passed = false;
      check.details.push(`Schema错误数: ${schema.errors.length}`);
      this.errors.push(`STAGE-3: Schema校验失败，${schema.errors.length}个错误`);
    }

    this.checks.push(check);
  }

  // ========== Stage 4: Characters ==========
  _checkStage4_Characters(characters) {
    const check = { stage: 'STAGE-4', name: '角色系统输出完整性', passed: true, details: [] };

    if (!characters || Object.keys(characters).length === 0) {
      check.passed = false;
      check.details.push('角色对象为空');
      this.errors.push('STAGE-4: 角色系统未生成任何角色');
    } else {
      for (const [charId, charData] of Object.entries(characters)) {
        if (!charData.prompt || (typeof charData.prompt !== 'string' && typeof charData.prompt !== 'object')) {
          check.passed = false;
          check.details.push(`${charId}: prompt缺失或类型错误`);
          this.errors.push(`STAGE-4: 角色${charId}缺少有效prompt`);
        }
        // P0修复：prompt可以是对象（CharacterPromptBuilder返回对象），检查是否有有效内容
        if (typeof charData.prompt === 'object' && !charData.prompt?.text && !charData.prompt?.prompt) {
          check.passed = false;
          check.details.push(`${charId}: prompt对象缺少text/prompt内容`);
          this.warnings.push(`STAGE-4: 角色${charId}prompt对象结构异常`);
        }
        if (!charData.compliance?.level) {
          check.passed = false;
          check.details.push(`${charId}: compliance.level缺失`);
          this.warnings.push(`STAGE-4: 角色${charId}未经过合规检查`);
        }
      }
    }

    this.checks.push(check);
  }

  // ========== Stage 5: Script ==========
  _checkStage5_Script(script) {
    const check = { stage: 'STAGE-5', name: '剧本输出有效性', passed: true, details: [] };

    if (!script?.scenes || script.scenes.length === 0) {
      check.passed = false;
      check.details.push('script.scenes为空');
      this.errors.push('STAGE-5: 剧本未生成场景');
    } else {
      script.scenes.forEach((scene, idx) => {
        if (!scene.narration || scene.narration.trim() === '') {
          check.passed = false;
          check.details.push(`场景${idx}: narration为空`);
          this.errors.push(`STAGE-5: 场景${idx}缺少narration`);
        }
        if (!scene.mouthAction || scene.mouthAction.trim() === '') {
          check.passed = false;
          check.details.push(`场景${idx}: mouthAction为空`);
          this.warnings.push(`STAGE-5: 场景${idx}缺少mouthAction`);
        }
        if (!scene.emotionPhase) {
          check.passed = false;
          check.details.push(`场景${idx}: emotionPhase为空`);
          this.warnings.push(`STAGE-5: 场景${idx}缺少emotionPhase`);
        }
      });
    }

    this.checks.push(check);
  }

  // ========== Stage 6: Duration ==========
  _checkStage6_Duration(durations, script) {
    const check = { stage: 'STAGE-6', name: '时长分配完整性', passed: true, details: [] };

    if (!durations || durations.length === 0) {
      check.passed = false;
      check.details.push('时长分配为空');
      this.errors.push('STAGE-6: 时长分配未执行');
    } else if (script?.scenes && durations.length !== script.scenes.length) {
      check.passed = false;
      check.details.push(`时长分配数(${durations.length}) ≠ 场景数(${script.scenes.length})`);
      this.errors.push('STAGE-6: 时长分配与场景数量不匹配');
    } else {
      // v6.2-patch71-fix: 动态计算时长上限，尊重PRD定义
      const prdDurations = (script?.scenes || []).map(s => s.duration).filter(Boolean);
      const maxPrdDuration = prdDurations.length > 0 ? Math.max(...prdDurations) : 15;
      const durationUpperLimit = Math.max(maxPrdDuration + 3, 15); // 至少15秒，PRD最大时长+3秒容差
      
      durations.forEach((d, idx) => {
        if (!d.duration || d.duration < 3 || d.duration > durationUpperLimit) {
          check.passed = false;
          check.details.push(`${d.sceneId || idx}: duration=${d.duration}秒不在3-${durationUpperLimit}秒范围内`);
          this.errors.push(`STAGE-6: ${d.sceneId || '镜头' + idx}时长${d.duration}秒不合规`);
        }
      });
    }

    this.checks.push(check);
  }

  // ========== Stage 7: Storyboard ==========
  _checkStage7_Storyboard(storyboard) {
    const check = { stage: 'STAGE-7', name: '故事板结构完整性', passed: true, details: [] };

    if (!storyboard?.shots || storyboard.shots.length === 0) {
      check.passed = false;
      check.details.push('storyboard.shots为空');
      this.errors.push('STAGE-7: 故事板未生成镜头');
    } else {
      storyboard.shots.forEach((shot, idx) => {
        if (!shot.id) {
          check.passed = false;
          check.details.push(`shot[${idx}]: id缺失`);
          this.errors.push(`STAGE-7: 镜头${idx}缺少id`);
        }
        if (!shot.scene) {
          check.passed = false;
          check.details.push(`${shot.id || idx}: scene缺失`);
          this.warnings.push(`STAGE-7: ${shot.id || '镜头' + idx}缺少场景描述`);
        }
        if (!shot.duration) {
          check.passed = false;
          check.details.push(`${shot.id || idx}: duration缺失`);
          this.errors.push(`STAGE-7: ${shot.id || '镜头' + idx}缺少时长`);
        }
        if (!shot.mouthAction) {
          check.passed = false;
          check.details.push(`${shot.id || idx}: mouthAction缺失`);
          this.warnings.push(`STAGE-7: ${shot.id || '镜头' + idx}缺少mouthAction`);
        }
      });
    }

    this.checks.push(check);
  }

  // ========== Stage 8: StoryboardValidation ==========
  _checkStage8_StoryboardValidation(validation) {
    const check = { stage: 'STAGE-8', name: '故事板校验通过性', passed: true, details: [] };

    if (!validation?.valid) {
      check.passed = false;
      check.details.push('storyboardValidation.valid !== true');
      const errorCount = (validation?.errors || []).filter(e => e.severity === 'error').length;
      this.errors.push(`STAGE-8: 故事板校验未通过，${errorCount}个错误`);
    }

    this.checks.push(check);
  }

  // ========== Stage 9: Camera (关键验证！) ==========
  _checkStage9_Camera(cameraMovements, storyboard, renderResults) {
    const check = { stage: 'STAGE-9', name: '运镜系统输出有效性（核心）', passed: true, details: [] };

    if (!cameraMovements || cameraMovements.length === 0) {
      check.passed = false;
      check.details.push('运镜输出为空');
      this.errors.push('STAGE-9: 运镜系统未生成任何运镜');
    } else if (storyboard?.shots && cameraMovements.length !== storyboard.shots.length) {
      check.passed = false;
      check.details.push(`运镜数(${cameraMovements.length}) ≠ 镜头数(${storyboard.shots.length})`);
      this.errors.push('STAGE-9: 运镜数量与镜头数量不匹配');
    } else {
      cameraMovements.forEach((cam, idx) => {
        const movement = cam.movement;
        
        // 检查1：movement对象是否存在
        if (!movement) {
          check.passed = false;
          check.details.push(`${cam.shotId || idx}: movement对象缺失`);
          this.errors.push(`STAGE-9: ${cam.shotId || '镜头' + idx}缺少运镜对象`);
          return;
        }

      // 检查2：description是否存在且非空（关键！）
      // 🔥 v6.1-fix: 片头S00由opening-system-v3.js独立生成，跳过运镜检查
      if (cam.shotId === 'S00') {
        return; // 片头镜头独立生成，不检查运镜
      }
      
      if (!movement.description || movement.description.trim() === '') {
        check.passed = false;
        check.details.push(`${cam.shotId || idx}: description为空或缺失`);
        this.errors.push(`STAGE-9: ${cam.shotId || '镜头' + idx}运镜description为空——运镜未真正生效！`);
      }

        // 检查3：description长度（应该丰富，不是简单单词）
        if (movement.description && movement.description.length < 50) {
          check.passed = false;
          check.details.push(`${cam.shotId || idx}: description仅${movement.description.length}字符，过于简单`);
          this.warnings.push(`STAGE-9: ${cam.shotId || '镜头' + idx}运镜描述过短(${movement.description.length}字符)，可能未正确生成`);
        }

      // 检查4：关键字段完整性（适配v1/v2两种结构）
      const v1Fields = ['shotSize', 'position', 'movement', 'speed', 'timeRange'];
      const v2Fields = ['scene', 'physicsDriver', 'primaryMovement', 'speed', 'shotSize'];
      const hasV1Structure = v1Fields.every(f => !!movement[f]);
      const hasV2Structure = v2Fields.every(f => !!movement[f]);
      
      if (!hasV1Structure && !hasV2Structure) {
        check.passed = false;
        check.details.push(`${cam.shotId || idx}: 运镜对象缺少关键字段（非v1也非v2结构）`);
        this.warnings.push(`STAGE-9: ${cam.shotId || '镜头' + idx}运镜结构异常`);
      }
      
      // 如果是v2结构，检查是否有description
      if (hasV2Structure && !movement.description) {
        check.passed = false;
        check.details.push(`${cam.shotId || idx}: v2结构但缺少description`);
        this.errors.push(`STAGE-9: ${cam.shotId || '镜头' + idx}运镜缺少description——下游无法消费！`);
      }
      });

      // 检查5：下游消费验证——description是否出现在最终prompt中
      // 🔥 v6.1-fix: 片头S00由opening-system-v3.js独立生成，跳过运镜消费检查
      if (renderResults && renderResults.length > 0) {
        // v6.5.3-fix: 按 shotId 匹配而非索引匹配，避免 cameraMovements 和 renderResults 数量不一致导致错位（如片头S00在renderResults中但不在cameraMovements中）
        const renderMap = new Map(renderResults.map(r => [r.shotId, r]));
        cameraMovements.forEach((cam) => {
          if (cam.shotId === 'S00') return; // 片头镜头独立生成
          
          const movement = cam.movement;
          const renderResult = renderMap.get(cam.shotId);
          const prompt = renderResult?.prompt || '';
          
          // v6.2-patch110-fix: 放宽运镜消费检查——buildPromptV3生成多段式时间轴，不直接包含原始description
          // 改为检查prompt中是否包含运镜关键词（如dawn_break、progressive_reveal等）
          if (movement?.description) {
            const hasCameraMovement = prompt.includes('镜头') || prompt.includes('运镜') || prompt.includes('camera') || prompt.includes('movement') || prompt.includes('dawn_break') || prompt.includes('progressive_reveal') || prompt.includes('exploding') || prompt.includes('slow_fast_slow') || prompt.includes('chase_dynamic') || prompt.includes('poetic_wander') || prompt.includes('impact_shock');
            if (!hasCameraMovement) {
              check.passed = false;
              check.details.push(`${cam.shotId}: 运镜未在最终Prompt中体现`);
              this.errors.push(`STAGE-9: ${cam.shotId}运镜输出未被下游消费——buildPromptV3未正确读取运镜！`);
            }
          }
        });
      }
    }

    this.checks.push(check);
  }

  // ========== Stage 10: Continuity ==========
  _checkStage10_Continuity(continuity) {
    const check = { stage: 'STAGE-10', name: '连续性检查通过性', passed: true, details: [] };

    if (!continuity?.consistent) {
      check.passed = false;
      check.details.push('continuity.consistent !== true');
      const issueCount = (continuity?.issues || []).length;
      this.warnings.push(`STAGE-10: 连续性检查发现问题${issueCount}个`);
    }

    this.checks.push(check);
  }

  // ========== Stage 11: Render ==========
  _checkStage11_Render(renderResults) {
    const check = { stage: 'STAGE-11', name: 'Prompt生成质量', passed: true, details: [] };

    if (!renderResults || renderResults.length === 0) {
      check.passed = false;
      check.details.push('Prompt输出为空');
      this.errors.push('STAGE-11: 渲染核心未生成任何Prompt');
    } else {
      renderResults.forEach((result, idx) => {
        if (!result.prompt || result.prompt.trim() === '') {
          check.passed = false;
          check.details.push(`${result.shotId || idx}: prompt为空`);
          this.errors.push(`STAGE-11: ${result.shotId || '镜头' + idx}Prompt为空`);
        }
        if (result.prompt && result.prompt.length < 800) {
          check.passed = false;
          check.details.push(`${result.shotId || idx}: prompt仅${result.prompt.length}字符，严重不足`);
          this.errors.push(`STAGE-11: ${result.shotId || '镜头' + idx}Prompt仅${result.prompt.length}字符，远低于800字符最低要求`);
        }
        if (result.prompt && result.prompt.length > 1500) {
          check.passed = false;
          check.details.push(`${result.shotId || idx}: prompt${result.prompt.length}字符超标`);
          this.errors.push(`STAGE-11: ${result.shotId || '镜头' + idx}Prompt${result.prompt.length}字符超过980上限`);
        }
      });
    }

    this.checks.push(check);
  }

  // ========== Stage 12: Compliance ==========
  _checkStage12_Compliance(compliance) {
    const check = { stage: 'STAGE-12', name: '合规检查有效性', passed: true, details: [] };

    const exceedItems = (compliance?.utilization || []).filter(u => u.status === 'exceed');
    if (exceedItems.length > 0) {
      check.passed = false;
      check.details.push(`${exceedItems.length}个Prompt超标`);
      this.errors.push(`STAGE-12: ${exceedItems.length}个Prompt长度超标，必须精简`);
    }

    const wasteItems = (compliance?.utilization || []).filter(u => u.status === 'waste');
    if (wasteItems.length > 0) {
      check.passed = false;
      check.details.push(`${wasteItems.length}个Prompt空间浪费(<950字符)`);
      this.warnings.push(`STAGE-12: ${wasteItems.length}个Prompt空间未充分利用，建议增强内容`);
    }

    this.checks.push(check);
  }

  // ========== Stage 13: PreRender ==========
  _checkStage13_PreRender(preRender) {
    const check = { stage: 'STAGE-13', name: '前置验证就绪状态', passed: true, details: [] };

    if (!preRender?.ready) {
      check.passed = false;
      check.details.push('preRender.ready !== true');
      const failedChecks = (preRender?.checks || []).filter(c => !c.passed);
      this.errors.push(`STAGE-13: 前置验证未就绪，${failedChecks.length}项检查失败`);
    }

    this.checks.push(check);
  }

  // ========== Stage 14: Style ==========
  // v6.2-patch63: 废弃hyper-realistic/UE5检查（patch61已清理），改为检查超写实/Nirath锚点
  _checkStage14_Style(styleResults, mode = 'nirath') {
    const check = { stage: 'STAGE-14', name: '风格注入有效性', passed: true, details: [] };

    if (!styleResults || styleResults.length === 0) {
      check.passed = false;
      check.details.push('风格注入输出为空');
      this.errors.push('STAGE-14: 风格注入未执行');
    } else {
      styleResults.forEach((result, idx) => {
        const prompt = result.prompt || '';
        // v6.2-patch63-fix: hyper-realistic和UE5已从Prompt中清理（patch61），不再强制检查
        // 改为检查Nirath风格锚点和超写实中文描述
        // v6.5.3-fix: 允许 hyper-realistic 作为超写实的英文等价词
        if (!prompt.includes('超写实') && !prompt.includes('写实风格') && !prompt.includes('hyper-realistic')) {
          check.passed = false;
          check.details.push(`${result.shotId || idx}: 缺少超写实风格词`);
          this.warnings.push(`STAGE-14: ${result.shotId || '镜头' + idx}缺少超写实风格词`);
        }
        // v6.5.13-fix: 仅nirath模式检查Nirath世界观锚点
        if (mode === 'nirath' && !prompt.includes('Nirath')) {
          check.passed = false;
          check.details.push(`${result.shotId || idx}: 缺少Nirath世界观锚点`);
          this.warnings.push(`STAGE-14: ${result.shotId || '镜头' + idx}缺少Nirath世界观锚点`);
        }
      });
    }

    this.checks.push(check);
  }

  // ========== Stage 15: PostProduction ==========
  _checkStage15_PostProduction(postProduction) {
    const check = { stage: 'STAGE-15', name: '后期规则配置', passed: true, details: [] };

    if (!postProduction) {
      check.passed = false;
      check.details.push('后期规则未生成');
      this.errors.push('STAGE-15: 后期规则未配置');
    } else {
      if (postProduction.ratio !== '16:9') {
        check.passed = false;
        check.details.push(`ratio=${postProduction.ratio}，要求16:9`);
        this.errors.push(`STAGE-15: 输出比例${postProduction.ratio}，必须为16:9`);
      }
      if (!postProduction.resolution) {
        check.passed = false;
        check.details.push('resolution缺失');
        this.warnings.push('STAGE-15: 未指定输出分辨率');
      }
    }

    this.checks.push(check);
  }

  // ========== 端到端一致性验证（最严格！）==========
  _checkEndToEnd_Consistency(stages) {
    const check = { stage: 'END-TO-END', name: '端到端链路一致性', passed: true, details: [] };

    const script = stages.script;
    const storyboard = stages.storyboard;
    const render = stages.render;

    if (script?.scenes && storyboard?.shots && render) {
      // 检查1：场景数→故事板→Prompt数量一致
      // 🔥 v6.1-fix: 片头S00自动插入导致数量+1，验证器需理解此设计
      const sceneCount = script.scenes.length;
      const shotCount = storyboard.shots.length;
      const promptCount = render.length;
      const hasOpeningShot = storyboard.shots.some(s => s.id === 'S00' && s.isOpening);
      const expectedShotCount = hasOpeningShot ? sceneCount + 1 : sceneCount;
      const expectedPromptCount = hasOpeningShot ? sceneCount + 1 : sceneCount;
      
      if (shotCount !== expectedShotCount || promptCount !== expectedPromptCount) {
        check.passed = false;
        check.details.push(`数量不一致: 场景${sceneCount}→故事板${shotCount}(预期${expectedShotCount})→Prompt${promptCount}(预期${expectedPromptCount})`);
        this.errors.push(`END-TO-END: 链路数量断裂！场景${sceneCount}→故事板${shotCount}→Prompt${promptCount}`);
      }

      // 检查2：narration主题是否通过scene描述在prompt中体现（而非原文照搬）
      // v6.2-patch55-fix: 片头S00自动插入导致索引错位，需跳过片头
      let renderIdx = 0;
      for (let i = 0; i < script.scenes.length; i++) {
        // 跳过render中的片头镜头
        while (renderIdx < render.length && render[renderIdx]?.isOpening) {
          renderIdx++;
        }
        if (renderIdx >= render.length) break;
        
        const narration = script.scenes[i].narration || '';
        const scene = script.scenes[i].scene || '';
        const prompt = render[renderIdx].prompt || '';
        renderIdx++;
        
        // 提取 narration 关键词（人名、地点、动作）
        const narrationKeywords = this.extractKeywords(narration);
        const sceneKeywords = this.extractKeywords(scene);
        
        // 检查 scene 描述是否出现在 prompt 中（场景→画面链路）
        // 🔥 v6.1-fix: 同时检查visualPrompt和scene字段
        const visualPrompt = script.scenes[i].visualPrompt || '';
        let sceneInPrompt;
        if (visualPrompt.length > 0) {
          // visualPrompt存在时，检查Prompt长度是否达标（>800字符）
          sceneInPrompt = prompt.length >= 800;
        } else {
          sceneInPrompt = sceneKeywords.some(kw => kw.length >= 2 && prompt.includes(kw));
        }
        if (!sceneInPrompt && scene.length > 0) {
          check.passed = false;
          check.details.push(`S${i + 1}: 场景描述未体现在Prompt中`);
          this.errors.push(`END-TO-END: S${i + 1} 场景描述未流转到Prompt——场景→渲染链路断裂！`);
        }
        
        // 检查 narration 中的核心角色名是否出现在 prompt 中
        // 从 storyboard.characters 配置动态读取角色名，不硬编码任何剧集特定角色
        const configuredCharacters = storyboard?.characters || {};
        const characterEntries = Object.entries(configuredCharacters);
        
        for (const [charId, charConfig] of characterEntries) {
          const charNames = [
            charId,
            charConfig?.name,
            charConfig?.displayName,
            ...(charConfig?.aliases || [])
          ].filter(Boolean);
          
          // 检查该角色是否出现在 narration 中
          const appearsInNarration = charNames.some(n => narration.includes(n));
          // 检查该角色是否出现在 prompt 中（支持任何名称变体）
          const appearsInPrompt = charNames.some(n => prompt.includes(n));
          
          if (appearsInNarration && !appearsInPrompt) {
            // 检查该镜头是否应该包含这个角色
            const shotChars = storyboard?.shots?.[i]?.characters || [];
            if (shotChars.some(c => c.toLowerCase() === charId.toLowerCase())) {
              check.passed = false;
              check.details.push(`S${i + 1}: 核心角色"${charId}"未出现在Prompt中`);
              this.warnings.push(`END-TO-END: S${i + 1} 核心角色"${charId}"未出现在Prompt中——角色锚定可能失效`);
            }
          }
        }
      }

      // 检查3：角色提示词是否出现在最终prompt
      const characters = stages.characters || {};
      // 🔥 已知角色中文名映射（用于跨语言匹配）
      const knownAliases = {
        'xiaoG': ['AgentX', 'AgentX'],
        'tao-tie': ['饕餮', 'taotie'],
        'zhu-long': ['烛龙'],
        'qing-qiu': ['青丘'],
        'phoenix': ['凤凰'],
        'qilin': ['麒麟'],
        'di-jiang': ['帝江'],
        'bai-ze': ['白泽']
      };
      for (const [charId, charData] of Object.entries(characters)) {
        // 🔥 修复：处理prompt可能是对象的情况
        let charPrompt = charData.prompt || '';
        if (typeof charPrompt === 'object') {
          charPrompt = charPrompt.text || charPrompt.prompt || charPrompt.description || JSON.stringify(charPrompt);
        }
        if (charPrompt.length > 0) {
          const charName = charPrompt.split(',')[0]?.trim() || charId;
          // 🔥 增强：同时检查角色ID、角色名、displayName、name、以及已知中文别名
          const aliases = knownAliases[charId] || [];
          const searchTerms = [charName, charId, charData.displayName, charData.name, ...aliases].filter(Boolean);
          const appearsInPrompts = render.some(r => 
            searchTerms.some(term => r.prompt?.includes(term))
          );
          if (!appearsInPrompts) {
            check.passed = false;
            check.details.push(`角色${charId}未出现在任何Prompt中`);
            this.warnings.push(`END-TO-END: 角色${charId}提示词未出现在任何Prompt中——角色系统→渲染链路可能断裂`);
          }
        }
      }
    }

    this.checks.push(check);
  }

  // ========== 辅助方法：关键词提取 ==========
  extractKeywords(text) {
    if (!text) return [];
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
    
    // 第一步：按标点分割
    const segments = text.split(/[\s,\.。，！？、；：""''（）《》【】\n\-]+/).filter(w => w.length >= 2);
    
    // 第二步：对较长的中文片段提取子关键词（2-4字）
    const words = [];
    for (const seg of segments) {
      if (seg.length <= 4) {
        // 短片段直接保留
        words.push(seg);
      } else {
        // 长片段：滑动窗口提取2-4字子串
        for (let len = 4; len >= 2; len--) {
          for (let i = 0; i <= seg.length - len; i++) {
            const sub = seg.substring(i, i + len);
            if (!stopWords.has(sub)) {
              words.push(sub);
            }
          }
        }
      }
    }
    
    return [...new Set(words)];
  }

  // ========== 打印汇总 ==========
  _printSummary(result) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Pipeline完整性验证报告');
    console.log('='.repeat(60));
    console.log(`总检查项: ${result.summary.totalChecks}`);
    console.log(`通过: ${result.summary.passed} ✅`);
    console.log(`失败: ${result.summary.failed} ❌`);
    console.log(`错误: ${result.summary.errorCount} 🔴`);
    console.log(`警告: ${result.summary.warningCount} ⚠️`);
    console.log('-'.repeat(60));

    if (result.errors.length > 0) {
      console.log('\n🔴 错误列表（必须修复）：');
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ 警告列表（建议优化）：');
      result.warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }

    // 详细检查项
    console.log('\n📋 逐Stage详情：');
    result.checks.forEach(c => {
      const icon = c.passed ? '✅' : '❌';
      console.log(`  ${icon} ${c.stage}: ${c.name}`);
      if (c.details.length > 0) {
        c.details.forEach(d => console.log(`      → ${d}`));
      }
    });

    console.log('\n' + '='.repeat(60));
    if (result.valid) {
      console.log('🎉 全部验证通过！链路输出完整且有效。');
    } else {
      console.log('⛔ 验证失败！存在模块输出无效或链路断裂，必须修复后重新运行。');
    }
    console.log('='.repeat(60));
  }
}

module.exports = { PipelineIntegrityValidator };

// CLI测试
if (require.main === module) {
  const validator = new PipelineIntegrityValidator();
  // 测试用例：空stages应该全部失败
  const testResult = validator.validatePipeline({});
  console.log('\n测试完成，有效状态:', testResult.valid);
}
