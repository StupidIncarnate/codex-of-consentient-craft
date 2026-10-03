/**
 * PURPOSE: Scans disk stores across repositories and user environments to inventory and weigh
 * all deletable items, determining their retention protection status based on active processes,
 * open citations, and repository recency. Reach for this when enforcing the machine disk budget.
 *
 * USAGE:
 * const { items, skipped } = await diskScanBroker({
 *   repoRoots: ['/path/to/repo'],
 * });
 * // Returns { items: DiskItem[], skipped: 0 }
 */

import { existsSync } from '#gateway/node/fs';
import { lstat, readdirIfExists, readJsonFileIfExists } from '#gateway/node/fs__promises';
import { isPortFree } from '#gateway/node/net';
import { homedir, tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { getEnv, kill } from '#gateway/node/process';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { diskItemContract, type DiskItem } from '../../../contracts/disk-item/disk-item-contract';
import { diskStoresStatics } from '../../../statics/disk-stores/disk-stores-statics';

export const diskScanBroker = async ({
  repoRoots = [],
  nowMs,
  tmpDir,
  dungeonmasterHome,
  _folderToWalk,
}: {
  repoRoots?: readonly string[];
  nowMs?: number;
  tmpDir?: string;
  dungeonmasterHome?: string;
  _folderToWalk?: string;
}): Promise<{
  items: DiskItem[];
  skipped: number;
  _walkBytes?: number;
}> => {
  if (_folderToWalk !== undefined) {
    const entries = await readdirIfExists(_folderToWalk);
    if (entries === null) {
      return { items: [], skipped: 1, _walkBytes: 0 };
    }

    const results = await Promise.all(
      entries.map(async (entry) => {
        const childPath = join(_folderToWalk, entry);
        try {
          const stats = await lstat(childPath);
          if (stats.isSymbolicLink()) {
            return { bytes: stats.size, skipped: 0 };
          }
          if (stats.isDirectory()) {
            const sub = await diskScanBroker({ _folderToWalk: childPath });
            return { bytes: sub._walkBytes ?? 0, skipped: sub.skipped };
          }
          return { bytes: stats.size, skipped: 0 };
        } catch {
          return { bytes: 0, skipped: 1 };
        }
      }),
    );

    let bytes = 0;
    let skipped = 0;
    for (const r of results) {
      bytes += r.bytes;
      skipped += r.skipped;
    }
    return { items: [], skipped, _walkBytes: bytes };
  }

  const currentTime = nowMs ?? Date.now();
  const effectiveTmp = tmpDir ?? getEnv('DUNGEONMASTER_TMP_DIR') ?? tmpdir();
  const effectiveHome =
    dungeonmasterHome ??
    getEnv('DUNGEONMASTER_HOME') ??
    join(homedir(), locationsStatics.dungeonmasterHome.dir);

  const uniqueRoots = [...new Set(repoRoots)].filter((root) => existsSync(root));
  const items: DiskItem[] = [];
  let skipped = 0;

  const storeResults = await Promise.all(
    diskStoresStatics.stores.map(async (store) => {
      const storeItems: DiskItem[] = [];
      let storeSkipped = 0;

      switch (store.storeId) {
        case 'ward-run-results': {
          const wardDirName = locationsStatics.repoRoot.wardLocalDir;
          await Promise.all(
            uniqueRoots.map(async (repoRoot) => {
              const pkgs = (await readdirIfExists(join(repoRoot, 'packages'))) ?? [];
              const runDirs = [
                join(repoRoot, wardDirName),
                ...pkgs.map((p) => join(repoRoot, 'packages', p, wardDirName)),
              ];

              const dirFiles = await Promise.all(
                runDirs.map(async (dir) => {
                  const files = (await readdirIfExists(dir)) ?? [];
                  return { dir, files };
                }),
              );

              const candidates: { path: string; bytes: number; mtimeMs: number }[] = [];
              await Promise.all(
                dirFiles.flatMap(({ dir, files }) =>
                  files
                    .filter((file) => file.startsWith('run-') && file.endsWith('.json'))
                    .map(async (file) => {
                      const fPath = join(dir, file);
                      try {
                        const s = await lstat(fPath);
                        candidates.push({
                          path: fPath,
                          bytes: s.size,
                          mtimeMs: Math.floor(s.mtimeMs),
                        });
                      } catch {
                        storeSkipped += 1;
                      }
                    }),
                ),
              );

              if (candidates.length > 0) {
                const maxMtime = Math.max(...candidates.map((c) => c.mtimeMs));
                let newestSet = false;
                for (const c of candidates) {
                  const isNewest = !newestSet && c.mtimeMs === maxMtime;
                  if (isNewest) {
                    newestSet = true;
                  }
                  storeItems.push(
                    diskItemContract.parse({
                      storeId: 'ward-run-results',
                      path: c.path,
                      bytes: c.bytes,
                      mtimeMs: c.mtimeMs,
                      protectedReason: isNewest ? 'newest-per-repo' : null,
                    }),
                  );
                }
              }
            }),
          );
          break;
        }
        case 'ward-bundle-cache': {
          const wardDir = locationsStatics.repoRoot.wardLocalDir;
          await Promise.all(
            uniqueRoots.map(async (repoRoot) => {
              const pkgs = (await readdirIfExists(join(repoRoot, 'packages'))) ?? [];
              await Promise.all(
                pkgs.map(async (pkg) => {
                  const bDir = join(repoRoot, 'packages', pkg, wardDir, 'bundle');
                  const entries = (await readdirIfExists(bDir)) ?? [];

                  await Promise.all(
                    entries.map(async (entry) => {
                      const itemPath = join(bDir, entry);
                      try {
                        const stats = await lstat(itemPath);
                        if (stats.isDirectory()) {
                          const walked = await diskScanBroker({ _folderToWalk: itemPath });
                          storeSkipped += walked.skipped;
                          storeItems.push(
                            diskItemContract.parse({
                              storeId: store.storeId,
                              path: itemPath,
                              bytes: walked._walkBytes ?? 0,
                              mtimeMs: Math.floor(stats.mtimeMs),
                              protectedReason: null,
                            }),
                          );
                        }
                      } catch {
                        storeSkipped += 1;
                      }
                    }),
                  );
                }),
              );
            }),
          );
          break;
        }
        case 'e2e-test-results': {
          await Promise.all(
            uniqueRoots.map(async (repoRoot) => {
              const pkgs = (await readdirIfExists(join(repoRoot, 'packages'))) ?? [];
              const parents = [
                join(repoRoot, 'test-results'),
                ...pkgs.map((p) => join(repoRoot, 'packages', p, 'test-results')),
              ];

              await Promise.all(
                parents.map(async (parent) => {
                  const entries = (await readdirIfExists(parent)) ?? [];
                  await Promise.all(
                    entries.map(async (entry) => {
                      const itemPath = join(parent, entry);
                      try {
                        const stats = await lstat(itemPath);
                        if (stats.isDirectory()) {
                          const mtimeMs = Math.floor(stats.mtimeMs);
                          const ageMs = currentTime - mtimeMs;
                          const port = Number.parseInt(entry, 10);
                          let protectedReason: string | null = null;
                          if (
                            ageMs <= diskStoresStatics.orphanedPortTimeoutMs &&
                            Number.isInteger(port) &&
                            port > 0
                          ) {
                            try {
                              const free = await isPortFree({ port });
                              if (!free) {
                                protectedReason = `port-in-use:${port}`;
                              }
                            } catch {
                              protectedReason = null;
                            }
                          }
                          const walked = await diskScanBroker({ _folderToWalk: itemPath });
                          storeSkipped += walked.skipped;
                          storeItems.push(
                            diskItemContract.parse({
                              storeId: store.storeId,
                              path: itemPath,
                              bytes: walked._walkBytes ?? 0,
                              mtimeMs,
                              protectedReason,
                            }),
                          );
                        }
                      } catch {
                        storeSkipped += 1;
                      }
                    }),
                  );
                }),
              );
            }),
          );
          break;
        }
        case 'e2e-vite-cache': {
          const nodeMod = locationsStatics.repoRoot.nodeModules;
          await Promise.all(
            uniqueRoots.map(async (repoRoot) => {
              const pkgs = (await readdirIfExists(join(repoRoot, 'packages'))) ?? [];
              const parents = [
                join(repoRoot, nodeMod),
                ...pkgs.map((p) => join(repoRoot, 'packages', p, nodeMod)),
              ];

              await Promise.all(
                parents.map(async (parent) => {
                  const entries = (await readdirIfExists(parent)) ?? [];
                  await Promise.all(
                    entries
                      .filter((e) => e.startsWith('.vite-'))
                      .map(async (entry) => {
                        const itemPath = join(parent, entry);
                        try {
                          const stats = await lstat(itemPath);
                          if (stats.isDirectory()) {
                            const mtimeMs = Math.floor(stats.mtimeMs);
                            const ageMs = currentTime - mtimeMs;
                            const port = Number.parseInt(entry.slice('.vite-'.length), 10);
                            let protectedReason: string | null = null;
                            if (
                              ageMs <= diskStoresStatics.orphanedPortTimeoutMs &&
                              Number.isInteger(port) &&
                              port > 0
                            ) {
                              try {
                                const free = await isPortFree({ port });
                                if (!free) {
                                  protectedReason = `port-in-use:${port}`;
                                }
                              } catch {
                                protectedReason = null;
                              }
                            }
                            const walked = await diskScanBroker({ _folderToWalk: itemPath });
                            storeSkipped += walked.skipped;
                            storeItems.push(
                              diskItemContract.parse({
                                storeId: store.storeId,
                                path: itemPath,
                                bytes: walked._walkBytes ?? 0,
                                mtimeMs,
                                protectedReason,
                              }),
                            );
                          }
                        } catch {
                          storeSkipped += 1;
                        }
                      }),
                  );
                }),
              );
            }),
          );
          break;
        }
        case 'e2e-playwright-reports': {
          await Promise.all(
            uniqueRoots.map(async (repoRoot) => {
              const pkgs = (await readdirIfExists(join(repoRoot, 'packages'))) ?? [];
              const parents = [repoRoot, ...pkgs.map((p) => join(repoRoot, 'packages', p))];
              await Promise.all(
                parents.map(async (parent) => {
                  const entries = (await readdirIfExists(parent)) ?? [];
                  await Promise.all(
                    entries
                      .filter(
                        (e) => e.startsWith('.ward-playwright-report-') && e.endsWith('.json'),
                      )
                      .map(async (entry) => {
                        const itemPath = join(parent, entry);
                        try {
                          const stats = await lstat(itemPath);
                          storeItems.push(
                            diskItemContract.parse({
                              storeId: store.storeId,
                              path: itemPath,
                              bytes: stats.size,
                              mtimeMs: Math.floor(stats.mtimeMs),
                              protectedReason: null,
                            }),
                          );
                        } catch {
                          storeSkipped += 1;
                        }
                      }),
                  );
                }),
              );
            }),
          );
          break;
        }
        case 'jest-transform-cache': {
          const tmpEntries = (await readdirIfExists(effectiveTmp)) ?? [];
          const jestDirs = tmpEntries
            .filter((e) => e.startsWith('jest_'))
            .map((e) => join(effectiveTmp, e));

          await Promise.all(
            jestDirs.map(async (jDir) => {
              const subs = (await readdirIfExists(jDir)) ?? [];
              await Promise.all(
                subs.map(async (sub) => {
                  const itemPath = join(jDir, sub);
                  try {
                    const stats = await lstat(itemPath);
                    let bytes = stats.size;
                    if (stats.isDirectory()) {
                      const walked = await diskScanBroker({ _folderToWalk: itemPath });
                      bytes = walked._walkBytes ?? 0;
                      storeSkipped += walked.skipped;
                    }
                    storeItems.push(
                      diskItemContract.parse({
                        storeId: store.storeId,
                        path: itemPath,
                        bytes,
                        mtimeMs: Math.floor(stats.mtimeMs),
                        protectedReason: null,
                      }),
                    );
                  } catch {
                    storeSkipped += 1;
                  }
                }),
              );
            }),
          );
          break;
        }
        case 'e2e-sandboxes':
        case 'jest-test-sandboxes': {
          const prefix = store.storeId === 'e2e-sandboxes' ? 'dm-e2e-' : 'dungeonmaster-jest-';
          const tmpEntries = (await readdirIfExists(effectiveTmp)) ?? [];
          const sandboxes = tmpEntries.filter((e) => e.startsWith(prefix));
          await Promise.all(
            sandboxes.map(async (entry) => {
              const itemPath = join(effectiveTmp, entry);
              try {
                const stats = await lstat(itemPath);
                const suffix = entry.slice(prefix.length);
                const parts = suffix.split('-');
                const pidPart = [...parts].reverse().find((part) => {
                  const parsed = Number.parseInt(part, 10);
                  return Number.isInteger(parsed) && String(parsed) === part;
                });
                const pid = pidPart === undefined ? NaN : Number.parseInt(pidPart, 10);
                let isAlive = false;
                if (Number.isInteger(pid) && pid > 0) {
                  try {
                    kill(pid, 0);
                    isAlive = true;
                  } catch (error: unknown) {
                    if (
                      error !== null &&
                      typeof error === 'object' &&
                      'code' in error &&
                      error.code === 'EPERM'
                    ) {
                      isAlive = true;
                    }
                  }
                }
                const reason = isAlive ? `pid-alive:${pid}` : null;
                let bytes = stats.size;
                if (stats.isDirectory()) {
                  const walked = await diskScanBroker({ _folderToWalk: itemPath });
                  bytes = walked._walkBytes ?? 0;
                  storeSkipped += walked.skipped;
                }
                storeItems.push(
                  diskItemContract.parse({
                    storeId: store.storeId,
                    path: itemPath,
                    bytes,
                    mtimeMs: Math.floor(stats.mtimeMs),
                    protectedReason: reason,
                  }),
                );
              } catch {
                storeSkipped += 1;
              }
            }),
          );
          break;
        }
        case 'siegelense-sandboxes': {
          const tmpEntries = (await readdirIfExists(effectiveTmp)) ?? [];
          const sieges = tmpEntries.filter((e) => e.startsWith('dm-siege-'));
          await Promise.all(
            sieges.map(async (entry) => {
              const itemPath = join(effectiveTmp, entry);
              try {
                const stats = await lstat(itemPath);
                const instanceId = entry.slice('dm-siege-'.length);
                let isActive = false;
                if (instanceId.startsWith('inst_')) {
                  const regPath = join(
                    effectiveHome,
                    locationsStatics.siegelense.dir,
                    locationsStatics.siegelense.registry,
                  );
                  try {
                    const raw = await readJsonFileIfExists(regPath);
                    const instancesKey = locationsStatics.siegelense.instancesDir;
                    if (raw && typeof raw === 'object' && instancesKey in raw) {
                      const rawInstances = (raw as Record<string, unknown>)[instancesKey];
                      if (Array.isArray(rawInstances)) {
                        const found = rawInstances.find(
                          (inst: unknown): inst is Record<string, unknown> =>
                            typeof inst === 'object' &&
                            inst !== null &&
                            'id' in inst &&
                            inst.id === instanceId,
                        );
                        if (found?.state === 'alive') {
                          const pidNum =
                            typeof found.pid === 'string' ? Number.parseInt(found.pid, 10) : NaN;
                          if (Number.isInteger(pidNum)) {
                            try {
                              kill(pidNum, 0);
                              isActive = true;
                            } catch (error: unknown) {
                              if (
                                error !== null &&
                                typeof error === 'object' &&
                                'code' in error &&
                                error.code === 'EPERM'
                              ) {
                                isActive = true;
                              }
                            }
                          } else {
                            isActive = true;
                          }
                        }
                      }
                    }
                  } catch {
                    isActive = false;
                  }
                }
                let bytes = stats.size;
                if (stats.isDirectory()) {
                  const walked = await diskScanBroker({ _folderToWalk: itemPath });
                  bytes = walked._walkBytes ?? 0;
                  storeSkipped += walked.skipped;
                }
                storeItems.push(
                  diskItemContract.parse({
                    storeId: store.storeId,
                    path: itemPath,
                    bytes,
                    mtimeMs: Math.floor(stats.mtimeMs),
                    protectedReason: isActive ? 'siegelense-instance-alive' : null,
                  }),
                );
              } catch {
                storeSkipped += 1;
              }
            }),
          );
          break;
        }
        case 'siegelense-evidence': {
          const siegeDir = join(effectiveHome, locationsStatics.siegelense.dir);
          const instancesDirs = [
            join(
              siegeDir,
              locationsStatics.siegelense.unownedDir,
              locationsStatics.siegelense.instancesDir,
            ),
            join(siegeDir, locationsStatics.siegelense.instancesDir),
          ];
          const gDir = join(siegeDir, locationsStatics.siegelense.guildsDir);
          const guilds = (await readdirIfExists(gDir)) ?? [];
          for (const g of guilds) {
            instancesDirs.push(join(gDir, g, locationsStatics.siegelense.instancesDir));
          }

          await Promise.all(
            instancesDirs.map(async (iDir) => {
              const entries = (await readdirIfExists(iDir)) ?? [];
              await Promise.all(
                entries.map(async (entry) => {
                  const itemPath = join(iDir, entry);
                  try {
                    const stats = await lstat(itemPath);
                    if (stats.isDirectory()) {
                      const instanceId = entry;
                      let isActive = false;
                      const regPath = join(
                        effectiveHome,
                        locationsStatics.siegelense.dir,
                        locationsStatics.siegelense.registry,
                      );
                      try {
                        const raw = await readJsonFileIfExists(regPath);
                        const instancesKey = locationsStatics.siegelense.instancesDir;
                        if (raw && typeof raw === 'object' && instancesKey in raw) {
                          const rawInstances = (raw as Record<string, unknown>)[instancesKey];
                          if (Array.isArray(rawInstances)) {
                            const found = rawInstances.find(
                              (inst: unknown): inst is Record<string, unknown> =>
                                typeof inst === 'object' &&
                                inst !== null &&
                                'id' in inst &&
                                inst.id === instanceId,
                            );
                            if (found) {
                              if (found.state === 'alive') {
                                const pidNum =
                                  typeof found.pid === 'string'
                                    ? Number.parseInt(found.pid, 10)
                                    : NaN;
                                if (Number.isInteger(pidNum)) {
                                  try {
                                    kill(pidNum, 0);
                                    isActive = true;
                                  } catch (error: unknown) {
                                    if (
                                      error !== null &&
                                      typeof error === 'object' &&
                                      'code' in error &&
                                      error.code === 'EPERM'
                                    ) {
                                      isActive = true;
                                    }
                                  }
                                } else {
                                  isActive = true;
                                }
                              }
                              if (
                                !isActive &&
                                typeof found.questId === 'string' &&
                                typeof found.guildId === 'string'
                              ) {
                                const qPath = join(
                                  effectiveHome,
                                  locationsStatics.dungeonmasterHome.guildsDir,
                                  found.guildId,
                                  locationsStatics.guild.questsDir,
                                  found.questId,
                                  locationsStatics.quest.questFile,
                                );
                                const qRaw = await readJsonFileIfExists(qPath);
                                if (
                                  qRaw &&
                                  typeof qRaw === 'object' &&
                                  'status' in qRaw &&
                                  typeof qRaw.status === 'string'
                                ) {
                                  if (
                                    qRaw.status !== 'complete' &&
                                    qRaw.status !== 'merged' &&
                                    qRaw.status !== 'abandoned'
                                  ) {
                                    isActive = true;
                                  }
                                }
                              }
                            }
                          }
                        }
                      } catch {
                        isActive = false;
                      }

                      const walked = await diskScanBroker({ _folderToWalk: itemPath });
                      storeSkipped += walked.skipped;
                      storeItems.push(
                        diskItemContract.parse({
                          storeId: store.storeId,
                          path: itemPath,
                          bytes: walked._walkBytes ?? 0,
                          mtimeMs: Math.floor(stats.mtimeMs),
                          protectedReason: isActive ? 'siegelense-instance-alive' : null,
                        }),
                      );
                    }
                  } catch {
                    storeSkipped += 1;
                  }
                }),
              );
            }),
          );
          break;
        }
        default: {
          break;
        }
      }

      return { items: storeItems, skipped: storeSkipped };
    }),
  );

  for (const res of storeResults) {
    items.push(...res.items);
    skipped += res.skipped;
  }

  return { items, skipped };
};
