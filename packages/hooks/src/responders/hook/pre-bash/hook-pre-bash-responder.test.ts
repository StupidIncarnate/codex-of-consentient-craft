import { HookPreBashResponder } from './hook-pre-bash-responder';
import { HookPreBashResponderProxy } from './hook-pre-bash-responder.proxy';
import { HookDataStub } from '../../../contracts/hook-data/hook-data.stub';

describe('HookPreBashResponder', () => {
  describe('piped ward commands', () => {
    it('VALID: {command: "npm run ward | grep error"} => returns pipe blocked message', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward | grep error' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          `Blocked: piping ward output loses valuable information.\n` +
          `You ran: \`npm run ward | grep error\`\n\n` +
          `Ward already provides structured output with summaries and the \`detail\` subcommand for full errors.\n\n` +
          `Instead, try:\n` +
          `  npm run ward -- --only lint                           # Scope to specific check type\n` +
          `  npm run ward -- --only unit -- path/to/file.test.ts   # Scope to specific file\n` +
          `  npm run ward -- --only unit --onlyTests "test name"   # Scope to specific test name\n` +
          `  npm run ward -- detail <runId> <filePath>             # Get full error details for a file`,
      });
    });

    it('VALID: {command: "npm run ward -- --only lint | head -20"} => returns pipe blocked message', () => {
      HookPreBashResponderProxy();
      const hookData = HookDataStub({
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward -- --only lint | head -20' },
      });

      const result = HookPreBashResponder({ input: hookData });

      expect(result).toStrictEqual({
        shouldBlock: true,
        message:
          `Blocked: piping ward output loses valuable information.\n` +
          `You ran: \`npm run ward -- --only lint | head -20\`\n\n` +
          `Ward already provides structured output with summaries and the \`detail\` subcommand for full errors.\n\n` +
          `Instead, try:\n` +
          `  npm run ward -- --only lint                           # Scope to specific check type\n` +
          `  npm run ward -- --only unit -- path/to/file.test.ts   # Scope to specific file\n` +
          `  npm run ward -- --only unit --onlyTests "test name"   # Scope to specific test name\n` +
          `  npm run ward -- detail <runId> <filePath>             # Get full error details for a file`,
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
