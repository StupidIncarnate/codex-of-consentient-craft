import { questSourceContract } from './quest-source-contract';
import { QuestSourceStub } from './quest-source.stub';

describe('questSourceContract', () => {
  it('VALID: {value: "user"} => parses as "user"', () => {
    const result = questSourceContract.parse(QuestSourceStub({ value: 'user' }));

    expect(result).toBe('user');
  });

  it('VALID: {value: "smoketest-mcp"} => parses as "smoketest-mcp"', () => {
    const result = questSourceContract.parse(QuestSourceStub({ value: 'smoketest-mcp' }));

    expect(result).toBe('smoketest-mcp');
  });

  it('VALID: {value: "smoketest-signals"} => parses as "smoketest-signals"', () => {
    const result = questSourceContract.parse(QuestSourceStub({ value: 'smoketest-signals' }));

    expect(result).toBe('smoketest-signals');
  });

  it('VALID: {value: "smoketest-orchestration"} => parses as "smoketest-orchestration"', () => {
    const result = questSourceContract.parse(QuestSourceStub({ value: 'smoketest-orchestration' }));

    expect(result).toBe('smoketest-orchestration');
  });

  it('VALID: default stub value => "user"', () => {
    const result = QuestSourceStub();

    expect(result).toBe('user');
  });

  it('INVALID: {value: "invalid"} => throws', () => {
    expect(() => questSourceContract.parse('invalid')).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: ""} => throws', () => {
    expect(() => questSourceContract.parse('')).toThrow(/Invalid enum value/u);
  });
});
