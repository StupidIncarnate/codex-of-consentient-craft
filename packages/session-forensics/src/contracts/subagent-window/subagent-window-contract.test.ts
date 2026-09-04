import { subagentWindowContract } from './subagent-window-contract';
import { SubagentWindowStub } from './subagent-window.stub';

describe('subagentWindowContract', () => {
  describe('valid input', () => {
    it('VALID: {agentId, startedAt, endedAt} => returns the branded window', () => {
      const result = subagentWindowContract.parse({
        agentId: 'agent-solo',
        startedAt: '2026-09-01T19:00:00.000Z',
        endedAt: '2026-09-01T19:05:00.000Z',
      });

      expect(result).toStrictEqual(
        SubagentWindowStub({
          agentId: 'agent-solo',
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:05:00.000Z',
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startedAt equals endedAt} => returns the branded zero-length window', () => {
      const result = subagentWindowContract.parse({
        agentId: 'agent-instant',
        startedAt: '2026-09-01T19:00:00.000Z',
        endedAt: '2026-09-01T19:00:00.000Z',
      });

      expect(result).toStrictEqual(
        SubagentWindowStub({
          agentId: 'agent-instant',
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {agentId: empty string} => throws', () => {
      expect(() => SubagentWindowStub({ agentId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {startedAt: date only, no time} => throws', () => {
      expect(() => SubagentWindowStub({ startedAt: '2026-09-01' })).toThrow(/datetime/u);
    });

    it('INVALID: {endedAt: number} => throws', () => {
      expect(() => SubagentWindowStub({ endedAt: 1_788_491_226 as never })).toThrow(
        /Expected string/u,
      );
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {no endedAt} => throws', () => {
      expect(() =>
        subagentWindowContract.parse({
          agentId: 'agent-abc',
          startedAt: '2026-09-01T19:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });
  });
});
