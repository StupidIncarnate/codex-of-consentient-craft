import { gatewayNpmPassthroughPlanContract } from './gateway-npm-passthrough-plan-contract';
import { GatewayNpmPassthroughPlanStub } from './gateway-npm-passthrough-plan.stub';

describe('gatewayNpmPassthroughPlanContract', () => {
  it('VALID: {} => stub holds a named left-pad passthrough', () => {
    expect(GatewayNpmPassthroughPlanStub()).toStrictEqual({
      dependency: { name: 'left-pad', range: '^1.3.0', folder: 'left-pad' },
      shape: 'named',
    });
  });

  it('VALID: {a subpath specifier} => parses it as the dependency name', () => {
    const result = gatewayNpmPassthroughPlanContract.parse({
      dependency: { name: 'hono/ws', range: '^4.0.0', folder: 'hono__ws' },
      shape: 'untyped',
    });

    expect(result).toStrictEqual({
      dependency: { name: 'hono/ws', range: '^4.0.0', folder: 'hono__ws' },
      shape: 'untyped',
    });
  });

  it('VALID: {shape: export-equals, exportNames} => keeps the names its barrel re-exports', () => {
    const result = gatewayNpmPassthroughPlanContract.parse({
      dependency: { name: 'debug', range: '^4.0.0', folder: 'debug' },
      shape: 'export-equals',
      exportNames: { values: ['enable'], types: ['Debugger'] },
    });

    expect(result).toStrictEqual({
      dependency: { name: 'debug', range: '^4.0.0', folder: 'debug' },
      shape: 'export-equals',
      exportNames: { values: ['enable'], types: ['Debugger'] },
    });
  });

  it('INVALID: {shape: "commonjs"} => throws a validation error', () => {
    expect(() =>
      gatewayNpmPassthroughPlanContract.parse({
        dependency: { name: 'left-pad', range: '^1.3.0', folder: 'left-pad' },
        shape: 'commonjs',
      }),
    ).toThrow(/Invalid option/u);
  });
});
