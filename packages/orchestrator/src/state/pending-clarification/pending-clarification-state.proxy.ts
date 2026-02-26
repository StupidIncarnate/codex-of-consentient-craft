import type { SessionIdStub } from '@dungeonmaster/shared/contracts';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { pendingClarificationState } from './pending-clarification-state';
import type { PendingClarificationEntryStub } from '../../contracts/pending-clarification-entry/pending-clarification-entry.stub';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type SessionId = ReturnType<typeof SessionIdStub>;
type PendingClarificationEntry = ReturnType<typeof PendingClarificationEntryStub>;

export const pendingClarificationStateProxy = (): {
  setupEmpty: () => void;
  setupWithProcessEntry: (params: { processId: ProcessId } & PendingClarificationEntry) => void;
  setupWithSessionEntry: (params: { sessionId: SessionId } & PendingClarificationEntry) => void;
} => ({
  setupEmpty: (): void => {
    pendingClarificationState.clear();
  },

  setupWithProcessEntry: ({
    processId,
    questId,
    questions,
  }: { processId: ProcessId } & PendingClarificationEntry): void => {
    pendingClarificationState.clear();
    pendingClarificationState.setForProcess({ processId, questId, questions });
  },

  setupWithSessionEntry: ({
    sessionId,
    questId,
    questions,
  }: { sessionId: SessionId } & PendingClarificationEntry): void => {
    pendingClarificationState.clear();
    const tempProcessId = ProcessIdStub({ value: 'temp-promote' });
    pendingClarificationState.setForProcess({
      processId: tempProcessId,
      questId,
      questions,
    });
    pendingClarificationState.promoteToSession({
      processId: tempProcessId,
      sessionId,
    });
  },
});
