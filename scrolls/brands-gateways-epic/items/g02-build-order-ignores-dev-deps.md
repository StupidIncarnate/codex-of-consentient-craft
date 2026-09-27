# G02: The build order ignores `devDependencies`

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 21, lines 479-511 |
| Needs | nothing |
| Unblocks | [G22](g22-jest-through-gateway.md) |
| Packages touched | none — this is the root build script, `scripts/build-workspaces.mjs`, not a workspace package |
| Checks to run | `unit` (the script's own tests, if any exist) plus a manual `npm run build:clean` proof once the operator is ready to build (the executing agent itself never builds — see Traps) |
| Split | one agent |
| Runs alone | no |

## Why

`npm run build` runs `scripts/build-workspaces.mjs`, which builds each workspace package after every
package it depends on. It reads "depends on" from `readManifests`, which merges `dependencies`,
`devDependencies` and `peerDependencies` into one list — so a package used only by TESTS counts as a real
build dependency today.

This is harmless right now because every gateway package (`@dungeonmaster/npm`, `node`, `browser`, `bin`)
lists `@dungeonmaster/testing` as a `devDependency` (gateway proxies call `registerMock`, which lives in
`testing`), and `testing` lists no dungeonmaster package back. Once `testing` imports Jest through
`#gateway/npm/jest__globals` (planned in "Jest goes through the gateway" — see G22, which needs this
item), `testing` must list the gateway as a real `dependency`. At that point the build script sees the
gateway needing `testing` (as a `devDependency`) AND `testing` needing the gateway (as a real
`dependency`), and throws `Dependency cycle among workspaces` — breaking `npm run build` the day `testing`
switches over.

Only one of those two edges is a REAL build-order requirement:

| Edge | Real build order? |
|---|---|
| `testing` imports `#gateway/...`, a `dependency` | Yes. The gateway must build before `testing`. |
| gateway proxies and tests import `@dungeonmaster/testing`, a `devDependency` | No. Tests never need a build. The gateway's own build does emit proxies, but it reads `testing` through the `source` condition, straight from TypeScript, never from `testing`'s `dist`. |

## Current state

Checked 2026-09-26 against the code. `scripts/build-workspaces.mjs` (repo root, not inside `packages/`)
holds `readManifests` at line 289:

```js
const readManifests = () => {
  const manifests = new Map();

  for (const dirName of listWorkspacePackageDirs({ packagesDir: PACKAGES_DIR })) {
    const manifestPath = join(PACKAGES_DIR, dirName, 'package.json');
    let raw;
    try {
      raw = readFileSync(manifestPath, 'utf8');
    } catch {
      continue;
    }

    const manifest = JSON.parse(raw);
    manifests.set(manifest.name, {
      dir: dirName,
      hasBuild: Boolean(manifest.scripts?.build),
      deps: Object.keys({
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      }).filter((dep) => dep.startsWith(SCOPE)),
    });
  }

  return manifests;
};
```

Lines 305-309 are the merge that needs to drop `devDependencies`. `topologicalOrder` (line 317) consumes
`manifests` afterward with Kahn's algorithm and does not need to change — it only reads `deps`, whatever
produced that list.

The source doc's own 2026-09-26 check found this drops no REAL build edge today: the only dungeonmaster
packages listed as a `devDependency` ALONE (nowhere as a real `dependency` or `peerDependency` in the
same manifest) are `@dungeonmaster/testing`, in every package, and `@dungeonmaster/hydration-recipes`, in
`server` and `web` — and no production source file in `server` or `web` imports `hydration-recipes`. Not
independently re-verified in this pass; the executing agent re-confirms this before landing the change,
since it is the exact thing that would silently break if wrong (a package that DOES need another purely
through `devDependencies` for its build would stop building in the right order with no error, only a
`TS2307` failure later).

## Work

1. Change the merge at `scripts/build-workspaces.mjs:305-309` to drop `devDependencies`:
   ```js
   deps: Object.keys({
     ...manifest.dependencies,
     ...manifest.peerDependencies,
   }).filter((dep) => dep.startsWith(SCOPE)),
   ```
2. Re-verify the source doc's 2026-09-26 claim before landing: walk every workspace package's manifest
   and confirm no package needs another PURELY via `devDependencies` for a real build-time import (as
   opposed to a test-only one). Use `discover` or a `python3 os.walk` one-liner to read every
   `packages/*/package.json`, not a guess.
3. **`registerMock` stays in `@dungeonmaster/testing` throughout.** Moving it into the gateway to dodge
   the future cycle is explicitly NOT the fix — it would turn `testing` into something the gateway
   depends on for real code, which is backwards from what `testing` is for.
4. This item does not itself need `testing` to already import the gateway (that is G22, which needs this
   item done first) — it only needs the BUILD SCRIPT fixed ahead of that day, so `npm run build` does not
   break the moment G22 lands.

## Done when

- [ ] `scripts/build-workspaces.mjs`'s `readManifests` merges only `dependencies` and `peerDependencies`.
- [ ] The re-verification (Work step 2) is reported: which packages list a dungeonmaster package as a
  `devDependency` alone, and confirmation none of them need it for a real build-time import.
- [ ] `registerMock` has not moved out of `@dungeonmaster/testing`.
- [ ] Any test this script has (`npm run ward -- -- scripts/build-workspaces.mjs` if ward covers root
  scripts; otherwise say so in the report) passes, or the report says no test exists for this file today.

## Traps

- **Never build.** This item changes the build SCRIPT, which is easy to want to prove by actually running
  `npm run build`. Per the standing agent brief and the `<dungeonmaster-buildDiscipline>` snippet, a
  dispatched agent never builds — report "build needed" and let the operator run
  `npm run build:clean` to prove the fix once this item is otherwise done.
- The dependency-cycle error this item prevents only appears once `testing` switches to importing the
  gateway as a real dependency (G22) — so this item's own fix will not visibly change anything about
  today's build. Its proof is the re-verification in Work step 2, not a build that suddenly starts
  working differently.

## Concessions made while executing
