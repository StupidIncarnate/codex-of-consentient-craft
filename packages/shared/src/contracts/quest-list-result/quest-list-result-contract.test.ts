import { QuestListItemStub } from '../quest-list-item/quest-list-item.stub';
import { SkippedQuestFileStub } from '../skipped-quest-file/skipped-quest-file.stub';
import { questListResultContract } from './quest-list-result-contract';
import { QuestListResultStub } from './quest-list-result.stub';

describe('questListResultContract', () => {
  describe('valid results', () => {
    it('EMPTY: {no quests, no skips} => parses successfully', () => {
      const result = questListResultContract.parse(QuestListResultStub());

      expect(result).toStrictEqual({ quests: [], skipped: [] });
    });

    it('VALID: {one quest, one skipped file} => parses both halves', () => {
      const result = questListResultContract.parse(
        QuestListResultStub({
          quests: [QuestListItemStub()],
          skipped: [SkippedQuestFileStub()],
        }),
      );

      expect(result).toStrictEqual({
        quests: [
          {
            id: 'add-auth',
            folder: '001-add-auth',
            title: 'Add Authentication',
            status: 'in_progress',
            createdAt: '2024-01-15T10:00:00.000Z',
            stepProgress: '2/5',
          },
        ],
        skipped: [
          {
            questFolder: '4226b8d1-2827-4250-8d82-c278d66bcd2d',
            questFilePath:
              '/home/user/.dungeonmaster/guilds/g1/quests/4226b8d1-2827-4250-8d82-c278d66bcd2d/quest.json',
            reason: "workItems.1.role: Invalid enum value, received 'pathseeker'",
          },
        ],
      });
    });

    it('VALID: {skipped omitted} => defaults to an empty skip list', () => {
      const result = questListResultContract.parse({ quests: [QuestListItemStub()] });

      expect(result).toStrictEqual({
        quests: [
          {
            id: 'add-auth',
            folder: '001-add-auth',
            title: 'Add Authentication',
            status: 'in_progress',
            createdAt: '2024-01-15T10:00:00.000Z',
            stepProgress: '2/5',
          },
        ],
        skipped: [],
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {quests: missing} => throws validation error', () => {
      expect(() => questListResultContract.parse({ skipped: [] })).toThrow(/Required/u);
    });

    it('INVALID: {quests: bare array payload} => throws validation error', () => {
      expect(() => questListResultContract.parse([QuestListItemStub()])).toThrow(
        /Expected object, received array/u,
      );
    });

    it('INVALID: {skipped entry missing reason} => throws validation error', () => {
      expect(() =>
        questListResultContract.parse({
          quests: [],
          skipped: [
            {
              questFolder: '001-add-auth',
              questFilePath: '/home/user/.dungeonmaster/guilds/g1/quests/001-add-auth/quest.json',
            },
          ],
        }),
      ).toThrow(/Required/u);
    });
  });
});
