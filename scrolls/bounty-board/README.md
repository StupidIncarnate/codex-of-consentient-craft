# Bounty board

Every known change this repo still owes lives here, one file per bounty. There are two kinds:

| Kind | What it is |
|---|---|
| `defect` | Something wrong today: a bug, a wrong message, dead code, stale teaching text, a missing test that lets a real bug through |
| `change` | Something nobody has built yet and nothing is wrong meanwhile: a new doc, a tool improvement, a planned rule |

A large plan with its own design stays in its plan document. Its open pieces get a bounty here that
links back to it.

## How this folder works

- **One file per bounty**, in the folder named for the package it lives in: `siegelense/`, `web/`,
  `orchestrator/`, and so on. A bounty that spans packages goes in `cross-cutting/`.
- **File name:** `<ID>-<short-slug>.md`, for example `siegelense/DEF-042-status-since-1wk.md`.
- **IDs are kept from the list the bounty came from.** `DEF-NN` came from the walkthrough ledger,
  `FNN` from the brands-and-gateways epic. A new defect takes the next free `DEF` number, and a new
  change takes the next free `CHG` number.
- **A finished bounty's file is deleted** in the commit that finishes it, and its row leaves the
  index. Git history keeps both.
- **A declined bounty's file is deleted too**, and one line goes under "Declined" below, so nobody
  raises it again.
- **Longer context stays where it was written.** A file links to the original doc's section when that
  doc holds more than the file needs to repeat.

Next free numbers: **DEF-268** and **CHG-5**.

## Status values

| Status | Meaning |
|---|---|
| `ready` | Anyone can pick it up. The file says what to change |
| `needs decision` | The user must choose before anyone works on it. The file names the choice |
| `suspected` | Found by reading code, never seen on a real surface. Confirm it, then change the status, or delete the file |
| `blocked` | Waiting on something named in the file |

## Template

```markdown
# <ID>: <one line saying what is wrong, or what to build>

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-022 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

<For a defect: what someone sees, with the exact command, output or file:line.
For a change, name this section "What to build".>

## What should happen

<The expected behaviour, and any rule the user set for it.>

## Where to look

<Files and lines. Check them first: line numbers drift.>

## History

<Partial fixes with their SHAs, decisions and who made them, and links to longer context.>
```

## Declined

| ID | What was asked | The user's decision |
|---|---|---|
| DEF-164 | The green `EXECUTION COMPLETE` banner shows above a `FAILED` row | 2026-09-30: no change. The banner reflects the quest's status only, and a failed row that a later retry fixed stays plain `FAILED` |
| DEF-208 | Confirm whether a step split into pieces shows nested rows or a flat list in the execution view | 2026-09-30: nested, as it ships today. No change |

## Index

Sorted by package, then ID.

