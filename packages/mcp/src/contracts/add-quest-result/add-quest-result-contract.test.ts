import { addQuestResultContract } from './add-quest-result-contract';
import { AddQuestResultStub } from './add-quest-result.stub';

describe('addQuestResultContract', () => {
  it('VALID: {success: true, questId, questFolder, filePath} => parses successfully', () => {
    const result = AddQuestResultStub({
      success: true,
      questId: 'add-auth',
      questFolder: '001-add-auth',
      filePath: '/path/to/quest.json',
    });

    expect(result).toStrictEqual({
      success: true,
      questId: 'add-auth',
      questFolder: '001-add-auth',
      filePath: '/path/to/quest.json',
    });
  });

  it('VALID: {success: false, error} => parses successfully', () => {
    const result = addQuestResultContract.parse({
      success: false,
      error: 'Failed to create quest',
    });

    expect(result).toStrictEqual({
      success: false,
      error: 'Failed to create quest',
    });
  });

  it('VALID: {success: true} with all optional fields omitted => parses successfully', () => {
    const result = addQuestResultContract.parse({
      success: true,
    });

    expect(result).toStrictEqual({
      success: true,
    });
  });
});
