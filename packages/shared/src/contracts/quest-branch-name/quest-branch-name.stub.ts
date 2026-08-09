import { questBranchNameContract } from './quest-branch-name-contract';
import type { QuestBranchName } from './quest-branch-name-contract';

export const QuestBranchNameStub = (
  { value }: { value: string } = { value: 'quest/git-lifecycle-7bc217a1' },
): QuestBranchName => questBranchNameContract.parse(value);
