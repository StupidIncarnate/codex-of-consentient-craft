import { QuestStub } from '../../contracts/quest/quest.stub';
import { QuestSessionStub } from '../../contracts/quest-session/quest-session.stub';
import { SessionIdStub } from '../../contracts/session-id/session-id.stub';
import { questSessionCwdTransformer } from './quest-session-cwd-transformer';

describe('questSessionCwdTransformer', () => {
  describe('a row exists', () => {
    it('VALID: {one row matching the sessionId} => returns its recorded cwd', () => {
      const quest = QuestStub({
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
        ],
      });

      const result = questSessionCwdTransformer({
        quest,
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
      });

      expect(result).toBe('/repo');
    });

    it('VALID: {the SECOND row matches} => returns that row, not the first', () => {
      const quest = QuestStub({
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
          QuestSessionStub({
            sessionId: '8e4e1efe-5619-4d0a-8604-5e92d01423b7',
            cwd: '/repo/worktrees/add-auth',
            role: 'codeweaver',
          }),
        ],
      });

      const result = questSessionCwdTransformer({
        quest,
        sessionId: SessionIdStub({ value: '8e4e1efe-5619-4d0a-8604-5e92d01423b7' }),
      });

      expect(result).toBe('/repo/worktrees/add-auth');
    });

    it('VALID: {quest also records a worktreePath} => returns the ROW, not the worktree', () => {
      const quest = QuestStub({
        worktreePath: '/repo/worktrees/add-auth',
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
        ],
      });

      const result = questSessionCwdTransformer({
        quest,
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
      });

      expect(result).toBe('/repo');
    });

    it('VALID: {row carries no workItemId} => still returns its cwd', () => {
      const quest = QuestStub({
        sessions: [
          QuestSessionStub({
            sessionId: 'f1e0766c-e7fe-47f5-a2e3-60f0fddf5e4c',
            cwd: '/repo/worktrees/add-auth',
            role: 'codeweaver',
          }),
        ],
      });

      const result = questSessionCwdTransformer({
        quest,
        sessionId: SessionIdStub({ value: 'f1e0766c-e7fe-47f5-a2e3-60f0fddf5e4c' }),
      });

      expect(result).toBe('/repo/worktrees/add-auth');
    });
  });

  describe('no row exists', () => {
    it('EMPTY: {sessions: []} => returns null', () => {
      const quest = QuestStub({ sessions: [] });

      const result = questSessionCwdTransformer({
        quest,
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {rows present but none matches} => returns null', () => {
      const quest = QuestStub({
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
        ],
      });

      const result = questSessionCwdTransformer({
        quest,
        sessionId: SessionIdStub({ value: '99bba2ad-d227-453c-9e83-3611ca9f240c' }),
      });

      expect(result).toBe(null);
    });
  });
});
