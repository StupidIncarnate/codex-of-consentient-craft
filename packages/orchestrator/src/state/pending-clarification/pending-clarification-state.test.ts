import { ProcessIdStub, SessionIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { pendingClarificationState } from './pending-clarification-state';
import { pendingClarificationStateProxy } from './pending-clarification-state.proxy';
import { ClarificationQuestionStub } from '../../contracts/clarification-question/clarification-question.stub';

describe('pendingClarificationState', () => {
  describe('setForProcess', () => {
    it('VALID: {processId, questId, questions} => stores entry by processId', () => {
      const proxy = pendingClarificationStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'proc-1' });
      const questId = QuestIdStub({ value: 'quest-1' });
      const questions = [ClarificationQuestionStub()];

      pendingClarificationState.setForProcess({ processId, questId, questions });

      const sessionId = SessionIdStub({ value: 'session-1' });
      pendingClarificationState.promoteToSession({ processId, sessionId });
      const result = pendingClarificationState.getForSession({ sessionId });

      expect(result).toStrictEqual({
        questId: 'quest-1',
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Architecture Choice',
            options: [
              { label: 'Option A', description: 'Use REST endpoints' },
              { label: 'Option B', description: 'Use GraphQL' },
            ],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('promoteToSession', () => {
    it('VALID: {existing processId, sessionId} => moves entry to session map and returns true', () => {
      const proxy = pendingClarificationStateProxy();
      const processId = ProcessIdStub({ value: 'proc-promote' });
      const questId = QuestIdStub({ value: 'quest-promote' });
      const questions = [ClarificationQuestionStub()];
      proxy.setupWithProcessEntry({ processId, questId, questions });

      const sessionId = SessionIdStub({ value: 'session-promote' });
      const result = pendingClarificationState.promoteToSession({ processId, sessionId });

      expect(result).toBe(true);

      const sessionEntry = pendingClarificationState.getForSession({ sessionId });

      expect(sessionEntry).toStrictEqual({
        questId: 'quest-promote',
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Architecture Choice',
            options: [
              { label: 'Option A', description: 'Use REST endpoints' },
              { label: 'Option B', description: 'Use GraphQL' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('EMPTY: {nonexistent processId} => returns false', () => {
      const proxy = pendingClarificationStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'nonexistent' });
      const sessionId = SessionIdStub({ value: 'session-no-match' });

      const result = pendingClarificationState.promoteToSession({ processId, sessionId });

      expect(result).toBe(false);
    });

    it('VALID: {promote} => removes entry from process map', () => {
      const proxy = pendingClarificationStateProxy();
      const processId = ProcessIdStub({ value: 'proc-remove' });
      const questId = QuestIdStub({ value: 'quest-remove' });
      const questions = [ClarificationQuestionStub()];
      proxy.setupWithProcessEntry({ processId, questId, questions });

      const sessionId = SessionIdStub({ value: 'session-remove' });
      pendingClarificationState.promoteToSession({ processId, sessionId });

      const secondPromote = pendingClarificationState.promoteToSession({
        processId,
        sessionId: SessionIdStub({ value: 'session-second' }),
      });

      expect(secondPromote).toBe(false);
    });
  });

  describe('getForSession', () => {
    it('VALID: {existing sessionId} => returns pending entry', () => {
      const proxy = pendingClarificationStateProxy();
      const sessionId = SessionIdStub({ value: 'session-get' });
      const questId = QuestIdStub({ value: 'quest-get' });
      const questions = [ClarificationQuestionStub()];
      proxy.setupWithSessionEntry({ sessionId, questId, questions });

      const result = pendingClarificationState.getForSession({ sessionId });

      expect(result).toStrictEqual({
        questId: 'quest-get',
        questions: [
          {
            question: 'Which approach do you prefer?',
            header: 'Architecture Choice',
            options: [
              { label: 'Option A', description: 'Use REST endpoints' },
              { label: 'Option B', description: 'Use GraphQL' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('EMPTY: {nonexistent sessionId} => returns undefined', () => {
      const proxy = pendingClarificationStateProxy();
      proxy.setupEmpty();
      const sessionId = SessionIdStub({ value: 'nonexistent-session' });

      const result = pendingClarificationState.getForSession({ sessionId });

      expect(result).toBeUndefined();
    });
  });

  describe('removeForSession', () => {
    it('VALID: {existing sessionId} => removes entry and returns true', () => {
      const proxy = pendingClarificationStateProxy();
      const sessionId = SessionIdStub({ value: 'session-del' });
      const questId = QuestIdStub({ value: 'quest-del' });
      const questions = [ClarificationQuestionStub()];
      proxy.setupWithSessionEntry({ sessionId, questId, questions });

      const result = pendingClarificationState.removeForSession({ sessionId });

      expect(result).toBe(true);
      expect(pendingClarificationState.getForSession({ sessionId })).toBeUndefined();
    });

    it('EMPTY: {nonexistent sessionId} => returns false', () => {
      const proxy = pendingClarificationStateProxy();
      proxy.setupEmpty();
      const sessionId = SessionIdStub({ value: 'nonexistent-del' });

      const result = pendingClarificationState.removeForSession({ sessionId });

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('VALID: {entries in both maps} => clears all entries', () => {
      const proxy = pendingClarificationStateProxy();
      proxy.setupEmpty();
      const processId = ProcessIdStub({ value: 'proc-clear' });
      const questId = QuestIdStub({ value: 'quest-clear' });
      const questions = [ClarificationQuestionStub()];
      const sessionId = SessionIdStub({ value: 'session-clear' });

      pendingClarificationState.setForProcess({ processId, questId, questions });
      pendingClarificationState.promoteToSession({ processId, sessionId });
      pendingClarificationState.setForProcess({
        processId: ProcessIdStub({ value: 'proc-clear-2' }),
        questId,
        questions,
      });

      pendingClarificationState.clear();

      expect(pendingClarificationState.getForSession({ sessionId })).toBeUndefined();

      const promoteResult = pendingClarificationState.promoteToSession({
        processId: ProcessIdStub({ value: 'proc-clear-2' }),
        sessionId: SessionIdStub({ value: 'session-clear-2' }),
      });

      expect(promoteResult).toBe(false);
    });
  });
});
