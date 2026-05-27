import type { StubArgument } from '@dungeonmaster/shared/@types';
import { tsconfigReferenceContract, type TsconfigReference } from './tsconfig-reference-contract';

export const TsconfigReferenceStub = ({
  ...props
}: StubArgument<TsconfigReference> = {}): TsconfigReference =>
  tsconfigReferenceContract.parse({
    path: '../shared',
    ...props,
  });
