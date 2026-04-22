# Smoke Testing Dungeonmaster Runtime

This doc covers how to manually verify the three runtime scenarios work end-to-end. Intended
for LLM sessions and humans who need to check changes before merging.

---

## Scenario 1: `npm run dev` — smoke-test changes locally

```bash
npm run build
npm run dev
```

**Expected:**

| Thing | Value |
|---|---|
| Server port | `devServer.port` from `.dungeonmaster.json` (currently 4750) |
| Web port | `devServer.port + 1` (currently 4751) |
| Home dir | `<repo>/.dungeonmaster-dev/` |
| Log lines | `[dev]` prefix on orchestration events (VERBOSE=1 is set by the script) |

**Verify:**

- `<repo>/.dungeonmaster-dev/` is created and populated with `guilds/` when you add a guild.
- `<repo>/.dungeonmaster/` (prod queue) is NOT written to.
- `~/.dungeonmaster` is untouched.
- Browser at `http://dungeonmaster.localhost:4751` loads the web UI.

**Teardown:**

```bash
npm run dev:kill
```

---

## Scenario 2: `npm run prod` — run the real orchestrator against your prod quest queue

```bash
npm run build
npm run prod
```

**Expected:**

| Thing | Value |
|---|---|
| Server port | `dungeonmaster.port` from `.dungeonmaster.json` (currently 4800) |
| Web port | `dungeonmaster.port + 1` (currently 4801) |
| Home dir | `<repo>/.dungeonmaster/` (colocated in the tree so Claude Code Read/Grep can access quest files) |
| Log lines | `[dev]` prefix on orchestration events (VERBOSE=1 is set by the script) |

**Verify:**

- `<repo>/.dungeonmaster/` is populated with `guilds/` and `event-outbox.jsonl`.
- `<repo>/.dungeonmaster-dev/` (smoke-test queue from scenario 1) is NOT written to.
- `~/.dungeonmaster` is untouched.
- A test quest created during dev in scenario 1 does NOT appear in the prod web UI.

**Teardown:**

```bash
npm run prod:kill
```

---

## Scenario 3: Dogfood siege — orchestrator runs quest that spawns dev server

This is the most complex flow. Prerequisite: `npm run prod` is running; a quest is
queued up that will reach siegemaster (must have a siege work item with a flow
reference).

**Expected child-process behavior when siege fires:**

- Siegemaster reads `.dungeonmaster.json` → resolves `devServer.port` = 4750.
- `devServerStartBroker` kills any stale processes on 4750 and 4751.
- Spawns `npm run dev` as a child.
- Child inherits parent env (`DUNGEONMASTER_HOME=<repo>/.dungeonmaster`), but npm's
  script-inline env (`VAR=val cmd` via `sh -c`) overrides — child ends up with
  `DUNGEONMASTER_HOME=<repo>/.dungeonmaster-dev` and `DUNGEONMASTER_PORT=4750`.
- Child server binds to 4750, writes quest/guild data to `<repo>/.dungeonmaster-dev/`.
- Siegemaster agent runs its verification against `http://dungeonmaster.localhost:4750`.
- On agent complete/failed, `devServerStopBroker` sends SIGTERM (then SIGKILL after 5s).

**Env-inheritance sanity check:** add a temporary `console.error('CHILD_HOME=',
process.env.DUNGEONMASTER_HOME)` at the top of `packages/server/bin/server-entry.ts`.
Run the scenario. The log should print `CHILD_HOME= <repo>/.dungeonmaster-dev`, NOT
`<repo>/.dungeonmaster`. If it shows the prod path, the inline env override isn't
flowing through — probably because `childProcessSpawnAdapter` is bypassing the shell.
In that case, siegemaster needs to explicitly strip `DUNGEONMASTER_HOME` from the
child's env via `{ env: { ...process.env, DUNGEONMASTER_HOME: undefined } }` and rely on
the dev script's inline set alone.

**Verify:**

- `<repo>/.dungeonmaster-dev/` picks up the child's activity; `<repo>/.dungeonmaster/`
  (the parent's prod queue) does NOT.
- No orphaned dev server on port 4750 after the quest completes (run `lsof -i :4750`).
- Parent orchestrator on 4800 keeps running throughout.

---

## Scenario 4: Published binary in another repo

```bash
# in dungeonmaster repo
npm pack

# in a fresh target repo
npm install /path/to/dungeonmaster-*.tgz
dungeonmaster start
```

**Expected:**

| Thing | Value |
|---|---|
| Server port | `dungeonmaster.port` from target repo's `.dungeonmaster.json`, else 3737 |
| Home dir | `~/.dungeonmaster` (user-global, shared across every repo the user runs from) |
| Log lines | Silent — `VERBOSE` is not set by the published binary |

**Verify:**

- `~/.dungeonmaster/` is created on first run.
- `cd` to a DIFFERENT repo and run `dungeonmaster start` — quests added from the first
  repo are visible (shared queue).
- No `.dungeonmaster/` or `.dungeonmaster-dev/` directories appear in the target repo.

**No-args form** also works: `dungeonmaster` (without `start`) aliases to the same
behavior.

---

## Common failure modes

| Symptom | Likely cause |
|---|---|
| Server starts on 3737 instead of 4800/4750 | `.dungeonmaster.json` missing or `dungeonmaster.port` not set |
| "Killed existing dev instances on ports 3737 and 3738" in `npm run dev:kill` | `.dungeonmaster.json` missing `devServer.port`; `node -e` returned `undefined`, NaN coerced |
| Siege child writes to `<repo>/.dungeonmaster` instead of `.dungeonmaster-dev` | npm script-inline env didn't override; see Scenario 3 env check above |
| Zod parse error "dungeonmaster.port and devServer.port must differ" | Both fields set to the same value in `.dungeonmaster.json` — change one |
| MCP `list-quests` returns empty list when you expect dev quests | IDE-launched MCP isn't pinned to repo-local home; check `.mcp.json` bash wrapper |
| Orchestration events silent | `VERBOSE=1` missing from the launching script |

---

## Quick verification checklist

After making runtime-config changes, run:

```bash
npm run build
npm run ward
grep -r "DUNGEONMASTER_ENV" packages/ scripts/ .mcp.json package.json   # expect zero code hits
grep -r "legacyProjectConfigFile" packages/                             # expect zero hits
grep -r "dungeonmaster-home" packages/ docs/ *.md                       # expect zero hits (tmp/ excluded)
```
