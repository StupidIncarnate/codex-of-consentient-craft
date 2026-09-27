import type { StubArgument } from '../../@types/stub-argument.type';

import { questContractPropertyContract } from './quest-contract-property-contract';
import type { QuestContractProperty } from './quest-contract-property-contract';

export const QuestContractPropertyStub = ({
  ...props
}: StubArgument<QuestContractProperty> = {}): QuestContractProperty =>
  questContractPropertyContract.parse({
    name: 'email',
    type: 'EmailAddress',
    description: 'Stub property description',
    ...props,
  });
