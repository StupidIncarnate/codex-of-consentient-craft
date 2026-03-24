import { eslintResultToLintResultTransformer } from './eslint-result-to-lint-result-transformer';

type EslintResultInput = Parameters<typeof eslintResultToLintResultTransformer>[0]['eslintResult'];

const createEslintResult = (overrides: Partial<EslintResultInput> = {}): EslintResultInput => ({
  filePath: '',
  messages: [],
  errorCount: 0,
  warningCount: 0,
  ...overrides,
});

describe('eslintResultToLintResultTransformer()', () => {
  describe('message transformation', () => {
    it('VALID: {eslintResult with basic message} => transforms message fields correctly', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/basic-message.ts',
        messages: [
          {
            line: 10,
            column: 15,
            message: 'Basic lint message',
            severity: 1,
            ruleId: 'basic-rule',
          },
        ],
        errorCount: 0,
        warningCount: 1,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      const [firstMessage] = result.messages;

      expect(firstMessage).toStrictEqual({
        line: 10,
        column: 15,
        message: 'Basic lint message',
        severity: 1,
        ruleId: 'basic-rule',
      });
    });

    it('VALID: {eslintResult with message without ruleId} => omits ruleId from output', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/no-rule.ts',
        messages: [
          {
            line: 5,
            column: 8,
            message: 'Syntax error without rule',
            severity: 2,
            ruleId: null,
          },
        ],
        errorCount: 1,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      const [firstMessage] = result.messages;

      expect(firstMessage?.ruleId).toBeUndefined();
    });

    it('VALID: {eslintResult with message with ruleId} => preserves ruleId', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/with-rule.ts',
        messages: [
          {
            line: 3,
            column: 12,
            message: 'Rule violation detected',
            severity: 2,
            ruleId: 'specific-rule',
          },
        ],
        errorCount: 1,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      const [firstMessage] = result.messages;

      expect(firstMessage?.ruleId).toBe('specific-rule');
    });

    it('VALID: {eslintResult with multiple messages} => transforms all messages', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/multiple-messages.ts',
        messages: [
          {
            line: 1,
            column: 1,
            message: 'First message',
            severity: 2,
            ruleId: 'rule-one',
          },
          {
            line: 2,
            column: 5,
            message: 'Second message',
            severity: 1,
            ruleId: null,
          },
          {
            line: 3,
            column: 10,
            message: 'Third message',
            severity: 2,
            ruleId: 'rule-three',
          },
        ],
        errorCount: 2,
        warningCount: 1,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.messages).toStrictEqual([
        {
          line: 1,
          column: 1,
          message: 'First message',
          severity: 2,
          ruleId: 'rule-one',
        },
        {
          line: 2,
          column: 5,
          message: 'Second message',
          severity: 1,
        },
        {
          line: 3,
          column: 10,
          message: 'Third message',
          severity: 2,
          ruleId: 'rule-three',
        },
      ]);
    });
  });

  describe('count preservation', () => {
    it('VALID: {eslintResult with errorCount and warningCount} => preserves counts', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/counts.ts',
        messages: [],
        errorCount: 5,
        warningCount: 3,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.errorCount).toBe(5);
      expect(result.warningCount).toBe(3);
    });

    it('EDGE: {eslintResult with zero counts} => preserves zero counts', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/zero-counts.ts',
        messages: [],
        errorCount: 0,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });

    it('EDGE: {eslintResult with high counts} => preserves large counts', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/high-counts.ts',
        messages: [],
        errorCount: 999,
        warningCount: 1500,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.errorCount).toBe(999);
      expect(result.warningCount).toBe(1500);
    });
  });

  describe('file path handling', () => {
    it('VALID: {eslintResult with absolute path} => preserves file path', () => {
      const eslintResult = createEslintResult({
        filePath: '/absolute/path/to/file.ts',
        messages: [],
        errorCount: 0,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.filePath).toBe('/absolute/path/to/file.ts');
    });

    it('VALID: {eslintResult with relative path} => preserves file path', () => {
      const eslintResult = createEslintResult({
        filePath: 'relative/path/file.ts',
        messages: [],
        errorCount: 0,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.filePath).toBe('relative/path/file.ts');
    });

    it('VALID: {eslintResult with special characters in path} => preserves path correctly', () => {
      const eslintResult = createEslintResult({
        filePath: '/path/with spaces/and-special_chars/file (1).ts',
        messages: [],
        errorCount: 0,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.filePath).toBe('/path/with spaces/and-special_chars/file (1).ts');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {eslintResult with empty string ruleId} => omits ruleId from output', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/empty-rule.ts',
        messages: [
          {
            line: 1,
            column: 1,
            message: 'Message with empty ruleId',
            severity: 2,
            ruleId: '',
          },
        ],
        errorCount: 1,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      const [firstMessage] = result.messages;

      expect(firstMessage?.ruleId).toBeUndefined();
    });

    it('EDGE: {eslintResult with no messages} => returns empty messages array', () => {
      const eslintResult = createEslintResult({
        filePath: '/test/no-messages.ts',
        messages: [],
        errorCount: 0,
        warningCount: 0,
      });

      const result = eslintResultToLintResultTransformer({ eslintResult });

      expect(result.messages).toStrictEqual([]);
    });
  });
});
