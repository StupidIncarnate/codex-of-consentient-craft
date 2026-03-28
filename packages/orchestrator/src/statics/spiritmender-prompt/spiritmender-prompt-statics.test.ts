import { spiritmenderPromptStatics } from './spiritmender-prompt-statics';

describe('spiritmenderPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(spiritmenderPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(spiritmenderPromptStatics.prompt)).toStrictEqual([
      'template',
      'placeholders',
    ]);
    expect(typeof spiritmenderPromptStatics.prompt.template).toBe('string');
    expect(spiritmenderPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(spiritmenderPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
