import { HookPreBashResponder } from './hook-pre-bash-responder';
import { HookPreBashResponderProxy } from './hook-pre-bash-responder.proxy';
import { HookDataStub } from '../../../contracts/hook-data/hook-data.stub';

describe('HookPreBashResponder', () => {
  describe('blocked commands', () => {
    it('VALID: {command: "jest"} => returns {shouldBlock: true, message}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'jest' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Direct invocation of jest/eslint/tsc is blocked. Use `dungeonmaster-ward` or `npm run ward` instead.',
      });
    });

    it('VALID: {command: "npx eslint src/"} => returns {shouldBlock: true, message}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx eslint src/' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Direct invocation of jest/eslint/tsc is blocked. Use `dungeonmaster-ward` or `npm run ward` instead.',
      });
    });

    it('VALID: {command: "tsc --noEmit"} => returns {shouldBlock: true, message}', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'tsc --noEmit' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Direct invocation of jest/eslint/tsc is blocked. Use `dungeonmaster-ward` or `npm run ward` instead.',
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
