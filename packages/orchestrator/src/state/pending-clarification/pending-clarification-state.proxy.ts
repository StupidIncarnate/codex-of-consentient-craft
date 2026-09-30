import type { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { pendingClarificationState } from './pending-clarification-state';
import type { PendingClarificationEntryStub } from '../../contracts/pending-clarification-entry/pending-clarification-entry.stub';
import { pendingClarificationEntryContract } from '../../contracts/pending-clarification-entry/pending-clarification-entry-contract';

type ProcessId = string;
type SessionId = ReturnType<typeof SessionIdStub>;
type PendingClarificationEntry = ReturnType<typeof PendingClarificationEntryStub>;

export const pendingClarificationStateProxy = (): {
  setupEmpty: () => void;
  setupWithProcessEntry: (params: {
    processId: ProcessId;
    questId: PendingClarificationEntry['questId'];
    questions: PendingClarificationEntry['questions'];
  }) => void;
  setupWithSessionEntry: (params: {
    sessionId: SessionId;
    questId: PendingClarificationEntry['questId'];
    questions: PendingClarificationEntry['questions'];
  }) => void;
} => ({
  setupEmpty: (): void => {
    pendingClarificationState.clear();
  },

  setupWithProcessEntry: ({
    processId,
    questId,
    questions,
  }: {
    processId: ProcessId;
    questId: PendingClarificationEntry['questId'];
    questions: PendingClarificationEntry['questions'];
  }): void => {
    pendingClarificationState.clear();
    pendingClarificationState.setForProcess({
      processId,
      ...pendingClarificationEntryContract.parse({ questId, questions }),
    });
  },

  setupWithSessionEntry: ({
    sessionId,
    questId,
    questions,
  }: {
    sessionId: SessionId;
    questId: PendingClarificationEntry['questId'];
    questions: PendingClarificationEntry['questions'];
  }): void => {
    pendingClarificationState.clear();
    const tempProcessId = 'temp-promote';
    pendingClarificationState.setForProcess({
      processId: tempProcessId,
      ...pendingClarificationEntryContract.parse({ questId, questions }),
    });
    pendingClarificationState.promoteToSession({
      processId: tempProcessId,
      sessionId,
    });
  },
});
