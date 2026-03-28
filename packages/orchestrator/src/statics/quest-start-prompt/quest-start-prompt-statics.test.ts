import { questStartPromptStatics } from './quest-start-prompt-statics';

describe('questStartPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(questStartPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(questStartPromptStatics.prompt)).toStrictEqual(['template']);
    expect(typeof questStartPromptStatics.prompt.template).toBe('string');
    expect(questStartPromptStatics.prompt.template.length).toBeGreaterThan(0);
  });
});
