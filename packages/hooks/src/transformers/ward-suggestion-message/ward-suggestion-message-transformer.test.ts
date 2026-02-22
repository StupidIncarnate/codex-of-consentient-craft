import { wardSuggestionMessageTransformer } from './ward-suggestion-message-transformer';
import { BashToolInputStub } from '../../contracts/bash-tool-input/bash-tool-input.stub';

describe('wardSuggestionMessageTransformer', () => {
  describe('jest commands', () => {
    it('VALID: {command: "jest"} => returns test suggestion without path', () => {
      const { command } = BashToolInputStub({ command: 'jest' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct jest invocation. Use instead: `npx dungeonmaster-ward run --only test`',
      );
    });

    it('VALID: {command: "npx jest foo.test.ts"} => returns test suggestion with path', () => {
      const { command } = BashToolInputStub({ command: 'npx jest foo.test.ts' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct jest invocation. Use instead: `npx dungeonmaster-ward run --only test -- foo.test.ts`',
      );
    });

    it('VALID: {command: "jest --verbose src/test.ts"} => returns test suggestion preserving args', () => {
      const { command } = BashToolInputStub({ command: 'jest --verbose src/test.ts' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct jest invocation. Use instead: `npx dungeonmaster-ward run --only test -- --verbose src/test.ts`',
      );
    });
  });

  describe('eslint commands', () => {
    it('VALID: {command: "eslint"} => returns lint suggestion', () => {
      const { command } = BashToolInputStub({ command: 'eslint' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct eslint invocation. Use instead: `npx dungeonmaster-ward run --only lint`',
      );
    });

    it('VALID: {command: "npx eslint src/"} => returns lint suggestion', () => {
      const { command } = BashToolInputStub({ command: 'npx eslint src/' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct eslint invocation. Use instead: `npx dungeonmaster-ward run --only lint`',
      );
    });
  });

  describe('tsc commands', () => {
    it('VALID: {command: "tsc --noEmit"} => returns typecheck suggestion', () => {
      const { command } = BashToolInputStub({ command: 'tsc --noEmit' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct tsc invocation. Use instead: `npx dungeonmaster-ward run --only typecheck`',
      );
    });

    it('VALID: {command: "npx tsc"} => returns typecheck suggestion', () => {
      const { command } = BashToolInputStub({ command: 'npx tsc' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct tsc invocation. Use instead: `npx dungeonmaster-ward run --only typecheck`',
      );
    });
  });

  describe('unrecognized blocked commands', () => {
    it('VALID: {command: "unknown-tool"} => returns generic ward suggestion', () => {
      const { command } = BashToolInputStub({ command: 'unknown-tool' });

      const result = wardSuggestionMessageTransformer({ command });

      expect(result).toBe(
        'Blocked: direct tool invocation. Use instead: `npx dungeonmaster-ward run`',
      );
    });
  });
});
