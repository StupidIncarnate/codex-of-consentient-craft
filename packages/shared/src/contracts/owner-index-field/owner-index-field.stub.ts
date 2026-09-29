import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexFieldContract } from './owner-index-field-contract';
import type { OwnerIndexField } from './owner-index-field-contract';

export const OwnerIndexFieldStub = ({
  ...props
}: StubArgument<OwnerIndexField> = {}): OwnerIndexField =>
  ownerIndexFieldContract.parse({
    key: 'id',
    kind: 'own-brand',
    brandText: 'ThingId',
    ...props,
  });
