import { violationMessageExtractTransformer } from './violation-message-extract-transformer';

const testRuleId = '@typescript-eslint/no-explicit-any';
const testHookData = Object.freeze({ file: '/test/file.ts' });

const createDisplayConfig = (overrides: Record<PropertyKey, unknown> = {}) => ({ ...overrides });

describe('violationMessageExtractTransformer', () => {
  it('VALID: {displayConfig: {message: undefined}, ruleId, hookData} => returns default message', () => {
    const displayConfig = createDisplayConfig();

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toMatch(/type "any"/u);
    expect(message).toMatch(/type safety/u);
  });

  it('VALID: {displayConfig: {message: "custom"}, ruleId, hookData} => returns custom string', () => {
    const displayConfig = createDisplayConfig({ message: 'Custom violation message' });

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toBe('Custom violation message');
  });

  it('VALID: {displayConfig: {message: fn}, ruleId, hookData} => calls function and returns result', () => {
    const messageFunction = (data: unknown): PropertyKey => {
      const hookData = data as Record<PropertyKey, PropertyKey>;
      return `Custom message for ${String(hookData.file)}`;
    };
    const displayConfig = createDisplayConfig({ message: messageFunction });

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toBe('Custom message for /test/file.ts');
  });

  it('VALID: {displayConfig: {message: fn returns non-string}, ruleId, hookData} => converts to string', () => {
    const messageFunction = (): PropertyKey => 123;
    const displayConfig = createDisplayConfig({ message: messageFunction });

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toBe(123);
  });

  it('EDGE: {displayConfig: {message: fn throws}, ruleId, hookData} => returns error message', () => {
    const messageFunction = (): PropertyKey => {
      throw new Error('Function failed');
    };
    const displayConfig = createDisplayConfig({ message: messageFunction });

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toBe('Custom message function failed: Function failed');
  });

  it('EDGE: {displayConfig: {message: fn throws non-Error}, ruleId, hookData} => returns string error', () => {
    const messageFunction = (): PropertyKey => {
      throw new Error('String error');
    };
    const displayConfig = createDisplayConfig({ message: messageFunction });

    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: testRuleId,
      hookData: testHookData,
    });

    expect(message).toBe('Custom message function failed: String error');
  });
});
