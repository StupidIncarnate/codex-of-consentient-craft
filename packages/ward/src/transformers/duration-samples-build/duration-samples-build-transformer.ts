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

const resolveResource = (
  mapping: ReadonlyMap<string, number | null> | Record<string, number | null> | undefined,
  packageName: string,
): number | null => {
  if (!mapping) {
    return null;
  }

  if (mapping instanceof Map) {
    if (!mapping.has(packageName)) {
      return null;
    }

    return mapping.get(packageName) ?? null;
  }

  if (!Object.hasOwn(mapping, packageName)) {
    return null;
  }

  return mapping[packageName] ?? null;
};

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
  peakRssByPackage?: ReadonlyMap<string, number | null> | Record<string, number | null>;
  shardsByPackage?: ReadonlyMap<string, number | null> | Record<string, number | null>;
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

      samples.push(
        durationSampleContract.parse({
          repoRoot,
          packageName: projectResult.projectFolder.name,
          checkType: check.checkType,
          durationMs: projectResult.durationMs,
          peakRssMB: resolveResource(peakRssByPackage, projectResult.projectFolder.name),
          shards: resolveResource(shardsByPackage, projectResult.projectFolder.name),
          recordedAtMs: nowMs,
        }),
      );
    }
  }

  return samples;
};
