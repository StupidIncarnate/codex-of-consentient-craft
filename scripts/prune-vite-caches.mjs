#!/usr/bin/env node
/**
 * Removes Vite dependency caches nothing will ever read again.
 *
 * `packages/web/vite.config.ts` sets `cacheDir: node_modules/.vite-<basePort>`, and ward's e2e
 * runner asks the OS for a FRESH free port every run. So every e2e run mints a ~39M cache under a
 * number that will never come up again, and Vite has no eviction of its own. Left alone this fills
 * the disk: measured at 1,404 dirs and 46G in one checkout, plus 1,586 more in a single worktree.
 * `npm run dev` and `npm run prod` bind fixed ports, so they reuse one dir each and are not the
 * source.
 *
 * Every npm script that starts Vite runs this first, so the sweep happens without anything being
 * scheduled, and a worktree sweeps its own tree from its own copy of this file.
 *
 * Run it by hand with `npm run clean:vite`.
 *
 * This script is repo-local, not general-purpose: it hardcodes this repo's own package layout
 * (`packages/web`) rather than deriving it, so it does not port to another repo unmodified.
 */

import { readdir, lstat, rm, unlink, readFile, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A cache this old belongs to a run that is long finished. Anything younger may still be serving a
// browser walk that has not torn down yet, or a dev server somebody is looking at right now.
const MAX_AGE_DAYS = 2;
const CACHE_PREFIX = '.vite-';
const WEB_CACHE_PARENT = 'packages/web/node_modules';
const WORKTREE_PARENTS = ['worktrees', '.claude/worktrees'];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const listDir = async (path) => {
  try {
    return await readdir(path);
  } catch {
    // A worktree without an installed node_modules, or no worktrees at all.
    return [];
  }
};

/**
 * The ports a long-lived server binds, which must survive however old their cache looks. A dev
 * server left up for a week writes to its cache only when a dependency changes, so its mtime goes
 * stale while the server is still serving from it — deleting that one out from under a running
 * Vite gives the browser 504s on every optimized dep.
 */
const protectedPortsFor = async (root) => {
  const ports = new Set();

  for (const fromEnv of [process.env.DUNGEONMASTER_PORT, process.env.DUNGEONMASTER_WEB_PORT]) {
    if (fromEnv !== undefined && fromEnv !== '') {
      ports.add(fromEnv);
    }
  }

  try {
    const config = JSON.parse(await readFile(join(root, '.dungeonmaster.json'), 'utf8'));
    for (const port of [config?.dungeonmaster?.port, config?.devServer?.port]) {
      if (typeof port === 'number') {
        ports.add(String(port));
        // vite.config.ts falls back to `API port + 1` for the web half.
        ports.add(String(port + 1));
      }
    }
  } catch (error) {
    process.stderr.write(
      `[prune-vite-caches] could not read ${join(root, '.dungeonmaster.json')}: ${String(error)}\n`,
    );
  }

  return ports;
};

const pruneRoot = async (root) => {
  const parent = join(root, WEB_CACHE_PARENT);
  const entries = (await listDir(parent)).filter((name) => name.startsWith(CACHE_PREFIX));

  if (entries.length === 0) {
    return { dirs: 0, links: 0, bytes: 0 };
  }

  const protectedPorts = await protectedPortsFor(root);
  const doomedDirs = [];
  const doomedLinks = [];

  for (const name of entries) {
    const path = join(parent, name);
    const port = name.slice(CACHE_PREFIX.length);

    if (!/^\d+$/u.test(port) || protectedPorts.has(port)) {
      continue;
    }

    const info = await lstat(path);

    if (info.isSymbolicLink()) {
      // A worktree's npm install links these back to the main checkout. Never follow one — the
      // target belongs to the root that owns it and gets swept there. A DANGLING link is left over
      // from a sweep that already took the target, so it is safe to drop.
      const target = await stat(path).catch(() => null);
      if (target === null) {
        doomedLinks.push(path);
      }
      continue;
    }

    if (info.isDirectory() && info.mtimeMs < cutoff) {
      doomedDirs.push(path);
    }
  }

  // Concurrent runs both sweep, so two processes can name the same directory. `force` turns the
  // loser's ENOENT into a no-op rather than a crash that takes the Vite start down with it.
  const removed = await Promise.all(
    doomedDirs.map(async (path) => {
      const bytes = await duOf(path);
      await rm(path, { recursive: true, force: true });
      return bytes;
    }),
  );

  await Promise.all(doomedLinks.map((path) => unlink(path).catch(() => undefined)));

  return {
    dirs: doomedDirs.length,
    links: doomedLinks.length,
    bytes: removed.reduce((sum, bytes) => sum + bytes, 0),
  };
};

const duOf = async (path) => {
  let total = 0;
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    await Promise.all(
      entries.map(async (entry) => {
        const child = join(dir, entry.name);
        if (entry.isDirectory()) {
          return walk(child);
        }
        const info = await lstat(child).catch(() => null);
        total += info?.size ?? 0;
        return undefined;
      }),
    );
  };
  await walk(path);
  return total;
};

const roots = [repoRoot];

for (const parent of WORKTREE_PARENTS) {
  for (const name of await listDir(join(repoRoot, parent))) {
    roots.push(join(repoRoot, parent, name));
  }
}

const results = await Promise.all(roots.map(pruneRoot));
const dirs = results.reduce((sum, r) => sum + r.dirs, 0);
const links = results.reduce((sum, r) => sum + r.links, 0);
const bytes = results.reduce((sum, r) => sum + r.bytes, 0);

// Silence when there was nothing to do — this runs ahead of every Vite start, and a line per start
// is noise in the dev log and in every Playwright `[WebServer]` prefix.
if (dirs > 0 || links > 0) {
  const gib = (bytes / 1024 ** 3).toFixed(1);
  process.stdout.write(
    `[prune-vite-caches] removed ${String(dirs)} caches older than ${String(MAX_AGE_DAYS)} days ` +
      `(${gib} GB) and ${String(links)} dead links\n`,
  );
}
