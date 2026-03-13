import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationStartupRecoveryResponder } from './orchestration-startup-recovery-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationStartupRecoveryResponderProxy = (): {
  callResponder: (params: {
    quests: Quest[];
  }) => ReturnType<typeof OrchestrationStartupRecoveryResponder>;
} => {
  const stateProxy = orchestrationProcessesStateProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  stateProxy.setupEmpty();

  return {
    callResponder: OrchestrationStartupRecoveryResponder,
  };
};
