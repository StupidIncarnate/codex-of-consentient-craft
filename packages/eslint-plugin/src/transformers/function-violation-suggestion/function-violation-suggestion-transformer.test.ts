import { functionViolationSuggestionTransformer } from './function-violation-suggestion-transformer';

describe('functionViolationSuggestionTransformer', () => {
  it('VALID: {functionType: guard} => returns guard suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'guard' });

    expect(result).toMatch(/guards\//u);
    expect(result).toMatch(/DOMAIN-SPECIFIC/u);
    expect(result).toMatch(/DO NOT use generic names/u);
    expect(result).toMatch(/search the codebase/u);
  });

  it('VALID: {functionType: transformer} => returns transformer suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'transformer' });

    expect(result).toMatch(/transformers\//u);
    expect(result).toMatch(/DOMAIN-SPECIFIC/u);
    expect(result).toMatch(/DO NOT use generic names/u);
    expect(result).toMatch(/search the codebase/u);
  });

  it('VALID: {functionType: unknown} => returns generic suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'unknown' });

    expect(result).toMatch(/project standards/u);
    expect(result).toMatch(/DOMAIN-SPECIFIC/u);
    expect(result).toMatch(/DO NOT use generic names/u);
    expect(result).toMatch(/search the codebase/u);
  });
});
