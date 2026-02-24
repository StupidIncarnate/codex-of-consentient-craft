import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { chatProcessState } from './chat-process-state';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const chatProcessStateProxy = (): {
  setupWithProcess: (params: { processId: ProcessId; kill: jest.Mock }) => void;
  setupEmpty: () => void;
} => ({
  setupWithProcess: ({ processId, kill }: { processId: ProcessId; kill: jest.Mock }): void => {
    chatProcessState.clear();
    chatProcessState.register({ processId, kill });
  },

  setupEmpty: (): void => {
    chatProcessState.clear();
  },
});
