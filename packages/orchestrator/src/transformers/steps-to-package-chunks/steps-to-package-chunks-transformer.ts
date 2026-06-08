/**
 * PURPOSE: Groups codeweaver DependencyStep[] into per-package chunks, EXCLUDING flowrider-owned
 * steps (flows/ + startup/ folder types and .integration.test.ts / .e2e.ts files, per
 * isFlowriderOwnedStepGuard). Each package's steps form one chunk, split when the package exceeds
 * codeweaverMaxFilesPerChunkStatics.value implementation files. Steps with no focusFile or no
 * resolvable package land in their own solo chunk.
 *
 * USAGE:
 * stepsToPackageChunksTransformer({ steps });
 * // Returns DependencyStep[][] — one chunk per package (flowrider-owned steps removed), capped at 20.
 */

import type { DependencyStep, PackageName } from '@dungeonmaster/shared/contracts';
import { packageNameContract } from '@dungeonmaster/shared/contracts';

import { isFlowriderOwnedStepGuard } from '../../guards/is-flowrider-owned-step/is-flowrider-owned-step-guard';
import { codeweaverMaxFilesPerChunkStatics } from '../../statics/codeweaver-max-files-per-chunk/codeweaver-max-files-per-chunk-statics';

export const stepsToPackageChunksTransformer = ({
  steps,
}: {
  steps: DependencyStep[];
}): DependencyStep[][] => {
  const maxFiles = codeweaverMaxFilesPerChunkStatics.value;

  // First-seen-ordered buckets keyed by package name. Steps with no resolvable package emit solo,
  // matching the ungrouped behavior of the prior folder-type chunker.
  const packageBuckets = new Map<PackageName, DependencyStep[]>();
  const soloChunks: DependencyStep[][] = [];

  for (const step of steps) {
    const filePath = step.focusFile?.path;

    // flow-test-owned steps (flows/ + startup/ + .integration.test.ts + .e2e.ts) belong to
    // Flowrider, not Codeweaver.
    if (isFlowriderOwnedStepGuard({ step })) {
      continue;
    }

    const packageMatch =
      filePath === undefined ? null : /packages\/([^/]+)\//u.exec(String(filePath));
    const packageSegment = packageMatch?.[1];

    if (packageSegment === undefined) {
      soloChunks.push([step]);
      continue;
    }

    const packageName = packageNameContract.parse(packageSegment);
    const existing = packageBuckets.get(packageName);
    if (existing) {
      existing.push(step);
    } else {
      packageBuckets.set(packageName, [step]);
    }
  }

  const result: DependencyStep[][] = [];
  for (const bucket of packageBuckets.values()) {
    for (let i = 0; i < bucket.length; i += maxFiles) {
      result.push(bucket.slice(i, i + maxFiles));
    }
  }
  result.push(...soloChunks);

  return result;
};
