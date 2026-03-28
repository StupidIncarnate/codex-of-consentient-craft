import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

describe('codeweaverPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(codeweaverPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(codeweaverPromptStatics.prompt)).toStrictEqual(['template', 'placeholders']);
    expect(typeof codeweaverPromptStatics.prompt.template).toBe('string');
    expect(codeweaverPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(codeweaverPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
