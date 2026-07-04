import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchPauseResponder } from './orchestration-dispatch-pause-responder';
import { OrchestrationDispatchPauseResponderProxy } from './orchestration-dispatch-pause-responder.proxy';

describe('OrchestrationDispatchPauseResponder', () => {
  it('VALID: {playing} => writes paused, flips memory state off, returns the persisted state', async () => {
    const proxy = OrchestrationDispatchPauseResponderProxy();
    proxy.setPlayingFirst();
    proxy.setupCurrentState({ state: DispatchStateStub({ mode: 'node-playing' }) });
    proxy.setupWrittenState({
      state: DispatchStateStub({ updatedAt: '2024-01-15T10:02:00.000Z' }),
    });

    const result = await OrchestrationDispatchPauseResponder();

    expect(result).toStrictEqual(DispatchStateStub({ updatedAt: '2024-01-15T10:02:00.000Z' }));
    expect(proxy.getWriteCalls()).toStrictEqual([{ mode: 'paused' }]);
    expect(proxy.getIsPlaying()).toBe(false);
  });

  it('VALID: {current state has heartbeat} => preserves the heartbeat in the write', async () => {
    const proxy = OrchestrationDispatchPauseResponderProxy();
    proxy.setupCurrentState({
      state: DispatchStateStub({
        mode: 'node-playing',
        mcpHeartbeatAt: '2024-01-15T09:00:00.000Z',
      }),
    });

    await OrchestrationDispatchPauseResponder();

    expect(proxy.getWriteCalls()).toStrictEqual([
      { mode: 'paused', mcpHeartbeatAt: '2024-01-15T09:00:00.000Z' },
    ]);
  });
});
