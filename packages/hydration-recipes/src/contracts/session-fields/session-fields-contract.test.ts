import { sessionFieldsContract } from './session-fields-contract';
import { SessionFieldsStub } from './session-fields.stub';

describe('sessionFieldsContract', () => {
  describe('valid session fields', () => {
    it('VALID: {sessionId, cwd, lines} => parses to exactly those three fields', () => {
      const result = sessionFieldsContract.parse({
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
        lines: ['{"type":"init","session_id":"abc-123"}'],
      });

      expect(result).toStrictEqual({
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
        lines: ['{"type":"init","session_id":"abc-123"}'],
      });
    });

    it('VALID: {lines: []} => parses with an empty line array', () => {
      const result = sessionFieldsContract.parse({
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
        lines: [],
      });

      expect(result.lines).toStrictEqual([]);
    });

    it('VALID: {stub with sessionId override} => parses with the overridden id', () => {
      const result = SessionFieldsStub({ sessionId: 'seed-session-2' });

      expect(result.sessionId).toBe('seed-session-2');
    });
  });

  describe('invalid session fields', () => {
    it('INVALID: {cwd, lines — no sessionId} => throws "Required"', () => {
      expect(() =>
        sessionFieldsContract.parse({ cwd: '/tmp/guilds-under-test/guild-1', lines: [] }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {cwd: "relative/path"} => throws "Path must be absolute"', () => {
      expect(() =>
        sessionFieldsContract.parse({
          sessionId: 'seed-session-1',
          cwd: 'relative/path',
          lines: [],
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {lines: [""]} => throws on an empty line', () => {
      expect(() =>
        sessionFieldsContract.parse({
          sessionId: 'seed-session-1',
          cwd: '/tmp/guilds-under-test/guild-1',
          lines: [''],
        }),
      ).toThrow(/too_small/u);
    });
  });

  describe('empty session fields', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => sessionFieldsContract.parse({})).toThrow(/Required/u);
    });
  });
});
