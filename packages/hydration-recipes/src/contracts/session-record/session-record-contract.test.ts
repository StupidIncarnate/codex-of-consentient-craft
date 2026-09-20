import { sessionRecordContract } from './session-record-contract';
import { SessionRecordStub } from './session-record.stub';

describe('sessionRecordContract', () => {
  describe('valid session records', () => {
    it('VALID: {sessionId, cwd, filePath, lineCount} => parses to exactly those four fields', () => {
      const result = sessionRecordContract.parse({
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
        filePath:
          '/tmp/guilds-under-test/guild-1/.claude/projects/-tmp-guild-1/seed-session-1.jsonl',
        lineCount: 3,
      });

      expect(result).toStrictEqual({
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
        filePath:
          '/tmp/guilds-under-test/guild-1/.claude/projects/-tmp-guild-1/seed-session-1.jsonl',
        lineCount: 3,
      });
    });

    it('VALID: {stub with lineCount override} => parses with the overridden count', () => {
      const result = SessionRecordStub({ lineCount: 5 });

      expect(result.lineCount).toBe(5);
    });
  });

  describe('invalid session records', () => {
    it('INVALID: {cwd, filePath, lineCount — no sessionId} => throws "Required"', () => {
      expect(() =>
        sessionRecordContract.parse({
          cwd: '/tmp/guilds-under-test/guild-1',
          filePath: '/tmp/guilds-under-test/guild-1/seed-session-1.jsonl',
          lineCount: 1,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {filePath: "relative/path"} => throws "Path must be absolute"', () => {
      expect(() =>
        sessionRecordContract.parse({
          sessionId: 'seed-session-1',
          cwd: '/tmp/guilds-under-test/guild-1',
          filePath: 'relative/path',
          lineCount: 1,
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {lineCount: 0} => throws "Number must be greater than 0"', () => {
      expect(() =>
        sessionRecordContract.parse({
          sessionId: 'seed-session-1',
          cwd: '/tmp/guilds-under-test/guild-1',
          filePath: '/tmp/guilds-under-test/guild-1/seed-session-1.jsonl',
          lineCount: 0,
        }),
      ).toThrow(/Number must be greater than 0/u);
    });
  });

  describe('empty session records', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => sessionRecordContract.parse({})).toThrow(/Required/u);
    });
  });
});
