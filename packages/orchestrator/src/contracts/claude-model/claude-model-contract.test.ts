import { claudeModelContract } from './claude-model-contract';
import { ClaudeModelStub } from './claude-model.stub';

describe('claudeModelContract', () => {
  it('VALID: {haiku stub} => parses', () => {
    expect(claudeModelContract.parse(ClaudeModelStub({ value: 'haiku' }))).toBe('haiku');
  });

  it('VALID: {sonnet stub} => parses', () => {
    expect(claudeModelContract.parse(ClaudeModelStub({ value: 'sonnet' }))).toBe('sonnet');
  });

  it('VALID: {opus stub} => parses', () => {
    expect(claudeModelContract.parse(ClaudeModelStub({ value: 'opus' }))).toBe('opus');
  });

  it('INVALID: {unknown value} => throws invalid enum error', () => {
    expect(() => claudeModelContract.parse('gpt-4')).toThrow(/Invalid enum value/u);
  });
});
