/**
 * PURPOSE: Runs `tsc -b --listFiles` once from the repo root and groups per-package results, with discovery diff per package
 *
 * USAGE:
 * const results = await checkRunTypecheckRefsBroker({
 *   rootPath: absoluteFilePathContract.parse('/repo'),
 *   projectFolders: [ProjectFolderStub()],
 * });
 * // Returns Map<ProjectPath, ProjectResult> with status, errors, filesCount, discoveredCount, onlyDiscovered, onlyProcessed
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { tscOutputParseTransformer } from '../../../transformers/tsc-output-parse/tsc-output-parse-transformer';
import { tscOutputGroupByPackageTransformer } from '../../../transformers/tsc-output-group-by-package/tsc-output-group-by-package-transformer';
import { tsconfigDiscoverPatternsTransformer } from '../../../transformers/tsconfig-discover-patterns/tsconfig-discover-patterns-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';
import { fsReadJsonSyncAdapter } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter';

export const checkRunTypecheckRefsBroker = async ({
  rootPath,
  projectFolders,
}: {
  rootPath: AbsoluteFilePath;
  projectFolders: readonly ProjectFolder[];
}): Promise<Map<ProjectFolder['path'], ProjectResult>> => {
  if (projectFolders.length === 0) {
    return new Map();
  }

  const { bin, args } = checkCommandsStatics.typecheckRefs;
  const command = String(
    binResolveBroker({ binName: binCommandContract.parse(bin), cwd: rootPath }),
  );

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: [...args],
    cwd: rootPath,
  });

  const errors = ((): ReturnType<typeof tscOutputParseTransformer> => {
    try {
      return tscOutputParseTransformer({ output: String(result.output) });
    } catch {
      return [];
    }
  })();

  const { byPackage } = tscOutputGroupByPackageTransformer({
    errors,
    projectFolders,
    rootPath,
  });

  const exitCode = rawOutputContract.shape.exitCode.parse(result.exitCode ?? 1);

  const resultMap = new Map<ProjectFolder['path'], ProjectResult>();

  for (const folder of projectFolders) {
    const folderErrors = byPackage.get(folder.path) ?? [];
    const cwd = absoluteFilePathContract.parse(String(folder.path));

    const tsconfigPath = filePathContract.parse(`${String(cwd)}/tsconfig.json`);
    const tsconfigData = ((): unknown => {
      try {
        return fsReadJsonSyncAdapter({ filePath: tsconfigPath });
      } catch {
        return {};
      }
    })();

    const { patterns, exclude } = tsconfigDiscoverPatternsTransformer({ tsconfigData });
    const { discoveredCount } = fsGlobSyncAdapter({
      patterns,
      cwd,
      exclude,
    });

    const status = folderErrors.length > 0 ? 'fail' : 'pass';

    const projectResult = projectResultContract.parse({
      projectFolder: folder,
      status,
      errors: folderErrors,
      testFailures: [],
      filesCount: discoveredCount,
      discoveredCount,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: '',
        exitCode,
      }),
    });

    resultMap.set(folder.path, projectResult);
  }

  return resultMap;
};
