import type { ProcessIdStub } from '../../contracts/process-id/process-id.stub';

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
