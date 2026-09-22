# Siegelense CLI Command-by-Command Walkthrough Plan

This document establishes the official command-by-command order for manually exercising, inspecting, and verifying the complete Siegelense CLI and headless browser verification fleet.

---

## Walkthrough Lifecycle Order & Complete Argument Reference

The walkthrough proceeds across three phases covering all 13 subcommands in a real lifecycle sequence:

### Phase 0: Pre-Flight Inspection & Host Baseline

1. **`siegelense docs`**
   * *Purpose*: Query the built-in role and operator documentation without booting any processes. Outputs Markdown by default.
   * *Complete Arguments*:
     * `--for <scope>` *(optional)*: Scopes documentation to a specific role (`planning`, `walking`, `attacking`, `fixing`, `driving`). With no `--for`, `docs` returns the general overview alone.
     * `--json` *(optional)*: Outputs raw JSON structure instead of formatted Markdown.
   ```bash
   dungeonmaster siegelense docs
   dungeonmaster siegelense docs --for walking
   ```

2. **`siegelense capacity`**
   * *Purpose*: Probe host system capacity (RAM, CPU, free disk space, headroom) to ensure safe instance allocation before opening pools.
   * *Complete Arguments*:
     * `--spec <specName>` *(required)*: Name of the lane spec to calculate capacity against (`dungeonmaster-stack` or `dungeonmaster-api`). Required because capacity calculation depends on spec footprint.
     * `--pool <n>` *(optional)*: Anticipated pool size to evaluate division against sample groups without averaging across different sizes.
     * `--json` *(optional)*: Outputs raw JSON structure instead of human summary.
   ```bash
   dungeonmaster siegelense capacity --spec dungeonmaster-stack
   dungeonmaster siegelense capacity --spec dungeonmaster-stack --pool 3
   ```

3. **`siegelense status`**
   * *Purpose*: Inspect the fleet state. Outputs formatted human-readable Unicode box-drawing table and system vital summary by default.
   * *Complete Arguments*:
     * `--instance <instanceId>` *(optional)*: Inspect a specific instance in full detail (metrics, logs, surviving orphans, likely cause of death if killed).
     * `--branch <name>` *(optional)*: Filter the fleet listing to instances created on a specific git branch.
     * `--since <1hr|6hr|1day|beginning>` *(optional)*: Coarse-grained time filter to show only instances created/active within the last hour, 6 hours, 1 day, or from the beginning. Defaults to `6hr` (`6h`) for the fleet listing. Pass `--since beginning` to show all instances.
     * `--json` *(optional)*: Outputs raw JSON structure instead of formatted table.
   ```bash
   dungeonmaster siegelense status
   dungeonmaster siegelense status --branch main
   dungeonmaster siegelense status --since 6hr
   dungeonmaster siegelense status --since beginning
   ```

4. **`siegelense cleanup`**
   * *Purpose*: Sweep stale instances, release abandoned ports/locks, and age out expired assets. Outputs human-readable summary by default. Always recheck `siegelense status` as a followup step to verify that swept resources and removed instances are reflected in the registry.
   * *Complete Arguments*:
     * `--json` *(optional)*: Outputs raw JSON structure instead of human summary.
   ```bash
   dungeonmaster siegelense cleanup
   dungeonmaster siegelense status
   ```

5. **`siegelense recipes`**
   * *Purpose*: Inspect the catalog of pre-packaged application state recipes and parameters. Takes no selectors because it lists the catalogue before seeding. Outputs human-readable block listing by default.
   * *Complete Arguments*:
     * `--json` *(optional)*: Outputs raw JSON structure instead of human listing.
   ```bash
   dungeonmaster siegelense recipes
   ```

6. **`siegelense profile`**
   * *Purpose*: Inspect the recorded cost and timing profile for a specific lane spec.
   * *Complete Arguments*:
     * `--spec <specName>` *(required)*: The spec name to profile (`dungeonmaster-stack` or `dungeonmaster-api`). Profile is keyed by spec content hash, so a spec name is always required.
     * `--json` *(optional)*: Outputs raw JSON structure.
   ```bash
   dungeonmaster siegelense profile --spec dungeonmaster-stack
   ```

