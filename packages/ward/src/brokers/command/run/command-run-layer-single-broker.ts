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
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { checkRunLintBroker } from '../../check-run/lint/check-run-lint-broker';
import { checkRunTypecheckBroker } from '../../check-run/typecheck/check-run-typecheck-broker';
import { checkRunUnitBroker } from '../../check-run/unit/check-run-unit-broker';
import { checkRunE2eBroker } from '../../check-run/e2e/check-run-e2e-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';

const CHECK_RUNNERS = {
  lint: checkRunLintBroker,
  typecheck: checkRunTypecheckBroker,
  unit: checkRunUnitBroker,
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

  const checks = await checkTypes.reduce(
    async (accPromise, checkType) => {
      const acc = await accPromise;
      const runner = CHECK_RUNNERS[checkType];

      process.stderr.write(
        `${checkType.padEnd(CHECK_PAD)}${projectFolder.name.padEnd(NAME_PAD)} running...\r`,
      );

      const projectResult = await runner({ projectFolder, fileList });

      if (projectResult.status === 'skip') {
        process.stderr.write(`\x1b[K`);
      } else {
        const failCount = projectResult.errors.length + projectResult.testFailures.length;
        const statusLabel = projectResult.status === 'pass' ? 'PASS' : 'FAIL';
        const detail =
          failCount > 0
            ? `${String(projectResult.filesCount)} files, ${String(failCount)} errors`
            : `${String(projectResult.filesCount)} files`;

        process.stderr.write(
          `\x1b[K${checkType.padEnd(CHECK_PAD)}${projectFolder.name.padEnd(NAME_PAD)} ${statusLabel}  ${detail}\n`,
        );
      }

      return [...acc, checkResultBuildTransformer({ checkType, projectResults: [projectResult] })];
    },
    Promise.resolve([] as ReturnType<typeof checkResultBuildTransformer>[]),
  );

  const wardResult = wardResultContract.parse({
    runId,
    timestamp,
    filters: {
      ...(config.only ? { only: config.only } : {}),
      ...(hasPassthrough ? { passthrough: config.passthrough } : {}),
    },
    checks,
  });

  await storageSaveBroker({ rootPath, wardResult });
  await storagePruneBroker({ rootPath });

  return wardResult;
};
