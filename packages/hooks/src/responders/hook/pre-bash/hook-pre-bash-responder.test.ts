import { HookPreBashResponder } from './hook-pre-bash-responder';
import { HookPreBashResponderProxy } from './hook-pre-bash-responder.proxy';
import { HookDataStub } from '../../../contracts/hook-data/hook-data.stub';

describe('HookPreBashResponder', () => {
  describe('blocked commands', () => {
    it('VALID: {command: "jest"} => returns ward test suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'jest' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Blocked: direct jest invocation. Use instead: `npx dungeonmaster-ward run --only test`',
      });
    });

    it('VALID: {command: "npx jest foo.test.ts"} => returns ward test suggestion with path', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx jest foo.test.ts' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Blocked: direct jest invocation. Use instead: `npx dungeonmaster-ward run --only test -- foo.test.ts`',
      });
    });

    it('VALID: {command: "npx eslint src/"} => returns ward lint suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx eslint src/' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Blocked: direct eslint invocation. Use instead: `npx dungeonmaster-ward run --only lint`',
      });
    });

    it('VALID: {command: "tsc --noEmit"} => returns ward typecheck suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'tsc --noEmit' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Blocked: direct tsc invocation. Use instead: `npx dungeonmaster-ward run --only typecheck`',
      });
    });
  });

  describe('allowed commands', () => {
    it('VALID: {command: "npm test"} => returns {shouldBlock: false}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {command: "dungeonmaster-ward"} => returns {shouldBlock: false}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'dungeonmaster-ward' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {command: "echo hello"} => returns {shouldBlock: false}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'echo hello' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });
  });

  describe('invalid tool input', () => {
    it('VALID: {tool_input without command} => returns {shouldBlock: false}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { file_path: '/test/file.ts', content: '' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });
  });
});
