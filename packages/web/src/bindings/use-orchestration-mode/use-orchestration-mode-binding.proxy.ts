import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { orchestrationModeGetBrokerProxy } from '../../brokers/orchestration/mode-get/orchestration-mode-get-broker.proxy';

export const useOrchestrationModeBindingProxy = (): ReturnType<
  typeof orchestrationModeGetBrokerProxy
> => {
  const broker = orchestrationModeGetBrokerProxy();
  // useOrchestrationModeBinding logs directly from its inner catch (no setError state), so any
  // test composing this binding without staging a mode response would otherwise throw here.
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  registerSpyOn({ object: globalThis.console, method: 'error', passthrough: true })
    .calledWith(['[use-orchestration-mode]'])
    .returns(undefined);

  return { ...broker };
};
