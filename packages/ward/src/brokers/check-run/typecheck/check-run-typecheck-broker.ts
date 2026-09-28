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
 * A package's `tsconfig.build.json` differs from `tsconfig.json` in `rootDir`, `outDir`, `exclude`
 * and `customConditions` — real gaps a checking-config-only run misses (TS6059 in commit ed13c2901,
 * TS2379 under `exactOptionalPropertyTypes` in G15, neither caught until `npm run build`). Whenever
 * the file exists, this runs a SECOND `tsc --noEmit` pass against it, in parallel with the checking
 * pass, and merges its errors into the same `errors`/`elsewhereErrors` lists — de-duplicated against
 * the checking pass's own findings, so a real error the two configs agree on prints once, not twice,
 * and no separate heading is needed: an error is an error whichever config found it.
 *
 * USAGE:
 * const result = await checkRunTypecheckBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed TypeScript errors from tsconfig.json and, when present,
 * // tsconfig.build.json; status reflects the whole package on any scoped run
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import { existsSync, readJsonFileSyncIfExists } from '#gateway/node/fs';
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
import { globDiscoverFilesBroker } from '../../glob/discover-files/glob-discover-files-broker';

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

  if (!existsSync(tsconfigPath)) {
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

  const { bin, args, buildArgs } = checkCommandsStatics.typecheck;

  let tsconfigData: unknown = {};
  try {
    tsconfigData = readJsonFileSyncIfExists(String(tsconfigPath)) ?? {};
  } catch {
    // read failed, tsconfigData stays as empty object (transformer will use fallback)
  }

  const { patterns, exclude } = tsconfigDiscoverPatternsTransformer({ tsconfigData });
  const { discoveredCount, discoveredFiles } = globDiscoverFilesBroker({
    patterns,
    cwd,
    exclude,
  });
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  // The build config's `-p` target is per-package, so only `--noEmit` is a static arg; the path is
  // appended here. Run alongside the checking pass, never after it — a sequential second `tsc`
  // process would double the wall time of every package's typecheck that carries this file.
  const buildTsconfigPath = filePathContract.parse(`${String(cwd)}/tsconfig.build.json`);
  const hasBuildConfig = existsSync(buildTsconfigPath);

  // A missing `tsc` binary rejects `run` with RunNotFoundError rather than resolving a result —
  // caught here and folded into the same failed-run shape the old spawn-capture adapter resolved
  // for an ENOENT, so a machine without the resolved bin reads as a failing typecheck run below,
  // exactly as it always has.
  const [result, buildResult] = await Promise.all([
    run({ command, args: [...args], cwd }).catch((error: unknown) => {
      if (!(error instanceof RunNotFoundError)) {
        throw error;
      }
      return { exitCode: 1, output: '', signal: null, timedOut: false };
    }),
    hasBuildConfig
      ? run({
          command,
          args: [...buildArgs, '-p', String(buildTsconfigPath)],
          cwd,
        }).catch((error: unknown) => {
          if (!(error instanceof RunNotFoundError)) {
            throw error;
          }
          return { exitCode: 1, output: '', signal: null, timedOut: false };
        })
      : Promise.resolve(null),
  ]);

  const exitCode = exitCodeContract.parse(result.exitCode);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let mainErrors: ReturnType<typeof tscOutputParseTransformer> = [];

  if (status === 'fail') {
    try {
      mainErrors = tscOutputParseTransformer({ output: result.output });
    } catch {
      mainErrors = [];
    }
  }

  let buildStatus: 'pass' | 'fail' = 'pass';
  let buildErrors: ReturnType<typeof tscOutputParseTransformer> = [];
  let buildStrippedOutput = '';
  let buildExitCode = exitCodeContract.parse(0);
  let buildSignal: NodeJS.Signals | null = null;

  if (buildResult !== null) {
    buildExitCode = exitCodeContract.parse(buildResult.exitCode);
    buildSignal = buildResult.signal;
    buildStatus = buildExitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

    if (buildStatus === 'fail') {
      try {
        buildErrors = tscOutputParseTransformer({ output: buildResult.output });
      } catch {
        buildErrors = [];
      }
    }

    buildStrippedOutput = buildResult.output
      .split('\n')
      .filter((line) => !line.startsWith('/'))
      .join('\n');
  }

  // The build pass shares most of its source tree with the checking pass, so the same real error
  // often surfaces under both configs. Merged on filePath+line+column+severity+message, so a caller
  // reading `errors` sees it once and has no reason to know two `tsc` runs happened at all.
  const mainErrorKeys = new Set(
    mainErrors.map(
      (entry) =>
        `${entry.filePath}|${String(entry.line)}|${String(entry.column)}|${entry.severity}|${entry.message}`,
    ),
  );
  const uniqueBuildErrors = buildErrors.filter(
    (entry) =>
      !mainErrorKeys.has(
        `${entry.filePath}|${String(entry.line)}|${String(entry.column)}|${entry.severity}|${entry.message}`,
      ),
  );
  const allErrors = [...mainErrors, ...uniqueBuildErrors];
  const combinedStatus = status === 'fail' || buildStatus === 'fail' ? 'fail' : 'pass';

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

  const strippedOutputMain = tscLines.filter((line) => !line.startsWith('/')).join('\n');
  const strippedOutput =
    buildStatus === 'fail' && buildStrippedOutput.length > 0
      ? [strippedOutputMain, '--- tsconfig.build.json ---', buildStrippedOutput]
          .filter((part) => part.length > 0)
          .join('\n')
      : strippedOutputMain;

  // The checking pass's exit code/signal stay the reported ones whenever IT failed — a build-only
  // failure (checking pass clean) is the one case that needs the build pass's own exit evidence
  // instead, or `rawOutput` would claim exit 0 on a run the summary reports as failed.
  let combinedExitCode = exitCode;
  let combinedSignal = result.signal;

  if (status !== 'fail' && buildStatus === 'fail') {
    combinedExitCode = buildExitCode;
    combinedSignal = buildSignal;
  }

  return projectResultContract.parse({
    projectFolder,
    // `status` is never overridden to 'pass' by scope any more: tsc always grades the WHOLE
    // package, so a real error anywhere in it fails the run whatever paths the caller passed —
    // named or elsewhere, file or directory, from either config. A bare package arg reaches here
    // with an empty `fileList`, where this was already the whole-package truth.
    status: combinedStatus,
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
      exitCode: combinedExitCode,
      signal: combinedSignal,
    }),
  });
};
