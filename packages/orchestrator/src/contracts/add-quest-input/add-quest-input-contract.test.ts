import { addQuestInputContract as _addQuestInputContract } from './add-quest-input-contract';
import { AddQuestInputStub } from './add-quest-input.stub';

describe('addQuestInputContract', () => {
  it('VALID: {title, userRequest} => parses successfully', () => {
    const result = AddQuestInputStub({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication to the app',
    });

    expect(result).toStrictEqual({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication to the app',
    });
  });

  it('VALID: default stub values => parses successfully', () => {
    const result = AddQuestInputStub();

    expect(result).toStrictEqual({
      title: 'Test Quest',
      userRequest: 'User wants to test the quest system',
    });
  });
});
