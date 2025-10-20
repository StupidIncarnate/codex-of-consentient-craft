import { hasFileSuffixGuard } from './has-file-suffix-guard';

describe('hasFileSuffixGuard', () => {
  it('VALID: {filename: "foo.proxy.ts", suffix: "proxy"} => returns true', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.proxy.ts', suffix: 'proxy' })).toBe(true);
  });

  it('VALID: {filename: "foo.proxy.tsx", suffix: "proxy"} => returns true', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.proxy.tsx', suffix: 'proxy' })).toBe(true);
  });

  it('VALID: {filename: "user.stub.ts", suffix: "stub"} => returns true', () => {
    expect(hasFileSuffixGuard({ filename: 'user.stub.ts', suffix: 'stub' })).toBe(true);
  });

  it('VALID: {filename: "user.stub.tsx", suffix: "stub"} => returns true', () => {
    expect(hasFileSuffixGuard({ filename: 'user.stub.tsx', suffix: 'stub' })).toBe(true);
  });

  it('VALID: {filename: "broker.integration.test.ts", suffix: "integration.test"} => returns true', () => {
    expect(
      hasFileSuffixGuard({ filename: 'broker.integration.test.ts', suffix: 'integration.test' }),
    ).toBe(true);
  });

  it('VALID: {filename: "component.integration.test.tsx", suffix: "integration.test"} => returns true', () => {
    expect(
      hasFileSuffixGuard({
        filename: 'component.integration.test.tsx',
        suffix: 'integration.test',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: "/path/to/foo.proxy.ts", suffix: "proxy"} => returns true', () => {
    expect(hasFileSuffixGuard({ filename: '/path/to/foo.proxy.ts', suffix: 'proxy' })).toBe(true);
  });

  it('INVALID: {filename: "foo.test.ts", suffix: "proxy"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.test.ts', suffix: 'proxy' })).toBe(false);
  });

  it('INVALID: {filename: "foo.proxy.js", suffix: "proxy"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.proxy.js', suffix: 'proxy' })).toBe(false);
  });

  it('INVALID: {filename: "proxy.ts", suffix: "proxy"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'proxy.ts', suffix: 'proxy' })).toBe(false);
  });

  it('INVALID: {filename: "foo-proxy.ts", suffix: "proxy"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'foo-proxy.ts', suffix: 'proxy' })).toBe(false);
  });

  it('INVALID: {filename: "foo.test.ts", suffix: "integration.test"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.test.ts', suffix: 'integration.test' })).toBe(false);
  });

  it('EMPTY: {filename: "", suffix: "proxy"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: '', suffix: 'proxy' })).toBe(false);
  });

  it('EMPTY: {filename: "foo.proxy.ts", suffix: ""} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.proxy.ts', suffix: '' })).toBe(false);
  });

  it('EMPTY: {suffix: "proxy"} => returns false', () => {
    expect(hasFileSuffixGuard({ suffix: 'proxy' })).toBe(false);
  });

  it('EMPTY: {filename: "foo.proxy.ts"} => returns false', () => {
    expect(hasFileSuffixGuard({ filename: 'foo.proxy.ts' })).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(hasFileSuffixGuard({})).toBe(false);
  });
});
