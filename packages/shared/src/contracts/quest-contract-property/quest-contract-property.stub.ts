import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questContractPropertyContract } from './quest-contract-property-contract';
import type { QuestContractProperty } from './quest-contract-property-contract';

export const QuestContractPropertyStub = ({
  ...props
}: StubArgument<QuestContractProperty> = {}): QuestContractProperty =>
  questContractPropertyContract.parse({
    name: 'email',
    ...props,
  });
