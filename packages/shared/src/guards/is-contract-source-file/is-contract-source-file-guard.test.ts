import { isContractSourceFileGuard } from './is-contract-source-file-guard';

describe('isContractSourceFileGuard', () => {
  describe('contract files', () => {
    it.each([
      'packages/a/src/contracts/quest/quest-contract.ts',
      'packages/a/src/contracts/quest/quest-owner-layer-contract.ts',
      'packages/a/src/contracts/nested/deeper/x-contract.ts',
    ])('VALID: {relativePath: %s} => returns true', (relativePath) => {
      expect(isContractSourceFileGuard({ relativePath })).toBe(true);
    });
  });

  describe('files that are not production contracts', () => {
    it.each([
      'packages/a/src/contracts/quest/quest-contract.test.ts',
      'packages/a/src/contracts/quest/quest.stub.ts',
      'packages/a/src/brokers/quest/quest-contract.ts',
      'packages/a/src/contracts/quest/quest-contract.tsx',
      'packages/a/test/contracts/quest/quest-contract.ts',
      'packages/a/dist/src/contracts/quest/quest-contract.ts',
      'packages/a/node_modules/dep/contracts/x/x-contract.ts',
    ])('VALID: {relativePath: %s} => returns false', (relativePath) => {
      expect(isContractSourceFileGuard({ relativePath })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {relativePath: undefined} => returns false', () => {
      expect(isContractSourceFileGuard({})).toBe(false);
    });
  });
});
