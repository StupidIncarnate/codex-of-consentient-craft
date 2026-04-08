import { readPackageDescriptionLayerBroker } from './read-package-description-layer-broker';
import { readPackageDescriptionLayerBrokerProxy } from './read-package-description-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readPackageDescriptionLayerBroker', () => {
  describe('successful reads', () => {
    it('VALID: package.json with description => returns description', () => {
      const proxy = readPackageDescriptionLayerBrokerProxy();
      const packageJsonPath = AbsoluteFilePathStub({ value: '/project/packages/web/package.json' });
      const description = ContentTextStub({ value: 'A web package' });

      proxy.setupDescription({ description });

      const result = readPackageDescriptionLayerBroker({ packageJsonPath });

      expect(result).toStrictEqual(description);
    });
  });

  describe('error handling', () => {
    it('ERROR: no package.json => returns empty string', () => {
      const proxy = readPackageDescriptionLayerBrokerProxy();
      const packageJsonPath = AbsoluteFilePathStub({ value: '/nonexistent/package.json' });

      proxy.setupNoPackageJson();

      const result = readPackageDescriptionLayerBroker({ packageJsonPath });

      expect(result).toStrictEqual(ContentTextStub({ value: '' }));
    });
  });
});
