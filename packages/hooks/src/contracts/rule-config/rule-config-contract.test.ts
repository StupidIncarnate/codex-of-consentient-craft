import { ruleConfigContract } from './rule-config-contract';
import { messageContract } from '../message/message-contract';
import type { Message } from '../message/message-contract';
import { RuleConfigStub } from './rule-config.stub';

describe('ruleConfigContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = RuleConfigStub();

    expect(result).toStrictEqual({
      rule: '@dungeonmaster/enforce-project-structure',
      displayName: 'Enforce Project Structure',
    });
  });

  it('VALID: {with message string} => parses successfully', () => {
    const result = RuleConfigStub({
      rule: 'no-console',
      displayName: 'No Console',
      message: 'Console statements are not allowed',
    });

    expect(result.message).toBe('Console statements are not allowed');
  });

  it('VALID: {message function} => keeps the same function', () => {
    const message = (hookData: unknown): Message => {
      return messageContract.parse(`saw ${typeof hookData}`);
    };

    const result = RuleConfigStub({ rule: 'no-console', message });

    expect(result.message).toBe(message);
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return ruleConfigContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {message: number} => throws validation error', () => {
      expect(() => {
        return ruleConfigContract.parse({ rule: 'no-console', message: 5 });
      }).toThrow(/Invalid input/u);
    });
  });
});
