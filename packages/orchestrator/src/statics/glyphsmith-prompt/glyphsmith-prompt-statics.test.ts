import { glyphsmithPromptStatics } from './glyphsmith-prompt-statics';

describe('glyphsmithPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(glyphsmithPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(glyphsmithPromptStatics.prompt)).toStrictEqual(['template', 'placeholders']);
    expect(typeof glyphsmithPromptStatics.prompt.template).toBe('string');
    expect(glyphsmithPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(glyphsmithPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
      questId: '$QUEST_ID',
    });
  });
});
