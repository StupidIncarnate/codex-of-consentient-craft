import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { FileSizeBytesStub } from '../file-size-bytes/file-size-bytes.stub';
import { PruneAssetKindStub } from '../prune-asset-kind/prune-asset-kind.stub';
import { pruneAssetContract } from './prune-asset-contract';
import type { PruneAsset } from './prune-asset-contract';

export const PruneAssetStub = ({ ...props }: StubArgument<PruneAsset> = {}): PruneAsset =>
  pruneAssetContract.parse({
    path: AbsoluteFilePathStub({ value: '/tmp/instances/inst_9b2c/runs/run_1/step1.png' }),
    kind: PruneAssetKindStub({ value: 'shot' }),
    sizeBytes: FileSizeBytesStub({ value: 2048 }),
    modifiedAtMs: EpochMsStub({ value: 1_700_000_000_000 }),
    ...props,
  });
