import { McpDiscoverResultStub } from './mcp-discover-result.stub';
import { mcpDiscoverResultContract } from './mcp-discover-result-contract';

describe('mcpDiscoverResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = McpDiscoverResultStub();

      expect(mcpDiscoverResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {results: wrong type} => throws', () => {
      expect(() =>
        mcpDiscoverResultContract.parse({ ...McpDiscoverResultStub(), results: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
