import { HookPreBashResponder } from './hook-pre-bash-responder';
import { HookPreBashResponderProxy } from './hook-pre-bash-responder.proxy';
import { HookDataStub } from '../../../contracts/hook-data/hook-data.stub';
import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';

describe('HookPreBashResponder', () => {
  describe('piped ward commands', () => {
    it('VALID: {command: "npm run ward | grep error"} => strips pipe and returns updated command', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward | grep error' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
        updatedCommand: 'npm run ward',
      });
    });

    it('VALID: {command: "npm run ward -- --only lint | head -20"} => strips pipe and returns updated command', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward -- --only lint | head -20' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
        updatedCommand: 'npm run ward -- --only lint',
      });
    });
  });

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
        message: 'Blocked: direct jest invocation. Use instead: `npm run ward -- --only test`',
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
          'Blocked: direct jest invocation. Use instead: `npm run ward -- --only test -- foo.test.ts`',
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
        message: 'Blocked: direct eslint invocation. Use instead: `npm run ward -- --only lint`',
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
        message: 'Blocked: direct tsc invocation. Use instead: `npm run ward -- --only typecheck`',
      });
    });

    it('VALID: {command: "npx dungeonmaster-ward run --only test"} => returns blocked with npm run ward suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npx dungeonmaster-ward run --only test' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          'Blocked: npx dungeonmaster-ward is banned. Use instead: `npm run ward -- run --only test`',
      });
    });
  });

  describe('blocked search commands', () => {
    it('VALID: {command: "grep -rn pattern ."} => returns discover suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'grep -rn pattern .' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('VALID: {command: "rg pattern src/"} => returns discover suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'rg pattern src/' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('VALID: {command: "find . -name *.ts"} => returns discover suggestion', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'find . -name *.ts' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message: discoverSuggestionMessageStatics.blockMessage,
      });
    });

    it('VALID: {command: "npm run ward | grep error"} => allowed (piped grep is legitimate)', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward | grep error' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
        updatedCommand: 'npm run ward',
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

    it('VALID: {command: "dungeonmaster-ward", no timeout} => returns updatedTimeout', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'dungeonmaster-ward' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
        updatedTimeout: 600_000,
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

  describe('ward timeout enforcement', () => {
    it('VALID: {command: "npm run ward", timeout: 120000} => overrides timeout to 600000', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 120_000 },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
        updatedTimeout: 600_000,
      });
    });

    it('VALID: {command: "npm run ward -- --only unit", no timeout} => overrides timeout to 600000', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward -- --only unit' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
        updatedTimeout: 600_000,
      });
    });

    it('VALID: {command: "npm run ward", timeout: 600000} => no override needed', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 600_000 },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {command: "npm run ward", timeout: 900000} => no override (already above minimum)', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 900_000 },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: false,
      });
    });

    it('VALID: {command: "echo hello", timeout: 5000} => no override (not ward)', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'echo hello', timeout: 5000 },
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
