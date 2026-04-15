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

  it('VALID: prompt template => length matches the trimmed prompt size', () => {
    const { template } = chaoswhispererPromptStatics.prompt;
    const templateLength = template.length;

    expect(templateLength).toBe(33221);
  });

  it('VALID: prompt template => Phase 5 no longer instructs calling validate-spec MCP tool', () => {
    const removedNeedle = 'Run validate-spec first';
    const { template } = chaoswhispererPromptStatics.prompt;

    expect(template.indexOf(removedNeedle)).toBe(-1);
  });

  it('VALID: prompt template => documents modify-quest validation layers', () => {
    const needle = '`modify-quest` validates on every call.';
    const { template } = chaoswhispererPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });
});
