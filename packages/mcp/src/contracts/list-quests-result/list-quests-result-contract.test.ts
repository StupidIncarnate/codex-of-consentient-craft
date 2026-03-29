import { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { listQuestsResultContract } from './list-quests-result-contract';
import { ListQuestsResultStub } from './list-quests-result.stub';

describe('listQuestsResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, quests: []} => parses successfully', () => {
      const result = ListQuestsResultStub({ success: true, quests: [] });

      const parsed = listQuestsResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        quests: [],
      });
    });

    it('VALID: {success: true, quests: with items} => parses successfully', () => {
      const questItem = QuestListItemStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
      });

      const result = listQuestsResultContract.parse({
        success: true,
        quests: [questItem],
      });

      expect(result).toStrictEqual({
        success: true,
        quests: [questItem],
      });
    });

    it('VALID: {success: false, error} => parses successfully', () => {
      const result = listQuestsResultContract.parse({
        success: false,
        error: 'Failed to list quests',
      });

      expect(result).toStrictEqual({
        success: false,
        error: 'Failed to list quests',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {success: missing} => throws validation error', () => {
      expect(() => {
        listQuestsResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
