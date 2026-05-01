import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });

describe('readPackageJsonLayerBroker', () => {
  describe('missing file', () => {
    it('EMPTY: {missing package.json} => returns empty array', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupMissing();

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid JSON', () => {
    it('INVALID: {malformed JSON} => returns empty array', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupPackageJson({ content: ContentTextStub({ value: 'not-json' }) });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('no exports field', () => {
    it('EMPTY: {package.json with no exports} => returns empty array', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupPackageJson({
        content: ContentTextStub({ value: '{"name":"my-package"}' }),
      });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single barrel export', () => {
    it('VALID: {exports with ./contracts} => returns contracts barrel', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupPackageJson({
        content: ContentTextStub({
          value: '{"exports":{"./contracts":{"import":"./dist/contracts.js"}}}',
        }),
      });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['contracts']);
    });
  });

  describe('multi-barrel exports', () => {
    it('VALID: {exports with contracts, guards, statics} => returns all three barrels', () => {
      const proxy = readPackageJsonLayerBrokerProxy();
      proxy.setupPackageJson({
        content: ContentTextStub({
          value:
            '{"exports":{"./contracts":{"import":"./dist/contracts.js"},"./guards":{"import":"./dist/guards.js"},"./statics":{"import":"./dist/statics.js"}}}',
        }),
      });

      const result = readPackageJsonLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result.map(String)).toStrictEqual(['contracts', 'guards', 'statics']);
    });
  });
});
