import { readPackageDescriptionLayerBroker } from './read-package-description-layer-broker';
import { readPackageDescriptionLayerBrokerProxy } from './read-package-description-layer-broker.proxy';

describe('readPackageDescriptionLayerBroker', () => {
  describe('successful reads', () => {
    it('VALID: package.json with description => returns description', () => {
      const proxy = readPackageDescriptionLayerBrokerProxy();
      const packageJsonPath = '/project/packages/web/package.json';
      const description = 'A web package';

      proxy.setupDescription({ packageJsonPath, description });

      const result = readPackageDescriptionLayerBroker({ packageJsonPath });

      expect(result).toStrictEqual(description);
    });
  });

  describe('error handling', () => {
    it('ERROR: no package.json => returns empty string', () => {
      const proxy = readPackageDescriptionLayerBrokerProxy();
      const packageJsonPath = '/nonexistent/package.json';

      proxy.setupNoPackageJson({ packageJsonPath });

      const result = readPackageDescriptionLayerBroker({ packageJsonPath });

      expect(result).toStrictEqual('');
    });
  });
});
