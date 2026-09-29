import type { StubArgument } from '@dungeonmaster/shared/@types';

import { OwnerIndexFieldStub } from '../owner-index-field/owner-index-field.stub';
import { OwnerIndexOwnerStub } from '../owner-index-owner/owner-index-owner.stub';
import { ownerIndexMatchContract } from './owner-index-match-contract';
import type { OwnerIndexMatch } from './owner-index-match-contract';

export const OwnerIndexMatchStub = ({
  ...props
}: StubArgument<OwnerIndexMatch> = {}): OwnerIndexMatch =>
  ownerIndexMatchContract.parse({
    owner: OwnerIndexOwnerStub(),
    field: OwnerIndexFieldStub(),
    ...props,
  });
