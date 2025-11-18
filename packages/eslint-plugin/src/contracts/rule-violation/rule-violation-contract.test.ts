import { RuleViolationStub } from './rule-violation.stub';
import { ruleViolationContract } from './rule-violation-contract';

describe('RuleViolationStub', () => {
  it('VALID: {} => returns default RuleViolation', () => {
    const result = RuleViolationStub();

    expect(result.message).toBe('Violation message');
    expect(result.node).toBeDefined();
    expect(result.messageId).toBeUndefined();
  });

  it('VALID: {message: "Custom message"} => returns RuleViolation with custom message', () => {
    const result = RuleViolationStub({ message: 'Custom error message' });

    expect(result.message).toBe('Custom error message');
  });

  it('VALID: {messageId: "customId"} => returns RuleViolation with messageId', () => {
    const result = RuleViolationStub({ messageId: 'customErrorId' });

    expect(result.messageId).toBe('customErrorId');
  });

  it('VALID: {data: {foo: "bar"}} => returns RuleViolation with data', () => {
    const result = RuleViolationStub({ data: { foo: 'bar', count: 42 } });

    expect(result.data).toStrictEqual({ foo: 'bar', count: 42 });
  });

  it('VALID: {fix: function} => returns RuleViolation with fix function', () => {
    const fixFn = (): void => {};
    const result = RuleViolationStub({ fix: fixFn });

    expect(typeof result.fix).toBe('function');
  });

  it('INVALID: {message: ""} => throws ZodError for empty message', () => {
    expect(() => {
      ruleViolationContract.parse({ message: '' });
    }).toThrow('String must contain at least 1 character(s)');
  });
});
