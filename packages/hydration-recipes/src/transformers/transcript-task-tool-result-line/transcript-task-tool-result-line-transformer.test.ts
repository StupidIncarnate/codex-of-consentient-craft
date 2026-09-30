import { AgentStub } from '@dungeonmaster/shared/contracts/agent/agent.stub';

import { transcriptTaskToolResultLineTransformer } from './transcript-task-tool-result-line-transformer';

describe('transcriptTaskToolResultLineTransformer', () => {
  it('VALID: {toolUseId, content, agentId} => returns a tool_result line carrying toolUseResult.agentId', () => {
    const result = transcriptTaskToolResultLineTransformer({
      toolUseId: 'toolu_seed_nested_1',
      content: 'done',
      agentId: AgentStub({ id: 'seed-agent-1' }).id,
    });

    expect(result).toStrictEqual({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'toolu_seed_nested_1', content: 'done' }],
      },
      toolUseResult: { agentId: 'seed-agent-1' },
    });
  });
});
