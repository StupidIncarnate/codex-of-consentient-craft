import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchPauseResponderProxy } from './orchestration-dispatch-pause-responder.proxy';

describe('OrchestrationDispatchPauseResponder', () => {
  it('VALID: {pause succeeds} => returns 200 with the paused state', async () => {
    const proxy = OrchestrationDispatchPauseResponderProxy();
    proxy.setupState({ state: DispatchStateStub() });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: { state: DispatchStateStub() },
    });
  });

  it('ERROR: {adapter throws} => returns 500 with error message', async () => {
    const proxy = OrchestrationDispatchPauseResponderProxy();
    proxy.setupError({ message: 'pause failed' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'pause failed' },
    });
  });
});