> **Walkthrough Status**: Phase 0 concluded. Walkthrough ended at Command 6 (`profile`) with all 6 pre-flight commands verified. Phase 1 (`start`, `run`, `results`, etc.) is next.

---

### Phase 1: Boot, Execution & Evidence Querying

7. **`siegelense start`**
    * *Purpose*: Boot an isolated lane instance with an API server, a Vite dev server, and a Chromium browser.
      Automatically defaults to in-repo fixtures when running inside the monorepo. The web process is
      `npm run dev --workspace=@dungeonmaster/web`, so the browser loads unbundled ES modules — one HTTP request per
      source file on first load, plus Vite's hot-reload websocket. That request volume is expected, not a symptom.
   * *Complete Arguments*:
     * `--spec <specName>` *(required)*: The lane spec to boot (`dungeonmaster-stack` or `dungeonmaster-api`).
     * `--quest <questId>` *(optional)*: Link instance evidence to an existing quest ID.
     * `--guild <guildId>` *(optional)*: Guild ownership ID for evidence partitioning.
     * `--seed <recipeName>` *(optional)*: Pre-seed application state on boot using a declared recipe.
     * `--idle-timeout-ms <ms>` *(optional)*: Raise idle ceiling beyond the default 900,000ms (15m).
     * `--json` *(optional)*: Outputs raw JSON manifest.
   ```bash
   dungeonmaster siegelense start --spec dungeonmaster-stack
   ```

8. **`siegelense status --instance <instanceId>`**
   * *Purpose*: Confirm the instance is alive, healthy, and examine its allocated ports, URLs, and throwaway home directory.
   * *Complete Arguments*:
     * `--instance <instanceId>` *(required)*: The instance ID to inspect.
     * `--json` *(optional)*: Outputs raw JSON instance details.
   ```bash
   dungeonmaster siegelense status --instance <instanceId>
   ```

9. **`siegelense run` (Run 1: Discovery & Page Load)**
   * *Purpose*: Submit a batch of steps (`goto`, `look`, `screenshot`) to the live instance and observe the execution status index.
   * *Complete Arguments*:
     * `--instance <instanceId>` *(required)*: Target running instance ID.
     * `--steps <jsonArray>` *(required if `--steps-file` absent)*: JSON array of step objects.
     * `--steps-file <filePath>` *(required if `--steps` absent)*: Path to a file containing the JSON array of step objects.
     * `--stop-on <error|never>` *(optional)*: Whether to abort remaining steps in the batch on first error. Defaults to `error`.
     * `--json` *(optional)*: Outputs raw JSON status index.
   ```bash
   dungeonmaster siegelense run --instance <instanceId> --steps '[{"step":"goto","path":"/"},{"step":"look"},{"step":"screenshot","name":"homepage"}]'
   ```

10. **`siegelense status --instance <instanceId>` (Run 1 Followup Status Check)**
    * *Purpose*: Recheck instance status immediately following Run 1 to verify that `runs` incremented from `0` to `1`, `lastStep` recorded the final step in the batch, and instance memory/health remain stable.
    * *Complete Arguments*: Same as Command 8 (`--instance <instanceId>`).
    ```bash
    dungeonmaster siegelense status --instance <instanceId>
    ```

