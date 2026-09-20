# Siegelense CLI Command-by-Command Walkthrough Plan

This document establishes the official command-by-command order for manually exercising, inspecting, and verifying the complete Siegelense CLI and headless browser verification fleet.

---

## Walkthrough Lifecycle Order & Complete Argument Reference

The walkthrough proceeds across three phases covering all 13 subcommands in a real lifecycle sequence:

### Phase 0: Pre-Flight Inspection & Host Baseline

1. **`siegelense docs`**
   * *Purpose*: Query the built-in role and operator documentation without booting any processes. Outputs Markdown by default.
   * *Complete Arguments*:
     * `--for <scope>` *(required)*: Scopes documentation to a specific role (`operating`, `planning`, `walking`, `attacking`, `fixing`, `driving`, `operational`). Required to prevent context flooding.
     * `--json` *(optional)*: Outputs raw JSON structure instead of formatted Markdown.
   ```bash
   dungeonmaster siegelense docs --for operating
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
   * *Purpose*: Boot an isolated lane instance with an API server, Vite preview server, and Chromium browser. Automatically defaults to in-repo fixtures when running inside the monorepo.
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
      * `--kind <shots|video>` *(optional)*: Reclaim only screenshots or video screencasts.
      * `--older-than <window>` *(optional)*: Age threshold (e.g. `7d`, `2d`, `1h`). Defaults to `7d` (or `2d` for video).
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

## Defects & Subagent Assignment Ledger

| Defect #   | Command                                 | Summary                                                                                                                                                                                                                                                                     | Assignee                                               | Status                                                                                                    |
|------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| **DEF-01** | `siegelense docs`                       | Docs output should be formatted as clean Markdown rather than raw JSON by default (preserving `--json` for JSON). Also resolve stale "NOT BUILT YET" annotations for `request`, `file`, and `storage`.                                                                      | Subagent (`Docs Markdown Formatter`)                   | **Completed** ✅                                                                                          |
| **DEF-02** | `siegelense start`                      | `start` requires explicit `CLAUDE_CLI_PATH` and `WARD_CLI_PATH` environment variables instead of automatically defaulting to the repo's committed test fixtures when run within the repository.                                                                             | Subagent (`Start In-Repo Fixture Defaults`)            | **Completed** ✅                                                                                          |
| **DEF-03** | `siegelense status`                     | `status` outputs JSON by default instead of the human-readable table/text format. Should output table and text format by default, reserving `--json` for JSON output.                                                                                                       | Subagent (`Status Table Formatter`)                    | **Completed** ✅                                                                                          |
| **DEF-04** | `siegelense status` & registry          | Record git `branch` on each instance `RegistryEntry` at reserve/start. Add filtering to `status`: `--branch <name>` and coarse time window `--since <1hr                                                                                                                    | 6hr                                                    | 1day>` (strictly restricted to 1hr, 6hr, 1day to prevent granular abuse). Display branch in status table. | Subagent (`Status Branch and Time Filter`) | **Completed** ✅ |
| **DEF-05** | `siegelense docs`                       | Rewrite all documentation verbiage across all 7 scopes in `docs-statics.ts` into clear, plain, readable English (eliminating dense/cryptic shorthand while preserving all rules, commands, and guidance).                                                                   | Subagent (`Docs Plain English Rewriter`)               | **Completed** ✅                                                                                          |
| **DEF-06** | `siegelense docs`                       | Make `--for <scope>` **required** instead of optional. Running `siegelense docs` without `--for` must refuse and list the 7 available scopes to prevent dumping all roles and flooding context.                                                                             | Subagent (`Docs For Required Subagent`)                | **Completed** ✅                                                                                          |
| **DEF-07** | `siegelense` lane specs                 | Rename lane specs from `dungeonmaster-web` to `dungeonmaster-stack` and `dungeonmaster-headless` to `dungeonmaster-api`. Update all contracts, statics, docs, error messages, and tests.                                                                                    | Subagent (`Spec Renamer Subagent`)                     | **Completed** ✅                                                                                          |
| **DEF-08** | `siegelense status` & bare fleet tables | Render all human table displays using clean Unicode box-drawing borders (`┌─┬─┐`, `│`, `├─┼─┤`, `└─┴─┘`) with dynamically aligned column widths instead of unaligned tabs or naive spaces.                                                                                  | Subagent (`Box Table Display Formatter`)               | **Completed** ✅                                                                                          |
| **DEF-09** | All commands (`siegelense *`)           | Universal Human-First Output: All commands output token-efficient human-readable views by default. Eliminate `--human` flag everywhere; use only `--json` for explicit raw JSON output.                                                                                     | Subagents (4 parts across all subcommands)             | **Completed** ✅                                                                                          |
| **DEF-10** | `siegelense status`                     | Status should default to filtering to the last 6 hours (`--since 6hr`) on the fleet listing instead of unbounded history. Viewing all historical instances requires explicitly passing `--since beginning`. Update contracts, transformers, brokers, responders, and tests. | Subagent (`Status Since Default and Beginning Option`) | **Completed** ✅                                                                                          |
| **DEF-11** | `siegelense recipes`                    | `recipes` still defaults to JSON output and still expects `--human`. Align with DEF-09 standard: output human text view by default (`recipesAnswerRenderTransformer`), eliminate `--human` flag, and only output JSON when `--json` is explicitly passed.                   | Subagent (`Recipes Human View Default`)                | **Completed** ✅                                                                                          |
| **DEF-12** | `siegelense recipes` / packages         | Delete orphaned `packages/siegelense-recipes/` directory. Update `../packages/siegelense` (`recipeLocationStatics`, location brokers, error messages, and tests) to point to `packages/hydration-recipes` (`@dungeonmaster/hydration-recipes`).                             | Subagent (`Hydration Recipes Rename Cleanup`)          | **Completed** ✅                                                                                          |
| **DEF-13** | `siegelense capacity`                   | `capacity` needs to require `--spec <specName>` instead of allowing a bare invocation. Refuse when `--spec` is omitted with an informative error listing known lane specs and USAGE.                                                                                        | Subagent (`Capacity Require Spec Subagent`)            | **Completed** ✅                                                                                          |

---
