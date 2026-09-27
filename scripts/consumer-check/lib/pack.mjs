/**
 * `npm pack` every non-private workspace package from THIS repo's own compiled `dist/`, into a
 * caller-given directory. Packing every non-private package rather than hand-picking a dependency
 * list is deliberate: the transitive `dependencies` graph among `@dungeonmaster/*` packages (cli ->
 * orchestrator -> config -> ...) already reaches nearly all of them, and a hand-picked subset is
 * exactly the kind of second copy of a list that drifts the moment a package gains a new internal
 * dependency. `npm pack` reads a package's `files` field, so packing one nobody ends up installing
 * costs a few extra KB on disk and nothing else.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './ground-truth.mjs';
import { run } from './proc.mjs';
import { listWorkspacePackageDirs } from '../../workspace-package-dirs.mjs';

const PACKAGES_DIR = 'packages';

export const listPackablePackages = () => {
  const dirs = listWorkspacePackageDirs({ packagesDir: join(REPO_ROOT, PACKAGES_DIR) });
  const packable = [];
  for (const dir of dirs) {
    const manifestPath = join(REPO_ROOT, PACKAGES_DIR, dir, 'package.json');
    // A `packages/*` directory mid-scaffold (another agent's in-progress work, or leftover debris)
    // may have no `package.json` yet — that is not a package this suite can pack, so it is skipped
    // rather than crashing the whole suite on an ENOENT for a directory nobody finished.
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      continue;
    }
    if (manifest.private === true) {
      continue;
    }
    packable.push({ dir, name: manifest.name, version: manifest.version });
  }
  return packable;
};

// Returns an ARRAY of `{ packageName, tarballPath }` — never a `{ [name]: path }` map. Every
// consumer (`install.mjs`'s `file:<tarball>` rewrite, `global-prefix.mjs`'s `npm install -g`
// argv) needs an ordered list of tarball paths, and an array is also what lets two same-named
// entries (there are none today, but nothing here assumes it) fail loudly instead of silently
// overwriting a key.
export const packAllPackages = async ({ outDir }) => {
  const packable = listPackablePackages();
  const tarballs = [];

  for (const { dir, name } of packable) {
    const packageDir = join(REPO_ROOT, PACKAGES_DIR, dir);
    const result = await run({
      command: 'npm',
      args: ['pack', '--pack-destination', outDir, '--json'],
      cwd: packageDir,
      timeoutMs: 60_000,
    });
    if (result.code !== 0) {
      throw new Error(`npm pack failed for ${name}:\n${result.stderr}`);
    }
    const [packed] = JSON.parse(result.stdout);
    tarballs.push({ packageName: name, tarballPath: join(outDir, packed.filename) });
  }

  return tarballs;
};
