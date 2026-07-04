import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchNormalizeBootResponder } from './orchestration-dispatch-normalize-boot-responder';
import { OrchestrationDispatchNormalizeBootResponderProxy } from './orchestration-dispatch-normalize-boot-responder.proxy';

describe('OrchestrationDispatchNormalizeBootResponder', () => {
  it('VALID: {persisted mode: node-playing} => writes paused and returns the written state', async () => {
    const proxy = OrchestrationDispatchNormalizeBootResponderProxy();
    proxy.setupCurrentState({ state: DispatchStateStub({ mode: 'node-playing' }) });
    proxy.setupWrittenState({
      state: DispatchStateStub({ updatedAt: '2024-01-15T10:05:00.000Z' }),
    });

    const result = await OrchestrationDispatchNormalizeBootResponder();

    expect(result).toStrictEqual(DispatchStateStub({ updatedAt: '2024-01-15T10:05:00.000Z' }));
    expect(proxy.getWriteCalls()).toStrictEqual([{ mode: 'paused' }]);
  });

  it('VALID: {persisted node-playing with heartbeat} => preserves the heartbeat in the paused write', async () => {
    const proxy = OrchestrationDispatchNormalizeBootResponderProxy();
    proxy.setupCurrentState({
      state: DispatchStateStub({
        mode: 'node-playing',
        mcpHeartbeatAt: '2024-01-15T09:00:00.000Z',
      }),
    });

    await OrchestrationDispatchNormalizeBootResponder();

    expect(proxy.getWriteCalls()).toStrictEqual([
      { mode: 'paused', mcpHeartbeatAt: '2024-01-15T09:00:00.000Z' },
    ]);
  });

  it('VALID: {persisted mode: paused} => no write, returns the current state', async () => {
    const proxy = OrchestrationDispatchNormalizeBootResponderProxy();
    proxy.setupCurrentState({ state: DispatchStateStub() });

    const result = await OrchestrationDispatchNormalizeBootResponder();

    expect(result).toStrictEqual(DispatchStateStub());
    expect(proxy.getWriteCalls()).toStrictEqual([]);
  });
});
