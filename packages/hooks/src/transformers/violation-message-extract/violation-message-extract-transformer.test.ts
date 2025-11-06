import { violationMessageExtractTransformer } from './violation-message-extract-transformer';

describe('violationMessageExtractTransformer', () => {
  const testRuleId = '@typescript-eslint/no-explicit-any';
  const testHookData = { file: '/test/file.ts' };

  it('VALID: {displayConfig: {message: undefined}, ruleId, hookData} => returns default message', () => {
    const displayConfig = {};

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toContain('type "any"');
    expect(message).toContain('type safety');
  });

  it('VALID: {displayConfig: {message: "custom"}, ruleId, hookData} => returns custom string', () => {
    const displayConfig = { message: 'Custom violation message' };

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toStrictEqual('Custom violation message');
  });

  it('VALID: {displayConfig: {message: fn}, ruleId, hookData} => calls function and returns result', () => {
    const displayConfig = {
      message: (data: unknown): string => {
        const hookData = data as { file: string };
        return `Custom message for ${hookData.file}`;
      },
    };

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toStrictEqual('Custom message for /test/file.ts');
  });

  it('VALID: {displayConfig: {message: fn returns non-string}, ruleId, hookData} => converts to string', () => {
    const displayConfig = {
      message: (): number => 123,
    };

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toStrictEqual('123');
  });

  it('EDGE: {displayConfig: {message: fn throws}, ruleId, hookData} => returns error message', () => {
    const displayConfig = {
      message: (): string => {
        throw new Error('Function failed');
      },
    };

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toStrictEqual('Custom message function failed: Function failed');
  });

  it('EDGE: {displayConfig: {message: fn throws non-Error}, ruleId, hookData} => returns string error', () => {
    const displayConfig = {
      message: (): string => {
        throw 'String error';
      },
    };

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toStrictEqual('Custom message function failed: String error');
  });
});
