/**
 * PURPOSE: Orchestrates a full ward run by discovering projects, running checks in parallel, and persisting results
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
import { checkResultContract } from '../../../contracts/check-result/check-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { projectFolderDiscoverBroker } from '../../project-folder/discover/project-folder-discover-broker';
import { globResolveBroker } from '../../glob/resolve/glob-resolve-broker';
import { changedFilesDiscoverBroker } from '../../changed-files/discover/changed-files-discover-broker';
import { checkRunE2eBroker } from '../../check-run/e2e/check-run-e2e-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';
import { orchestrateRunAllLayerCheckBroker } from './orchestrate-run-all-layer-check-broker';

export const orchestrateRunAllBroker = async ({
  config,
  rootPath,
  isSubPackage,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
  isSubPackage: boolean;
}): Promise<WardResult> => {
  const runId = runIdGenerateTransformer();
  const timestamp = Date.now();

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasFileScope = Boolean(config.glob) || config.changed === true;

  const projectFolders = await projectFolderDiscoverBroker({ rootPath });

  let fileList: GitRelativePath[] = [];
  if (config.glob) {
    fileList = await globResolveBroker({ pattern: config.glob, basePath: rootPath });
  } else if (config.changed === true) {
    fileList = await changedFilesDiscoverBroker({ cwd: rootPath });
  }

  const perProjectTypes = checkTypes.filter(
    (ct) => ct === 'lint' || ct === 'typecheck' || ct === 'test',
  );

  const perProjectChecks = await Promise.all(
    perProjectTypes.map(async (checkType) => {
      const projectResults = await Promise.all(
        projectFolders.map(async (projectFolder) =>
          orchestrateRunAllLayerCheckBroker({ checkType, projectFolder, fileList }),
        ),
      );
      return checkResultBuildTransformer({ checkType, projectResults });
    }),
  );

  const checks = [...perProjectChecks];

  if (checkTypes.includes('e2e') && !hasFileScope && !isSubPackage) {
    const e2eResult = await checkRunE2eBroker({ rootPath });
    checks.push(checkResultBuildTransformer({ checkType: 'e2e', projectResults: [e2eResult] }));
  } else if (checkTypes.includes('e2e') && (hasFileScope || isSubPackage)) {
    checks.push(
      checkResultContract.parse({ checkType: 'e2e', status: 'skip', projectResults: [] }),
    );
  }

  const wardResult = wardResultContract.parse({
    runId,
    timestamp,
    filters: {
      ...(config.glob ? { glob: config.glob } : {}),
      ...(config.changed === true ? { changed: true } : {}),
      ...(config.only ? { only: config.only } : {}),
    },
    checks,
  });

  await storageSaveBroker({ rootPath, wardResult });
  await storagePruneBroker({ rootPath });

  return wardResult;
};