| ID | Package | Kind | Bounty | Status |
|---|---|---|---|---|
| [DEF-233](cli/DEF-233-cli-install-test-slow-under-load.md) | cli | defect | ward slow-test gate flags the cli install integration test under full-suite load | suspected |
| [DEF-234](cli/DEF-234-init-looks-for-packages-in-wrong-place-in-consumer.md) | cli | defect | dungeonmaster init in a consumer may look for dungeonmaster's packages in the wrong directory | suspected |
| [DEF-231](config/DEF-231-config-knobs-never-read.md) | config | defect | three config knobs are defined and validated but nothing reads them | ready |
| [DEF-59](cross-cutting/DEF-059-recipes-inputs-and-returns.md) | cross-cutting | defect | `recipes` does not list input meanings or returned fields, so an agent cannot chain seeds | ready |
| [DEF-200](cross-cutting/DEF-200-unreadable-quests-retired-signoff-keys.md) | cross-cutting | defect | Three quests show UNREADABLE because their flow nodes carry sign-off keys the strict contract no longer knows | ready |
| [DEF-262](cross-cutting/DEF-262-testing-and-shared-claude-md-stale-adapter-sections.md) | cross-cutting | defect | `testing` and `shared` CLAUDE.md files keep whole sections about adapters | ready |
| [DEF-263](cross-cutting/DEF-263-claude-md-files-name-deleted-adapters.md) | cross-cutting | defect | Several CLAUDE.md files still name adapters by their old names | ready |
| [F63](cross-cutting/F063-bump-repo-jest.md) | cross-cutting | defect | the repo pins jest 30.2.0, which grades tests differently from consumers | ready |
| [F106](cross-cutting/F106-slow-test-file-flags.md) | cross-cutting | defect | slow test files and load timeouts recorded in whole-repo runs | ready |
| [F127](cross-cutting/F127-b11-keeper-table-departures.md) | cross-cutting | defect | two R9 renames depart from B11's keeper table | ready |
| [F128](cross-cutting/F128-bigbang-leftovers-files.md) | cross-cutting | defect | big-bang leftovers files are not worked | ready |
| [DEF-261](eslint-plugin/DEF-261-eslint-plugin-claude-md-teaches-adapters.md) | eslint-plugin | defect | eslint-plugin CLAUDE.md files teach adapter mocking, `beforeEach` and `calledWith([])` | ready |
| [DEF-266](eslint-plugin/DEF-266-dead-adapters-branches-and-stale-rule-comments.md) | eslint-plugin | defect | Lint code keeps dead `/adapters/` branches, and config comments say on-rules are off | ready |
| [F100](eslint-plugin/F100-owner-field-reuse-object-and-enum-copy-checks.md) | eslint-plugin | change | `enforce-owner-field-reuse` has no nested-object copy check and no inline-enum copy check | ready |
| [F105](eslint-plugin/F105-eslint-config-load-cost.md) | eslint-plugin | defect | loading `eslint.config.js` costs about 5 seconds per process | ready |
| [F119](eslint-plugin/F119-r7-ignores-layer-contracts.md) | eslint-plugin | defect | R7 grades neither unbranded leaves in layer contracts nor non-contract files importing a layer | ready |
| [DEF-232](gateway/DEF-232-gateway-folder-list-copies.md) | gateway | defect | the four gateway folder names are still hand-kept in every workspace package.json imports field | suspected |
| [DEF-235](gateway/DEF-235-gateway-copies-never-run-inside-a-consumer.md) | gateway | defect | the node and browser gateway copies init writes have never had typecheck, tests or build run in a consumer | ready |
| [DEF-237](gateway/DEF-237-gateway-purpose-comments-describe-the-build.md) | gateway | defect | PURPOSE headers in packages/@gateway describe the build that made them, not the file | ready |
| [DEF-267](gateway/DEF-267-is-port-free-proxy-no-read-back.md) | gateway | defect | The `is-port-free` gateway proxy cannot show what it was called with | ready |
| [DEF-133](hydration/DEF-133-duplicate-guild-name-seed.md) | hydration | defect | A second `guild-empty` seed still shows the name `Guild 1` twice | ready |
| [DEF-209](hydration/DEF-209-attach-has-no-cli-or-recipe-surface.md) | hydration | change | The `attach` hydration verb is reachable only from a Jest test | suspected |
| [F116](hydration/F116-hydration-run-state-z-custom-unknown.md) | hydration | defect | hydration run-state map values are `z.custom<unknown>()`, which is `z.unknown()` renamed | ready |
| [DEF-71](hydration-recipes/DEF-071-http-failure-url-one-place.md) | hydration-recipes | defect | The "no URL known" transport error is fixed per caller, not in one place | ready |
| [DEF-218](hydration-recipes/DEF-218-quest-completed-work-items-lack-related-data-items.md) | hydration-recipes | defect | `quest-completed` seeds work items with no `relatedDataItems` link back to their operations | suspected |
| [DEF-230](hydration-recipes/DEF-230-write-routes-escape-target-home.md) | hydration-recipes | defect | quest update, reach and operation write routes read the global DUNGEONMASTER_HOME, not the target's home | ready |
| [CHG-1](mcp/CHG-1-gateway-folder-type-doc.md) | mcp | change | Write a `gateway` folder-type doc for `get-folder-detail` | ready |
| [DEF-210](mcp/DEF-210-mcp-json-stale-and-init-never-updates-it.md) | mcp | defect | `dungeonmaster init` never rewrites an existing `dungeonmaster` entry in `.mcp.json`, so this repo's copy is stale | ready |
| [DEF-217](mcp/DEF-217-served-docs-tell-agents-to-grep-r.md) | mcp | defect | Two served docs tell agents to run `grep -r ... packages/*/dist/`, which this repo's hook blocks | suspected |
| [CHG-4](orchestrator/CHG-4-plan-names-test-data-setup.md) | orchestrator | change | A plan names how each browser test gets its data (plan check 19) | ready |
| [DEF-201](orchestrator/DEF-201-close-out-repair-no-done-route-untested.md) | orchestrator | defect | The shared `CLOSE_OUT.repair` step declares no `done` route and no test drives it | suspected |
| [DEF-202](orchestrator/DEF-202-orcha-handoff-stale.md) | orchestrator | defect | `scrolls/orcha-changes/HANDOFF.md` says work is owed that is already done | ready |
| [DEF-215](orchestrator/DEF-215-next-action-indexes-agent-flow-loosely.md) | orchestrator | defect | `nextActionTransformer` indexes `agentFlowStatics` with loosely typed parameters | suspected |
| [F30](orchestrator/F030-orchestrator-tests-as-never-casts.md) | orchestrator | defect | orchestrator test files lean on `as never` casts | ready |
| [DEF-78](server/DEF-078-guild-responders-match-error-text.md) | server | defect | Guild responders spot a duplicate path by matching the error text | ready |
| [DEF-260](server/DEF-260-server-claude-md-teaches-adapters.md) | server | defect | `packages/server/CLAUDE.md` teaches adapters that no longer exist | ready |
| [F120](server/F120-ward-detail-catch-all-in-responder-result.md) | server | defect | `wardDetailContract` is the loose last union member, so any object that fails the others passes as ward detail | ready |
| [F126](server/F126-server-process-id-own-brands.md) | server | defect | server response-data `processId` and `chatProcessId` carry their own brands | ready |
| [F132](server/F132-guild-responder-proxies-invent-failures.md) | server | defect | two guild responder proxies hand-make failures, and `ban-invented-failures` scans 0 of them | ready |
| [DEF-204](session-forensics/DEF-204-quest-find-no-cwd-walk-up.md) | session-forensics | defect | Run from a package subdirectory, `session-forensics` does not find the quest and prints blank | ready |
| [DEF-205](session-forensics/DEF-205-empty-target-dumps-raw-zod.md) | session-forensics | defect | An empty-string target skips the usage text and dumps a raw Zod error | ready |
| [DEF-206](session-forensics/DEF-206-quest-forensics-command-skips-step-6.md) | session-forensics | defect | `/quest-forensics` jumps from Step 5 to Step 7 | ready |
| [DEF-207](session-forensics/DEF-207-dangling-minutes-flag-falls-back-silently.md) | session-forensics | defect | A `--minutes` or `--floor-seconds` flag with no value silently takes the default | suspected |
| [CHG-2](shared/CHG-2-project-map-lists-gateway-as-one-name.md) | shared | change | `get-project-map` should list the gateway as one name, `#gateway` | ready |
| [DEF-264](shared/DEF-264-architecture-brokers-walk-src-adapters.md) | shared | defect | Project-map brokers in `shared` still look for `src/adapters/` paths, which no longer exist | suspected |
| [DEF-265](shared/DEF-265-get-architecture-diagram-lists-raw-packages.md) | shared | defect | `get-architecture` layer diagram lists raw packages the same page says nothing may import | ready |
| [CHG-3](siegelense/CHG-3-siege-memory-storage.md) | siegelense | change | Siege memory storage: agents keep reminders of how to drive an app | ready |
| [DEF-42](siegelense/DEF-042-status-since-1wk.md) | siegelense | defect | `status --since beginning` prints every instance the registry has ever held | ready |
| [DEF-56](siegelense/DEF-056-cleanup-lock-released-json.md) | siegelense | defect | `cleanup --json` `lockReleased: false` cannot say "none held" from "release failed" | ready |
| [DEF-57](siegelense/DEF-057-monitored-rss-wording.md) | siegelense | defect | `MONITORED: rss per process group` still uses jargon | ready |
| [DEF-61](siegelense/DEF-061-heartbeat-chromium-pid.md) | siegelense | defect | Chromium and ffmpeg pids are not in the lane record, so `kill` and `cleanup` cannot reap them | ready |
| [DEF-69](siegelense/DEF-069-kill-liveness-pgid-reuse.md) | siegelense | defect | `kill` liveness check does not confirm a pgid is still this lane's | ready |
| [DEF-75](siegelense/DEF-075-start-manifest-driver-log.md) | siegelense | defect | `start --json` manifest `logs` lists `api` and `web`, not `driver.log` | ready |
| [DEF-76](siegelense/DEF-076-run-default-output-too-thin.md) | siegelense | defect | `results --run` prints only a header for a `look` run | ready |
| [DEF-79](siegelense/DEF-079-unused-seed-binding-grammar.md) | siegelense | defect | Unused placeholder code from an older two-segment reference grammar | suspected |
| [DEF-80](siegelense/DEF-080-video-stop-unfinished-file.md) | siegelense | defect | `video stop` hands back a video file that is not finished and covers the whole session | ready |
| [DEF-83](siegelense/DEF-083-until-refusal-path.md) | siegelense | defect | The `until` refusal is filed under `steps.0.visible` when no `visible` was given | ready |
| [DEF-86](siegelense/DEF-086-results-json-rows-as-strings.md) | siegelense | defect | `results --json` rows are JSON strings inside JSON | ready |
| [DEF-87](siegelense/DEF-087-compare-json-new-rows-as-strings.md) | siegelense | defect | `compare --json` `console.new`, `server.new` and `network.new` are JSON strings | ready |
| [DEF-88](siegelense/DEF-088-prune-kind-log-takes-run-readings.md) | siegelense | defect | `prune --kind log` removes run readings, and `--kind transcript` matches nothing | ready |
| [DEF-93](siegelense/DEF-093-status-stuck-reservation.md) | siegelense | defect | `status` does not show a stuck reservation | ready |
| [DEF-107](siegelense/DEF-107-status-json-link-present.md) | siegelense | defect | `linkPresent` in the manifest and status paths reads as broken | ready |
| [DEF-108](siegelense/DEF-108-status-instance-url-rows.md) | siegelense | defect | `status --instance` shows no URL or API row | ready |
| [DEF-110](siegelense/DEF-110-stale-build-fingerprint.md) | siegelense | defect | `start` does not fingerprint the source, refuse a rebuild under a live lane, or serve a frozen build | ready |
| [DEF-111](siegelense/DEF-111-quest-home-inheritance-test.md) | siegelense | defect | No test that a spawned siegemaster inherits the server's `DUNGEONMASTER_HOME` | ready |
| [DEF-112](siegelense/DEF-112-status-idle-timeout-row.md) | siegelense | defect | `status --instance` has no idle-timeout row | ready |
| [DEF-115](siegelense/DEF-115-seed-hint-hand-typed.md) | siegelense | defect | The seed refusal hint still hand-types the providing recipe and binding paths | ready |
| [DEF-116](siegelense/DEF-116-look-within-crops-screenshot.md) | siegelense | defect | `look` with `within` screenshots the whole page | ready |
| [DEF-118](siegelense/DEF-118-failed-run-exits-zero.md) | siegelense | defect | A `run` whose status is `failed` exits 0 | ready |
| [DEF-131](siegelense/DEF-131-text-view-raw-json-readings.md) | siegelense | defect | `hold`, `reset`, `storage` and `dom` readings print raw JSON in the text view | ready |
| [DEF-132](siegelense/DEF-132-dom-full-text-glued.md) | siegelense | defect | `dom` with `text: "full"` glues text nodes together | ready |
| [DEF-139](siegelense/DEF-139-screenshot-full-page.md) | siegelense | defect | `screenshot` cannot capture a full page | ready |
| [DEF-142](siegelense/DEF-142-before-scripts-invisible.md) | siegelense | defect | `before` init scripts carry over to every later run and cannot be seen or removed | ready |
| [DEF-152](siegelense/DEF-152-ws-opened-event.md) | siegelense | defect | `results --kind ws` records `closed` but no `opened` event | ready |
| [DEF-156](siegelense/DEF-156-compare-changed-region.md) | siegelense | defect | `compare` reports a pixel share but not where the pixels changed | ready |
| [DEF-159](siegelense/DEF-159-assets-link-home-mismatch.md) | siegelense | defect | The assets link points at a different home than `npm run siegelense` writes to | ready |
| [DEF-213](siegelense/DEF-213-driving-oddities-have-no-cli-surface.md) | siegelense | defect | The driving-oddities file has brokers but nothing calls them | ready |
| [DEF-236](testing/DEF-236-tool-test-fixtures-use-old-gateway-layout.md) | testing | defect | tool tests still use the old gateway layout as sample data | ready |
| [F133](tooling/F133-adapter-census-has-nothing-to-census.md) | tooling | defect | `adapter-census` reports adapters, and no package has a `src/adapters/` folder | ready |
| [DEF-168](ward/DEF-168-full-run-slow-files.md) | ward | defect | A full `npm run ward` exits 1 on two slow files that pass alone | ready |
| [DEF-211](ward/DEF-211-scope-reaching-no-package-passes-silently.md) | ward | defect | A ward scope that reaches no package exits 0 having run nothing, and no guard catches it | ready |
| [DEF-212](ward/DEF-212-eslint-fix-can-break-compiling-code.md) | ward | defect | Ward's `eslint --fix` sometimes turns compiling code into code that fails to compile | suspected |
| [DEF-216](ward/DEF-216-e2e-still-needs-shared-and-testing-dist.md) | ward | defect | Ward's e2e check still needs `packages/shared/dist` and `packages/testing/dist` built first | suspected |
| [DEF-136](web/DEF-136-guild-create-400-body-dropped.md) | web | defect | The web post wrapper drops the 400 body, and the unused add-guild modal lacks the path check | ready |
| [DEF-137](web/DEF-137-bad-guild-no-way-to-fix.md) | web | defect | No UI to fix or remove a guild with an invalid path | ready |
| [DEF-147](web/DEF-147-quest-exec-operations-fallback.md) | web | defect | Why a seeded completed quest shows the `OPERATIONS` fallback, not `STEPS`, was never checked | suspected |
| [DEF-203](web/DEF-203-verdict-buttons-inflight-and-reload-untested.md) | web | defect | No test shows the verdict buttons disable while a request is in flight, or that a verdict survives a reload | suspected |
| [F107](web/F107-collect-subagent-chains-parses-every-render.md) | web | defect | `collect-subagent-chains-transformer` parses every group each render and discards the result | ready |
| [F115](web/F115-home-content-dead-delete-fallback.md) | web | defect | `home-content-widget` keeps a dead `Failed to delete quest` fallback | ready |
| [F130](web/F130-e2e-write-quest-file-takes-no-lock.md) | web | defect | web e2e `writeQuestFile` takes no quest lock | ready |
| [F131](web/F131-dispatch-harness-hides-non-200.md) | web | defect | `startQuestViaStartRoute` drops the HTTP status and returns `processId: "undefined"` | ready |
