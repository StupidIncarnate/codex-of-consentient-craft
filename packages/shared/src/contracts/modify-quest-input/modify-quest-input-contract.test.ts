import { modifyQuestInputContract } from './modify-quest-input-contract';
import { ModifyQuestInputStub } from './modify-quest-input.stub';

describe('modifyQuestInputContract', () => {
  it('VALID: {questId only} => parses successfully', () => {
    const result = ModifyQuestInputStub({ questId: 'add-auth' });

    expect(result).toStrictEqual({ questId: 'add-auth' });
  });

  it('VALID: {questId with title} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      title: 'Updated Title',
    });

    expect(result).toStrictEqual({ questId: 'add-auth', title: 'Updated Title' });
  });

  it('INVALID: {questId: ""} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({ questId: '' });
    }).toThrow(/too_small/u);
  });
});
