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

import { childProcessSpawnCaptureAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  absoluteFilePathContract,
  contentTextContract,
  exitCodeContract,
  filePathContract,
  repoRelativePathContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { configDefaultsStatics } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { servedBuildStaleContract } from '../../../contracts/served-build-stale/served-build-stale-contract';
import type { ServedBuildStale } from '../../../contracts/served-build-stale/served-build-stale-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { servedBuildStatics } from '../../../statics/served-build/served-build-statics';
import { laneCommandPathsTransformer } from '../../../transformers/lane-command-paths/lane-command-paths-transformer';
import { servedBuildStaleRenderTransformer } from '../../../transformers/served-build-stale-render/served-build-stale-render-transformer';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';

export const servedBuildStaleReadBroker = async ({
  specName,
}: {
  specName: SpecName;
}): Promise<ContentText> => {
  const spec = await laneSpecFindBroker({ specName });
  const candidates = laneCommandPathsTransformer({ spec });
  if (candidates.length === 0) {
    return contentTextContract.parse('');
  }

  const cwdSeed = processCwdAdapter();
  const repoRoot = absoluteFilePathContract.parse(
    await cwdResolveBroker({ startPath: cwdSeed, kind: 'repo-root' }),
  );
  const { git } = servedBuildStatics;

  const ignoreCheck = await childProcessSpawnCaptureAdapter({
    command: git.command,
    args: [...git.checkIgnoreArgs, ...candidates],
    cwd: repoRoot,
  });
  // 1 is git's "none of these is ignored"; anything else but 0 is git unable to answer at all.
  if (ignoreCheck.exitCode !== exitCodeContract.parse(git.checkIgnoreExit.someIgnored)) {
    return contentTextContract.parse('');
  }
  const candidateSet = new Set<unknown>(candidates);
  const servedFolders = ignoreCheck.output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => candidateSet.has(line))
    .map((line) => repoRelativePathContract.parse(line));

  const readings = await Promise.all(
    servedFolders.map(async (outDir): Promise<ServedBuildStale | null> => {
      const folderStat = await fsStatAdapter({
        filePath: absoluteFilePathContract.parse(`${repoRoot}/${outDir}`),
      });
      if (folderStat === null) {
        return null;
      }
      const builtAtMs = folderStat.modifiedAtMs;

      const changed = await childProcessSpawnCaptureAdapter({
        command: git.shellCommand,
        args: [
          '-c',
          git.changedSinceScript,
          git.shellArgZero,
          String(Math.floor(builtAtMs / servedBuildStatics.time.msPerSecond)),
        ],
        cwd: repoRoot,
      });
      if (changed.exitCode !== exitCodeContract.parse(0)) {
        return null;
      }
      const [baseCommit = '', ...differing] = changed.output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const touched = await Promise.all(
        differing.map(async (file) => {
          const fileStat = await fsStatAdapter({
            filePath: absoluteFilePathContract.parse(`${repoRoot}/${file}`),
          });
          // A file gone from disk is a deletion the served folder still carries.
          return fileStat === null || fileStat.modifiedAtMs > builtAtMs ? [file] : [];
        }),
      );
      const changedFiles = touched.flat();
      if (changedFiles.length === 0) {
        return null;
      }

      return servedBuildStaleContract.parse({ outDir, builtAtMs, baseCommit, changedFiles });
    }),
  );
  const stale = readings.filter((reading): reading is ServedBuildStale => reading !== null);
  if (stale.length === 0) {
    return contentTextContract.parse('');
  }

  const config = await dungeonmasterConfigResolveAdapter({
    startPath: filePathContract.parse(
      `${cwdSeed}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
    ),
  });
  // `devServer.buildCommand` carries a schema default, so it is always set once `devServer` is;
  // the fallback only covers the type, `laneSpecFindBroker` having already refused a config
  // without `devServer`.
  return servedBuildStaleRenderTransformer({
    stale,
    buildCommand: contentTextContract.parse(
      String(config.devServer?.buildCommand ?? configDefaultsStatics.devServer.buildCommand),
    ),
  });
};
