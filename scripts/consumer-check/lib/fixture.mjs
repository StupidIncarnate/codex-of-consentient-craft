/**
 * Builds a local-mode consumer fixture on disk, under the OS temp dir — never under this checkout
 * (repo `CLAUDE.md`'s own scratch-file rule is for THIS repo's scratch files; a fixture under
 * `<repoRoot>/tmp` would sit below this repo's own `node_modules` in the directory tree, and Node's
 * `require()` walk-up would resolve every `@dungeonmaster/*` import to THIS repo's copy before ever
 * looking at whatever the fixture's own `npm install` produced — silently faking a pass. Physical
 * separation is the only fix, the same hazard the `<dungeonmaster-worktrees>` session snippet
 * describes for a worktree not being hermetic).
 *
 * The global-only scenario (repo CLAUDE.md's "Four Resolution Scenarios", #4) has its own module,
 * `global-prefix.mjs` — a global install needs an isolated `npm` PREFIX, not a fixture directory.
 */

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './proc.mjs';

export const makeWorkDir = ({ prefix }) => mkdtempSync(join(tmpdir(), `${prefix}-`));

/**
 * `tarballs` is the ARRAY `packAllPackages` returns: `{ packageName, tarballPath }[]`. Every
 * `@dungeonmaster/*` name gets an explicit `file:<tarball>` specifier — proven necessary against the
 * real npm registry (this repo's own `npm pack` proof, item G25): without one, npm resolves a bare
 * `"*"` for a `@dungeonmaster/*` name against the PUBLIC registry and 404s, since this beta line is
 * not published there. Supplying every packed name up front, in one `npm install`, is what lets npm
 * satisfy each package's OWN `@dungeonmaster/*` dependencies from this same local set instead of
 * reaching for the registry.
 */
export const writeRootPackageJson = ({
  dir,
  name,
  tarballs,
  extraDependencies = {},
  extraDevDependencies = {},
}) => {
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, 'packages'), { recursive: true });
  const dependencies = {};
  for (const { packageName, tarballPath } of tarballs) {
    dependencies[packageName] = `file:${tarballPath}`;
  }
  const packageJson = {
    name,
    version: '0.0.0',
    private: true,
    workspaces: ['packages/*'],
    dependencies: { ...dependencies, ...extraDependencies },
    devDependencies: { ...extraDevDependencies },
  };
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  writeFileSync(join(dir, '.gitignore'), 'node_modules/\ndist/\n');
  return dir;
};

export const npmInstall = ({ cwd, env, timeoutMs = 5 * 60 * 1000 }) =>
  run({ command: 'npm', args: ['install', '--no-audit', '--no-fund'], cwd, env, timeoutMs });
