import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationDispatchGetResponder } from './orchestration-dispatch-get-responder';
import { OrchestrationDispatchGetResponderProxy } from './orchestration-dispatch-get-responder.proxy';

describe('OrchestrationDispatchGetResponder', () => {
  it('VALID: {state file: node-playing} => returns the persisted state', async () => {
    const proxy = OrchestrationDispatchGetResponderProxy();
    proxy.setupState({ state: DispatchStateStub({ mode: 'node-playing' }) });

    const result = await OrchestrationDispatchGetResponder();

    expect(result).toStrictEqual(DispatchStateStub({ mode: 'node-playing' }));
  });

  it('EMPTY: {no setup} => returns the paused default', async () => {
    OrchestrationDispatchGetResponderProxy();

    const result = await OrchestrationDispatchGetResponder();

    expect(result).toStrictEqual(DispatchStateStub());
  });
});
