import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { OrchestrationDispatchPlayResponderProxy } from './orchestration-dispatch-play-responder.proxy';

describe('OrchestrationDispatchPlayResponder', () => {
  it('VALID: {play succeeds} => returns 200 with the playing state', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupState({ state: DispatchStateStub({ mode: 'node-playing' }) });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: { state: DispatchStateStub({ mode: 'node-playing' }) },
    });
  });

  it('ERROR: {adapter throws} => returns 500 with error message', async () => {
    const proxy = OrchestrationDispatchPlayResponderProxy();
    proxy.setupError({ message: 'play failed' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'play failed' },
    });
  });
});
