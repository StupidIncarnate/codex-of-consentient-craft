import { claudePermissionContract } from './claude-permission-contract';
import { ClaudePermissionStub } from './claude-permission.stub';

describe('claudePermissionContract', () => {
  describe('valid permissions', () => {
    it('VALID: {value: mcp__dungeonmaster__get-architecture} => returns branded permission', () => {
      const result = claudePermissionContract.parse('mcp__dungeonmaster__get-architecture');

      expect(result).toBe(ClaudePermissionStub({ value: 'mcp__dungeonmaster__get-architecture' }));
    });

    it('VALID: {value: Bash(git commit:*)} => returns branded permission', () => {
      const result = claudePermissionContract.parse('Bash(git commit:*)');

      expect(result).toBe(ClaudePermissionStub({ value: 'Bash(git commit:*)' }));
    });

    it('VALID: {value: Bash(npm run:*)} => returns branded permission for a third-party entry', () => {
      const result = claudePermissionContract.parse('Bash(npm run:*)');

      expect(result).toBe(ClaudePermissionStub({ value: 'Bash(npm run:*)' }));
    });
  });

  describe('invalid permissions', () => {
    it('INVALID: {value: 123} => throws Expected string', () => {
      expect(() => claudePermissionContract.parse(123 as never)).toThrow(/Expected string/u);
    });

    it('INVALID: {value: null} => throws Expected string', () => {
      expect(() => claudePermissionContract.parse(null as never)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws Required', () => {
      expect(() => claudePermissionContract.parse(undefined as never)).toThrow(/Required/u);
    });
  });
});