11. **`siegelense results` (Run 1 Evidence)**
    * *Purpose*: Query the resulting evidence off disk (step readings, element key map, screenshot metadata, console buffer).
    * *Complete Arguments*:
      * `--instance <instanceId>` *(required)*: The instance ID whose evidence is queried.
      * `--run <runId>` *(optional)*: Target run ID (e.g. `run_1`). Required unless querying timeline-wide.
      * `--step <n>` *(optional)*: Specific step index (1-based) within the run to retrieve payload for.
      * `--kind <kind>` *(optional)*: Narrows queried evidence: `console`, `network`, `ws`, `server`, `screenshots`, `steps`.
      * `--where-path <path>` *(optional)*: Filter network entries by request path substring.
      * `--where-method <method>` *(optional)*: Filter network entries by HTTP method (`GET`, `POST`, etc.).
      * `--where-nth <n>` *(optional)*: Return only the Nth matching entry.
      * `--where-level <level>` *(optional)*: Filter console/server logs by severity (`error`, `warn`, `info`, etc.).
      * `--where-steps <range>` *(optional)*: Step range filter (e.g. `4-9`).
      * `--fields <f1,f2,...>` *(optional)*: Field projection list to limit payload columns.
      * `--since <boot|step>` *(optional)*: Query buffers since boot or since run started.
      * `--json` *(optional)*: Outputs raw JSON results.
    ```bash
    dungeonmaster siegelense results --instance <instanceId> --run run_1
    dungeonmaster siegelense results --instance <instanceId> --run run_1 --kind screenshots
    dungeonmaster siegelense results --instance <instanceId> --run run_1 --step 2
    ```

12. **`siegelense snapshots`**
    * *Purpose*: Inspect any available snapshot restore points for the instance.
    * *Complete Arguments*:
      * `--instance <instanceId>` *(required)*: The instance ID whose snapshots are listed.
      * `--json` *(optional)*: Outputs raw JSON list.
    ```bash
    dungeonmaster siegelense snapshots --instance <instanceId>
    ```

13. **`siegelense run` (Run 2: Subsequent Action / Mutation)**
    * *Purpose*: Submit a second batch of steps on the same timeline (e.g. clicking or typing) to generate a second run.
    * *Complete Arguments*: Same as Command 9 (`--instance`, `--steps`, `--steps-file`, `--stop-on`).
    ```bash
    dungeonmaster siegelense run --instance <instanceId> --steps '[{"step":"look"}]'
    ```

14. **`siegelense status --instance <instanceId>` (Run 2 Followup Status Check)**
    * *Purpose*: Recheck instance status immediately following Run 2 to verify that `runs` incremented from `1` to `2` and `lastStep` reflects the second run.
    * *Complete Arguments*: Same as Command 8 (`--instance <instanceId>`).
    ```bash
    dungeonmaster siegelense status --instance <instanceId>
    ```

15. **`siegelense compare`**
    * *Purpose*: Compare the index delta between `run_1` and `run_2` across the instance timeline.
    * *Complete Arguments*:
      * `--instance <instanceId>` *(required)*: The instance ID holding both runs.
      * `--run-a <runId>` *(required)*: Baseline run ID (e.g. `run_1`).
      * `--run-b <runId>` *(required)*: Comparison run ID (e.g. `run_2`).
      * `--json` *(optional)*: Outputs raw JSON delta.
    ```bash
    dungeonmaster siegelense compare --instance <instanceId> --run-a run_1 --run-b run_2
    ```

---

### Phase 2: Teardown, Post-Mortem & Storage Management

16. **`siegelense kill`**
    * *Purpose*: Gracefully stop the running instance, release ports, and remove the throwaway home while preserving evidence.
    * *Complete Arguments*:
      * `--instance <instanceId>` *(required)*: The instance ID to terminate.
      * `--json` *(optional)*: Outputs raw JSON confirmation.
    ```bash
    dungeonmaster siegelense kill --instance <instanceId>
    ```

17. **`siegelense status --instance <instanceId>` (Post-Kill)**
    * *Purpose*: Verify the instance state transitioned to `killed` in the registry without being deleted.
    * *Complete Arguments*:
      * `--instance <instanceId>` *(required)*: The terminated instance ID.
    ```bash
    dungeonmaster siegelense status --instance <instanceId>
    ```

18. **`siegelense results` (Post-Kill Off-Disk Verification)**
    * *Purpose*: Demonstrate that evidence remains queryable off disk even after the instance has terminated.
    * *Complete Arguments*: Same as Command 11 (`--instance`, `--run`, `--kind`, etc.).
    ```bash
    dungeonmaster siegelense results --instance <instanceId> --run run_1
    ```

