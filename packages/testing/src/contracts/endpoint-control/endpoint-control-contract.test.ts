import { endpointControlContract } from './endpoint-control-contract';
import { EndpointControlStub } from './endpoint-control.stub';

describe('endpointControlContract', () => {
  describe('valid data', () => {
    it('VALID: {} => parses empty object', () => {
      const result = endpointControlContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('EndpointControlStub', () => {
    it('VALID: {defaults} => creates EndpointControl with all methods', () => {
      const control = EndpointControlStub();

      expect(typeof control.resolves).toBe('function');
      expect(typeof control.responds).toBe('function');
      expect(typeof control.respondRaw).toBe('function');
      expect(typeof control.networkError).toBe('function');
    });

    it('VALID: {custom resolves} => creates EndpointControl with overridden method', () => {
      const customResolves = (): void => undefined;
      const control = EndpointControlStub({ resolves: customResolves });

      expect(control.resolves).toBe(customResolves);
    });
  });
});
