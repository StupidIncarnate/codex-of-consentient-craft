import { transcriptAssistantTaskToolUseLineTransformer } from './transcript-assistant-task-tool-use-line-transformer';

describe('transcriptAssistantTaskToolUseLineTransformer', () => {
  it('VALID: {toolUseId, description, prompt} => returns an Agent tool_use line for a general-purpose sub-agent', () => {
    const result = transcriptAssistantTaskToolUseLineTransformer({
      toolUseId: 'toolu_seed_nested_2',
      description: 'Nested task 2',
      prompt: 'Nested prompt 2',
    });

    expect(result).toStrictEqual({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_seed_nested_2',
            name: 'Agent',
            input: {
              description: 'Nested task 2',
              prompt: 'Nested prompt 2',
              subagent_type: 'general-purpose',
            },
          },
        ],
      },
    });
  });
});
