import { questTitleContract } from './quest-title-contract';
import { QuestTitleStub } from './quest-title.stub';

describe('questTitleContract', () => {
  it('VALID: {value: "Add Authentication"} => parses successfully', () => {
    const title = QuestTitleStub({ value: 'Add Authentication' });

    expect(title).toBe('Add Authentication');
  });

  it('VALID: {default value} => uses default title', () => {
    const title = QuestTitleStub();

    expect(title).toBe('Add Authentication');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return questTitleContract.parse('');
    }).toThrow(/expected string to have >=1 characters/u);
  });
});
