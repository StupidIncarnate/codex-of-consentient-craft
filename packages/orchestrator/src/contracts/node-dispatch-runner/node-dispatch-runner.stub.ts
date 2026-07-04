import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { NodeDispatchRunnerController } from './node-dispatch-runner-contract';

export const NodeDispatchRunnerControllerStub = (): NodeDispatchRunnerController => {
  const ok = adapterResultContract.parse({ success: true });
  return {
    start: () => ok,
    stop: () => ok,
    kick: async () => Promise.resolve(ok),
  };
};
