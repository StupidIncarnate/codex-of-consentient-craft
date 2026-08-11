import { questBranchNameContract } from './quest-branch-name-contract';
import { QuestBranchNameStub } from './quest-branch-name.stub';

describe('questBranchNameContract', () => {
  it('VALID: {value: "quest/git-lifecycle-7bc217a1"} => parses successfully', () => {
    const branchName = QuestBranchNameStub({ value: 'quest/git-lifecycle-7bc217a1' });

    expect(branchName).toBe('quest/git-lifecycle-7bc217a1');
  });

  it('VALID: {default value} => uses default branch name', () => {
    const branchName = QuestBranchNameStub();

    expect(branchName).toBe('quest/git-lifecycle-7bc217a1');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return questBranchNameContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });
});
