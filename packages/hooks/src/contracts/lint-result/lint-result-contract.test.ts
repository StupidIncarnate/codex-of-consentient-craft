import { LintResultStub } from './lint-result.stub';
import { LintMessageStub } from '../lint-message/lint-message.stub';

describe('lintResultContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = LintResultStub();

    expect(result.filePath).toBe('/test/file.ts');
    expect(result.messages[0]?.ruleId).toBe('@typescript-eslint/no-explicit-any');
  });

  it('VALID: {multiple messages} => parses successfully', () => {
    const result = LintResultStub({
      filePath: '/src/test.ts',
      messages: [
        LintMessageStub({ ruleId: 'no-console', line: 1 }),
        LintMessageStub({ ruleId: 'no-var', line: 2 }),
      ],
    });

    expect(result.filePath).toBe('/src/test.ts');
  });

  it('VALID: {empty messages} => parses successfully', () => {
    const result = LintResultStub({ messages: [] });

    expect(result.messages).toStrictEqual([]);
  });
});
