import { codeSnippetNormalizeTransformer } from './code-snippet-normalize-transformer';

describe('codeSnippetNormalizeTransformer', () => {
  it('VALID: {a multi-line call} => one line with single spaces', () => {
    const result = codeSnippetNormalizeTransformer({ text: 'handle\n    .calledWith([])' });

    expect(result).toBe('handle .calledWith([])');
  });

  it('EDGE: {text longer than the limit} => cut to the limit', () => {
    const result = codeSnippetNormalizeTransformer({ text: 'x'.repeat(200) });

    expect(result).toBe('x'.repeat(80));
  });

  it('EMPTY: {text: ""} => an empty snippet', () => {
    const result = codeSnippetNormalizeTransformer({ text: '' });

    expect(result).toBe('');
  });
});
