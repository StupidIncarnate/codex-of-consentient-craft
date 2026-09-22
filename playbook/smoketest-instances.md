# Smoke Testing Dungeonmaster Runtime

This doc covers how to manually verify the three runtime scenarios work end-to-end. Intended
for LLM sessions and humans who need to check changes before merging.

---

## Scenario 1: `npm run dev` — smoke-test changes locally

```bash
npm run dev
```

No build needed first — `dev` is `tsx watch --conditions=source`, so it reads source directly.

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

## Scenario 3: A siegelense lane — a siegemaster round's isolated QA lane

Siegemaster resolves no dev-server config and owns no server of its own. Each round dispatches a
`siegemaster-verifier` and a `siegemaster-stress` minion pair, and each minion boots its OWN
throwaway lane — an API server, a Vite server, and (for a spec that asks for one) a headless
Chromium — through `dungeonmaster siegelense start`, backed by `packages/siegelense`'s
`laneBootBroker` and `playwrightSessionAdapter`. A lane never touches the prod or dev queue: the OS
picks its port pair and the instance gets its own throwaway home under the OS tmp dir
(`dm-siege-<instanceId>`), so several lanes run at once without colliding with each other or with a
running `npm run prod` / `npm run dev`. A lane closes itself once nothing drives it for the idle
window, so nobody starts, stops, or manages one by hand during a real quest.

You can stand a lane up the same way a minion does, to check the mechanism on its own:

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense start --spec dungeonmaster-stack --json
```

`dungeonmaster-stack` boots the API server, the web server and a headless Chromium;
`dungeonmaster-api` (no browser) is the faster check when a browser is not what you're after. Both
auto-detect this repo's fake Claude/ward CLI fixtures on disk, so no extra env is needed when run
from the repo root.

**Expected:**

| Thing | Value |
|---|---|
| API port / web port | OS-assigned, printed on the manifest's `apiUrl` / `baseUrl` |
| Home dir | `<os tmp dir>/dm-siege-<instanceId>` — NOT `<repo>/.dungeonmaster` or `<repo>/.dungeonmaster-dev` |
| Evidence dir | `<dungeonmaster home>/siegelense/unowned/instances/<instanceId>` (or `guilds/<guildId>/instances/<instanceId>` with `--guild`/`--quest`) — `<dungeonmaster home>` follows `DUNGEONMASTER_HOME`, else `~/.dungeonmaster` |
| Claude / ward CLI | the repo's fixture binaries, so a lane never talks to the real Claude API or a real ward run |

**Verify:**

- The manifest prints the instance id, spec, URLs, home path, evidence path, and boot time.
- Drive a step and read the result:
  ```bash
  node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> --steps '[{"step":"request","method":"GET","path":"/api/guilds"}]'
  node packages/cli/dist/bin/dungeonmaster.js siegelense results --instance <id> --run <runId>
  ```
- A second lane (`siegelense start --spec dungeonmaster-api` in another terminal) boots and drives at
  the same time without colliding — distinct ports, distinct homes.
- `node packages/cli/dist/bin/dungeonmaster.js siegelense status --instance <id>` reports it alive,
  with its own RSS and last-beat reading.
- Neither lane's home is `<repo>/.dungeonmaster` or `<repo>/.dungeonmaster-dev` — the prod and dev
  queues stay untouched throughout.
- `node packages/cli/dist/bin/dungeonmaster.js siegelense kill --instance <id>` closes the browser
  (when the spec carries one), kills every process it spawned, and removes the throwaway home — the
  evidence directory survives, since it is the run's own record.
- After teardown, `lsof -i :<apiPort>` and `lsof -i :<webPort>` (the ports the manifest printed) show
  nothing listening.

**Teardown (if a lane is left running):**

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense cleanup
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
| A siegelense lane never comes up within its boot timeout | the thrown `LaneBootFailedError` names the unready processes and each one's own log path under the instance's evidence directory |
| Zod parse error "dungeonmaster.port and devServer.port must differ" | Both fields set to the same value in `.dungeonmaster.json` — change one |
| MCP `list-quests` returns empty list when you expect dev quests | IDE-launched MCP isn't pinned to repo-local home; check `.mcp.json` bash wrapper |
| Orchestration events silent | `VERBOSE=1` missing from the launching script |

---

## Quick verification checklist

After making runtime-config changes, run:

```bash
npm run ward
grep -r "DUNGEONMASTER_ENV" packages/ scripts/ .mcp.json package.json   # expect zero code hits
grep -r "legacyProjectConfigFile" packages/                             # expect zero hits
grep -r "dungeonmaster-home" packages/ docs/ *.md                       # expect zero hits (tmp/ excluded)
```
