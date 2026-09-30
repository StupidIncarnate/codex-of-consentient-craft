/**
 * PURPOSE: Runs all requested check types directly against a single project folder and returns WardResult
 *
 * USAGE:
 * const result = await singlePackageLayerBroker({ config: WardConfigStub(), projectFolder: ProjectFolderStub(), rootPath });
 * // Returns WardResult with one ProjectResult per check type
 */

import { stderr } from '#gateway/node/process';

import {
  wardRunResultContract,
  type WardRunResult,
} from '../../../contracts/ward-result/ward-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { msPerSecondStatics } from '../../../statics/ms-per-second/ms-per-second-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { foldProjectResultIntoChecksTransformer } from '../../../transformers/fold-project-result-into-checks/fold-project-result-into-checks-transformer';
import type { ProjectResult } from '../../../contracts/project-result/project-result-contract';
import { checkRunLintBroker } from '../../check-run/lint/check-run-lint-broker';
import { checkRunTypecheckBroker } from '../../check-run/typecheck/check-run-typecheck-broker';
import { checkRunUnitBroker } from '../../check-run/unit/check-run-unit-broker';
import { checkRunIntegrationBroker } from '../../check-run/integration/check-run-integration-broker';
import { checkRunE2eBroker } from '../../check-run/e2e/check-run-e2e-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';
import { e2eArtifactsPruneBroker } from '../../e2e-artifacts/prune/e2e-artifacts-prune-broker';

const CHECK_RUNNERS = {
  lint: checkRunLintBroker,
  typecheck: checkRunTypecheckBroker,
  unit: checkRunUnitBroker,
  integration: checkRunIntegrationBroker,
  e2e: checkRunE2eBroker,
} as const;

export const singlePackageLayerBroker = async ({
  config,
  projectFolder,
  rootPath,
  platformDedupeProjectResult,
}: {
  config: WardConfig;
  projectFolder: ProjectFolder;
  rootPath: string;
  platformDedupeProjectResult?: ProjectResult;
}): Promise<WardRunResult> => {
  const runId = runIdGenerateTransformer();
  const timestamp = Date.now();

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasPassthrough = Array.isArray(config.passthrough) && config.passthrough.length > 0;

  const fileList = hasPassthrough
    ? (config.passthrough ?? []).map((arg) => arg)
    : [];

  const CHECK_PAD = 12;
  const NAME_PAD = 20;

  const runStartMs = Date.now();

  const checks = await checkTypes.reduce(
    async (accPromise, checkType) => {
      const acc = await accPromise;
      const runner = CHECK_RUNNERS[checkType];

      stderr.write(
        `${checkType.padEnd(CHECK_PAD)}${projectFolder.name.padEnd(NAME_PAD)} running...\r`,
      );

      const startMs = Date.now();
      const projectResult = await runner({
        projectFolder,
        fileList,
        ...(config.onlyTests ? { testNamePattern: String(config.onlyTests) } : {}),
      });
      const checkDurationMs = Date.now() - startMs;

      const formattedDuration = ` (${(checkDurationMs / msPerSecondStatics.value).toFixed(1)}s)`;

      if (projectResult.status === 'skip') {
        stderr.write(
          `\x1b[K${checkType.padEnd(CHECK_PAD)}${projectFolder.name.padEnd(NAME_PAD)} skip${formattedDuration}\n`,
        );
      } else {
        const failCount = projectResult.errors.length + projectResult.testFailures.length;
        const statusLabel = projectResult.status === 'pass' ? 'PASS' : 'FAIL';
        const isScopedWithResults = hasPassthrough && Number(projectResult.filesCount) > 0;
        const hasMismatch =
          !isScopedWithResults &&
          Number(projectResult.discoveredCount) > 0 &&
          Number(projectResult.discoveredCount) !== Number(projectResult.filesCount);
        const mismatch = hasMismatch ? '  DISCOVERY MISMATCH' : '';
        const detail =
          failCount > 0
            ? `${String(projectResult.filesCount)} files, ${String(failCount)} errors, ${String(projectResult.discoveredCount)} discovered${mismatch}`
            : `${String(projectResult.filesCount)} files, ${String(projectResult.discoveredCount)} discovered${mismatch}`;

        stderr.write(
          `\x1b[K${checkType.padEnd(CHECK_PAD)}${projectFolder.name.padEnd(NAME_PAD)} ${statusLabel}  ${detail}${formattedDuration}\n`,
        );

        if (hasMismatch) {
          const MAX_DIFF_DISPLAY = 10;
          const indent = '  ';
          if (projectResult.onlyProcessed.length > 0) {
            const shown = projectResult.onlyProcessed.slice(0, MAX_DIFF_DISPLAY);
            const remaining = projectResult.onlyProcessed.length - shown.length;
            const suffix = remaining > 0 ? `\n${indent}  ... and ${String(remaining)} more` : '';
            stderr.write(`${indent}only processed: ${shown.join(`, `)}${suffix}\n`);
          }
          if (projectResult.onlyDiscovered.length > 0) {
            const shown = projectResult.onlyDiscovered.slice(0, MAX_DIFF_DISPLAY);
            const remaining = projectResult.onlyDiscovered.length - shown.length;
            const suffix = remaining > 0 ? `\n${indent}  ... and ${String(remaining)} more` : '';
            stderr.write(`${indent}only discovered: ${shown.join(`, `)}${suffix}\n`);
          }
        }
      }

      return [
        ...acc,
        checkResultBuildTransformer({
          checkType,
          projectResults: [projectResult],
          durationMs: checkDurationMs,
        }),
      ];
    },
    Promise.resolve([] as ReturnType<typeof checkResultBuildTransformer>[]),
  );

  const totalDurationMs = Date.now() - runStartMs;

  // Folded in AFTER the loop above finishes, never inside it: `platformDedupeProjectResult` is
  // computed once for the whole repo by `commandRunBroker`, not once per check type here.
  const foldedChecks = foldProjectResultIntoChecksTransformer({
    checks,
    checkType: 'lint',
    ...(platformDedupeProjectResult === undefined
      ? {}
      : { extraProjectResult: platformDedupeProjectResult }),
  });

  const wardResult = wardRunResultContract.parse({
    runId,
    timestamp,
    // THE GIT FLAGS RIDE ALONG BECAUSE `passthrough` CANNOT SPEAK FOR ITSELF. `gitScopeLayerBroker`
    // writes a `--committed`/`--uncommitted` diff into that same field, so a saved result carrying
    // the list alone reads back as a list the caller typed — and `isCallerFileScopeGuard`, which
    // every report surface narrows on, would then treat an unbounded diff as a handful of files.
    filters: {
      ...(config.only ? { only: config.only } : {}),
      ...(config.committed === true ? { committed: true } : {}),
      ...(config.uncommitted === true ? { uncommitted: true } : {}),
      ...(hasPassthrough ? { passthrough: config.passthrough } : {}),
    },
    checks: foldedChecks,
    durationMs: totalDurationMs,
  });

  await storageSaveBroker({ rootPath, wardResult });
  await storagePruneBroker({ rootPath });
  // Sweeps whatever an e2e run left behind that never reached its own cleanup — a SIGKILL, a
  // Ctrl-C, a cancelled CI job. It sits here rather than in the e2e broker so that EVERY ward
  // invocation reaps them, including `--only lint`: a cache leaked at 09:00 should not wait for the
  // next browser walk, which in a repo like this one may be hours away.
  await e2eArtifactsPruneBroker({ packageRoot: rootPath });

  return wardResult;
};
