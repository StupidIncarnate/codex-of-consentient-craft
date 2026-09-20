import type { z } from 'zod';

import { pruneAssetKindContract } from './prune-asset-kind-contract';
import type { PruneAssetKind } from './prune-asset-kind-contract';

type PruneAssetKindInput = z.input<typeof pruneAssetKindContract>;

export const PruneAssetKindStub = ({
  value,
}: { value?: PruneAssetKindInput } = {}): PruneAssetKind =>
  pruneAssetKindContract.parse(value ?? 'shot');
