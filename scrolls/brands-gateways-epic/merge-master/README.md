# Merge-master adapter map

`adapter-map.json` lists every `adapters/` path that master's version of a changed file imports but that does not
exist on `gateway-pivot`, where every `adapters/` folder is gone. Each entry gives the HEAD replacement (a
`#gateway/<kind>/<subpath>` wrapper, a package broker or transformer, or `@dungeonmaster/orchestrator` for the server
forwarders), how the call and the proxy's staging methods map, and a commit on this branch where a caller made the same
switch. It was built by reading `git show master:<path>` for every file in
`git diff --name-only $(git merge-base HEAD master) master -- packages`, resolving each relative import (including
`.proxy`, `registerModuleMock` and `jest.mock` specifiers) against the file's own folder, keeping those that land in an
`/adapters/` path absent on HEAD, then reading the deleted adapter and proxy from the parent of its deleting commit, the
HEAD gateway wrapper and its `.proxy.ts`, and the HEAD callers. Entries: 51 (48 high, 3 low). Master also
modified files that sit inside deleted adapter folders, which are modify/delete conflicts to resolve by taking HEAD's
deletion and porting the test: the `.proxy.ts` of add-guild, update-guild, spawn-detached and is-alive; the
request-log adapter, test and proxy (see below); and the playwright-session tests plus `key-read-layer-adapter`.

## Low confidence

| Adapter path | Why low | What to do |
|---|---|---|
| `packages/siegelense/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter` | No HEAD siegelense caller ever used the swap (its only caller is new on master). The replacement `configResolveBroker` from `@dungeonmaster/config` is what ward and orchestrator call, but its proxy stages the real broker through find and load steps, so the old `setupConfigResolved` has no one-to-one method. | Stage with `setupConfigFound` then `setupValidConfig`; keep `@dungeonmaster/config` in siegelense's dependencies. |
| `packages/siegelense/src/adapters/playwright/session/key-read-layer-adapter` | New on master, no HEAD version. The four sibling layer adapters became layer brokers in `a7b84bfbe`, so this one should follow, but nothing on HEAD shows it. | Create `brokers/browser-session/launch/key-read-layer-broker.ts` and its proxy, then check whether master's `browser-session-launch-broker.ts` imports it. |
| `packages/server/src/adapters/process/request-log/process-request-log-adapter` | Master adds it; HEAD has no equivalent and no `#gateway` wrapper to map to. | Write `brokers/process/request-log/process-request-log-broker.ts` mirroring `processDevLogBroker` (`getEnv('DUNGEONMASTER_REQUEST_LOG')`, `stdout.write`). The only caller, `server-request-log-responder`, is new on master. |
