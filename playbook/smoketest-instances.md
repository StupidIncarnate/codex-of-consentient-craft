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

## Scenario 3: Siege lane — a siegemaster round's isolated QA lane

Siegemaster resolves no dev-server config and owns no server of its own. Each round dispatches a
`siegemaster-verifier` and a `siegemaster-stress` minion pair, and each minion boots its OWN
throwaway lane — an API server, a Vite server, and a headless Chromium — via
`packages/web/test/siege-driver/siege-driver.ts`. A lane never touches the prod or dev queue: the OS
picks its port pair (`netFreePortPairAdapter`) and it gets its own `DUNGEONMASTER_HOME` under the OS
tmp dir, so several lanes run at once without colliding with each other or with a running
`npm run prod` / `npm run dev`. A lane closes itself once nothing drives it for the idle window, so
nobody starts, stops, or manages one by hand during a real quest.

You can stand a lane up the same way a minion does, to check the mechanism on its own:

```bash
npx tsx packages/web/test/siege-driver/siege-driver.ts p1
```

**Expected:**

| Thing | Value |
|---|---|
| API port / web port | OS-assigned, printed in the manifest |
| Home dir | `<os tmp dir>/dm-siege-p1-<pid>` — NOT `<repo>/.dungeonmaster` or `<repo>/.dungeonmaster-dev` |
| Lane dir | `<repo>/tmp/siege/p1/` — carries `lane.json`, `commands/`, `results/`, `screenshots/` |
| Claude / ward CLI | fake binaries, so a lane never talks to the real Claude API or a real ward run |

**Verify:**

- The command prints `[siege] lane up` plus the manifest JSON, and `tmp/siege/p1/lane.json` on disk
  matches it.
- Drop a command file and read the result it produces:
  ```bash
  echo '{"name":"goto","target":"/","timeoutMs":30000}' > tmp/siege/p1/commands/010-goto.json
  cat tmp/siege/p1/results/010-goto.txt   # "OK", a blank line, then the JSON reading
  ```
- A second lane (`npx tsx packages/web/test/siege-driver/siege-driver.ts p2`, in another terminal)
  boots and drives at the same time without colliding — distinct ports, distinct homes, its own
  `tmp/siege/p2/` directory.
- Neither lane's home is `<repo>/.dungeonmaster` or `<repo>/.dungeonmaster-dev` — the prod and dev
  queues stay untouched throughout.
- Drop `{"name":"end"}` as the next command (or send SIGINT/SIGTERM to the process) and the lane
  closes its browser, kills both child servers, and removes its throwaway home.
- After teardown, `lsof -i :<apiPort>` and `lsof -i :<webPort>` (the ports from the printed
  manifest) show nothing listening.

**Teardown (if a lane is left running):**

```bash
pkill -f siege-driver
```

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
| A siege lane never comes up within its boot timeout | check `tmp/siege/<lane-name>/api-server.log` and `web-server.log` — the thrown error names the lane and both ready-urls |
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
