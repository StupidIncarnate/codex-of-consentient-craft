import { headlineDispatchLayerBroker } from './headline-dispatch-layer-broker';
import { headlineDispatchLayerBrokerProxy } from './headline-dispatch-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { PackageTypeStub } from '../../../contracts/package-type/package-type.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/shared' });
const PACKAGE_NAME = ContentTextStub({ value: 'shared' });

describe('headlineDispatchLayerBroker', () => {
  describe('library type', () => {
    it('VALID: {packageType: library} => output contains Library exports section header', () => {
      const proxy = headlineDispatchLayerBrokerProxy();
      proxy.setupForLibrary();

      const result = headlineDispatchLayerBroker({
        packageType: PackageTypeStub({ value: 'library' }),
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      expect(String(result).split('\n')[0]).toStrictEqual('## Library exports');
    });
  });

  describe('eslint-plugin type', () => {
    it('VALID: {packageType: eslint-plugin, no rules} => output contains Rules registered section header', () => {
      const proxy = headlineDispatchLayerBrokerProxy();
      proxy.setupForEslintPlugin();

      const result = headlineDispatchLayerBroker({
        packageType: PackageTypeStub({ value: 'eslint-plugin' }),
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
        packageName: PACKAGE_NAME,
      });

      expect(String(result).split('\n')[0]).toStrictEqual('## Config presets');
    });
  });

  describe('frontend-ink type', () => {
    it('ERROR: {packageType: frontend-ink} => throws not-yet-implemented error with package name', () => {
      headlineDispatchLayerBrokerProxy();

      expect(() =>
        headlineDispatchLayerBroker({
          packageType: PackageTypeStub({ value: 'frontend-ink' }),
          projectRoot: PROJECT_ROOT,
          packageRoot: PACKAGE_ROOT,
          packageName: PACKAGE_NAME,
        }),
      ).toThrow('frontend-ink renderer not yet implemented (v2) — package: shared');
    });
  });
});
