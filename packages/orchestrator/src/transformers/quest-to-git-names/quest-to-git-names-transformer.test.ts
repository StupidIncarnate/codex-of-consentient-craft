import { QuestTitleStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questBranchStatics } from '../../statics/quest-branch/quest-branch-statics';

import { questToGitNamesTransformer } from './quest-to-git-names-transformer';

describe('questToGitNamesTransformer', () => {
  it('VALID: multi-word title with punctuation => exact branchName and worktreeDirName', () => {
    const title = QuestTitleStub({
      value: 'Quest git lifecycle: baseRef branching, Followup Chat, and merge-back',
    });
    const questId = QuestIdStub({ value: '7bc217a1-41e8-40bd-9e25-803d2716b3e8' });

    const result = questToGitNamesTransformer({ title, questId });

    expect(result).toStrictEqual({
      branchName: 'quest/quest-git-lifecycle-baseref-branching-followup-c-7bc217a1',
      worktreeDirName: 'quest-git-lifecycle-baseref-branching-followup-c-7bc217a1',
    });
  });

  it('VALID: {title, questId} => branchName equals "quest/" + worktreeDirName', () => {
    const title = QuestTitleStub({ value: 'Add Authentication' });
    const questId = QuestIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    const result = questToGitNamesTransformer({ title, questId });

    expect(result.branchName).toBe(`quest/${result.worktreeDirName}`);
  });

  it('VALID: {title longer than slugMaxLength} => slug truncated to exactly slugMaxLength characters', () => {
    const title = QuestTitleStub({ value: 'x'.repeat(questBranchStatics.slugMaxLength + 12) });
    const questId = QuestIdStub({ value: '12345678' });

    const result = questToGitNamesTransformer({ title, questId });

    const expectedSlug = 'x'.repeat(questBranchStatics.slugMaxLength);

    expect(result).toStrictEqual({
      branchName: `quest/${expectedSlug}-12345678`,
      worktreeDirName: `${expectedSlug}-12345678`,
    });
  });

  it('EDGE: {title truncation lands on a hyphen} => no trailing hyphen in the result', () => {
    const title = QuestTitleStub({
      value: 'abcde abcde abcde abcde abcde abcde abcde abcde extra',
    });
    const questId = QuestIdStub({ value: 'abc123' });

    const result = questToGitNamesTransformer({ title, questId });

    expect(result).toStrictEqual({
      branchName: 'quest/abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abc123',
      worktreeDirName: 'abcde-abcde-abcde-abcde-abcde-abcde-abcde-abcde-abc123',
    });
  });

  it('EDGE: {title: "!!!"} => slug is fallbackSlug and directory does not start with a hyphen', () => {
    const title = QuestTitleStub({ value: '!!!' });
    const questId = QuestIdStub({ value: 'abc12345' });

    const result = questToGitNamesTransformer({ title, questId });

    expect(result).toStrictEqual({
      branchName: 'quest/quest-abc12345',
      worktreeDirName: 'quest-abc12345',
    });
  });

  it('EDGE: {questId shorter than 8 characters} => slice returns the whole id', () => {
    const title = QuestTitleStub({ value: 'Add' });
    const questId = QuestIdStub({ value: 'ab12' });

    const result = questToGitNamesTransformer({ title, questId });

    expect(result).toStrictEqual({
      branchName: 'quest/add-ab12',
      worktreeDirName: 'add-ab12',
    });
  });
});
