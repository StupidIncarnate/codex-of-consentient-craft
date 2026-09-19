import { subagentRecordContract } from './subagent-record-contract';
import { SubagentRecordStub } from './subagent-record.stub';

describe('subagentRecordContract', () => {
  describe('valid subagent records', () => {
    it('VALID: {agentId, toolUseId, filePath, lineCount} => parses to exactly those four fields', () => {
      const result = subagentRecordContract.parse({
        agentId: 'seed-agent-1',
        toolUseId: 'toolu_seed1',
        filePath: '/tmp/guilds-under-test/guild-1/subagents/agent-seed-agent-1.jsonl',
        lineCount: 2,
      });

      expect(result).toStrictEqual({
        agentId: 'seed-agent-1',
        toolUseId: 'toolu_seed1',
        filePath: '/tmp/guilds-under-test/guild-1/subagents/agent-seed-agent-1.jsonl',
        lineCount: 2,
      });
    });

    it('VALID: {stub with lineCount override} => parses with the overridden count', () => {
      const result = SubagentRecordStub({ lineCount: 7 });

      expect(result.lineCount).toBe(7);
    });
  });

  describe('invalid subagent records', () => {
    it('INVALID: {toolUseId, filePath, lineCount — no agentId} => throws "Required"', () => {
      expect(() =>
        subagentRecordContract.parse({
          toolUseId: 'toolu_seed1',
          filePath: '/tmp/guilds-under-test/guild-1/subagents/agent-seed-agent-1.jsonl',
          lineCount: 1,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {filePath: "relative/path"} => throws "Path must be absolute"', () => {
      expect(() =>
        subagentRecordContract.parse({
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          filePath: 'relative/path',
          lineCount: 1,
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {lineCount: -1} => throws "Number must be greater than 0"', () => {
      expect(() =>
        subagentRecordContract.parse({
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          filePath: '/tmp/guilds-under-test/guild-1/subagents/agent-seed-agent-1.jsonl',
          lineCount: -1,
        }),
      ).toThrow(/Number must be greater than 0/u);
    });
  });

  describe('empty subagent records', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => subagentRecordContract.parse({})).toThrow(/Required/u);
    });
  });
});
