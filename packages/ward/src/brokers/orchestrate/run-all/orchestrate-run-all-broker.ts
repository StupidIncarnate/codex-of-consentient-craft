/**
 * PURPOSE: Orchestrates a full ward run by discovering projects, running checks sequentially, and persisting results
 *
 * USAGE:
 * const result = await orchestrateRunAllBroker({ config: WardConfigStub(), rootPath: AbsoluteFilePathStub() });
 * // Returns WardResult with all check results across discovered projects
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  wardResultContract,
  type WardResult,
} from '../../../contracts/ward-result/ward-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { projectFolderDiscoverBroker } from '../../project-folder/discover/project-folder-discover-broker';
import { changedFilesDiscoverBroker } from '../../changed-files/discover/changed-files-discover-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';
import { orchestrateRunAllLayerCheckBroker } from './orchestrate-run-all-layer-check-broker';

export const orchestrateRunAllBroker = async ({
  config,
  rootPath,
  onProgress,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
  onProgress?: (params: {
    checkType: string;
    packageName: string;
    completed: number;
    total: number;
  }) => void;
}): Promise<WardResult> => {
  const runId = runIdGenerateTransformer();
  const timestamp = Date.now();

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasPassthrough = Array.isArray(config.passthrough) && config.passthrough.length > 0;
  const hasFileScope = config.changed === true || hasPassthrough;

  const allProjectFolders = await projectFolderDiscoverBroker({ rootPath });

  let fileList: GitRelativePath[] = [];
  if (hasPassthrough) {
    fileList = (config.passthrough ?? []).map((filePath) =>
      gitRelativePathContract.parse(filePath),
    );
  } else if (config.changed === true) {
    fileList = await changedFilesDiscoverBroker({ cwd: rootPath });
  }

  const projectFolders = hasFileScope
    ? allProjectFolders.filter((folder) => {
        const relativePath = String(folder.path).replace(`${String(rootPath)}/`, '');
        return fileList.some((file) => String(file).startsWith(relativePath));
      })
    : allProjectFolders;

  const perProjectTypes = checkTypes.filter(
    (ct) => ct === 'lint' || ct === 'typecheck' || ct === 'test',
  );

  const totalChecks = perProjectTypes.length * projectFolders.length;
  let completedChecks = 0;

  const perProjectChecks = await perProjectTypes.reduce(
    async (outerAccPromise, checkType) => {
      const outerAcc = await outerAccPromise;
      const projectResults = await projectFolders.reduce(
        async (innerAccPromise, projectFolder) => {
          const accumulated = await innerAccPromise;
          const projectRelativePath = String(projectFolder.path).replace(
            `${String(rootPath)}/`,
            '',
          );
          const projectFileList = hasFileScope
            ? fileList
                .filter((file) => String(file).startsWith(projectRelativePath))
                .map((file) =>
                  gitRelativePathContract.parse(
                    String(file).replace(`${projectRelativePath}/`, ''),
                  ),
                )
            : fileList;
          const result = await orchestrateRunAllLayerCheckBroker({
            checkType,
            projectFolder,
            fileList: projectFileList,
          });
          completedChecks += 1;
          onProgress?.({
            checkType,
            packageName: projectFolder.name,
            completed: completedChecks,
            total: totalChecks,
          });
          return [...accumulated, result];
        },
        Promise.resolve([] as Awaited<ReturnType<typeof orchestrateRunAllLayerCheckBroker>>[]),
      );
      return [...outerAcc, checkResultBuildTransformer({ checkType, projectResults })];
    },
    Promise.resolve([] as ReturnType<typeof checkResultBuildTransformer>[]),
  );

  const checks = [...perProjectChecks];

  const wardResult = wardResultContract.parse({
    runId,
    timestamp,
    filters: {
      ...(config.changed === true ? { changed: true } : {}),
      ...(config.only ? { only: config.only } : {}),
      ...(hasPassthrough ? { passthrough: config.passthrough } : {}),
    },
    checks,
  });

  await storageSaveBroker({ rootPath, wardResult });
  await storagePruneBroker({ rootPath });

  return wardResult;
};
