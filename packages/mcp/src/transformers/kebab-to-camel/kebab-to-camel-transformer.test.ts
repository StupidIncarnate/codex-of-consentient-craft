import { kebabToCamelTransformer } from './kebab-to-camel-transformer';

describe('kebabToCamelTransformer', () => {
  it('VALID: "has-permission-guard" => "hasPermissionGuard"', () => {
    const result = kebabToCamelTransformer({
      kebabCase: 'has-permission-guard',
    });

    expect(result).toBe('hasPermissionGuard');
  });

  it('VALID: "user-fetch-broker" => "userFetchBroker"', () => {
    const result = kebabToCamelTransformer({
      kebabCase: 'user-fetch-broker',
    });

    expect(result).toBe('userFetchBroker');
  });

  it('VALID: "simple" => "simple" (no hyphens)', () => {
    const result = kebabToCamelTransformer({
      kebabCase: 'simple',
    });

    expect(result).toBe('simple');
  });

  it('VALID: "a-b-c-d" => "aBCD" (multiple hyphens)', () => {
    const result = kebabToCamelTransformer({
      kebabCase: 'a-b-c-d',
    });

    expect(result).toBe('aBCD');
  });
});
