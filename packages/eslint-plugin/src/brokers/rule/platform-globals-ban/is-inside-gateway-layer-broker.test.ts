import { isInsideGatewayLayerBroker } from './is-inside-gateway-layer-broker';
import { isInsideGatewayLayerBrokerProxy } from './is-inside-gateway-layer-broker.proxy';

describe('isInsideGatewayLayerBroker', () => {
  describe('inside the gateway', () => {
    it('VALID: {filename under packages/@gateway/node/src} => returns true', () => {
      const proxy = isInsideGatewayLayerBrokerProxy();
      const filename = '/repo/packages/@gateway/node/src/fs/index.ts';
      proxy.setupFilename({ filename, matches: true });

      const result = isInsideGatewayLayerBroker({ filename });

      expect(result).toBe(true);
    });
  });

  describe('outside the gateway', () => {
    it('INVALID: {filename under packages/hooks/src} => returns false', () => {
      const proxy = isInsideGatewayLayerBrokerProxy();
      const filename = '/repo/packages/hooks/src/startup/start-x.ts';
      proxy.setupFilename({ filename, matches: false });

      const result = isInsideGatewayLayerBroker({ filename });

      expect(result).toBe(false);
    });
  });
});
