import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractUsesBindingContract } from './contract-uses-binding-contract';
import type { ContractUsesBinding } from './contract-uses-binding-contract';

export const ContractUsesBindingStub = ({
  ...props
}: StubArgument<ContractUsesBinding> = {}): ContractUsesBinding =>
  contractUsesBindingContract.parse({
    localName: 'thingContract',
    targetFile: '/repo/packages/example/src/contracts/thing/thing-contract.ts',
    isTypeOnly: false,
    ...props,
  });
