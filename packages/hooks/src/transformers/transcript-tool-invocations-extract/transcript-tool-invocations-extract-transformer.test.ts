import { transcriptToolInvocationsExtractTransformer } from './transcript-tool-invocations-extract-transformer';

describe('transcriptToolInvocationsExtractTransformer', () => {
  it('VALID: {transcript with get-agent-prompt + signal-back} => extracts both invocations with workItemId', () => {
    const transcript = [
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 't1',
              name: 'mcp__dungeonmaster__get-agent-prompt',
              input: { agent: 'codeweaver', questId: 'q1', workItemId: 'w1' },
            },
          ],
        },
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 't2',
              name: 'mcp__dungeonmaster__signal-back',
              input: { questId: 'q1', workItemId: 'w1', signal: 'complete' },
            },
          ],
        },
      }),
    ].join('\n');

    expect(transcriptToolInvocationsExtractTransformer({ transcript })).toStrictEqual([
      { name: 'mcp__dungeonmaster__get-agent-prompt', workItemId: 'w1' },
      { name: 'mcp__dungeonmaster__signal-back', workItemId: 'w1' },
    ]);
  });

  it('VALID: {blank lines and non-JSON lines} => skips them and keeps valid tool_use', () => {
    const transcript = [
      '',
      'not json at all',
      JSON.stringify({
        message: {
          content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } }],
        },
      }),
    ].join('\n');

    expect(transcriptToolInvocationsExtractTransformer({ transcript })).toStrictEqual([
      { name: 'Bash', workItemId: null },
    ]);
  });

  it('VALID: {string content and text content blocks} => yields no invocations', () => {
    const transcript = [
      JSON.stringify({ message: { role: 'user', content: 'plain user text' } }),
      JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: 'hi' }] } }),
    ].join('\n');

    expect(transcriptToolInvocationsExtractTransformer({ transcript })).toStrictEqual([]);
  });

  it('EDGE: {get-agent-prompt with empty-string workItemId} => workItemId is null', () => {
    const transcript = JSON.stringify({
      message: {
        content: [
          {
            type: 'tool_use',
            id: 't1',
            name: 'mcp__dungeonmaster__get-agent-prompt',
            input: { agent: 'codeweaver', questId: 'q1', workItemId: '' },
          },
        ],
      },
    });

    expect(transcriptToolInvocationsExtractTransformer({ transcript })).toStrictEqual([
      { name: 'mcp__dungeonmaster__get-agent-prompt', workItemId: null },
    ]);
  });

  it('EDGE: {minion get-agent-prompt with no workItemId} => workItemId is null', () => {
    const transcript = JSON.stringify({
      message: {
        content: [
          {
            type: 'tool_use',
            id: 't1',
            name: 'mcp__dungeonmaster__get-agent-prompt',
            input: { agent: 'codeweaver-minion', questId: 'q1' },
          },
        ],
      },
    });

    expect(transcriptToolInvocationsExtractTransformer({ transcript })).toStrictEqual([
      { name: 'mcp__dungeonmaster__get-agent-prompt', workItemId: null },
    ]);
  });

  it('EMPTY: {empty transcript} => returns no invocations', () => {
    expect(transcriptToolInvocationsExtractTransformer({ transcript: '' })).toStrictEqual([]);
  });
});
