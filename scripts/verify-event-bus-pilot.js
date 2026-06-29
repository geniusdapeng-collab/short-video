/**
 * Event Bus Pilot 验证脚本
 * 验证 Stage 7.2 + 7.3 的双模式运行（直接调用 + 事件驱动）
 * 
 * 验证维度：
 * 1. 事件总线正确发布和订阅
 * 2. 直接调用结果 vs 事件驱动结果 100% 一致
 * 3. 事件链式触发（7.2完成 → 自动触发7.3）
 * 4. 取消订阅功能正常
 * 5. 超时等待机制正常
 */

'use strict';

const { NirathEventBus, PipelineEventSubscribers, EVENT_DEFINITIONS } = require('../systems/event-bus-pilot.js');

// ============================================================
// 一、模拟 Pipeline（最小化，仅含 Stage 7.2 + 7.3）
// ============================================================

class MockPipeline {
  constructor() {
    this.logs = [];
    this.callCount = { '7.2': 0, '7.3': 0 };
  }

  log(stage, msg) {
    this.logs.push({ stage, msg, time: Date.now() });
  }

  async stageProtagonistInitiative(storyboard, input) {
    this.callCount['7.2']++;
    this.log('STAGE-7.2', '模拟主角主动性注入');
    
    // 模拟注入逻辑：检测被动描述，添加主动动作
    const shots = storyboard.shots || [];
    let injections = 0;
    
    for (const shot of shots) {
      const narration = shot.narration || '';
      // 检测被动描述（包含"被"、"受到"等词）
      if (narration.includes('被') || narration.includes('受到')) {
        shot._protagonistEnhanced = true;
        shot._enhancedAction = `${input?.protagonistName || 'AgentX'}主动应对`;
        injections++;
      }
    }
    
    return {
      totalInjections: injections,
      passiveDetections: injections,
      injections: shots.filter(s => s._protagonistEnhanced).map(s => ({
        shotId: s.id,
        action: s._enhancedAction
      }))
    };
  }

  async stageNarrationTrim(storyboard, durations) {
    this.callCount['7.3']++;
    this.log('STAGE-7.3', '模拟口播精简');
    
    const shots = storyboard.shots || [];
    let trimmedCount = 0;
    let totalTrimmedChars = 0;
    
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const duration = shot.duration || (durations[i]?.duration) || 5;
      const capacity = Math.floor(duration * 5.0 - 2); // 5字/秒
      const narration = shot.narration || '';
      
      if (narration.length > capacity) {
        const trimmed = narration.substring(0, capacity);
        const removed = narration.length - trimmed.length;
        shot._originalNarration = narration;
        shot.narration = trimmed;
        shot._trimmed = true;
        shot._trimmedChars = removed;
        trimmedCount++;
        totalTrimmedChars += removed;
      }
    }
    
    return {
      trimmedCount,
      totalTrimmedChars
    };
  }
}

// ============================================================
// 二、测试场景
// ============================================================

const TEST_STORYBOARD = {
  title: 'taotie-ep01-test',
  shots: [
    {
      id: 'S01',
      sequence: 1,
      scene: '钩吾废墟入口',
      narration: 'AgentX站在废墟边缘，远处传来婴儿般的啼哭声。他感受到大地的震动，知道有什么巨大的东西正在靠近。',
      type: 'establishing',
      duration: 15,
      characters: ['xiaoG', 'taotie']
    },
    {
      id: 'S02',
      sequence: 2,
      scene: '深渊发现',
      narration: '裂缝中，硫磺黄色的光芒缓缓升起。AgentX被这光芒吸引，受到一种不可名状的召唤。',
      type: 'discovery',
      duration: 12,
      characters: ['xiaoG', 'taotie']
    },
    {
      id: 'S03',
      sequence: 3,
      scene: '晶脉对峙',
      narration: '饕餮的巨口缓缓张开，利齿如白玉交错。AgentX没有被恐惧支配，而是伸出手掌。',
      type: 'confrontation',
      duration: 15,
      characters: ['xiaoG', 'taotie']
    }
  ],
  totalDuration: 42
};

// ============================================================
// 三、验证执行
// ============================================================

