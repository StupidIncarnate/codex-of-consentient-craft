import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { QuestExecutionQueueRunnerController } from './quest-execution-queue-runner-contract';

export const QuestExecutionQueueRunnerControllerStub = (): QuestExecutionQueueRunnerController => {
  const ok = adapterResultContract.parse({ success: true });
  return {
    start: () => ok,
    stop: () => ok,
    kick: async () => Promise.resolve(ok),
  };
};
