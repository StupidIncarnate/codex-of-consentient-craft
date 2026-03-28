import { pathseekerPromptStatics } from './pathseeker-prompt-statics';

describe('pathseekerPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(pathseekerPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(pathseekerPromptStatics.prompt)).toStrictEqual(['template', 'placeholders']);
    expect(typeof pathseekerPromptStatics.prompt.template).toBe('string');
    expect(pathseekerPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(pathseekerPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
