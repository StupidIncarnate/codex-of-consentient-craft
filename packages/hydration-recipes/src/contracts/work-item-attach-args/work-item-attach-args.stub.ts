/**
 * PURPOSE: Builds a valid `WorkItemAttachArgs` for a test that needs one but does not care which
 * work item or operation it names.
 *
 * USAGE:
 * WorkItemAttachArgsStub({ operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns WorkItemAttachArgs
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workItemAttachArgsContract } from './work-item-attach-args-contract';
import type { WorkItemAttachArgs } from './work-item-attach-args-contract';

export const WorkItemAttachArgsStub = ({
  ...props
}: StubArgument<WorkItemAttachArgs> = {}): WorkItemAttachArgs =>
  workItemAttachArgsContract.parse({
    role: 'codeweaver',
    status: 'complete',
    spawnerType: 'agent',
    createdAt: '2024-01-01T00:00:00.000Z',
    operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
