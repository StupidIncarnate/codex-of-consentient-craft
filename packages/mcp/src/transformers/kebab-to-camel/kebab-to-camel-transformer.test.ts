import { kebabToCamelTransformer } from './kebab-to-camel-transformer';
import { FunctionNameStub } from '../../contracts/function-name/function-name.stub';

describe('kebabToCamelTransformer', () => {
  it('VALID: "has-permission-guard" => "hasPermissionGuard"', () => {
    const result = kebabToCamelTransformer({
      kebabCase: FunctionNameStub({ value: 'has-permission-guard' }),
    });

    expect(result).toBe('hasPermissionGuard');
  });

  it('VALID: "user-fetch-broker" => "userFetchBroker"', () => {
    const result = kebabToCamelTransformer({
      kebabCase: FunctionNameStub({ value: 'user-fetch-broker' }),
    });

    expect(result).toBe('userFetchBroker');
  });

  it('VALID: "simple" => "simple" (no hyphens)', () => {
    const result = kebabToCamelTransformer({
      kebabCase: FunctionNameStub({ value: 'simple' }),
    });

    expect(result).toBe('simple');
  });

  it('VALID: "a-b-c-d" => "aBCD" (multiple hyphens)', () => {
    const result = kebabToCamelTransformer({
      kebabCase: FunctionNameStub({ value: 'a-b-c-d' }),
    });

    expect(result).toBe('aBCD');
  });
});
