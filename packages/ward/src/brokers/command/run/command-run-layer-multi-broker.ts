/**
 * PURPOSE: Spawns ward runs in each workspace package, loads sub-results, and merges into a combined WardResult
 *
 * USAGE:
 * const result = await commandRunLayerMultiBroker({ config: WardConfigStub(), projectFolders: [...], rootPath });
 * // Returns merged WardResult combining all package sub-results
 */

import { childProcessSpawnStreamAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import {
  wardResultContract,
  type WardResult,
} from '../../../contracts/ward-result/ward-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { CheckResult } from '../../../contracts/check-result/check-result-contract';
import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import { cliArgContract } from '../../../contracts/cli-arg/cli-arg-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { wardSpawnCommandStatics } from '../../../statics/ward-spawn-command/ward-spawn-command-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { extractChildRunIdTransformer } from '../../../transformers/extract-child-run-id/extract-child-run-id-transformer';
import { hasPassthroughMatchGuard } from '../../../guards/has-passthrough-match/has-passthrough-match-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
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
  const wardBin = String(
    binResolveBroker({
      binName: binCommandContract.parse(wardSpawnCommandStatics.bin),
      cwd: rootPath,
    }),
  );

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasPassthrough = Array.isArray(config.passthrough) && config.passthrough.length > 0;

  const CHECK_PAD = 12;
  const NAME_PAD = 20;

  const filteredFolders =
    hasPassthrough && config.passthrough
      ? projectFolders.filter((folder) =>
          config.passthrough?.some((arg) =>
            hasPassthroughMatchGuard({
              passthroughArg: cliArgContract.parse(arg),
              projectFolder: folder,
              rootPath,
            }),
          ),
        )
      : projectFolders;

  const subResults = await Promise.all(
    filteredFolders.map(async (folder) => {
      const spawnArgs = wardSpawnCommandStatics.baseArgs.map(String);

      if (config.only) {
        spawnArgs.push('--only', config.only.join(','));
      }

      if (hasPassthrough && config.passthrough) {
        const prefix = `${folder.path.slice(rootPath.length + 1)}/`;
        const matchingArgs = config.passthrough
          .filter((arg) =>
            hasPassthroughMatchGuard({
              passthroughArg: cliArgContract.parse(arg),
              projectFolder: folder,
              rootPath,
            }),
          )
          .map((arg) => cliArgContract.parse(arg.slice(prefix.length)));
        spawnArgs.push('--', ...matchingArgs.map(String));
      }

      const cwd = absoluteFilePathContract.parse(folder.path);
      const spawnResult = await childProcessSpawnStreamAdapter({
        command: wardBin,
        args: spawnArgs,
        cwd,
        onStderr: (line: string) => {
          process.stderr.write(line);
        },
      });

      const pkgRootPath = absoluteFilePathContract.parse(folder.path);
      const childRunId = extractChildRunIdTransformer({ output: spawnResult.output });

      const result = await storageLoadBroker({
        rootPath: pkgRootPath,
        ...(childRunId === null ? {} : { runId: childRunId }),
      });

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
