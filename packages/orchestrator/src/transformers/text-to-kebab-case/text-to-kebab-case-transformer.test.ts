import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { textToKebabCaseTransformer } from './text-to-kebab-case-transformer';

describe('textToKebabCaseTransformer', () => {
  it('VALID: {text: "Add Authentication"} => returns "add-authentication"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'Add Authentication' }),
    });

    expect(result).toBe('add-authentication');
  });

  it('VALID: {text: "Fix Login Bug"} => returns "fix-login-bug"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'Fix Login Bug' }),
    });

    expect(result).toBe('fix-login-bug');
  });

  it('VALID: {text: "already-kebab"} => returns unchanged', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'already-kebab' }),
    });

    expect(result).toBe('already-kebab');
  });

  it('VALID: {text: "UPPERCASE"} => returns lowercase', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'UPPERCASE' }),
    });

    expect(result).toBe('uppercase');
  });

  it('EDGE: {text: "  spaces  "} => trims leading/trailing hyphens', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: '  spaces  ' }),
    });

    expect(result).toBe('spaces');
  });
});
