import type { StubArgument } from '@dungeonmaster/shared/@types';

import { PruneAssetKindStub } from '../prune-asset-kind/prune-asset-kind.stub';
import { pruneAssetContract } from './prune-asset-contract';
import type { PruneAsset } from './prune-asset-contract';

export const PruneAssetStub = ({ ...props }: StubArgument<PruneAsset> = {}): PruneAsset =>
  pruneAssetContract.parse({
    path: '/tmp/instances/inst_9b2c/runs/run_1/step1.png',
    kind: PruneAssetKindStub({ value: 'shot' }),
    sizeBytes: 2048,
    modifiedAtMs: 1_700_000_000_000,
    ...props,
  });