19. **`siegelense prune`**
    * *Purpose*: Inspect and reclaim asset space (screenshots, stored traces) from completed instances.
    * *Complete Arguments*:
      * `--instance <instanceId>` *(optional)*: Reclaim assets for a specific instance only.
      * `--kind <video|shot|transcript|log>` *(optional)*: Reclaim only one class of file. Four values, per
        `prune-asset-kind-contract.ts:18` — note the singular `shot`, not `shots`.
      * `--older-than <window>` *(optional)*: Age threshold (e.g. `7d`, `1h`). Defaults to `7d` for every kind. The
        shorter video window belongs to `cleanup`'s fixed internal sweep, not to `prune` —
        `prune-args-parse-transformer.ts:71-74` never reads `pruneStatics.window.videoOlderThan`, so
        `prune --kind video` with no `--older-than` gets 7d.
      * `--json` *(optional)*: Outputs raw JSON structure instead of human summary.
    ```bash
    dungeonmaster siegelense prune
    dungeonmaster siegelense prune --older-than 1h
    ```

20. **`siegelense cleanup`**
    * *Purpose*: Perform final fleet maintenance and reap aged entries. Outputs human-readable summary by default.
    * *Complete Arguments*: Same as Command 4 (`--json`).
    ```bash
    dungeonmaster siegelense cleanup
    ```

21. **`siegelense status` (Post-Cleanup Fleet Verification)**
    * *Purpose*: Recheck fleet status immediately following cleanup to verify that reaped instances, abandoned locks, and cleaned assets are reflected in the registry.
    * *Complete Arguments*: Same as Command 3.
    ```bash
    dungeonmaster siegelense status
    dungeonmaster siegelense status --since beginning
    ```

---

## Walkthrough Operating Protocol

