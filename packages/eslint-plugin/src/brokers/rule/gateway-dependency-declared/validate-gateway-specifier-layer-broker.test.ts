import { validateGatewaySpecifierLayerBroker } from './validate-gateway-specifier-layer-broker';
import { validateGatewaySpecifierLayerBrokerProxy } from './validate-gateway-specifier-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub } from '../../../contracts/tsestree/tsestree.stub';
import { ImportPathStub } from '@dungeonmaster/shared/contracts';

describe('validateGatewaySpecifierLayerBroker', () => {
  describe('mapped and declared', () => {
    it('VALID: {specifier mapped, target in dependencies} => does not report', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/hooks',
        packageJson: {
          name: '@dungeonmaster/hooks',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
          dependencies: { '@dungeonmaster/npm': '*' },
        },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('VALID: {conditions-object target, declared} => does not report', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/conditions',
        packageJson: {
          name: '@dungeonmaster/conditions',
          imports: { '#gateway/npm/*': { source: '@dungeonmaster/npm/*' } },
          dependencies: { '@dungeonmaster/npm': '*' },
        },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/conditions/src/brokers/x/x-broker.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('self-import', () => {
    it('VALID: {target package equals own package name} => does not report', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/@gateway/npm',
        packageJson: {
          name: '@dungeonmaster/npm',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
        },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/@gateway/npm/src/glob-sync.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/glob' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('test-support file with devDependency', () => {
    it('VALID: {target only in devDependencies, test-support file} => does not report', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/test-devdep',
        packageJson: {
          name: '@dungeonmaster/test-devdep',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
          devDependencies: { '@dungeonmaster/npm': '*' },
        },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/test-devdep/src/brokers/x/x-broker.test.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });

  describe('unmapped specifier', () => {
    it('INVALID: {specifier not in imports map} => reports unmappedSpecifier', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/unmapped',
        packageJson: { name: '@dungeonmaster/unmapped', imports: {} },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/unmapped/src/brokers/x/x-broker.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'unmappedSpecifier',
        data: {
          specifier: '#gateway/npm/zod',
          packageJsonPath: '/repo/packages/unmapped/package.json',
          folder: 'npm',
          scope: '@dungeonmaster',
        },
      });
    });
  });

  describe('missing dependency', () => {
    it('INVALID: {target only in devDependencies, runtime file} => reports missingDependency for dependencies', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/runtime-devdep-only',
        packageJson: {
          name: '@dungeonmaster/runtime-devdep-only',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
          devDependencies: { '@dungeonmaster/npm': '*' },
        },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/runtime-devdep-only/src/brokers/x/x-broker.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingDependency',
        data: {
          packageJsonPath: '/repo/packages/runtime-devdep-only/package.json',
          targetPackage: '@dungeonmaster/npm',
          specifier: '#gateway/npm/zod',
          location: 'dependencies',
        },
      });
    });

    it('INVALID: {target missing from both maps, test-support file} => reports "dependencies or devDependencies"', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/test-missing',
        packageJson: {
          name: '@dungeonmaster/test-missing',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
        },
      });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/repo/packages/test-missing/src/brokers/x/x-broker.test.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'missingDependency',
        data: {
          packageJsonPath: '/repo/packages/test-missing/package.json',
          targetPackage: '@dungeonmaster/npm',
          specifier: '#gateway/npm/zod',
          location: 'dependencies or devDependencies',
        },
      });
    });
  });

  describe('no ancestor package.json', () => {
    it('EMPTY: {no ancestor package.json} => does not report', () => {
      const proxy = validateGatewaySpecifierLayerBrokerProxy();
      proxy.setupNoPackageJsonAt({ dirPath: '/orphan/src' });
      proxy.setupNoPackageJsonAt({ dirPath: '/orphan' });
      proxy.setupNoPackageJsonAt({ dirPath: '/' });
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub();

      validateGatewaySpecifierLayerBroker({
        node,
        context,
        filename: '/orphan/src/x.ts',
        specifier: ImportPathStub({ value: '#gateway/npm/zod' }),
      });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});
