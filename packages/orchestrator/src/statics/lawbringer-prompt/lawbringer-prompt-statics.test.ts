import { lawbringerPromptStatics } from './lawbringer-prompt-statics';

describe('lawbringerPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(lawbringerPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(lawbringerPromptStatics.prompt)).toStrictEqual(['template', 'placeholders']);
    expect(typeof lawbringerPromptStatics.prompt.template).toBe('string');
    expect(lawbringerPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(lawbringerPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
