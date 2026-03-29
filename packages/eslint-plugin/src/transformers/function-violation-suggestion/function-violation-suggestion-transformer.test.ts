import { functionViolationSuggestionTransformer } from './function-violation-suggestion-transformer';

describe('functionViolationSuggestionTransformer', () => {
  it('VALID: {functionType: guard} => returns guard suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'guard' });

    expect(result).toStrictEqual(
      'This appears to be a boolean check. Extract it to a new file in guards/ folder with a DOMAIN-SPECIFIC name (e.g., guards/is-valid-user/is-valid-user-guard.ts). DO NOT use generic names like "helper", "util", "check". First, search the codebase to see if this functionality already exists before creating a new file.',
    );
  });

  it('VALID: {functionType: transformer} => returns transformer suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'transformer' });

    expect(result).toStrictEqual(
      'This appears to be a data transformation. Extract it to a new file in transformers/ folder with a DOMAIN-SPECIFIC name (e.g., transformers/format-user-name/format-user-name-transformer.ts). DO NOT use generic names like "helper", "util", "formatter". First, search the codebase to see if this functionality already exists before creating a new file.',
    );
  });

  it('VALID: {functionType: unknown} => returns generic suggestion with domain-specific naming guidance', () => {
    const result = functionViolationSuggestionTransformer({ functionType: 'unknown' });

    expect(result).toStrictEqual(
      'Extract this function to a separate file according to project standards (guards/ for boolean checks, transformers/ for data transformations, brokers/ for business logic) with a DOMAIN-SPECIFIC name. DO NOT use generic names like "helper", "util", "process". First, search the codebase to see if this functionality already exists before creating a new file.',
    );
  });
});
