import { proxyNameToImplementationNameTransformer } from './proxy-name-to-implementation-name-transformer';

describe('proxyNameToImplementationNameTransformer', () => {
  describe('removing Proxy suffix', () => {
    it('VALID: {proxyName: "httpAdapterProxy"} => returns "httpAdapter"', () => {
      const result = proxyNameToImplementationNameTransformer({ proxyName: 'httpAdapterProxy' });

      expect(result).toBe('httpAdapter');
    });

    it('VALID: {proxyName: "userFetchBrokerProxy"} => returns "userFetchBroker"', () => {
      const result = proxyNameToImplementationNameTransformer({
        proxyName: 'userFetchBrokerProxy',
      });

      expect(result).toBe('userFetchBroker');
    });

    it('VALID: {proxyName: "formatDateTransformerProxy"} => returns "formatDateTransformer"', () => {
      const result = proxyNameToImplementationNameTransformer({
        proxyName: 'formatDateTransformerProxy',
      });

      expect(result).toBe('formatDateTransformer');
    });
  });

  describe('edge cases', () => {
    it('VALID: {proxyName: "Proxy"} => returns ""', () => {
      const result = proxyNameToImplementationNameTransformer({ proxyName: 'Proxy' });

      expect(result).toBe('');
    });

    it('VALID: {proxyName: "ProxyProxy"} => returns "Proxy"', () => {
      const result = proxyNameToImplementationNameTransformer({ proxyName: 'ProxyProxy' });

      expect(result).toBe('Proxy');
    });

    it('VALID: {proxyName: "test"} => returns "test"', () => {
      const result = proxyNameToImplementationNameTransformer({ proxyName: 'test' });

      expect(result).toBe('test');
    });
  });
});
