import { textToKebabCaseTransformer } from './text-to-kebab-case-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('textToKebabCaseTransformer', () => {
  it('VALID: {text: "Add Authentication"} => returns "add-authentication"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'Add Authentication' }),
    });

    expect(result).toBe('add-authentication');
  });

  it('VALID: {text: "Create User Profile"} => returns "create-user-profile"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'Create User Profile' }),
    });

    expect(result).toBe('create-user-profile');
  });

  it('VALID: {text: "Fix Bug #123"} => returns "fix-bug-123"', () => {
    const result = textToKebabCaseTransformer({ text: ContentTextStub({ value: 'Fix Bug #123' }) });

    expect(result).toBe('fix-bug-123');
  });

  it('VALID: {text: "UPPERCASE TEXT"} => returns "uppercase-text"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'UPPERCASE TEXT' }),
    });

    expect(result).toBe('uppercase-text');
  });

  it('VALID: {text: "multiple   spaces"} => returns "multiple-spaces"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'multiple   spaces' }),
    });

    expect(result).toBe('multiple-spaces');
  });

  it('VALID: {text: "-leading-trailing-"} => returns "leading-trailing"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: '-leading-trailing-' }),
    });

    expect(result).toBe('leading-trailing');
  });

  it('VALID: {text: "already-kebab-case"} => returns "already-kebab-case"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'already-kebab-case' }),
    });

    expect(result).toBe('already-kebab-case');
  });

  it('VALID: {text: "special!@#$%chars"} => returns "special-chars"', () => {
    const result = textToKebabCaseTransformer({
      text: ContentTextStub({ value: 'special!@#$%chars' }),
    });

    expect(result).toBe('special-chars');
  });
});
