import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

describe('siegemasterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(siegemasterPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(siegemasterPromptStatics.prompt)).toStrictEqual([
      'template',
      'placeholders',
    ]);
    expect(typeof siegemasterPromptStatics.prompt.template).toBe('string');
    expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(siegemasterPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
