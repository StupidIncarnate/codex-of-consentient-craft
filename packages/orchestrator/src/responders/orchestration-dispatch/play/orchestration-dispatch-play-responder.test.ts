import { DispatchHoldStub } from '@dungeonmaster/shared/contracts/dispatch-hold/dispatch-hold.stub';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { OrchestrationDispatchPlayResponder } from './orchestration-dispatch-play-responder';
import { OrchestrationDispatchPlayResponderProxy } from './orchestration-dispatch-play-responder.proxy';

describe('OrchestrationDispatchPlayResponder', () => {
  it('VALID: {paused state} => writes node-playing, flips memory state, returns the written state', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupCurrentState({ state: DispatchStateStub() });
    proxy.setupWrittenState({
      state: DispatchStateStub({ mode: 'node-playing', updatedAt: '2024-01-15T10:01:00.000Z' }),
    });

    const result = await OrchestrationDispatchPlayResponder();

    expect(result).toStrictEqual(
      DispatchStateStub({ mode: 'node-playing', updatedAt: '2024-01-15T10:01:00.000Z' }),
    );
    expect(proxy.getWriteCalls()).toStrictEqual([
      { dispatchState: DispatchStateStub({ mode: 'node-playing' }) },
    ]);
    expect(proxy.getIsPlaying()).toBe(true);
  });

  it('VALID: {a live rate-limit hold} => play carries it through rather than clearing it', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupCurrentState({ state: DispatchStateStub({ hold: DispatchHoldStub() }) });

    await OrchestrationDispatchPlayResponder();

    // Pressing play sets the user's intent. The hold still refuses every dispatch, so the queue is
    // armed for the moment the window resets instead of firing a child into a spent quota.
    expect(proxy.getWriteCalls()).toStrictEqual([
      { dispatchState: DispatchStateStub({ mode: 'node-playing', hold: DispatchHoldStub() }) },
    ]);
  });

  it('VALID: {play against a live hold} => getIsPlaying stays false, because the hold still vetoes', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupCurrentState({ state: DispatchStateStub({ hold: DispatchHoldStub() }) });
    proxy.setupWrittenState({
      state: DispatchStateStub({ mode: 'node-playing', hold: DispatchHoldStub() }),
    });

    await OrchestrationDispatchPlayResponder();

    expect(proxy.getIsPlaying()).toBe(false);
  });
});
