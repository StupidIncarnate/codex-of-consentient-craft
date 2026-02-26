/**
 * PURPOSE: Tracks pending clarification questions during quest orchestration by process and session
 *
 * USAGE:
 * pendingClarificationState.setForProcess({processId, questId, questions});
 * pendingClarificationState.promoteToSession({processId, sessionId});
 * pendingClarificationState.getForSession({sessionId});
 * // Returns pending questions for a session after promotion from process-level tracking
 */

import type { ProcessId, SessionId } from '@dungeonmaster/shared/contracts';

import type { PendingClarificationEntry } from '../../contracts/pending-clarification-entry/pending-clarification-entry-contract';

const processQuestions = new Map<ProcessId, PendingClarificationEntry>();
const sessionQuestions = new Map<SessionId, PendingClarificationEntry>();

export const pendingClarificationState = {
  setForProcess: ({
    processId,
    questId,
    questions,
  }: {
    processId: ProcessId;
  } & PendingClarificationEntry): void => {
    processQuestions.set(processId, { questId, questions });
  },

  promoteToSession: ({
    processId,
    sessionId,
  }: {
    processId: ProcessId;
    sessionId: SessionId;
  }): boolean => {
    const entry = processQuestions.get(processId);
    if (!entry) {
      return false;
    }
    sessionQuestions.set(sessionId, entry);
    processQuestions.delete(processId);
    return true;
  },

  getForSession: ({ sessionId }: { sessionId: SessionId }): PendingClarificationEntry | undefined =>
    sessionQuestions.get(sessionId),

  removeForSession: ({ sessionId }: { sessionId: SessionId }): boolean =>
    sessionQuestions.delete(sessionId),

  clear: (): void => {
    processQuestions.clear();
    sessionQuestions.clear();
  },
} as const;
