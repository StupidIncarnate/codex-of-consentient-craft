import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexOwnerContract } from './owner-index-owner-contract';
import type { OwnerIndexOwner } from './owner-index-owner-contract';

export const OwnerIndexOwnerStub = ({
  ...props
}: StubArgument<OwnerIndexOwner> = {}): OwnerIndexOwner =>
  ownerIndexOwnerContract.parse({
    ownerName: 'Thing',
    contractName: 'thingContract',
    filePath: '/repo/packages/example/src/contracts/thing/thing-contract.ts',
    packageName: '@repo/example',
    typeName: 'Thing',
    schemaText: "z.object({ id: z.string().brand<'ThingId'>() })",
    fields: [{ key: 'id', kind: 'own-brand', brandText: 'ThingId' }],
    ...props,
  });
