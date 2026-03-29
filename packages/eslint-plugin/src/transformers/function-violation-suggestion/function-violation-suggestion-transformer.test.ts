import { functionViolationSuggestionTransformer } from './function-violation-suggestion-transformer';

describe('functionViolationSuggestionTransformer', () => {
  it('VALID: {functionType: guard} => returns guard suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'guard' });

    expect(result).toMatch(/^.*guards\/.*$/mu);
    expect(result).toMatch(/^.*DOMAIN-SPECIFIC.*$/mu);
    expect(result).toMatch(/^.*DO NOT use generic names.*$/mu);
    expect(result).toMatch(/^.*search the codebase.*$/mu);
  });

  it('VALID: {functionType: transformer} => returns transformer suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'transformer' });

    expect(result).toMatch(/^.*transformers\/.*$/mu);
    expect(result).toMatch(/^.*DOMAIN-SPECIFIC.*$/mu);
    expect(result).toMatch(/^.*DO NOT use generic names.*$/mu);
    expect(result).toMatch(/^.*search the codebase.*$/mu);
  });

  it('VALID: {functionType: unknown} => returns generic suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'unknown' });

    expect(result).toMatch(/^.*project standards.*$/mu);
    expect(result).toMatch(/^.*DOMAIN-SPECIFIC.*$/mu);
    expect(result).toMatch(/^.*DO NOT use generic names.*$/mu);
    expect(result).toMatch(/^.*search the codebase.*$/mu);
  });
});
