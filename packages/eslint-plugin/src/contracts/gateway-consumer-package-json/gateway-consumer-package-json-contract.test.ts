import { gatewayConsumerPackageJsonContract } from './gateway-consumer-package-json-contract';
import { GatewayConsumerPackageJsonStub } from './gateway-consumer-package-json.stub';

describe('gatewayConsumerPackageJsonContract', () => {
  describe('valid package.json shapes', () => {
    it('VALID: {name only} => parses with no imports or dependencies', () => {
      const packageJson = GatewayConsumerPackageJsonStub({ name: '@dungeonmaster/hooks' });

      const result = gatewayConsumerPackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({ name: '@dungeonmaster/hooks' });
    });

    it('VALID: {imports with string target} => parses the bare string target', () => {
      const packageJson = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });

      const result = gatewayConsumerPackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({
        name: '@dungeonmaster/hooks',
        imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      });
    });

    it('VALID: {imports with conditions-object target} => parses the source condition', () => {
      const packageJson = GatewayConsumerPackageJsonStub({
        imports: { '#gateway/npm/*': { source: '@dungeonmaster/npm/*' } },
      });

      const result = gatewayConsumerPackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({
        name: '@dungeonmaster/hooks',
        imports: { '#gateway/npm/*': { source: '@dungeonmaster/npm/*' } },
      });
    });

    it('VALID: {dependencies and devDependencies} => parses both maps', () => {
      const packageJson = GatewayConsumerPackageJsonStub({
        dependencies: { '@dungeonmaster/npm': '*' },
        devDependencies: { '@dungeonmaster/testing': '*' },
      });

      const result = gatewayConsumerPackageJsonContract.parse(packageJson);

      expect(result).toStrictEqual({
        name: '@dungeonmaster/hooks',
        dependencies: { '@dungeonmaster/npm': '*' },
        devDependencies: { '@dungeonmaster/testing': '*' },
      });
    });

    it('VALID: {name, extra field} => keeps the extra field via passthrough', () => {
      const result = gatewayConsumerPackageJsonContract.parse({
        name: '@dungeonmaster/hooks',
        version: '1.0.0',
      });

      expect(result).toStrictEqual({ name: '@dungeonmaster/hooks', version: '1.0.0' });
    });
  });

  describe('invalid package.json shapes', () => {
    it('INVALID: {missing name} => throws validation error', () => {
      expect(() => gatewayConsumerPackageJsonContract.parse({})).toThrow(/received undefined/u);
    });
  });
});
