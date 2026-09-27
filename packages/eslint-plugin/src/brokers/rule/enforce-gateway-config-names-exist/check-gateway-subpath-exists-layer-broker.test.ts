import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { checkGatewaySubpathExistsLayerBroker } from './check-gateway-subpath-exists-layer-broker';
import { checkGatewaySubpathExistsLayerBrokerProxy } from './check-gateway-subpath-exists-layer-broker.proxy';

describe('checkGatewaySubpathExistsLayerBroker', () => {
  describe('real subpath', () => {
    it('VALID: {subpath: one segment under a known folder} => returns the barrel path', () => {
      const proxy = checkGatewaySubpathExistsLayerBrokerProxy();
      proxy.setupBarrelExists({ barrelPath: '/repo/packages/@gateway/node/src/fs/fs.ts' });

      const result = checkGatewaySubpathExistsLayerBroker({
        rootDir: FilePathStub({ value: '/repo' }),
        subpath: '#gateway/node/fs',
      });

      expect(result).toBe('/repo/packages/@gateway/node/src/fs/fs.ts');
    });

    it('VALID: {subpath: underscored segment} => joins it before the barrel filename', () => {
      const proxy = checkGatewaySubpathExistsLayerBrokerProxy();
      proxy.setupBarrelExists({
        barrelPath: '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts',
      });

      const result = checkGatewaySubpathExistsLayerBroker({
        rootDir: FilePathStub({ value: '/repo' }),
        subpath: '#gateway/node/fs__promises',
      });

      expect(result).toBe('/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts');
    });
  });

  describe('unknown folder', () => {
    it('EMPTY: {subpath: folder not npm/node/browser/bin} => returns undefined', () => {
      checkGatewaySubpathExistsLayerBrokerProxy();

      const result = checkGatewaySubpathExistsLayerBroker({
        rootDir: FilePathStub({ value: '/repo' }),
        subpath: '#gateway/nope/fs',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('non-gateway subpath', () => {
    it('EMPTY: {subpath: does not start with #gateway/} => returns undefined', () => {
      checkGatewaySubpathExistsLayerBrokerProxy();

      const result = checkGatewaySubpathExistsLayerBroker({
        rootDir: FilePathStub({ value: '/repo' }),
        subpath: 'zod',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('barrel missing on disk', () => {
    it('INVALID: {subpath: well-formed but the barrel was never staged} => returns undefined', () => {
      checkGatewaySubpathExistsLayerBrokerProxy();

      const result = checkGatewaySubpathExistsLayerBroker({
        rootDir: FilePathStub({ value: '/repo' }),
        subpath: '#gateway/node/renamed-away',
      });

      expect(result).toBe(undefined);
    });
  });
});
