/**
 * PURPOSE: Spawns ward runs in each workspace package, loads sub-results, and merges into a combined WardResult
 *
 * USAGE:
 * const result = await commandRunLayerMultiBroker({ config: WardConfigStub(), projectFolders: [...], rootPath });
 * // Returns merged WardResult combining all package sub-results
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  wardResultContract,
  type WardResult,
} from '../../../contracts/ward-result/ward-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { CheckResult } from '../../../contracts/check-result/check-result-contract';
import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { wardSpawnCommandStatics } from '../../../statics/ward-spawn-command/ward-spawn-command-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';

export const commandRunLayerMultiBroker = async ({
  config,
  projectFolders,
  rootPath,
}: {
  config: WardConfig;
  projectFolders: ProjectFolder[];
  rootPath: AbsoluteFilePath;
}): Promise<WardResult> => {
  const runId = runIdGenerateTransformer();
  const timestamp = Date.now();

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasPassthrough = Array.isArray(config.passthrough) && config.passthrough.length > 0;

  const spawnArgs = wardSpawnCommandStatics.baseArgs.map(String);

  if (config.only) {
    spawnArgs.push('--only', config.only.join(','));
  }

  if (hasPassthrough && config.passthrough) {
    spawnArgs.push('--', ...config.passthrough.map(String));
  }

  const CHECK_PAD = 12;
  const NAME_PAD = 20;

  const subResults = await Promise.all(
    projectFolders.map(async (folder) => {
      const cwd = absoluteFilePathContract.parse(folder.path);
      await childProcessSpawnCaptureAdapter({ command: 'npx', args: spawnArgs, cwd });

      const pkgRootPath = absoluteFilePathContract.parse(folder.path);
      const result = await storageLoadBroker({ rootPath: pkgRootPath });

      if (result !== null) {
        for (const check of result.checks) {
          if (check.status === 'skip') {
            continue;
          }

          const failCount = check.projectResults.reduce(
            (sum, pr) => sum + pr.errors.length + pr.testFailures.length,
            0,
          );
          const filesCount = check.projectResults.reduce((sum, pr) => sum + pr.filesCount, 0);
          const statusLabel = check.status === 'pass' ? 'PASS' : 'FAIL';
          const detail =
            failCount > 0
              ? `${String(filesCount)} files, ${String(failCount)} errors`
              : `${String(filesCount)} files`;

          process.stderr.write(
            `${check.checkType.padEnd(CHECK_PAD)}${folder.name.padEnd(NAME_PAD)} ${statusLabel}  ${detail}\n`,
          );
        }
      }

      return result;
    }),
  );

  const allChecksByType = new Map<CheckType, CheckResult[]>();

  for (const checkType of checkTypes) {
    allChecksByType.set(checkType, []);
  }

  for (const subResult of subResults) {
    if (subResult === null) {
      continue;
    }
    for (const check of subResult.checks) {
      const bucket = allChecksByType.get(check.checkType);
      if (bucket !== undefined) {
        bucket.push(check);
      }
    }
  }

  const checks = checkTypes.map((checkType) => {
    const bucket = allChecksByType.get(checkType) ?? [];
    const projectResults = bucket.flatMap((c) => c.projectResults);
    return checkResultBuildTransformer({ checkType, projectResults });
  });

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
