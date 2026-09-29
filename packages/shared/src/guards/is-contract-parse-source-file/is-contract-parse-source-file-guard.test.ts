import { isContractParseSourceFileGuard } from './is-contract-parse-source-file-guard';

describe('isContractParseSourceFileGuard', () => {
  describe('files whose parse counts', () => {
    it.each([
      'packages/a/src/brokers/x/x-broker.ts',
      'packages/web/test/harnesses/claude-mock/claude-mock.harness.ts',
      'packages/orchestrator/test/harnesses/orchestration-jsonl/orchestration-jsonl.harness.ts',
      'packages/a/test/harnesses/h/helper.ts',
    ])('VALID: {relativePath: %s} => returns true', (relativePath) => {
      expect(isContractParseSourceFileGuard({ relativePath })).toBe(true);
    });
  });

  describe('files whose parse does not count', () => {
    it.each([
      'packages/a/src/brokers/x/x-broker.test.ts',
      'packages/a/src/brokers/x/x-broker.proxy.ts',
      'packages/a/src/contracts/z/z.stub.ts',
      'packages/a/test/harnesses/h/h.test.ts',
      'packages/a/test/harnesses/h/h.stub.ts',
      'packages/a/test/harnesses/h/h.proxy.ts',
      'packages/a/test/setup.ts',
      'packages/a/e2e/run.ts',
      'packages/a/node_modules/dep/test/harnesses/h.harness.ts',
      'packages/a/dist/test/harnesses/h.harness.ts',
    ])('VALID: {relativePath: %s} => returns false', (relativePath) => {
      expect(isContractParseSourceFileGuard({ relativePath })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {relativePath: undefined} => returns false', () => {
      expect(isContractParseSourceFileGuard({})).toBe(false);
    });
  });
});
