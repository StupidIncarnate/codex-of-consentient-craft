/**
 * PURPOSE: Builds duration sample records from completed ward check runs for historical performance tracking.
 * Reach for this after multi-package checks complete to record whole-package run durations while excluding crashed results.
 *
 * USAGE:
 * durationSamplesBuildTransformer({ repoRoot: '/repo', checks: [checkResult], wholePackageNames: new Set(['ward']), nowMs: 1700000000000 });
 * // Returns DurationSample[] for all non-crashed whole-package results across completed checks
 */

import { durationSampleContract } from '../../contracts/duration-sample/duration-sample-contract';
import type { DurationSample } from '../../contracts/duration-sample/duration-sample-contract';
import type { CheckResult } from '../../contracts/check-result/check-result-contract';
import { isCrashedProjectResultGuard } from '../../guards/is-crashed-project-result/is-crashed-project-result-guard';

export const durationSamplesBuildTransformer = ({
  repoRoot,
  checks,
  wholePackageNames,
  nowMs,
  peakRssByPackage,
  shardsByPackage,
}: {
  repoRoot: string;
  checks: readonly CheckResult[];
  wholePackageNames: ReadonlySet<string> | readonly string[];
  nowMs: number;
  peakRssByPackage?: Map<string, number | null> | Record<string, number | null>;
  shardsByPackage?: Map<string, number | null> | Record<string, number | null>;
}): DurationSample[] => {
  const wholePackageSet =
    wholePackageNames instanceof Set ? wholePackageNames : new Set(wholePackageNames);

  const samples: DurationSample[] = [];

  for (const check of checks) {
    for (const projectResult of check.projectResults) {
      if (!wholePackageSet.has(projectResult.projectFolder.name)) {
        continue;
      }

      if (isCrashedProjectResultGuard({ projectResult })) {
        continue;
      }

      let peakRssMB: number | null = null;
      if (peakRssByPackage) {
        if (peakRssByPackage instanceof Map) {
          peakRssMB = peakRssByPackage.get(projectResult.projectFolder.name) ?? null;
        } else if (Object.hasOwn(peakRssByPackage, projectResult.projectFolder.name)) {
          peakRssMB = peakRssByPackage[projectResult.projectFolder.name] ?? null;
        }
      }

      let shards: number | null = null;
      if (shardsByPackage) {
        if (shardsByPackage instanceof Map) {
          shards = shardsByPackage.get(projectResult.projectFolder.name) ?? null;
        } else if (Object.hasOwn(shardsByPackage, projectResult.projectFolder.name)) {
          shards = shardsByPackage[projectResult.projectFolder.name] ?? null;
        }
      }

      samples.push(
        durationSampleContract.parse({
          repoRoot,
          packageName: projectResult.projectFolder.name,
          checkType: check.checkType,
          durationMs: projectResult.durationMs,
          peakRssMB,
          shards,
          recordedAtMs: nowMs,
        }),
      );
    }
  }

  return samples;
};
