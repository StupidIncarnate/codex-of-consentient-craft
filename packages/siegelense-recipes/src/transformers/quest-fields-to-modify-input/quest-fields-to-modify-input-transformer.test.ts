import { questFieldsToModifyInputTransformer } from './quest-fields-to-modify-input-transformer';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

describe('questFieldsToModifyInputTransformer', () => {
  describe('a modifiable field', () => {
    it('VALID: {fields: {title}} => returns questId and title', () => {
      const result = questFieldsToModifyInputTransformer({
        questId: QuestIdStub({ value: 'add-auth' }),
        fields: { title: 'Renamed Quest' },
      });

      expect(result).toStrictEqual({ questId: 'add-auth', title: 'Renamed Quest' });
    });
  });

  describe('a field modify-quest does not recognize', () => {
    it('VALID: {fields: {title, guildId}} => drops guildId, keeping only title', () => {
      const result = questFieldsToModifyInputTransformer({
        questId: QuestIdStub({ value: 'add-auth' }),
        fields: { title: 'Renamed Quest', guildId: 'f47ac10b' },
      });

      expect(result).toStrictEqual({ questId: 'add-auth', title: 'Renamed Quest' });
    });
  });

  describe('no modifiable fields at all', () => {
    it('EMPTY: {fields: {guildId}} => returns just the questId', () => {
      const result = questFieldsToModifyInputTransformer({
        questId: QuestIdStub({ value: 'add-auth' }),
        fields: { guildId: 'f47ac10b' },
      });

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });
  });
});
