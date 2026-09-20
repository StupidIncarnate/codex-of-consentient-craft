/**
 * PURPOSE: Decides which class a file under an instance's `runs/` directory belongs to, so a
 * `--kind` selector can filter files nobody named in advance — a shots directory holds one entry per
 * captured step, and a run directory one pair per run, so both are found by listing rather than by
 * resolving. `null` is a real answer and means "not an asset this call recognises": it is what keeps
 * `prune` from taking a file some later chunk starts writing there before anyone has decided how
 * long it should live. Reach for this over classifying inside `pruneAssetsListBroker`: the
 * instance-level files that broker resolves by NAME already know their class, and only the listed
 * ones need deciding.
 *
 * USAGE:
 * pruneAssetClassifyTransformer({ fileName: 'step1.png' });
 * // Returns 'shot' as PruneAssetKind
 *
 * pruneAssetClassifyTransformer({ fileName: 'notes.txt' });
 * // Returns null
 */

import type { FileName } from '@dungeonmaster/shared/contracts';

import { pruneAssetKindContract } from '../../contracts/prune-asset-kind/prune-asset-kind-contract';
import type { PruneAssetKind } from '../../contracts/prune-asset-kind/prune-asset-kind-contract';
import { evidenceFileStatics } from '../../statics/evidence-file/evidence-file-statics';
import { pruneStatics } from '../../statics/prune/prune-statics';

export const pruneAssetClassifyTransformer = ({
  fileName,
}: {
  fileName: FileName;
}): PruneAssetKind | null => {
  const name = String(fileName);

  if (name.endsWith(pruneStatics.assets.videoExtension)) {
    return pruneAssetKindContract.parse('video');
  }

  if (name.endsWith(evidenceFileStatics.extensions.shot)) {
    return pruneAssetKindContract.parse('shot');
  }

  if (
    name.endsWith(evidenceFileStatics.extensions.transcript) ||
    name.endsWith(evidenceFileStatics.extensions.runReturn)
  ) {
    return pruneAssetKindContract.parse('transcript');
  }

  return null;
};
