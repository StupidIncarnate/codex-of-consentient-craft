import { agentOutputStateProxy } from '../../state/agent-output/agent-output-state.proxy';

export const useAgentOutputBindingProxy = (): {
  setupEmpty: () => void;
} => {
  const stateProxy = agentOutputStateProxy();

  return {
    setupEmpty: (): void => {
      stateProxy.setupEmptyOutput();
    },
  };
};
