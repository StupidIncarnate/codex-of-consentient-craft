import { TsconfigOptionsStub } from './tsconfig-options.stub';
import { tsconfigOptionsContract } from './tsconfig-options-contract';

describe('TsconfigOptionsStub', () => {
  it('VALID: {} => returns default TsconfigOptions', () => {
    const result = TsconfigOptionsStub();
    tsconfigOptionsContract.safeParse({});

    expect(result).toStrictEqual({
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      strict: true,
      noEmit: false,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: 'node',
    });
  });

  it('VALID: {target: "ES2021"} => returns TsconfigOptions with custom target', () => {
    const result = TsconfigOptionsStub({ target: 'ES2021' });

    expect(result.target).toBe('ES2021');
  });

  it('VALID: {module: "esnext"} => returns TsconfigOptions with custom module', () => {
    const result = TsconfigOptionsStub({ module: 'esnext' });

    expect(result.module).toBe('esnext');
  });

  it('VALID: {lib: ["ES2021", "DOM"]} => returns TsconfigOptions with custom lib', () => {
    const result = TsconfigOptionsStub({ lib: ['ES2021', 'DOM'] });

    expect(result.lib).toStrictEqual(['ES2021', 'DOM']);
  });

  it('VALID: {strict: false} => returns TsconfigOptions with strict disabled', () => {
    const result = TsconfigOptionsStub({ strict: false });

    expect(result.strict).toBe(false);
  });

  it('VALID: {moduleResolution: "bundler"} => returns TsconfigOptions with custom module resolution', () => {
    const result = TsconfigOptionsStub({ moduleResolution: 'bundler' });

    expect(result.moduleResolution).toBe('bundler');
  });
});
