import { gatewayImportsTargetTransformer } from './gateway-imports-target-transformer';
import { GatewayConsumerPackageJsonStub } from '../../contracts/gateway-consumer-package-json/gateway-consumer-package-json.stub';

describe('gatewayImportsTargetTransformer', () => {
  describe('exact key match', () => {
    it('VALID: {exact key, string target} => returns the target unchanged', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm': '@dungeonmaster/npm' },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm',
      });

      expect(result).toBe('@dungeonmaster/npm');
    });
  });

  describe('wildcard key match', () => {
    it('VALID: {wildcard key, string target} => substitutes the captured remainder', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe('@dungeonmaster/npm/zod');
    });

    it('VALID: {wildcard key, multi-segment capture} => substitutes the whole remainder', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/lodash/fp',
      });

      expect(result).toBe('@dungeonmaster/npm/lodash/fp');
    });
  });

  describe('conditions-object target', () => {
    it('VALID: {conditions object with source} => picks the source condition', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': { source: '@dungeonmaster/npm/*' } },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe('@dungeonmaster/npm/zod');
    });

    it('VALID: {conditions object with only import} => falls back to import', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': { import: '@dungeonmaster/npm/*' } },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe('@dungeonmaster/npm/zod');
    });

    it('VALID: {conditions object with only require} => falls back to require', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': { require: '@dungeonmaster/npm/*' } },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe('@dungeonmaster/npm/zod');
    });

    it('VALID: {conditions object with only default} => falls back to default', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': { default: '@dungeonmaster/npm/*' } },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe('@dungeonmaster/npm/zod');
    });
  });

  describe('no match', () => {
    it('EMPTY: {imports map undefined} => returns null', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({});

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe(null);
    });

    it('INVALID: {no key matches specifier} => returns null', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/node/*': '@dungeonmaster/node/*' },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/zod',
      });

      expect(result).toBe(null);
    });

    it('INVALID: {specifier shorter than wildcard prefix+suffix} => returns null', () => {
      const { imports: importsMap } = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*/index': '@dungeonmaster/npm/*/index' },
      });

      const result = gatewayImportsTargetTransformer({
        importsMap,
        specifier: '#gateway/npm/',
      });

      expect(result).toBe(null);
    });
  });
});
