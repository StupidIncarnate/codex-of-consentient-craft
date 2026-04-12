import { chaoswhispererPromptStatics } from './chaoswhisperer-prompt-statics';

describe('chaoswhispererPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(chaoswhispererPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
          questId: '$QUEST_ID',
        },
      },
    });
  });

  it('VALID: Phase 5 => instructs calling validate-spec MCP tool before gap reviewer', () => {
    const needle = 'Run validate-spec first';
    const { template } = chaoswhispererPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: Phase 5 => references validate-spec MCP tool with questId payload', () => {
    const needle = '`validate-spec` MCP tool with `{questId: "QUEST_ID"}`';
    const { template } = chaoswhispererPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });
});
