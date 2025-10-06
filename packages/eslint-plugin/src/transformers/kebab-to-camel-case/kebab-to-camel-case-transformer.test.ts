import { kebabToCamelCaseTransformer } from './kebab-to-camel-case-transformer';

describe('kebabToCamelCaseTransformer', () => {
  it('VALID: {str: "user-fetch-broker"} => returns "userFetchBroker"', () => {
    expect(kebabToCamelCaseTransformer({ str: 'user-fetch-broker' })).toBe('userFetchBroker');
  });

  it('VALID: {str: "format-date"} => returns "formatDate"', () => {
    expect(kebabToCamelCaseTransformer({ str: 'format-date' })).toBe('formatDate');
  });

  it('VALID: {str: "api-client"} => returns "apiClient"', () => {
    expect(kebabToCamelCaseTransformer({ str: 'api-client' })).toBe('apiClient');
  });

  it('VALID: {str: "user"} => returns "user"', () => {
    expect(kebabToCamelCaseTransformer({ str: 'user' })).toBe('user');
  });

  it('EDGE: {str: "a-b-c-d"} => returns "aBCD"', () => {
    expect(kebabToCamelCaseTransformer({ str: 'a-b-c-d' })).toBe('aBCD');
  });

  it('EDGE: {str: "single"} => returns "single"', () => {
    expect(kebabToCamelCaseTransformer({ str: 'single' })).toBe('single');
  });

  it('EMPTY: {str: ""} => returns ""', () => {
    expect(kebabToCamelCaseTransformer({ str: '' })).toBe('');
  });

  it('EDGE: {str: "-leading-dash"} => returns "LeadingDash"', () => {
    expect(kebabToCamelCaseTransformer({ str: '-leading-dash' })).toBe('LeadingDash');
  });
});
