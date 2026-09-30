import { gatewayNpmDependencyContract } from './gateway-npm-dependency-contract';
import { GatewayNpmDependencyStub } from './gateway-npm-dependency.stub';

describe('gatewayNpmDependencyContract', () => {
  it('VALID: {scoped name} => parses name, range and folder', () => {
    const dependency = GatewayNpmDependencyStub({
      name: '@hono/node-server',
      range: '^1.0.0',
      folder: 'hono__node-server',
    });

    const result = gatewayNpmDependencyContract.parse(dependency);

    expect(result).toStrictEqual({
      name: '@hono/node-server',
      range: '^1.0.0',
      folder: 'hono__node-server',
    });
  });

  it('VALID: {} => stub defaults to left-pad', () => {
    const result = GatewayNpmDependencyStub();

    expect(result).toStrictEqual({ name: 'left-pad', range: '^1.3.0', folder: 'left-pad' });
  });

  it('INVALID: {name: ""} => throws a validation error', () => {
    expect(() =>
      gatewayNpmDependencyContract.parse({ name: '', range: '^1.0.0', folder: 'x' }),
    ).toThrow(/Too small/u);
  });

  it('INVALID: {folder: ""} => throws a validation error', () => {
    expect(() =>
      gatewayNpmDependencyContract.parse({ name: 'x', range: '^1.0.0', folder: '' }),
    ).toThrow(/Too small/u);
  });
});
