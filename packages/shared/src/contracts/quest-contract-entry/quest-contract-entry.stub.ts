import type { StubArgument } from '@dungeonmaster/shared/@types';

import { FlowNodeIdStub } from '../flow-node-id/flow-node-id.stub';

import { questContractEntryContract } from './quest-contract-entry-contract';
import type { QuestContractEntry } from './quest-contract-entry-contract';

export const QuestContractEntryStub = ({
  ...props
}: StubArgument<QuestContractEntry> = {}): QuestContractEntry =>
  questContractEntryContract.parse({
    id: 'login-credentials',
    name: 'LoginCredentials',
    kind: 'data',
    status: 'new',
    source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
    nodeId: FlowNodeIdStub({ value: 'default-node' }),
    properties: [
      {
        name: 'email',
        type: 'EmailAddress',
        description: 'User email for authentication',
      },
    ],
    ...props,
  });
