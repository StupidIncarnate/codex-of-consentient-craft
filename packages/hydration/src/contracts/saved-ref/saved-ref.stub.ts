import type { StubArgument } from '@dungeonmaster/shared/@types';
import { savedRefContract } from './saved-ref-contract';
import type { SavedRef } from './saved-ref-contract';

export const SavedRefStub = ({ ...props }: StubArgument<SavedRef> = {}): SavedRef =>
  savedRefContract.parse({
    __savedRef: true,
    name: 'origin',
    ...props,
  });
