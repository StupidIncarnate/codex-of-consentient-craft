import { subagentFieldsContract } from './subagent-fields-contract';
import { SubagentFieldsStub } from './subagent-fields.stub';

describe('subagentFieldsContract', () => {
  describe('valid subagent fields', () => {
    it('VALID: {every field} => parses to exactly those eight fields', () => {
      const result = subagentFieldsContract.parse({
        agentId: 'seed-agent-1',
        toolUseId: 'toolu_seed1',
        taskDescription: 'Seeded task 1',
        taskPrompt: 'Research the auth system',
        lines: ['{"type":"init","session_id":"abc-123"}'],
        completed: true,
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
      });

      expect(result).toStrictEqual({
        agentId: 'seed-agent-1',
        toolUseId: 'toolu_seed1',
        taskDescription: 'Seeded task 1',
        taskPrompt: 'Research the auth system',
        lines: ['{"type":"init","session_id":"abc-123"}'],
        completed: true,
        sessionId: 'seed-session-1',
        cwd: '/tmp/guilds-under-test/guild-1',
      });
    });

    it('VALID: {completed: false} => parses an in-flight sub-agent', () => {
      const result = SubagentFieldsStub({ completed: false });

      expect(result.completed).toBe(false);
    });

    it('VALID: {stub with agentId override} => parses with the overridden id', () => {
      const result = SubagentFieldsStub({ agentId: 'seed-agent-2' });

      expect(result.agentId).toBe('seed-agent-2');
    });
  });

  describe('invalid subagent fields', () => {
    it('INVALID: {no agentId} => throws "Required"', () => {
      expect(() =>
        subagentFieldsContract.parse({
          toolUseId: 'toolu_seed1',
          taskDescription: 'Seeded task 1',
          taskPrompt: 'Research the auth system',
          lines: [],
          completed: true,
          sessionId: 'seed-session-1',
          cwd: '/tmp/guilds-under-test/guild-1',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {completed: "yes"} => throws "Expected boolean"', () => {
      expect(() =>
        subagentFieldsContract.parse({
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          taskDescription: 'Seeded task 1',
          taskPrompt: 'Research the auth system',
          lines: [],
          completed: 'yes' as never,
          sessionId: 'seed-session-1',
          cwd: '/tmp/guilds-under-test/guild-1',
        }),
      ).toThrow(/Expected boolean/u);
    });

    it('INVALID: {taskDescription: ""} => throws on empty string', () => {
      expect(() =>
        subagentFieldsContract.parse({
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          taskDescription: '',
          taskPrompt: 'Research the auth system',
          lines: [],
          completed: true,
          sessionId: 'seed-session-1',
          cwd: '/tmp/guilds-under-test/guild-1',
        }),
      ).toThrow(/too_small/u);
    });
  });

  describe('empty subagent fields', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => subagentFieldsContract.parse({})).toThrow(/Required/u);
    });
  });
});
