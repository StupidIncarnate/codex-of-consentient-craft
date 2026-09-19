import { toolUseIdFromParentLinesTransformer } from './tool-use-id-from-parent-lines-transformer';
import { AgentIdStub } from '@dungeonmaster/shared/contracts';

describe('toolUseIdFromParentLinesTransformer', () => {
  describe('a correlation line present among the parent lines', () => {
    it('VALID: {parentLines, agentId} => returns the correlated toolUseId', () => {
      const agentId = AgentIdStub({ value: 'seed-agent-1' });
      const correlationLine = JSON.stringify({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_seed1', content: 'done' }],
        },
        toolUseResult: { agentId: 'seed-agent-1' },
      });

      const result = toolUseIdFromParentLinesTransformer({
        parentLines: [correlationLine],
        agentId,
      });

      expect(result).toBe('toolu_seed1');
    });
  });

  describe('no correlation line present', () => {
    it('EMPTY: {parentLines: []} => returns undefined', () => {
      const result = toolUseIdFromParentLinesTransformer({
        parentLines: [],
        agentId: AgentIdStub({ value: 'seed-agent-1' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
