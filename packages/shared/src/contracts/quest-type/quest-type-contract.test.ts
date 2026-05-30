import { questTypeContract } from './quest-type-contract';
import { QuestTypeStub } from './quest-type.stub';

describe('questTypeContract', () => {
  it('VALID: {value: "feature"} => parses as "feature"', () => {
    const result = questTypeContract.parse(QuestTypeStub({ value: 'feature' }));

    expect(result).toBe('feature');
  });

  it('VALID: {value: "bug-hunt"} => parses as "bug-hunt"', () => {
    const result = questTypeContract.parse(QuestTypeStub({ value: 'bug-hunt' }));

    expect(result).toBe('bug-hunt');
  });

  it('VALID: default stub value => "feature"', () => {
    const result = QuestTypeStub();

    expect(result).toBe('feature');
  });

  it('INVALID: {value: "invalid"} => throws', () => {
    expect(() => questTypeContract.parse('invalid')).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: ""} => throws', () => {
    expect(() => questTypeContract.parse('')).toThrow(/Invalid enum value/u);
  });
});
