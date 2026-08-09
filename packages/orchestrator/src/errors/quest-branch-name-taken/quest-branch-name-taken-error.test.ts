import { QuestBranchNameTakenError } from './quest-branch-name-taken-error';

describe('QuestBranchNameTakenError', () => {
  describe('constructor()', () => {
    it('VALID: {branchName: "quest/add-auth-7bc217a1"} => sets name and full message', () => {
      const error = new QuestBranchNameTakenError({ branchName: 'quest/add-auth-7bc217a1' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'QuestBranchNameTakenError',
        message: 'quest/add-auth-7bc217a1 already exists — name is in use by other work',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QuestBranchNameTakenError);
    });

    it('VALID: {branchName: "quest/git-lifecycle-7bc217a1"} => embeds that exact branch name', () => {
      const error = new QuestBranchNameTakenError({ branchName: 'quest/git-lifecycle-7bc217a1' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'QuestBranchNameTakenError',
        message: 'quest/git-lifecycle-7bc217a1 already exists — name is in use by other work',
      });
    });

    it('EDGE: {branchName: ""} => message contains empty branch name', () => {
      const error = new QuestBranchNameTakenError({ branchName: '' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'QuestBranchNameTakenError',
        message: ' already exists — name is in use by other work',
      });
    });
  });
});
