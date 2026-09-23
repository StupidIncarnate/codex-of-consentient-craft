/**
 * PURPOSE: Runs TypeScript type checking on a project folder and parses errors into a ProjectResult.
 * tsc has no per-file mode, so it always checks the whole package; whenever `fileList` names actual
 * files or directories (a bare PACKAGE arg reaches here as an empty `fileList` instead — see
 * `multiPackageLayerBroker`), the run FAILS on any error anywhere in that package. Errors under a
 * named file (exact match) or a named directory (path-prefix match, see `isPathUnderDirectoryGuard`)
 * land in `errors` first; errors in the rest of the package land in both `errors` (so status and
 * counts stay truthful) and `elsewhereErrors` (so the summary can print them under their own
 * heading).
 *
 * USAGE:
 * const result = await checkRunTypecheckBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed TypeScript errors; status reflects the whole package on any scoped run
 */

import {
  childProcessSpawnCaptureAdapter,
  fsExistsSyncAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  exitCodeContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { tscOutputParseTransformer } from '../../../transformers/tsc-output-parse/tsc-output-parse-transformer';
import { tsconfigDiscoverPatternsTransformer } from '../../../transformers/tsconfig-discover-patterns/tsconfig-discover-patterns-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { isFilePathGuard } from '../../../guards/is-file-path/is-file-path-guard';
import { isPathUnderDirectoryGuard } from '../../../guards/is-path-under-directory/is-path-under-directory-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';
import { fsReadJsonSyncAdapter } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter';

export const checkRunTypecheckBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
  testNamePattern?: string;
}): Promise<ProjectResult> => {
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const tsconfigPath = filePathContract.parse(`${String(cwd)}/tsconfig.json`);

  if (!fsExistsSyncAdapter({ filePath: tsconfigPath })) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no tsconfig.json',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  const { bin, args } = checkCommandsStatics.typecheck;

  let tsconfigData: unknown = {};
  try {
    tsconfigData = fsReadJsonSyncAdapter({ filePath: tsconfigPath });
  } catch {
    // read failed, tsconfigData stays as empty object (transformer will use fallback)
  }

  const { patterns, exclude } = tsconfigDiscoverPatternsTransformer({ tsconfigData });
  const { discoveredCount, discoveredFiles } = fsGlobSyncAdapter({
    patterns,
    cwd,
    exclude,
  });
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: [...args],
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let allErrors: ReturnType<typeof tscOutputParseTransformer> = [];

  if (status === 'fail') {
    try {
      allErrors = tscOutputParseTransformer({ output: result.output });
    } catch {
      allErrors = [];
    }
  }

  // Every entry in `fileList` is either a FILE (extension-shaped, per isFilePathGuard) or a
  // DIRECTORY. tsc has no per-file mode (checkCommandsStatics.typecheck runs the whole project
  // regardless), so a scoped run must not read "none of MY files/directories have errors" as
  // "pass" when the package's tsc run found real errors elsewhere: that is the bug the
  // `<dungeonmaster-ward>` snippet's "no typecheck is lost" promise names. A bare PACKAGE arg
  // (`packages/ward`) never reaches here as a passthrough entry at all — `multiPackageLayerBroker`
  // slices it to an empty string and sends the child no `--` scope — so `fileList` is empty and
  // every branch below is a no-op for that case.
  const fileEntries = fileList.filter((entry) => isFilePathGuard({ path: String(entry) }));
  const directoryEntries = fileList.filter((entry) => !isFilePathGuard({ path: String(entry) }));
  const fileEntrySet = new Set(fileEntries.map(String));

  // A directory entry matches by PATH PREFIX WITH THE TRAILING SEPARATOR
  // (isPathUnderDirectoryGuard) — without it, a scope of `src/widget` would also claim
  // `src/widgets-extra`, a sibling it never contains.
  const namedErrors =
    fileList.length > 0
      ? allErrors.filter(
          (entry) =>
            fileEntrySet.has(String(entry.filePath)) ||
            directoryEntries.some((directory) =>
              isPathUnderDirectoryGuard({
                path: String(entry.filePath),
                directory: String(directory),
              }),
            ),
        )
      : allErrors;
  const elsewhereErrors =
    fileList.length > 0
      ? allErrors.filter(
          (entry) =>
            !fileEntrySet.has(String(entry.filePath)) &&
            !directoryEntries.some((directory) =>
              isPathUnderDirectoryGuard({
                path: String(entry.filePath),
                directory: String(directory),
              }),
            ),
        )
      : [];

  const cwdPrefix = `${String(cwd)}/`;
  const processedFiles: GitRelativePath[] = [];
  const tscLines = result.output.split('\n');

  for (const line of tscLines) {
    if (line.startsWith(cwdPrefix) && !line.includes('node_modules')) {
      processedFiles.push(gitRelativePathContract.parse(line.slice(cwdPrefix.length)));
    }
  }

  const filesCount = processedFiles.length;

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  const strippedOutput = tscLines.filter((line) => !line.startsWith('/')).join('\n');

  return projectResultContract.parse({
    projectFolder,
    // `status` is never overridden to 'pass' by scope any more: tsc always grades the WHOLE
    // package, so a real error anywhere in it fails the run whatever paths the caller passed —
    // named or elsewhere, file or directory. A bare package arg reaches here with an empty
    // `fileList`, where this was already the whole-package truth.
    status,
    // `errors` stays the FULL truthful list — named errors first, then elsewhere ones — so every
    // existing consumer (crash detection, failing-file counts) keeps working without knowing
    // `elsewhereErrors` exists. That field is a subset, kept only so the summary can print the two
    // under separate headings.
    errors: [...namedErrors, ...elsewhereErrors],
    elsewhereErrors,
    testFailures: [],
    filesCount,
    discoveredCount,
    onlyDiscovered,
    onlyProcessed,
    rawOutput: rawOutputContract.parse({
      stdout: strippedOutput,
      stderr: '',
      exitCode,
      signal: result.signal,
    }),
  });
};
