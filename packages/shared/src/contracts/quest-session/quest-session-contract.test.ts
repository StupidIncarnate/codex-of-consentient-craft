import { workItemRoleStatics } from '../../statics/work-item-role/work-item-role-statics';
import { questSessionContract } from './quest-session-contract';
import { QuestSessionStub } from './quest-session.stub';

const ROLES = workItemRoleStatics.names;

describe('questSessionContract', () => {
  describe('valid quest sessions', () => {
    it('VALID: {no workItemId} => parses without one', () => {
      const session = QuestSessionStub();

      const result = questSessionContract.parse(session);

      expect(result).toStrictEqual({
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo',
        role: 'codeweaver',
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {workItemId supplied} => parses carrying it', () => {
      const session = QuestSessionStub({
        workItemId: '8acf84af-a24b-4d29-9e4e-4819d21a5480',
      });

      const result = questSessionContract.parse(session);

      expect(result).toStrictEqual({
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo',
        role: 'codeweaver',
        workItemId: '8acf84af-a24b-4d29-9e4e-4819d21a5480',
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {cwd is a worktree beneath the repo} => parses the full path', () => {
      const session = QuestSessionStub({
        cwd: '/repo/worktrees/live-elapsed-duration-c8171a64',
        role: 'chaoswhisperer',
      });

      const result = questSessionContract.parse(session);

      expect(result).toStrictEqual({
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo/worktrees/live-elapsed-duration-c8171a64',
        role: 'chaoswhisperer',
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {cwd is a Windows absolute path} => parses', () => {
      const session = QuestSessionStub({ cwd: 'C:\\repo' });

      const result = questSessionContract.parse(session);

      expect(result).toStrictEqual({
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: 'C:\\repo',
        role: 'codeweaver',
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it.each(ROLES)('VALID: {role: %s} => parses', (role) => {
      const session = QuestSessionStub({ role });

      const result = questSessionContract.parse(session);

      expect(result).toStrictEqual({
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo',
        role,
        startedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid quest sessions', () => {
    it('INVALID: {sessionId: ""} => throws a too-small error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: '',
          cwd: '/repo',
          role: 'codeweaver',
          startedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {cwd: "relative/path"} => throws a must-be-absolute error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: 'relative/path',
          role: 'codeweaver',
          startedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {role: "codeweaver-reviewer"} => throws an invalid-enum error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'codeweaver-reviewer',
          startedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {workItemId: "not-a-uuid"} => throws an invalid-uuid error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'codeweaver',
          workItemId: 'not-a-uuid',
          startedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {startedAt: "2024-01-15"} => throws an invalid-datetime error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'codeweaver',
          startedAt: '2024-01-15',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {cwd: 42} => throws an expected-string error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: 42,
          role: 'codeweaver',
          startedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {only sessionId} => throws a required error', () => {
      expect(() => {
        return questSessionContract.parse({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        });
      }).toThrow(/Required/u);
    });
  });
});
