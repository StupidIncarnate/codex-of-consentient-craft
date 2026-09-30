import type { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { pendingClarificationState } from './pending-clarification-state';
import type { PendingClarificationEntryStub } from '../../contracts/pending-clarification-entry/pending-clarification-entry.stub';
import { pendingClarificationEntryContract } from '../../contracts/pending-clarification-entry/pending-clarification-entry-contract';

type ProcessId = string;
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
    pendingClarificationState.setForProcess(pendingClarificationEntryContract.parse({ processId, questId, questions }));
  },

  setupWithSessionEntry: ({
    sessionId,
    questId,
    questions,
  }: { sessionId: SessionId } & PendingClarificationEntry): void => {
    pendingClarificationState.clear();
    const tempProcessId = 'temp-promote';
    pendingClarificationState.setForProcess(pendingClarificationEntryContract.parse({
      processId: tempProcessId,
      questId,
      questions,
    }));
    pendingClarificationState.promoteToSession({
      processId: tempProcessId,
      sessionId,
    });
  },
});
