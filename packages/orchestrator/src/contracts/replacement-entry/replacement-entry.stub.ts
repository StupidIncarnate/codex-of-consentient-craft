import type { StubArgument } from '@dungeonmaster/shared/@types';

import { replacementEntryContract } from './replacement-entry-contract';
import type { ReplacementEntry } from './replacement-entry-contract';

export const ReplacementEntryStub = ({
  ...props
}: StubArgument<ReplacementEntry> = {}): ReplacementEntry =>
  replacementEntryContract.parse({
    oldId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    newId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    ...props,
  });
