import { selectorContract } from './selector-contract';
import { SelectorStub } from './selector.stub';

describe('selectorContract', () => {
  it('VALID: {value: [data-testid="GUILD_ADD"]} => parses successfully', () => {
    const selector = SelectorStub({ value: '[data-testid="GUILD_ADD"]' });

    const result = selectorContract.parse(selector);

    expect(result).toBe('[data-testid="GUILD_ADD"]');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      selectorContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('EDGE: {value: "a"} => a single-character selector parses successfully', () => {
    const result = selectorContract.parse('a');

    expect(result).toBe('a');
  });
});
