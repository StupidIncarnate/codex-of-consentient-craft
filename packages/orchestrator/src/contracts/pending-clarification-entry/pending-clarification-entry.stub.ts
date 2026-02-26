import type { StubArgument } from '@dungeonmaster/shared/@types';

import { pendingClarificationEntryContract } from './pending-clarification-entry-contract';
import type { PendingClarificationEntry } from './pending-clarification-entry-contract';

export const PendingClarificationEntryStub = ({
  ...props
}: StubArgument<PendingClarificationEntry> = {}): PendingClarificationEntry =>
  pendingClarificationEntryContract.parse({
    questId: 'add-auth',
    questions: [
      {
        question: 'Which approach do you prefer?',
        header: 'Architecture Choice',
        options: [
          { label: 'Option A', description: 'Use REST endpoints' },
          { label: 'Option B', description: 'Use GraphQL' },
        ],
        multiSelect: false,
      },
    ],
    ...props,
  });
