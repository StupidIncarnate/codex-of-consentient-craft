import { chaoswhispererPromptStatics } from './chaoswhisperer-prompt-statics';

describe('chaoswhispererPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(chaoswhispererPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(chaoswhispererPromptStatics.prompt)).toStrictEqual([
      'template',
      'placeholders',
    ]);
    expect(typeof chaoswhispererPromptStatics.prompt.template).toBe('string');
    expect(chaoswhispererPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(chaoswhispererPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
      questId: '$QUEST_ID',
    });
  });
});
