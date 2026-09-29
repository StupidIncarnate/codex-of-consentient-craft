import { isProductionSourceFileGuard } from './is-production-source-file-guard';

describe('isProductionSourceFileGuard', () => {
  describe('production files', () => {
    it.each([
      'packages/a/src/brokers/x/x-broker.ts',
      'packages/a/src/widgets/y/y-widget.tsx',
      'packages/a/src/contracts/z/z-contract.ts',
    ])('VALID: {relativePath: %s} => returns true', (relativePath) => {
      expect(isProductionSourceFileGuard({ relativePath })).toBe(true);
    });
  });

  describe('test-support files', () => {
    it.each([
      'packages/a/src/brokers/x/x-broker.test.ts',
      'packages/a/src/brokers/x/x-broker.integration.test.ts',
      'packages/a/src/brokers/x/x-broker.proxy.ts',
      'packages/a/src/contracts/z/z.stub.ts',
      'packages/a/src/widgets/y/y-widget.proxy.tsx',
      'packages/a/src/flows/f/f.e2e.ts',
      'packages/a/test/harnesses/h/h.harness.ts',
      'packages/a/test/setup.ts',
      'packages/a/e2e/run.ts',
      'packages/a/__mocks__/m.ts',
      'packages/a/node_modules/dep/index.ts',
      'packages/a/dist/src/x.ts',
      'packages/a/src/index.d.ts',
    ])('VALID: {relativePath: %s} => returns false', (relativePath) => {
      expect(isProductionSourceFileGuard({ relativePath })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {relativePath: undefined} => returns false', () => {
      expect(isProductionSourceFileGuard({})).toBe(false);
    });
  });
});
