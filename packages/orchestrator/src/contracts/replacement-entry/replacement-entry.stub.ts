import type { StubArgument } from '@dungeonmaster/shared/@types';

import { replacementEntryContract } from './replacement-entry-contract';
import type { ReplacementEntry } from './replacement-entry-contract';

export const ReplacementEntryStub = ({
  ...props
}: StubArgument<ReplacementEntry> = {}): ReplacementEntry =>
  replacementEntryContract.parse({
    oldId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    newId: '03a9d8d8-7d74-4041-981c-977812e6dc45',
    ...props,
  });
