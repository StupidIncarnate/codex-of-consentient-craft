import { skippedQuestFileContract } from './skipped-quest-file-contract';
import { SkippedQuestFileStub } from './skipped-quest-file.stub';

describe('skippedQuestFileContract', () => {
  describe('valid skipped files', () => {
    it('VALID: {folder, path, reason} => parses successfully', () => {
      const skipped = SkippedQuestFileStub();

      const result = skippedQuestFileContract.parse(skipped);

      expect(result).toStrictEqual({
        questFolder: '4226b8d1-2827-4250-8d82-c278d66bcd2d',
        questFilePath:
          '/home/user/.dungeonmaster/guilds/g1/quests/4226b8d1-2827-4250-8d82-c278d66bcd2d/quest.json',
        reason: "workItems.1.role: Invalid enum value, received 'pathseeker'",
      });
    });

    it('VALID: {numbered folder + malformed-json reason} => parses successfully', () => {
      const result = skippedQuestFileContract.parse({
        questFolder: '001-add-auth',
        questFilePath: '/home/user/.dungeonmaster/guilds/g1/quests/001-add-auth/quest.json',
        reason: 'file contents are not valid JSON',
      });

      expect(result).toStrictEqual({
        questFolder: '001-add-auth',
        questFilePath: '/home/user/.dungeonmaster/guilds/g1/quests/001-add-auth/quest.json',
        reason: 'file contents are not valid JSON',
      });
    });

    it('VALID: {relative quest file path} => parses successfully', () => {
      const result = skippedQuestFileContract.parse({
        questFolder: '001-add-auth',
        questFilePath: './.dungeonmaster/guilds/g1/quests/001-add-auth/quest.json',
        reason: 'file contents are not valid JSON',
      });

      expect(result).toStrictEqual({
        questFolder: '001-add-auth',
        questFilePath: './.dungeonmaster/guilds/g1/quests/001-add-auth/quest.json',
        reason: 'file contents are not valid JSON',
      });
    });
  });

  describe('invalid skipped files', () => {
    it('INVALID: {questFolder: ""} => throws validation error', () => {
      expect(() => SkippedQuestFileStub({ questFolder: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {reason: ""} => throws validation error', () => {
      expect(() => SkippedQuestFileStub({ reason: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {questFilePath: missing} => throws validation error', () => {
      expect(() =>
        skippedQuestFileContract.parse({
          questFolder: '001-add-auth',
          reason: 'file contents are not valid JSON',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {reason: 42} => throws validation error', () => {
      expect(() => SkippedQuestFileStub({ reason: 42 as never })).toThrow(/Expected string/u);
    });
  });
});
