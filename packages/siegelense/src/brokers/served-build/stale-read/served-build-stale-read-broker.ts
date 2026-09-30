/**
 * PURPOSE: Answers `start`'s question "is any compiled folder this lane serves behind the
 * checkout?" and hands back the warning text for it — the empty string when nothing is behind. A
 * `stack` lane's web process serves a build folder (`vite preview --outDir packages/web/dist`)
 * while its API runs live source, so every change since the last build is missing from the lane
 * and nothing else says so. It knows no package layout: the served folders are the paths the
 * lane's own commands name that git reports as ignored; a folder's build time is its own mtime
 * (a build rewrites its entries); the files behind it are the ones the working tree differs by
 * from the commit HEAD held at that time AND has touched since — so an edit that was already
 * uncommitted when the build ran does not count, and a fresh worktree whose build folder was
 * copied across from the main checkout is measured against the commit that build really saw.
 * Every "git cannot answer" branch (not a repository, no commit that old) reports nothing rather
 * than guess. This only warns; it never builds.
 *
 * USAGE:
 * await servedBuildStaleReadBroker({ specName: SpecNameStub({ value: 'stack' }) });
 * // Returns 'STALE BUILD: this lane serves packages/web/dist, last built ...\nREBUILD: ...\n', or ''
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import { statIfExists } from '#gateway/node/fs__promises';
import { cwd } from '#gateway/node/process';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { configDefaultsStatics, configResolveBroker } from '@dungeonmaster/config';

import { servedBuildStaleContract } from '../../../contracts/served-build-stale/served-build-stale-contract';
import type { ServedBuildStale } from '../../../contracts/served-build-stale/served-build-stale-contract';
import { servedBuildStatics } from '../../../statics/served-build/served-build-statics';
import { laneCommandPathsTransformer } from '../../../transformers/lane-command-paths/lane-command-paths-transformer';
import { servedBuildStaleRenderTransformer } from '../../../transformers/served-build-stale-render/served-build-stale-render-transformer';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';

export const servedBuildStaleReadBroker = async ({
  specName,
}: {
  specName: string;
}): Promise<string> => {
  const spec = await laneSpecFindBroker({ specName });
  const candidates = laneCommandPathsTransformer({ spec });
  if (candidates.length === 0) {
    return '';
  }

  const cwdSeed = cwd();
  const repoRoot = await cwdResolveBroker({ startPath: cwdSeed, kind: 'repo-root' });
  const { git } = servedBuildStatics;

  const ignoreCheck = await run({
    command: git.command,
    args: [...git.checkIgnoreArgs, ...candidates],
    cwd: repoRoot,
  }).catch((error: unknown) => {
    // git not installed is "git cannot answer", the same as not a repository: report nothing.
    if (error instanceof RunNotFoundError) {
      return null;
    }
    throw error;
  });
  if (ignoreCheck === null) {
    return '';
  }
  // 1 is git's "none of these is ignored"; anything else but 0 is git unable to answer at all.
  if (ignoreCheck.exitCode !== git.checkIgnoreExit.someIgnored) {
    return '';
  }
  const candidateSet = new Set<string>(candidates);
  const servedFolders = ignoreCheck.output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => candidateSet.has(line));

  const readings = await Promise.all(
    servedFolders.map(async (outDir): Promise<ServedBuildStale[]> => {
      const folderStat = await statIfExists(`${repoRoot}/${outDir}`);
      if (folderStat === null) {
        return [];
      }
      const builtAtMs = folderStat.modifiedAtMs;

      const changed = await run({
        command: git.shellCommand,
        args: [
          '-c',
          git.changedSinceScript,
          git.shellArgZero,
          String(Math.floor(builtAtMs / servedBuildStatics.time.msPerSecond)),
        ],
        cwd: repoRoot,
      });
      if (changed.exitCode !== 0) {
        return [];
      }
      const [baseCommit = '', ...differing] = changed.output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const touched = await Promise.all(
        differing.map(async (file) => {
          const fileStat = await statIfExists(`${repoRoot}/${file}`);
          // A file gone from disk is a deletion the served folder still carries.
          return fileStat === null || fileStat.modifiedAtMs > builtAtMs ? [file] : [];
        }),
      );
      const changedFiles = touched.flat();
      if (changedFiles.length === 0) {
        return [];
      }

      return [servedBuildStaleContract.parse({ outDir, builtAtMs, baseCommit, changedFiles })];
    }),
  );
  const stale = readings.flat();
  if (stale.length === 0) {
    return '';
  }

  const config = await configResolveBroker({
    filePath: `${cwdSeed}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
  });
  // `devServer.buildCommand` carries a schema default, so it is always set once `devServer` is;
  // the fallback only covers the type, `laneSpecFindBroker` having already refused a config
  // without `devServer`.
  return servedBuildStaleRenderTransformer({
    stale,
    buildCommand: config.devServer?.buildCommand ?? configDefaultsStatics.devServer.buildCommand,
  });
};
