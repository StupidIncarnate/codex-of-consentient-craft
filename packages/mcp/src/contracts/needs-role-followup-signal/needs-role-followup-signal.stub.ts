import type { StubArgument } from '@dungeonmaster/shared/@types';
import { needsRoleFollowupSignalContract } from './needs-role-followup-signal-contract';
import type { NeedsRoleFollowupSignal } from './needs-role-followup-signal-contract';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

export const NeedsRoleFollowupSignalStub = ({
  ...props
}: StubArgument<NeedsRoleFollowupSignal> = {}): NeedsRoleFollowupSignal =>
  needsRoleFollowupSignalContract.parse({
    signal: 'needs-role-followup',
    stepId: StepIdStub(),
    targetRole: 'test-writer',
    reason: 'Need test coverage for new feature',
    context: 'Implementation complete, tests needed',
    resume: true,
    ...props,
  });
