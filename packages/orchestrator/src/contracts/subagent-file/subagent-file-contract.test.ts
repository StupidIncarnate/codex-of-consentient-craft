import { StreamJsonLineStub } from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../agent-id/agent-id.stub';

import { subagentFileContract } from './subagent-file-contract';
import { SubagentFileStub } from './subagent-file.stub';

describe('subagentFileContract', () => {
  describe('valid sub-agent files', () => {
    it('VALID: {agentId + one line} => parses to the same shape', () => {
      const agentId = AgentIdStub({ value: 'real-x' });
      const line = StreamJsonLineStub({ value: '{"type":"assistant","message":{"content":[]}}' });

      const result = SubagentFileStub({ agentId, lines: [line] });

      expect(result).toStrictEqual({ agentId, lines: [line] });
    });
  });

  describe('invalid sub-agent files', () => {
    it('INVALID: {agentId empty} => throws validation error', () => {
      expect(() => subagentFileContract.parse({ agentId: '', lines: [] })).toThrow(/too_small/u);
    });
  });
});