1. **Strict Command-by-Command Flow**:
   * We proceed through the planned commands one at a time.
   * Every command is presented in triple-backtick ```bash blocks using `dungeonmaster siegelense <cmd>`.
   * The command is executed directly in the shell tool against the binary.
2. **No Redundant Terminal Output in Chat**:
   * **Rule**: Do NOT paste or echo back the full stdout/raw output in the assistant response. The user already sees the tool call execution and raw output in the UI.
   * The assistant response provides only the command executed, a concise operational takeaway (what state changed, what values were verified), and open items/notes.
3. **Interactive Step Gates**:
   * On each command, execution pauses for the user to ask questions, examine state, or direct follow-up actions.
   * The assistant advances to the next command **only when the user explicitly prompts: "next cmd"**.
4. **Defect Tracking & Subagent Delegation**:
   * Whenever the user mentions changes, requests tweaks, or identifies defects/discrepancies during the walkthrough, they must immediately be recorded in the Defect Ledger below.
   * Every recorded defect is delegated to a dedicated background subagent to implement and verify with scoped ward while the walkthrough proceeds without interruption.
   * **No Inline Fixes by the Walkthrough Driver**: The primary LLM running the walkthrough for the user **MUST NOT fix code or defects themselves**. Fixing things inline blocks the turn, delays responses, and significantly slows down the user's walkthrough experience. The driver's role is strictly to record the defect in the ledger, dispatch the background subagent, and keep the walkthrough moving seamlessly.

---

## Argument-Coverage Audit — Wave 1 Landed

Four read-only audits covered all 13 subcommands. Wave 1 fixed the findings below; the whole working
tree passes `npm run ward -- --uncommitted` at exit 0 across 7 packages, and each item was then driven
on the real CLI.

| Finding                                                                                                    | Resolution                                                                                                                                                                                  | Verified live                                              |
|------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| `recipes --human` declared in help, refused by parser                                                      | `--human` and `HUMAN_FLAG` removed from the help statics — the parser was right                                                                                                             | `Error: Unknown flag: --human`, exit 1                     |
| A test titled "--human is accepted for recipes" passed while a test in the same file asserted the opposite | The false positive is deleted. Its cause — a harness matching rejections against guessed patterns, one of which (`/^--human is not implemented for recipes:/u`) nothing throws — is removed | —                                                          |
| `status --help` omitted `--branch` and `--since`, both of which work                                       | Both added to synopsis and flags, with `6hr` default and `beginning` stated                                                                                                                 | `status --help` lists both                                 |
| `results --run X --since boot` documented exclusive, enforced nowhere                                      | Refused in the parser, following `runArgsParseTransformer`'s `--steps`/`--steps-file` precedent; both argv orders tested                                                                    | `Error: --run and --since are mutually exclusive…`, exit 1 |
| What that combination actually DID                                                                         | Pinned by an EDGE test: `sinceBoot` won the buffer filter so rows came from BOTH runs, while the answer still labelled `runId` with the one named — mislabelled data, not an error          | —                                                          |
| `results --kind ws` (1 of 6 enum values) untested; `--where-nth` parser-only                               | Behavioural tests added for both                                                                                                                                                            | —                                                          |
| `human` param on capacity/profile responders unreachable, 4 tests described it                             | Parameter and those 4 tests deleted                                                                                                                                                         | —                                                          |
| `humanRenderers` statics had no consumer                                                                   | Deleted after a whole-repo scan found only the declaration and its own snapshot test                                                                                                        | —                                                          |
| `siegelense-flow.ts:18-20` documented a `--human` gate absent from the function                            | PURPOSE rewritten to state that each args-parse transformer owns its own `KNOWN_FLAGS`                                                                                                      | —                                                          |

### Still open from the audit

| Item                                                                                             | Why it matters                                                                                                                                               |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `start`, `run`, `kill`, `capacity`, `prune` have NO flow-level argv test                         | 5 of 13. `prune` deletes files. This is what DEF-20 closes structurally.                                                                                     |
| `capacity --spec <unknown>` refusal never reached                                                | `capacity-read-broker.proxy.ts:9-13` mocks `profileReadBroker`, the call that hits the real check. `profile` has the identical requirement with a real test. |
| `capacity --pool` omitted                                                                        | The `poolSize ?? ceiling` fallback has no broker-level test passing `null`.                                                                                  |
| `prune --kind video/transcript/log` filtering                                                    | Only `shot` is proven to filter. `video`'s sole exerciser is `cleanup`'s fixed query — a different code path.                                                |
| `prune --kind video` with no `--older-than`                                                      | Resolves to 7d, not the 2d the docs claimed. Untested either way.                                                                                            |
| `start --seed` above `recipeSeedRunBroker`                                                       | Every test at `instanceStartBroker` and above passes `seed: null`; the proxy says so at `instance-start-broker.proxy.ts:177-179`.                            |
| `start --quest` alone / `--guild` alone                                                          | Only "neither" and "both" are covered.                                                                                                                       |
| `docs --for` — 6 of 7 scopes not driven through argv                                             | Content is well tested one layer down; only the CLI wiring is thin.                                                                                          |
| `snapshots` populated list not driven through argv                                               | Only the empty and unknown cases reach the real flow.                                                                                                        |
| **DEF-25** `siegelenseHelpStatics.calls.status.output` still reads "One JSON document on stdout" | Stale since DEF-03/DEF-09 made the table the default. Check every call's `output` line for the same rot.                                                     |

---

## Defects & Subagent Assignment Ledger

| Defect #   | Command                                 | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Assignee                                                                              | Status                                                                                                                                                                                                                                                                                                                                                                                  |
|------------|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **DEF-01** | `siegelense docs`                       | Docs output should be formatted as clean Markdown rather than raw JSON by default (preserving `--json` for JSON). Also resolve stale "NOT BUILT YET" annotations for `request`, `file`, and `storage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Subagent (`Docs Markdown Formatter`)                                                  | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-02** | `siegelense start`                      | `start` requires explicit `CLAUDE_CLI_PATH` and `WARD_CLI_PATH` environment variables instead of automatically defaulting to the repo's committed test fixtures when run within the repository.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Subagent (`Start In-Repo Fixture Defaults`)                                           | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-03** | `siegelense status`                     | `status` outputs JSON by default instead of the human-readable table/text format. Should output table and text format by default, reserving `--json` for JSON output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Subagent (`Status Table Formatter`)                                                   | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-04** | `siegelense status` & registry          | Record git `branch` on each instance `RegistryEntry` at reserve/start. Add filtering to `status`: `--branch <name>` and coarse time window `--since <1hr                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 6hr                                                                                   | 1day>` (strictly restricted to 1hr, 6hr, 1day to prevent granular abuse). Display branch in status table.                                                                                                                                                                                                                                                                               | Subagent (`Status Branch and Time Filter`) | **Completed** ✅ |
| **DEF-05** | `siegelense docs`                       | Rewrite all documentation verbiage across all 7 scopes in `docs-statics.ts` into clear, plain, readable English (eliminating dense/cryptic shorthand while preserving all rules, commands, and guidance).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Subagent (`Docs Plain English Rewriter`)                                              | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-06** | `siegelense docs`                       | Make `--for <scope>` **required** instead of optional. Running `siegelense docs` without `--for` must refuse and list the 7 available scopes to prevent dumping all roles and flooding context.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Subagent (`Docs For Required Subagent`)                                               | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-07** | `siegelense` lane specs                 | Rename lane specs from `dungeonmaster-web` to `dungeonmaster-stack` and `dungeonmaster-headless` to `dungeonmaster-api`. Update all contracts, statics, docs, error messages, and tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Subagent (`Spec Renamer Subagent`)                                                    | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-08** | `siegelense status` & bare fleet tables | Render all human table displays using clean Unicode box-drawing borders (`┌─┬─┐`, `│`, `├─┼─┤`, `└─┴─┘`) with dynamically aligned column widths instead of unaligned tabs or naive spaces.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Subagent (`Box Table Display Formatter`)                                              | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-09** | All commands (`siegelense *`)           | Universal Human-First Output: All commands output token-efficient human-readable views by default. Eliminate `--human` flag everywhere; use only `--json` for explicit raw JSON output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Subagents (4 parts across all subcommands)                                            | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-10** | `siegelense status`                     | Status should default to filtering to the last 6 hours (`--since 6hr`) on the fleet listing instead of unbounded history. Viewing all historical instances requires explicitly passing `--since beginning`. Update contracts, transformers, brokers, responders, and tests.                                                                                                                                                                                                                                                                                                                                                                                                                    | Subagent (`Status Since Default and Beginning Option`)                                | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-11** | `siegelense recipes`                    | `recipes` still defaults to JSON output and still expects `--human`. Align with DEF-09 standard: output human text view by default (`recipesAnswerRenderTransformer`), eliminate `--human` flag, and only output JSON when `--json` is explicitly passed.                                                                                                                                                                                                                                                                                                                                                                                                                                      | Subagent (`Recipes Human View Default`)                                               | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-12** | `siegelense recipes` / packages         | Delete orphaned `packages/siegelense-recipes/` directory. Update `../packages/siegelense` (`recipeLocationStatics`, location brokers, error messages, and tests) to point to `packages/hydration-recipes` (`@dungeonmaster/hydration-recipes`).                                                                                                                                                                                                                                                                                                                                                                                                                                                | Subagent (`Hydration Recipes Rename Cleanup`)                                         | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-13** | `siegelense capacity`                   | `capacity` needs to require `--spec <specName>` instead of allowing a bare invocation. Refuse when `--spec` is omitted with an informative error listing known lane specs and USAGE.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Subagent (`Capacity Require Spec Subagent`)                                           | **Completed** ✅                                                                                                                                                                                                                                                                                                                                                                        |
| **DEF-14** | `siegelense start`                      | `start` prints `API: -` though the registry holds the allocated api port. Observed on `inst_1c60cf225b13465d8b32449607d69529`: registry `"ports": {"api": 37895, "web": 41385}`, and `curl localhost:37895/api/guilds` returned 200. The renderer already supports the field — `start-answer-render-transformer.test.ts:119` asserts a filled `API:` line — so the manifest is dropping the value.                                                                                                                                                                                                                                                                                             | Subagent (`Start Manifest Api Url`)                                                   | **Completed** ✅ — `instance-start-broker.ts` never set `apiUrl`; contract had it `.optional()` so the omission parsed silently. Now renders `API: http://dungeonmaster.localhost:37895`. Needs a rebuild before the CLI shows it.                                                                                                                                                      |
| **DEF-15** | `siegelense start` / lane spec          | The lane's WEB process runs plain `dev`, so Vite keeps hot reload and its file watcher on. With `vite.config.ts:33`'s `conditions: ['source']`, the watcher's reach spans `packages/*/src/**`, so an edit during a live walkthrough reloads the page under the operator. `vite.config.ts:20-27` documents `dev:no-watch` as existing for exactly this case, and the lane does not use it. Switch `WEB_PROCESS` to `dev:no-watch`, matching what `API_PROCESS` already does. `packages/web/test/siege-driver/siege-lane.ts:118` carries the same gap.                                                                                                                                           | Subagent (`Lane Web No Watch`)                                                        | **Completed** ✅ — `WEB_PROCESS` now runs `dev:no-watch`; same fix applied to `siege-lane.ts:118`. Needs a rebuild before a lane picks it up.                                                                                                                                                                                                                                           |
| **DEF-16** | `siegelense start --seed`               | `--seed` fails for EVERY recipe with a raw Zod dump and exit 1. `seedResultContract` is `z.record(contentText, contentText)` (string→string), but `recipesSeedRunBroker` returns `HydrationRunResult` keyed by the recipe's binding names with OBJECT values — its own USAGE comment at `recipes-seed-run-broker.ts:8` states this. Observed: `--seed guild-empty` → one error on `guild`; `--seed guild-with-three-quests` → four, on `guild`/`questCreated`/`questInProgress`/`questComplete`. Failure path tears down cleanly (both attempts `killed`, 0 orphans).                                                                                                                          | Subagent (`Seed Result Contract Seam`)                                                | **Dispatched** 🔄                                                                                                                                                                                                                                                                                                                                                                       |
| **DEF-17** | test coverage across the recipes seam   | The DEF-16 bug was invisible because every test on the siegelense side mocks the recipes boundary with a shape the real producer never emits. `seed-result.stub.ts:8-10` invents flat strings; `recipe-seed-run-broker.test.ts:21-30` stages `{apiBaseUrl, guild, questIds}` and asserts the flat output. Producer has integration tests, consumer has unit tests, NOTHING crosses the seam — siegelense has no `*.integration.test.ts` under any seed path. Needs a real cross-package integration test that runs an actual recipe.                                                                                                                                                           | Folded into DEF-16                                                                    | **Dispatched** 🔄                                                                                                                                                                                                                                                                                                                                                                       |
| **DEF-18** | all `siegelense` subcommands            | Audit whether every documented flag on every subcommand is actually exercised by a test that crosses its real boundary, rather than asserting against a stub of the author's own invention. `--seed` was documented, shipped, and 100% broken. Scope: the 13 subcommands and their full argument surface as listed in this plan's Phase 0-2 sections.                                                                                                                                                                                                                                                                                                                                          | Subagent (`Siegelense Arg Coverage Audit`)                                            | **Pending** — dispatch after DEF-16 clears `packages/siegelense`                                                                                                                                                                                                                                                                                                                        |
| **DEF-19** | `flows/` folder type + testing standard | A flow collapsing every route into one map or switch is legal under the current rules, and no rule requires an entry point's arguments to be covered. Set `folderConfigStatics.flows.allowsLayerFiles` to `true` (keeping `folderDepth: 1`, matching `widgets`), then document: one flow file per entry point; the root `-flow.ts` routes and nothing else; a layer flow owns one entry point and its whole argument surface; each layer flow carries its own `.integration.test.ts`. Testing side: every documented argument needs a test that reaches the BEHAVIOUR it selects, and a boundary-crossing argument needs an integration test rather than a mock of the author's own invention. | Subagent (`Flows One File Per Route`) — worktree `worktrees/flows-one-file-per-route` | **Dispatched** 🔄                                                                                                                                                                                                                                                                                                                                                                       |
| **DEF-20** | `siegelense-flow.ts`                    | Apply DEF-19's standard here: split the 13-entry `CALL_ROUTES` map at `siegelense-flow.ts:87-117` into one layer flow per subcommand, each with its own integration test covering that subcommand's full argument surface.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Subagent (`Siegelense Flow Split`)                                                    | **Pending** — needs DEF-19 landed and DEF-16 clear of `packages/siegelense`                                                                                                                                                                                                                                                                                                             |
| **DEF-21** | `guild-with-three-quests` recipe        | The recipe promises "one created, one in_progress, and one complete" and sets all three via `setRaw` (`recipes-guild-with-three-quests-broker.ts:28/32/36`). A real `--seed` run writes all three quest files as `status: created` — verified on disk under the instance home, not just in the returned record. `title` from the SAME `setRaw` calls lands correctly, so status alone is dropped. The recipe's own integration test asserts the three statuses at lines 58-72 and PASSES. Leading hypothesis: the test runs a write-route target while the CLI passes `apiBaseUrl`, and `routeSelectTransformer` then prefers the api route, which mints `created` and ignores the raw status. | Subagent (`Recipe Quest Status Route`)                                                | **Dispatched** 🔄                                                                                                                                                                                                                                                                                                                                                                       |
| **DEF-22** | `siegelense start --seed`               | The `SEEDED:` line prints every saved row whole. `guild-with-three-quests` emits thousands of characters of quest JSON on the default human view, against DEF-09's token-efficient-by-default standard and this package's own "`run` returns a status; `results` returns payloads" rule. Render a summary per binding (name, id, and the one or two fields that identify the row); keep the full payload behind `--json`.                                                                                                                                                                                                                                                                      | Subagent (`Seeded Line Summary Render`)                                               | **Completed** ✅ — verified live: `guild: 95d26514-… (name: Guild 1, urlSlug: guild-1)`                                                                                                                                                                                                                                                                                                 |
| **DEF-23** | `guild-with-three-quests` recipe        | With DEF-21's routing fixed, the recipe now fails loudly instead of silently writing `created`: `could not reach "flows_approved" — Missing required content for transition to flows_approved`. Its `in_progress` and `complete` quests carry no flow/observable gate content, so the walk cannot legitimately complete. The recipe must seed that content to deliver what its description promises. `seedFixtureStatics.quest` in `hydration-recipes` already models the shape.                                                                                                                                                                                                               | Subagent (`Recipe Gate Content Seed`)                                                 | **Dispatched** 🔄                                                                                                                                                                                                                                                                                                                                                                       |
| **DEF-24** | seed error message                      | The failure renders as `ingredient "quest"'s "api" route refused the connection with no URL known: …`. No connection was refused and a URL was known — the real cause is the transition gate named later in the same string. The wrapper sends a reader to debug networking for a data problem. Render the wrapper from the actual failure kind.                                                                                                                                                                                                                                                                                                                                               | Subagent (`Seed Route Error Wrapper`)                                                 | **Queued** ⏸ — cause found: `hydration/src/errors/hydration-route-failed/hydration-route-failed-error.ts:50-52` hard-codes "refused the connection" for every route failure, varying only on whether a URL is known. Fixing it changes text asserted in `hydration-recipes/.../recipes-seed-run-broker.integration.test.ts:150`, which DEF-23's agent holds. Dispatch when that clears. |

---
