import { TsconfigOptionsStub } from './tsconfig-options.stub';

describe('TsconfigOptionsStub', () => {
  it('VALID: {} => returns default TsconfigOptions', () => {
    const result = TsconfigOptionsStub();

    expect(result.target).toBe('ES2020');
    expect(result.module).toBe('commonjs');
    expect(result.lib).toStrictEqual(['ES2020']);
    expect(result.strict).toBe(true);
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
