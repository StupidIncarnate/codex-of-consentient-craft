import { mcpPermissionContract } from './mcp-permission-contract';
import { McpPermissionStub } from './mcp-permission.stub';

describe('mcpPermissionContract', () => {
  describe('valid permissions', () => {
    it('VALID: {value: mcp__dungeonmaster__get-architecture} => returns branded permission', () => {
      const result = mcpPermissionContract.parse('mcp__dungeonmaster__get-architecture');

      expect(result).toBe(McpPermissionStub({ value: 'mcp__dungeonmaster__get-architecture' }));
    });

    it('VALID: {value: mcp__dungeonmaster__discover} => returns branded permission', () => {
      const result = mcpPermissionContract.parse('mcp__dungeonmaster__discover');

      expect(result).toBe(McpPermissionStub({ value: 'mcp__dungeonmaster__discover' }));
    });
  });

  describe('invalid permissions', () => {
    it('INVALID_VALUE: {value: 123} => throws Expected string', () => {
      expect(() => mcpPermissionContract.parse(123 as never)).toThrow(/Expected string/u);
    });

    it('INVALID_VALUE: {value: null} => throws Expected string', () => {
      expect(() => mcpPermissionContract.parse(null as never)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws Required', () => {
      expect(() => mcpPermissionContract.parse(undefined as never)).toThrow(/Required/u);
    });
  });
});
