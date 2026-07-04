import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchGetResponderProxy } from './orchestration-dispatch-get-responder.proxy';

describe('OrchestrationDispatchGetResponder', () => {
  it('VALID: {state readable} => returns 200 with the state', async () => {
    const proxy = OrchestrationDispatchGetResponderProxy();
    proxy.setupState({ state: DispatchStateStub({ mode: 'node-playing' }) });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: { state: DispatchStateStub({ mode: 'node-playing' }) },
    });
  });

  it('ERROR: {adapter throws} => returns 500 with error message', async () => {
    const proxy = OrchestrationDispatchGetResponderProxy();
    proxy.setupError({ message: 'read failed' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'read failed' },
    });
  });
});
