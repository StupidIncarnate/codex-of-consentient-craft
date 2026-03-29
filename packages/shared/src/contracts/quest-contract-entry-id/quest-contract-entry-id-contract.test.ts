import { questContractEntryIdContract } from './quest-contract-entry-id-contract';
import { QuestContractEntryIdStub } from './quest-contract-entry-id.stub';

describe('questContractEntryIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = QuestContractEntryIdStub({ value: 'login-credentials' });

    expect(id).toBe('login-credentials');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = QuestContractEntryIdStub();

    expect(id).toBe('login-credentials');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = QuestContractEntryIdStub({ value: 'config' });

    expect(id).toBe('config');
  });

  it('INVALID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return questContractEntryIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return questContractEntryIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
