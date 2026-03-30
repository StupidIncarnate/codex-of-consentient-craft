import type { WorktreeCreateHookData } from './worktree-create-hook-data-contract';
import { worktreeCreateHookDataContract } from './worktree-create-hook-data-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const WorktreeCreateHookDataStub = ({
  ...props
}: StubArgument<WorktreeCreateHookData> = {}): WorktreeCreateHookData =>
  worktreeCreateHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    hook_event_name: 'WorktreeCreate',
    worktree_path: '/home/user/project/.claude/worktrees/test-worktree',
    branch: 'worktree-test-branch',
    isolation: 'worktree',
    ...props,
  });
