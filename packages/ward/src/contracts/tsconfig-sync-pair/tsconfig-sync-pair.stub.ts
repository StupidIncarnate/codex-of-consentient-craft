import type { StubArgument } from '@dungeonmaster/shared/@types';
import { tsconfigSyncPairContract, type TsconfigSyncPair } from './tsconfig-sync-pair-contract';

export const TsconfigSyncPairStub = ({
  ...props
}: StubArgument<TsconfigSyncPair> = {}): TsconfigSyncPair =>
  tsconfigSyncPairContract.parse({
    tsconfigPath: '/repo/packages/shared/tsconfig.json',
    currentData: { compilerOptions: { composite: true }, references: [] },
    expectedRefs: [],
    ensureComposite: true,
    ...props,
  });
