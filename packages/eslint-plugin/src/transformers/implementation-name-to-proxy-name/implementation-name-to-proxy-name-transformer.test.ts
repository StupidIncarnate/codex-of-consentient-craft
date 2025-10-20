import { implementationNameToProxyNameTransformer } from './implementation-name-to-proxy-name-transformer';

describe('implementationNameToProxyNameTransformer', () => {
  it('VALID: {implementationName: "userBroker"} => returns "userBrokerProxy"', () => {
    expect(implementationNameToProxyNameTransformer({ implementationName: 'userBroker' })).toBe(
      'userBrokerProxy',
    );
  });

  it('VALID: {implementationName: "fetchDataAdapter"} => returns "fetchDataAdapterProxy"', () => {
    expect(
      implementationNameToProxyNameTransformer({ implementationName: 'fetchDataAdapter' }),
    ).toBe('fetchDataAdapterProxy');
  });

  it('VALID: {implementationName: "UserContract"} => returns "UserContractProxy"', () => {
    expect(implementationNameToProxyNameTransformer({ implementationName: 'UserContract' })).toBe(
      'UserContractProxy',
    );
  });

  it('VALID: {implementationName: "isValidGuard"} => returns "isValidGuardProxy"', () => {
    expect(implementationNameToProxyNameTransformer({ implementationName: 'isValidGuard' })).toBe(
      'isValidGuardProxy',
    );
  });

  it('VALID: {implementationName: "processDataTransformer"} => returns "processDataTransformerProxy"', () => {
    expect(
      implementationNameToProxyNameTransformer({ implementationName: 'processDataTransformer' }),
    ).toBe('processDataTransformerProxy');
  });

  it('EDGE: {implementationName: "a"} => returns "aProxy"', () => {
    expect(implementationNameToProxyNameTransformer({ implementationName: 'a' })).toBe('aProxy');
  });

  it('EDGE: {implementationName: "Proxy"} => returns "ProxyProxy"', () => {
    expect(implementationNameToProxyNameTransformer({ implementationName: 'Proxy' })).toBe(
      'ProxyProxy',
    );
  });

  it('EMPTY: {implementationName: ""} => returns "Proxy"', () => {
    expect(implementationNameToProxyNameTransformer({ implementationName: '' })).toBe('Proxy');
  });
});
