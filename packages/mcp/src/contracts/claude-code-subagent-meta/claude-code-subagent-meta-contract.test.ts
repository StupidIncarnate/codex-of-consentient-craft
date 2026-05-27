import { claudeCodeSubagentMetaContract } from './claude-code-subagent-meta-contract';
import { ClaudeCodeSubagentMetaStub } from './claude-code-subagent-meta.stub';

describe('claudeCodeSubagentMetaContract', () => {
  it('VALID: {minimal meta with toolUseId} => parses successfully', () => {
    const result = claudeCodeSubagentMetaContract.parse(ClaudeCodeSubagentMetaStub());

    expect(result.toolUseId).toBe('toolu_01B3VQHjYXB5Wap7jrw1T3uS');
  });

  it('VALID: {meta with extra fields like agentType+description} => parses successfully (passthrough)', () => {
    const result = claudeCodeSubagentMetaContract.parse({
      toolUseId: 'toolu_01KfM8kWZATagwS33eTq5fZS',
      agentType: 'general-purpose',
      description: 'pathseeker-dedup dispatch',
    });

    expect(result.toolUseId).toBe('toolu_01KfM8kWZATagwS33eTq5fZS');
  });

  it('INVALID: {missing toolUseId} => throws', () => {
    expect(() => claudeCodeSubagentMetaContract.parse({ agentType: 'general-purpose' })).toThrow(
      /toolUseId/u,
    );
  });

  it('INVALID: {empty toolUseId} => throws', () => {
    expect(() => claudeCodeSubagentMetaContract.parse({ toolUseId: '' })).toThrow(
      /String must contain at least 1/u,
    );
  });
});
