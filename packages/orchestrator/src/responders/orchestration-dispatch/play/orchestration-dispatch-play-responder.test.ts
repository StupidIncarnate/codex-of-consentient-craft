import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { DispatchPlayGateResultStub } from '../../../contracts/dispatch-play-gate-result/dispatch-play-gate-result.stub';
import { OrchestrationDispatchPlayResponder } from './orchestration-dispatch-play-responder';
import { OrchestrationDispatchPlayResponderProxy } from './orchestration-dispatch-play-responder.proxy';

describe('OrchestrationDispatchPlayResponder', () => {
  it('VALID: {gate allows} => writes node-playing, flips memory state, returns allowed', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupGate({ result: DispatchPlayGateResultStub({ allowed: true }) });
    proxy.setupCurrentState({ state: DispatchStateStub() });
    proxy.setupWrittenState({
      state: DispatchStateStub({ mode: 'node-playing', updatedAt: '2024-01-15T10:01:00.000Z' }),
    });

    const result = await OrchestrationDispatchPlayResponder({});

    expect(result).toStrictEqual({
      allowed: true,
      state: DispatchStateStub({ mode: 'node-playing', updatedAt: '2024-01-15T10:01:00.000Z' }),
    });
    expect(proxy.getWriteCalls()).toStrictEqual([{ mode: 'node-playing' }]);
    expect(proxy.getIsPlaying()).toBe(true);
  });

  it('VALID: {gate allows, current state has heartbeat} => preserves the heartbeat in the write', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupGate({ result: DispatchPlayGateResultStub({ allowed: true }) });
    proxy.setupCurrentState({
      state: DispatchStateStub({ mcpHeartbeatAt: '2024-01-15T09:00:00.000Z' }),
    });

    await OrchestrationDispatchPlayResponder({});

    expect(proxy.getWriteCalls()).toStrictEqual([
      { mode: 'node-playing', mcpHeartbeatAt: '2024-01-15T09:00:00.000Z' },
    ]);
  });

  it('INVALID: {gate refuses} => returns refusal with reason and unchanged state, memory stays paused', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupGate({
      result: DispatchPlayGateResultStub({
        allowed: false,
        reason: 'A /dumpster-launch loop is active',
      }),
    });
    proxy.setupCurrentState({ state: DispatchStateStub() });

    const result = await OrchestrationDispatchPlayResponder({});

    expect(result).toStrictEqual({
      allowed: false,
      reason: 'A /dumpster-launch loop is active',
      state: DispatchStateStub(),
    });
    expect(proxy.getWriteCalls()).toStrictEqual([]);
    expect(proxy.getIsPlaying()).toBe(false);
  });
});
