import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questContractEntryContract } from './quest-contract-entry-contract';
import type { QuestContractEntry } from './quest-contract-entry-contract';

export const QuestContractEntryStub = ({
  ...props
}: StubArgument<QuestContractEntry> = {}): QuestContractEntry =>
  questContractEntryContract.parse({
    id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
    name: 'LoginCredentials',
    kind: 'data',
    status: 'new',
    properties: [
      {
        name: 'email',
        type: 'EmailAddress',
        description: 'User email for authentication',
      },
    ],
    ...props,
  });
