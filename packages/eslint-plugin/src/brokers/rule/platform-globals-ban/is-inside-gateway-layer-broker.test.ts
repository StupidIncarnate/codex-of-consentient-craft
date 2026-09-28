import { isInsideGatewayLayerBroker } from './is-inside-gateway-layer-broker';
import { isInsideGatewayLayerBrokerProxy } from './is-inside-gateway-layer-broker.proxy';

describe('isInsideGatewayLayerBroker', () => {
  describe('inside the gateway', () => {
    it('VALID: {filename under packages/@gateway/node/src} => returns true', () => {
      isInsideGatewayLayerBrokerProxy();
      const filename = '/repo/packages/@gateway/node/src/fs/fs.ts';

      const result = isInsideGatewayLayerBroker({ filename });

      expect(result).toBe(true);
    });
  });

  describe('outside the gateway', () => {
    it('INVALID: {filename under packages/hooks/src} => returns false', () => {
      isInsideGatewayLayerBrokerProxy();
      const filename = '/repo/packages/hooks/src/startup/start-x.ts';

      const result = isInsideGatewayLayerBroker({ filename });

      expect(result).toBe(false);
    });
  });
});
