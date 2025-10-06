import { kebabToPascalCaseTransformer } from './kebab-to-pascal-case-transformer';

describe('kebabToPascalCaseTransformer', () => {
  it('VALID: {str: "user-widget"} => returns "UserWidget"', () => {
    expect(kebabToPascalCaseTransformer({ str: 'user-widget' })).toBe('UserWidget');
  });

  it('VALID: {str: "button"} => returns "Button"', () => {
    expect(kebabToPascalCaseTransformer({ str: 'button' })).toBe('Button');
  });

  it('VALID: {str: "user-profile-card"} => returns "UserProfileCard"', () => {
    expect(kebabToPascalCaseTransformer({ str: 'user-profile-card' })).toBe('UserProfileCard');
  });

  it('VALID: {str: "validation-error"} => returns "ValidationError"', () => {
    expect(kebabToPascalCaseTransformer({ str: 'validation-error' })).toBe('ValidationError');
  });

  it('EDGE: {str: "a"} => returns "A"', () => {
    expect(kebabToPascalCaseTransformer({ str: 'a' })).toBe('A');
  });

  it('EDGE: {str: "a-b-c"} => returns "ABC"', () => {
    expect(kebabToPascalCaseTransformer({ str: 'a-b-c' })).toBe('ABC');
  });

  it('EMPTY: {str: ""} => returns ""', () => {
    expect(kebabToPascalCaseTransformer({ str: '' })).toBe('');
  });
});
