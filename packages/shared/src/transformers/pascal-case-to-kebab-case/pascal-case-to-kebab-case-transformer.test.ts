import { pascalCaseToKebabCaseTransformer } from './pascal-case-to-kebab-case-transformer';

describe('pascalCaseToKebabCaseTransformer', () => {
  it('VALID: {AppHomeResponder} => app-home-responder', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: 'AppHomeResponder',
    });

    expect(result).toBe('app-home-responder');
  });

  it('VALID: {single PascalCase word} => single lowercase word', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: 'Home',
    });

    expect(result).toBe('home');
  });

  it('VALID: {already lowercase} => unchanged', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: 'home',
    });

    expect(result).toBe('home');
  });

  it('EMPTY: {empty string} => empty string', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: '',
    });

    expect(result).toBe('');
  });
});
