import { questIdContract } from './quest-id-contract';
import { QuestIdStub } from './quest-id.stub';

describe('questIdContract', () => {
  it('VALID: {value: "add-auth"} => parses successfully', () => {
    const id = QuestIdStub({ value: 'add-auth' });

    expect(id).toBe('add-auth');
  });

  it('VALID: {default value} => uses default id', () => {
    const id = QuestIdStub();

    expect(id).toBe('add-auth');
  });

  it('VALID: {value: "feature-123"} => parses kebab-case id', () => {
    const id = QuestIdStub({ value: 'feature-123' });

    expect(id).toBe('feature-123');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return questIdContract.parse('');
    }).toThrow(/expected string to have >=1 characters/u);
  });
});
