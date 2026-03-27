/**
 * PURPOSE: Runs all requested check types directly against a single project folder and returns WardResult
 *
 * USAGE:
 * const result = await commandRunLayerSingleBroker({ config: WardConfigStub(), projectFolder: ProjectFolderStub(), rootPath });
 * // Returns WardResult with one ProjectResult per check type
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  wardResultContract,
  type WardResult,
} from '../../../contracts/ward-result/ward-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { gitRelativePathContract } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { durationMsContract } from '../../../contracts/duration-ms/duration-ms-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { msPerSecondStatics } from '../../../statics/ms-per-second/ms-per-second-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { checkRunLintBroker } from '../../check-run/lint/check-run-lint-broker';
import { checkRunTypecheckBroker } from '../../check-run/typecheck/check-run-typecheck-broker';
import { checkRunUnitBroker } from '../../check-run/unit/check-run-unit-broker';
import { checkRunIntegrationBroker } from '../../check-run/integration/check-run-integration-broker';
import { checkRunE2eBroker } from '../../check-run/e2e/check-run-e2e-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';

const CHECK_RUNNERS = {
  lint: checkRunLintBroker,
  typecheck: checkRunTypecheckBroker,
  unit: checkRunUnitBroker,
  integration: checkRunIntegrationBroker,
  e2e: checkRunE2eBroker,
} as const;

export const commandRunLayerSingleBroker = async ({
  config,
  projectFolder,
  rootPath,
}: {
  config: WardConfig;
  projectFolder: ProjectFolder;
  rootPath: AbsoluteFilePath;
}): Promise<WardResult> => {
  const runId = runIdGenerateTransformer();
  const timestamp = Date.now();

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasPassthrough = Array.isArray(config.passthrough) && config.passthrough.length > 0;

  const fileList = hasPassthrough
    ? (config.passthrough ?? []).map((arg) => gitRelativePathContract.parse(arg))
    : [];

  const CHECK_PAD = 12;
  const NAME_PAD = 20;

  const runStartMs = Date.now();

  const checks = await checkTypes.reduce(
    async (accPromise, checkType) => {
      const acc = await accPromise;
      const runner = CHECK_RUNNERS[checkType];

      process.stderr.write(
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
        process.stderr.write(
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

        process.stderr.write(
          `\x1b[K${checkType.padEnd(CHECK_PAD)}${projectFolder.name.padEnd(NAME_PAD)} ${statusLabel}  ${detail}${formattedDuration}\n`,
        );

        if (hasMismatch) {
          const MAX_DIFF_DISPLAY = 10;
          const indent = '  ';
          if (projectResult.onlyProcessed.length > 0) {
            const shown = projectResult.onlyProcessed.slice(0, MAX_DIFF_DISPLAY);
            const remaining = projectResult.onlyProcessed.length - shown.length;
            const suffix = remaining > 0 ? `\n${indent}  ... and ${String(remaining)} more` : '';
            process.stderr.write(`${indent}only processed: ${shown.join(`, `)}${suffix}\n`);
          }
          if (projectResult.onlyDiscovered.length > 0) {
            const shown = projectResult.onlyDiscovered.slice(0, MAX_DIFF_DISPLAY);
            const remaining = projectResult.onlyDiscovered.length - shown.length;
            const suffix = remaining > 0 ? `\n${indent}  ... and ${String(remaining)} more` : '';
            process.stderr.write(`${indent}only discovered: ${shown.join(`, `)}${suffix}\n`);
          }
        }
      }

      return [
        ...acc,
        checkResultBuildTransformer({
          checkType,
          projectResults: [projectResult],
          durationMs: durationMsContract.parse(checkDurationMs),
        }),
      ];
    },
    Promise.resolve([] as ReturnType<typeof checkResultBuildTransformer>[]),
  );

  const totalDurationMs = Date.now() - runStartMs;

  const wardResult = wardResultContract.parse({
    runId,
    timestamp,
    filters: {
      ...(config.only ? { only: config.only } : {}),
      ...(hasPassthrough ? { passthrough: config.passthrough } : {}),
    },
    checks,
    durationMs: durationMsContract.parse(totalDurationMs),
  });

  await storageSaveBroker({ rootPath, wardResult });
  await storagePruneBroker({ rootPath });

  return wardResult;
};
