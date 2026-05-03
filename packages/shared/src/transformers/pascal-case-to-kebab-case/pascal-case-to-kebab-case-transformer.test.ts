import { pascalCaseToKebabCaseTransformer } from './pascal-case-to-kebab-case-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('pascalCaseToKebabCaseTransformer', () => {
  it('VALID: {AppHomeResponder} => app-home-responder', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: ContentTextStub({ value: 'AppHomeResponder' }),
    });

    expect(result).toBe(ContentTextStub({ value: 'app-home-responder' }));
  });

  it('VALID: {single PascalCase word} => single lowercase word', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: ContentTextStub({ value: 'Home' }),
    });

    expect(result).toBe(ContentTextStub({ value: 'home' }));
  });

  it('VALID: {already lowercase} => unchanged', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: ContentTextStub({ value: 'home' }),
    });

    expect(result).toBe(ContentTextStub({ value: 'home' }));
  });

  it('EMPTY: {empty string} => empty string', () => {
    const result = pascalCaseToKebabCaseTransformer({
      pascal: ContentTextStub({ value: '' }),
    });

    expect(result).toBe(ContentTextStub({ value: '' }));
  });
});
