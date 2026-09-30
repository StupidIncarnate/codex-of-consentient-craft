import { checkGatewayExportNameExistsLayerBroker } from './check-gateway-export-name-exists-layer-broker';
import { checkGatewayExportNameExistsLayerBrokerProxy } from './check-gateway-export-name-exists-layer-broker.proxy';

const BARREL_PATH = '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts';

describe('checkGatewayExportNameExistsLayerBroker', () => {
  describe('direct export in the barrel itself', () => {
    it('VALID: {name: a directly re-exported name} => returns true', () => {
      const proxy = checkGatewayExportNameExistsLayerBrokerProxy();
      proxy.setupBarrelSource({
        barrelPath: BARREL_PATH,
        sourceText: "export { appendFile } from './append-file/append-file';\n",
      });

      const result = checkGatewayExportNameExistsLayerBroker({
        barrelPath: BARREL_PATH,
        name: 'appendFile',
      });

      expect(result).toBe(true);
    });
  });

  describe('name found one level down a relative passthrough', () => {
    it('VALID: {name: declared in the file a relative export * from points at} => returns true', () => {
      const proxy = checkGatewayExportNameExistsLayerBrokerProxy();
      proxy.setupBarrelSource({
        barrelPath: BARREL_PATH,
        sourceText: "export * from './internal-helpers/internal-helpers';\n",
      });
      proxy.setupRelativeTargetSource({
        targetPath:
          '/repo/packages/@gateway/node/src/fs__promises/internal-helpers/internal-helpers.ts',
        sourceText: 'export const appendFile = async () => {};\n',
      });

      const result = checkGatewayExportNameExistsLayerBroker({
        barrelPath: BARREL_PATH,
        name: 'appendFile',
      });

      expect(result).toBe(true);
    });
  });

  describe('unresolved bare-specifier passthrough', () => {
    it('VALID: {name: not found directly, only a bare passthrough remains} => returns true (unverifiable, not banned)', () => {
      const proxy = checkGatewayExportNameExistsLayerBrokerProxy();
      proxy.setupBarrelSource({
        barrelPath: BARREL_PATH,
        sourceText: "export * from 'fs/promises';\n",
      });

      const result = checkGatewayExportNameExistsLayerBroker({
        barrelPath: BARREL_PATH,
        name: 'access',
      });

      expect(result).toBe(true);
    });
  });

  describe('name genuinely absent', () => {
    it('INVALID: {name: not found anywhere, no passthrough at all} => returns false', () => {
      const proxy = checkGatewayExportNameExistsLayerBrokerProxy();
      proxy.setupBarrelSource({
        barrelPath: BARREL_PATH,
        sourceText: "export { appendFile } from './append-file/append-file';\n",
      });

      const result = checkGatewayExportNameExistsLayerBroker({
        barrelPath: BARREL_PATH,
        name: 'renamedAway',
      });

      expect(result).toBe(false);
    });
  });
});
