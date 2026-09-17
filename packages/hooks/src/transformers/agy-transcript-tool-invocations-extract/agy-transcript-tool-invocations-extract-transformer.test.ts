import { dungeonmasterMcpToolsStatics } from '../../statics/dungeonmaster-mcp-tools/dungeonmaster-mcp-tools-statics';
import { agyTranscriptToolInvocationsExtractTransformer } from './agy-transcript-tool-invocations-extract-transformer';

describe('agyTranscriptToolInvocationsExtractTransformer', () => {
  it('VALID: {transcript with get-agent-prompt and signal-back} => extracts tool invocations with workItemId', () => {
    const transcript = [
      JSON.stringify({
        step_index: 1,
        type: 'PLANNER_RESPONSE',
        tool_calls: [
          {
            name: 'get-agent-prompt',
            args: { workItemId: 'item-123' },
          },
        ],
      }),
      JSON.stringify({
        step_index: 2,
        type: 'PLANNER_RESPONSE',
        tool_calls: [
          {
            name: 'run_command',
            args: { CommandLine: 'npm test' },
          },
        ],
      }),
      JSON.stringify({
        step_index: 3,
        type: 'PLANNER_RESPONSE',
        tool_calls: [
          {
            name: 'mcp__dungeonmaster__signal-back',
            args: { workItemId: 'item-123', status: 'success' },
          },
        ],
      }),
    ].join('\n');

    const result = agyTranscriptToolInvocationsExtractTransformer({ transcript });

    expect(result).toStrictEqual([
      {
        name: dungeonmasterMcpToolsStatics.getAgentPromptToolName,
        workItemId: 'item-123',
      },
      {
        name: 'run_command',
        workItemId: null,
      },
      {
        name: dungeonmasterMcpToolsStatics.signalBackToolName,
        workItemId: 'item-123',
      },
    ]);
  });

  it('EMPTY: {empty transcript} => returns empty array', () => {
    const result = agyTranscriptToolInvocationsExtractTransformer({ transcript: '' });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {lines without tool_calls} => returns empty array', () => {
    const transcript = JSON.stringify({ step_index: 0, type: 'USER_INPUT' });
    const result = agyTranscriptToolInvocationsExtractTransformer({ transcript });

    expect(result).toStrictEqual([]);
  });
});
