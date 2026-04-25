import { isHarnessOrProxyFileGuard } from './is-harness-or-proxy-file-guard';

describe('isHarnessOrProxyFileGuard', () => {
  describe('harness and proxy files', () => {
    it('VALID: {filename: "foo.harness.ts"} => true', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.harness.ts' })).toBe(true);
    });

    it('VALID: {filename: "foo.harness.tsx"} => true', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.harness.tsx' })).toBe(true);
    });

    it('VALID: {filename: "foo.proxy.ts"} => true', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.proxy.ts' })).toBe(true);
    });

    it('VALID: {filename: "foo.proxy.tsx"} => true', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.proxy.tsx' })).toBe(true);
    });
  });

  describe('non-matching files', () => {
    it('VALID: {filename: undefined} => false', () => {
      expect(isHarnessOrProxyFileGuard({ filename: undefined })).toBe(false);
    });

    it('VALID: {filename: "foo.ts"} => false', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.ts' })).toBe(false);
    });

    it('VALID: {filename: "foo.test.ts"} => false', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.test.ts' })).toBe(false);
    });

    it('VALID: {filename: "foo.stub.ts"} => false', () => {
      expect(isHarnessOrProxyFileGuard({ filename: 'foo.stub.ts' })).toBe(false);
    });
  });
});