async function runTests() {
  console.log('🔬 Event Bus Pilot 验证\n');
  console.log('=' .repeat(60));

  const results = [];

  function check(name, condition, detail) {
    const passed = !!condition;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${detail || ''}`);
    results.push({ name, passed, detail });
    return passed;
  }

  // === 测试1: 事件总线基础功能 ===
  console.log('\n📋 测试1: 事件总线基础功能');
  
  const bus = new NirathEventBus({ name: 'test-pilot', debug: true, enabled: true });
  
  let receivedEvent = null;
  bus.subscribe('test.event', (payload, metadata) => {
    receivedEvent = { payload, metadata };
  });
  
  bus.publish('test.event', { data: 'hello', num: 42 }, { stageId: 'TEST' });
  
  // 等待事件处理（EventEmitter是同步的）
  await new Promise(r => setTimeout(r, 10));
  
  check('事件发布', bus.getEventLog('test.event').length === 1, 
    `日志数=${bus.getEventLog('test.event').length}`);
  check('事件订阅', receivedEvent !== null, 
    `payload.data=${receivedEvent?.payload?.data}`);
  check('事件元数据', receivedEvent?.metadata?.stageId === 'TEST', 
    `stageId=${receivedEvent?.metadata?.stageId}`);

  // === 测试2: 直接调用模式（现有方式） ===
  console.log('\n📋 测试2: 直接调用模式（现有方式）');
  
  const pipelineDirect = new MockPipeline();
  const storyboardDirect = JSON.parse(JSON.stringify(TEST_STORYBOARD)); // 深克隆
  
  const direct7_2 = await pipelineDirect.stageProtagonistInitiative(storyboardDirect, { 
    protagonistId: 'xiaoG', 
    protagonistName: 'AgentX' 
  });
  const directDurations = storyboardDirect.shots.map(s => ({ duration: s.duration }));
  const direct7_3 = await pipelineDirect.stageNarrationTrim(storyboardDirect, directDurations);
  
  check('直接调用7.2', direct7_2.totalInjections >= 0, 
    `注入=${direct7_2.totalInjections}, 被动检测=${direct7_2.passiveDetections}`);
  check('直接调用7.3', direct7_3.trimmedCount >= 0, 
    `精简=${direct7_3.trimmedCount}, 删除字符=${direct7_3.totalTrimmedChars}`);
  check('直接调用次数', pipelineDirect.callCount['7.2'] === 1 && pipelineDirect.callCount['7.3'] === 1,
    `7.2=${pipelineDirect.callCount['7.2']}, 7.3=${pipelineDirect.callCount['7.3']}`);

  // === 测试3: 事件驱动模式（新方式） ===
  console.log('\n📋 测试3: 事件驱动模式（新方式）');
  
  const bus2 = new NirathEventBus({ name: 'pilot-test', debug: true, enabled: true });
  const pipelineEvent = new MockPipeline();
  const storyboardEvent = JSON.parse(JSON.stringify(TEST_STORYBOARD)); // 深克隆
  
  const subscribers = new PipelineEventSubscribers(bus2, pipelineEvent);
  subscribers.registerProtagonistInjector();
  subscribers.registerNarrationTrimmer();
  
  // 发布 storyboard.created 事件（模拟 Stage 7 完成后）
  bus2.publish('storyboard.created', {
    storyboard: storyboardEvent,
    input: { protagonistId: 'xiaoG', protagonistName: 'AgentX' }
  }, { stageId: 'STAGE-7' });
  
  // 等待事件链处理完成
  await new Promise(r => setTimeout(r, 100));
  
  check('事件驱动7.2触发', pipelineEvent.callCount['7.2'] === 1, 
    `7.2调用次数=${pipelineEvent.callCount['7.2']}`);
  check('事件驱动7.3链式触发', pipelineEvent.callCount['7.3'] === 1, 
    `7.3调用次数=${pipelineEvent.callCount['7.3']}（由7.2完成自动触发）`);
  
  // 检查事件日志
  const protagonistEvent = bus2.getEventLog('storyboard.protagonist.enhanced');
  const narrationEvent = bus2.getEventLog('storyboard.narration.trimmed');
  
  check('7.2完成事件', protagonistEvent.length === 1, 
    `事件数=${protagonistEvent.length}`);
  check('7.3完成事件', narrationEvent.length === 1, 
    `事件数=${narrationEvent.length}`);
  check('事件链顺序', 
    protagonistEvent[0]?.metadata?.timestamp <= narrationEvent[0]?.metadata?.timestamp,
    `7.2时间=${protagonistEvent[0]?.metadata?.timestamp}, 7.3时间=${narrationEvent[0]?.metadata?.timestamp}`);

  // === 测试4: 双模式结果一致性 ===
  console.log('\n📋 测试4: 双模式结果一致性（核心验证）');
  
  // 比较直接调用 vs 事件驱动的 storyboard 结果
  const directShots = storyboardDirect.shots;
  const eventShots = storyboardEvent.shots;
  
  let consistency = true;
  const inconsistencies = [];
  
  for (let i = 0; i < Math.min(directShots.length, eventShots.length); i++) {
    const d = directShots[i];
    const e = eventShots[i];
    
    // 检查7.2注入标记
    if (!!d._protagonistEnhanced !== !!e._protagonistEnhanced) {
      consistency = false;
      inconsistencies.push(`Shot[${i}] protagonistEnhanced: direct=${!!d._protagonistEnhanced}, event=${!!e._protagonistEnhanced}`);
    }
    
    // 检查7.3精简标记
    if (!!d._trimmed !== !!e._trimmed) {
      consistency = false;
      inconsistencies.push(`Shot[${i}] trimmed: direct=${!!d._trimmed}, event=${!!e._trimmed}`);
    }
    
    // 如果都精简了，检查narration长度
    if (d._trimmed && e._trimmed && d.narration?.length !== e.narration?.length) {
      consistency = false;
      inconsistencies.push(`Shot[${i}] narration长度: direct=${d.narration?.length}, event=${e.narration?.length}`);
    }
  }
  
  check('Storyboard一致性', consistency, 
    consistency ? '所有镜头标记一致' : `不一致: ${inconsistencies.slice(0, 3).join('; ')}`);
  
  // 比较report结果
  const report7_2_consistent = direct7_2.totalInjections === protagonistEvent[0]?.payload?.report?.totalInjections;
  check('7.2 Report一致性', report7_2_consistent, 
    `直接=${direct7_2.totalInjections}, 事件=${protagonistEvent[0]?.payload?.report?.totalInjections}`);
  
  const report7_3_consistent = direct7_3.trimmedCount === narrationEvent[0]?.payload?.report?.trimmedCount;
  check('7.3 Report一致性', report7_3_consistent, 
    `直接=${direct7_3.trimmedCount}, 事件=${narrationEvent[0]?.payload?.report?.trimmedCount}`);

  // === 测试5: 取消订阅 ===
  console.log('\n📋 测试5: 取消订阅');
  
  const bus3 = new NirathEventBus({ name: 'cleanup-test', enabled: true });
  let callCount = 0;
  const unsub = bus3.subscribe('cleanup.event', () => { callCount++; });
  
  bus3.publish('cleanup.event', {});
  await new Promise(r => setTimeout(r, 10));
  
  check('订阅生效', callCount === 1, `调用次数=${callCount}`);
  
  unsub(); // 取消订阅
  bus3.publish('cleanup.event', {});
  await new Promise(r => setTimeout(r, 10));
  
  check('取消订阅生效', callCount === 1, `取消后调用次数=${callCount}`);

  // === 测试6: 超时等待 ===
  console.log('\n📋 测试6: 超时等待');
  
  const bus4 = new NirathEventBus({ name: 'timeout-test', enabled: true });
  
  // 不发布事件，测试超时
  try {
    await bus4.waitFor('timeout.event', 50);
    check('超时机制', false, '应抛出超时异常');
  } catch (e) {
    check('超时机制', e.message.includes('超时'), `正确捕获超时: ${e.message}`);
  }
  
  // 发布事件后等待
  setTimeout(() => bus4.publish('success.event', { data: 'ok' }), 10);
  try {
    const result = await bus4.waitFor('success.event', 100);
    check('等待成功', result.data === 'ok', `收到数据=${result.data}`);
  } catch (e) {
    check('等待成功', false, `不应超时: ${e.message}`);
  }

  // === 测试7: 禁用模式 ===
  console.log('\n📋 测试7: 禁用模式');
  
  const busDisabled = new NirathEventBus({ name: 'disabled-test', enabled: false });
  let disabledReceived = false;
  busDisabled.subscribe('disabled.event', () => { disabledReceived = true; });
  busDisabled.publish('disabled.event', {});
  await new Promise(r => setTimeout(r, 10));
  
  check('禁用模式', !disabledReceived, `收到事件=${disabledReceived}`);

  // === 汇总 ===
  console.log('\n' + '='.repeat(60));
  console.log('📋 验证汇总');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.detail}`);
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log(`总计: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('\n🎉 所有验证通过！Event Bus Pilot 就绪。');
    console.log('\n✅ 已验证能力：');
    console.log('   1. 事件发布/订阅基础功能');
    console.log('   2. 直接调用 vs 事件驱动结果 100% 一致');
    console.log('   3. 事件链式触发（7.2完成 → 自动触发7.3）');
    console.log('   4. 取消订阅功能');
    console.log('   5. 超时等待机制');
    console.log('   6. 禁用模式不干扰');
    console.log('\n📋 事件定义：');
    for (const [type, def] of Object.entries(EVENT_DEFINITIONS)) {
      console.log(`   ${type}: ${def.description}`);
    }
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${total - passed} 项失败，请检查。`);
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('测试异常:', e);
  process.exit(1);
});
