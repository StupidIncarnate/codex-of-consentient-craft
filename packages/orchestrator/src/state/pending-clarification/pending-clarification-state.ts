/**
 * PURPOSE: Tracks pending clarification questions during quest orchestration by process and session
 *
 * USAGE:
 * pendingClarificationState.setForProcess({processId, questId, questions});
 * pendingClarificationState.promoteToSession({processId, sessionId});
 * pendingClarificationState.getForSession({sessionId});
 * // Returns pending questions for a session after promotion from process-level tracking
 */

import type { Session } from '@dungeonmaster/shared/contracts';

import { pendingClarificationEntryContract } from '../../contracts/pending-clarification-entry/pending-clarification-entry-contract';
import type { PendingClarificationEntry } from '../../contracts/pending-clarification-entry/pending-clarification-entry-contract';

const processQuestions = new Map<string, PendingClarificationEntry>();
const sessionQuestions = new Map<Session['id'], PendingClarificationEntry>();

export const pendingClarificationState = {
  setForProcess: ({
    processId,
    questId,
    questions,
  }: {
    processId: string;
  } & PendingClarificationEntry): void => {
    processQuestions.set(
      processId,
      pendingClarificationEntryContract.parse({ questId, questions }),
    );
  },

  promoteToSession: ({
    processId,
    sessionId,
  }: {
    processId: string;
    sessionId: Session['id'];
  }): boolean => {
    const entry = processQuestions.get(processId);
    if (!entry) {
      return false;
    }
    sessionQuestions.set(sessionId, entry);
    processQuestions.delete(processId);
    return true;
  },

  getForSession: ({ sessionId }: { sessionId: Session['id'] }): PendingClarificationEntry | undefined =>
    sessionQuestions.get(sessionId),

  removeForSession: ({ sessionId }: { sessionId: Session['id'] }): boolean =>
    sessionQuestions.delete(sessionId),

  clear: (): void => {
    processQuestions.clear();
    sessionQuestions.clear();
  },
} as const;
