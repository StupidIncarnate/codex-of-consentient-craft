/**
 * PURPOSE: The `--help` text for every `dungeonmaster siegelense <call>` — one entry per built
 * call under `calls`, keyed exactly to `siegelenseCallStatics.calls.names`, plus the index page's
 * headline. `index.headline` carries the whole fixed prose `siegelenseHelpRenderTransformer` prints
 * verbatim — no build-progress count appended at render time, so the index never reads like a
 * checklist with items still outstanding. `refusals` carries prose lifted verbatim from the MCP
 * tool description each call is replacing, unchanged except for renaming a JSON field to the flag
 * that now carries it —
 * smoothing that wording is how a refusal stops refusing. `internal.driver` documents the driver
 * process `start` spawns; it sits outside `calls` because nobody types `driver` at a terminal.
 * Reach for this over `siegelenseCallStatics` when you need the prose a caller reads — flags,
 * refusals, an example — rather than just the closed list of call names.
 *
 * USAGE:
 * siegelenseHelpStatics.calls.results.refusals;
 * // Returns the array holding the run-id refusal sentence and the unknown-id refusal
 */

import { instanceLifecycleStatics } from '../instance-lifecycle/instance-lifecycle-statics';
import { pruneStatics } from '../prune/prune-statics';
import { resultsStatics } from '../results/results-statics';
import { siegelenseCallStatics } from '../siegelense-call/siegelense-call-statics';
import { siegelenseOutputStatics } from '../siegelense-output/siegelense-output-statics';

const JSON_FLAG = {
  name: siegelenseOutputStatics.flags.json,
  value: null,
  required: false,
  description: 'print raw JSON output instead of the human-readable view.',
} as const;

// cleanup's own refusal builds its numbers off these two, so the help page can never say a stale
// window or an age-out window this checkout does not actually run. Divides by
// pruneStatics.olderThan.unitMs.s (1000) rather than a bare literal — the same ms-per-second this
// file already imports pruneStatics for.
const CLEANUP_STALE_AFTER_SECONDS =
  (instanceLifecycleStatics.heartbeat.intervalMs *
    instanceLifecycleStatics.heartbeat.stalenessBeats) /
  pruneStatics.olderThan.unitMs.s;

export const siegelenseHelpStatics = {
  index: {
    headline: 'dungeonmaster siegelense — every built call reachable without installing anything.',
    footer: "dungeonmaster siegelense <call> --help  for one call's flags and refusals",
  },
  calls: {
    start: {
      summary:
        'siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.',
      synopsis:
        'dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--seed <recipeName>] [--idle-timeout-ms <ms>] [--json]',
      flags: [
        {
          name: '--spec',
          value: '<specName>',
          required: true,
          description: 'the lane spec to boot.',
        },
        {
          name: '--quest',
          value: '<questId>',
          required: false,
          description:
            "files the instance's evidence under that quest's guild. Omitted, the instance is unowned.",
        },
        {
          name: '--guild',
          value: '<guildId>',
          required: false,
          description: 'the guild to file evidence under, when there is no quest.',
        },
        {
          name: '--seed',
          value: '<recipeName>',
          required: false,
          description:
            'runs that recipe against the lane once it is up, and returns the ids it made on the ' +
            "manifest's `seeded`. Takes only a recipe with NO declared inputs — this bare flag has " +
            "nowhere to carry params, unlike a `run` batch's own `seed` step, so a recipe that " +
            'declares one refuses before booting rather than failing after. ' +
            '`dungeonmaster siegelense recipes` lists every name with its description. Omitted, ' +
            'the instance starts empty and `seeded` is null.',
        },
        {
          name: '--idle-timeout-ms',
          value: '<ms>',
          required: false,
          description:
            "raises this instance's idle ceiling above the 900000ms (15 minute) default — the " +
            'length of think-time between runs the served lane survives before reaping itself with ' +
            'no run received. Omitted, the default applies.',
        },
        JSON_FLAG,
      ],
      refusals: [
        'A --seed that FAILS tears the instance down and reports the failure, rather than handing ' +
          'back a lane whose state is not what you asked for. `seeded: null` means no --seed was ' +
          'given, never that one was given and produced nothing.',
        '--idle-timeout-ms only RAISES the ceiling for this one instance — it never disables the ' +
          'idle timeout or makes it infinite. The timeout is the only backstop against an abandoned ' +
          'lane holding a port pair and a browser open forever.',
      ],
      output:
        'A human summary by default: instance id, spec, URLs, home and evidence paths, boot time, and one line per seeded binding. `dungeonmaster siegelense status --instance <id>` recovers the evidence paths later. `--json` prints the InstanceManifest unabridged, seeded rows included.',
      example: 'dungeonmaster siegelense start --spec stack',
    },
    run: {
      summary:
        'siegelense run — submit one batch of steps to a running instance and block until it finishes.',
      synopsis:
        'dungeonmaster siegelense run --instance <id> (--steps <json> | --steps-file <path>) [--stop-on error|never] [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: true,
          description: 'the instance to run the batch against.',
        },
        {
          name: '--steps',
          value: '<json>',
          required: false,
          description:
            'a JSON array of step objects, as one argv value. Exactly one of --steps or --steps-file is required.',
        },
        {
          name: '--steps-file',
          value: '<path>',
          required: false,
          description:
            'a file holding that same JSON array. Exactly one of --steps or --steps-file is required.',
        },
        {
          name: '--stop-on',
          value: 'error|never',
          required: false,
          description:
            "stop at the first failure, or push through every step regardless. Defaults to 'error'. " +
            "Either way, the RunResult's stoppedAt names the first failure's location — under 'never' " +
            'the run keeps going past it, so that location is where it would have stopped, not where ' +
            'it did.',
        },
        JSON_FLAG,
      ],
      refusals: [],
      output:
        "By default, one summary line — run id, status, steps run and duration — plus the failure point when stopped early and any screenshot paths captured. `--json` prints the raw RunResult. Either way, a STATUS — an index and a shot list — never the steps' own payloads; query those afterward with `dungeonmaster siegelense results`.",
      example:
        'dungeonmaster siegelense run --instance inst_4f9c2a17b8e6405fa1d4c9e02b7f1a3c --steps \'[{"step":"goto","path":"/"}]\'',
    },
    results: {
      summary: 'siegelense results — read evidence off disk for one instance. Starts nothing.',
      synopsis:
        'dungeonmaster siegelense results --instance <id> [--run <runId> | --since boot] [--step <n>] [--kind <kind>] [--where-path <p>] [--where-method <M>] [--where-nth <n>] [--where-level <l>] [--where-steps <a-b>] [--fields <a,b,c>] [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: true,
          description: 'the instance to read evidence from.',
        },
        {
          name: '--run',
          value: '<runId>',
          required: false,
          description: 'the run to read. Required against a finished instance.',
        },
        {
          name: '--step',
          value: '<n>',
          required: false,
          description: 'narrow to one step index within the run.',
        },
        {
          name: '--kind',
          value: '<kind>',
          required: false,
          description: `narrow to one evidence kind: ${resultsStatics.kinds.all.join(', ')}.`,
        },
        {
          name: '--where-path',
          value: '<p>',
          required: false,
          description: 'narrow network evidence to this request path.',
        },
        {
          name: '--where-method',
          value: '<M>',
          required: false,
          description: 'narrow network evidence to this HTTP method.',
        },
        {
          name: '--where-nth',
          value: '<n>',
          required: false,
          description: 'narrow to the nth matching row.',
        },
        {
          name: '--where-level',
          value: '<l>',
          required: false,
          description: 'narrow console or server evidence to this log level.',
        },
        {
          name: '--where-steps',
          value: '<a-b>',
          required: false,
          description: 'narrow to a step range, e.g. 4-9.',
        },
        {
          name: '--fields',
          value: '<a,b,c>',
          required: false,
          description: 'project the answer down to this comma-separated list of fields.',
        },
        {
          name: '--since',
          value: resultsStatics.since.boot,
          required: false,
          description:
            "read from the beginning of the instance's lifetime, in place of naming a run.",
        },
        JSON_FLAG,
      ],
      refusals: [
        'Against a finished instance you must name --run (or --since boot); omit both and the call refuses rather than guessing which run you meant.',
        'An --instance id with no record in the registry is refused rather than answered.',
      ],
      output:
        'By default, an instance header, the run summary when the query names no --step and no --kind, and formatted step readings, or a notice when none matched. `--json` prints the raw ResultsAnswer. Every answer for a known instance carries instanceState; an id with no record in the registry refuses instead.',
      example: 'dungeonmaster siegelense results --instance inst_9b2c --run run_2 --step 7',
    },
    kill: {
      summary: 'siegelense kill — stop one running instance.',
      synopsis: 'dungeonmaster siegelense kill --instance <id> [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: true,
          description:
            'the instance to stop. Accepts an already-dead instance id too, reaping its orphaned process groups from its heartbeat file when the driver itself is unreachable.',
        },
        JSON_FLAG,
      ],
      refusals: [],
      output:
        'By default, three lines: the instance id, the processes reaped, and whether the throwaway home was removed or preserved. `--json` prints the raw KillResult.',
      example: 'dungeonmaster siegelense kill --instance inst_9b2c',
    },
    capacity: {
      summary:
        'siegelense capacity — how many instances this machine can take right now. Ask before opening a pool. Starts nothing.',
      synopsis: 'dungeonmaster siegelense capacity --spec <specName> [--pool <n>] [--json]',
      flags: [
        {
          name: '--spec',
          value: '<specName>',
          required: true,
          description:
            'the lane spec to calculate capacity against. Capacity calculation depends on spec footprint.',
        },
        {
          name: '--pool',
          value: '<n>',
          required: false,
          description:
            'the size of the pool you are about to open. Decides WHICH measured sample group the division uses. Omitted, the policy ceiling is assumed, so the most contended group the profile holds is the one read.',
        },
        JSON_FLAG,
      ],
      refusals: [
        'Advisory, with one exception: `start` refuses outright when this answers suggested: 0 — either no room in memory for one more instance, or the policy pool already full. Everywhere else the caller decides.',
        'Samples are never averaged across pool sizes. One group is selected — the largest measured at or below --pool, or the smallest there is when every group measured a bigger pool — and the answer reports which, so the arithmetic is checkable.',
        'Counts instances this session did not start, reservations included: a parallel agent’s lanes, a ward e2e run holding a port pair, a developer’s own browser. It never reaps anything — a row whose heartbeat has gone cold is excluded from the count, and `cleanup` is what clears it.',
      ],
      output:
        'By default, a human summary — suggested and ceiling counts, the spec, a why sentence naming every figure it reasoned from, the measured host block, and the one profile group it divided by. `--json` prints the raw CapacityAnswer (profile null for a spec nothing has run).',
      example: 'dungeonmaster siegelense capacity --spec stack --pool 3',
    },
    status: {
      summary: 'siegelense status — report the fleet, or one instance in full.',
      synopsis:
        'dungeonmaster siegelense status [--instance <id>] [--branch <name>] [--since 1hr|6hr|1day|beginning] [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: false,
          description:
            'report that one instance in full — last beat, last step, MEMORY, orphans, the evidence directory with every file in it, and likelyCause when it died unexpectedly — instead of the fleet.',
        },
        {
          name: '--branch',
          value: '<name>',
          required: false,
          description: 'filters the fleet to instances created on that git branch.',
        },
        {
          name: '--since',
          value: '1hr|6hr|1day|beginning',
          required: false,
          description:
            'narrows the fleet to instances created within that time window. Defaults to 6hr; beginning is how a caller sees every instance the registry holds, regardless of age.',
        },
        JSON_FLAG,
      ],
      refusals: [
        'A --since value outside 1hr, 6hr, 1day or beginning is refused, naming the four accepted windows.',
        'An --instance id with no record in the registry is refused rather than answered.',
      ],
      output:
        "The fleet view lists instances but not their evidence paths or runs. Name one with --instance to get those. By default, the fleet prints as a box-drawing table (monitored vocabulary, machine reading, one row per instance); naming --instance prints that one instance in full as its own box-drawing table (last beat, last step, MEMORY, orphans, EVIDENCE DIR, likelyCause) instead of the fleet. EVIDENCE DIR is the absolute path of the instance's evidence directory, followed by a file tree of everything in it (logs, heartbeat, runs/*.jsonl transcripts and stored returns, screenshots, video), each file with its size; `--json` carries the same as evidence.dir plus evidence.files, one absolute path per file. LIKELY CAUSE appears only for an instance that ended unexpectedly — a recorded shutdown reason, or the memory and OOM evidence for a death nothing explained — and reads `-` for a live instance or a plain kill. MEMORY is the last measured memory of the instance's processes; for a killed instance, it is the instance's footprint at the moment it ended, not a current reading. `--json` prints the raw StatusAnswer either way.",
      example: 'dungeonmaster siegelense status --instance inst_4f9c2a17b8e6405fa1d4c9e02b7f1a3c',
    },
    cleanup: {
      summary: 'siegelense cleanup — reap every stale instance the registry holds.',
      synopsis: 'dungeonmaster siegelense cleanup [--json]',
      flags: [JSON_FLAG],
      refusals: [
        `Takes no input. An instance is stale once its heartbeat goes ${CLEANUP_STALE_AFTER_SECONDS}s without a beat (${instanceLifecycleStatics.heartbeat.stalenessBeats} missed beats of ${instanceLifecycleStatics.heartbeat.intervalMs}ms) — that reaps it and releases its ports and, if stuck, its locks. Evidence then ages out on its own window, video first on the shorter one: non-video after ${pruneStatics.window.defaultOlderThan}, video after ${pruneStatics.window.videoOlderThan}. It refuses exactly what prune refuses, so a capture a VERIFIED prelude or an open quest's WALKED line still cites is never touched, and the instance it belongs to says so in leftAlone.`,
      ],
      output:
        'By default, what was reaped, which ports and locks came back, how much evidence aged out, and what was left alone and why. `--json` prints the raw CleanupAnswer.',
      example: 'dungeonmaster siegelense cleanup',
    },
    prune: {
      summary:
        'siegelense prune — reclaim asset space deliberately, rather than waiting for the age-out window.',
      synopsis:
        'dungeonmaster siegelense prune [--instance <id>] [--kind <kind>] [--older-than <window>] [--confirm] [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: false,
          description: "one instance's assets, instead of every instance's.",
        },
        {
          name: '--kind',
          value: '<kind>',
          required: false,
          description:
            'one class of file: video, shot, transcript or log. Combines with --older-than.',
        },
        {
          name: '--older-than',
          value: '<window>',
          required: false,
          description:
            'how old an asset must be to go — a whole number and one of d, h, m, s. Defaults to 7d; this call deletes, so it never defaults to taking everything.',
        },
        {
          name: pruneStatics.flags.confirm,
          value: null,
          required: false,
          description:
            'actually deletes what was selected. Without it, prune is a DRY RUN: it prints what it WOULD remove and deletes nothing.',
        },
        JSON_FLAG,
      ],
      refusals: [
        'It refuses rather than warns: anything a VERIFIED prelude or an open quest WALKED note still cites stays, and the refusal names the citing file and the run id so a caller can open it.',
        'A live instance is refused whoever started it, whatever the window says.',
        'An instance whose quest record cannot be read is refused rather than treated as uncited — deleting is the irreversible move.',
        'The third citation kind, an open issue record, is NOT CHECKED: nothing in this repo stores an issue carrying a typed instanceId/runId. Every answer names it under `unresolved`, so an empty `refused` never reads as "nothing cites any of this".',
      ],
      output:
        'Without --confirm: a DRY RUN. Prints the same reclaim table, describing what it WOULD free, remove and refuse, but deletes nothing — the output says so plainly, and names --confirm as the flag that deletes. With --confirm: what was freed, what was removed, what was refused (with the citing file), and which citation kinds went unchecked. `--json` prints the raw PruneAnswer — freedMB and freedBytes, removed[] (with the tombstone flag), refused[] (each with the citing file), and unresolved[] naming every citation kind that went unchecked; without --confirm the DRY RUN notice prints to stderr instead, so stdout stays one valid JSON document.',
      example: 'dungeonmaster siegelense prune --kind video --older-than 2d --confirm',
    },
    compare: {
      summary: "siegelense compare — diff two runs of one instance's timeline.",
      synopsis:
        'dungeonmaster siegelense compare --instance <id> --run-a <runId> --run-b <runId> [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: true,
          description: 'the instance both runs belong to.',
        },
        { name: '--run-a', value: '<runId>', required: true, description: 'the first run.' },
        { name: '--run-b', value: '<runId>', required: true, description: 'the second run.' },
        JSON_FLAG,
      ],
      refusals: [
        'There is no cross-instance form: name one --instance and two runs (--run-a, --run-b) inside its own timeline — two different instances share nothing but a spec.',
      ],
      output:
        "By default, instance id, the runs compared, console/server/network error deltas, the pixel diff summary, and each run's own element churn (ELEMENTS WITHIN RUN A/B — appeared/disappeared/changed inside that run's own steps, never a diff between run A and run B: compare reads stored evidence only and never re-drives a page to compute one). `--json` prints the raw CompareAnswer. Either way, a READING, never a verdict on whether a unit passes.",
      example: 'dungeonmaster siegelense compare --instance inst_9b2c --run-a run_1 --run-b run_2',
    },
    snapshots: {
      summary:
        'siegelense snapshots — list the points `reset level: state` can return to for one instance. Starts nothing.',
      synopsis: 'dungeonmaster siegelense snapshots --instance <id> [--json]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: true,
          description:
            "the instance whose restore points to list. There is no fleet-wide form: a snapshot lives inside one instance's own throwaway home.",
        },
        JSON_FLAG,
      ],
      refusals: [
        'Snapshots die with the instance. `kill` removes the throwaway home the store lives inside, so a killed or pruned instance answers an empty list — the instanceState on the answer is what tells that apart from a live instance that has captured nothing yet.',
        'Every run mints its own `run_N:start` and `run_N:end`; a name ending in either suffix is refused at capture, so the automatic namespace can never be taken by a typed name.',
        'An --instance id with no record in the registry is refused rather than answered.',
      ],
      output:
        "By default, instance id and state, then a box-drawing table of restore points (name, age and manual flag, oldest first), or — when there are none — 'none recorded yet' against a live instance and a sentence naming the throwaway home as gone against a killed one, since the two mean different things. `--json` prints the raw SnapshotsAnswer — instanceId, instanceState, and one row per restore point with its name, atMs and manual flag.",
      example: 'dungeonmaster siegelense snapshots --instance inst_9b2c',
    },
    recipes: {
      summary: 'siegelense recipes — list what states can be created. No instance needed.',
      synopsis: 'dungeonmaster siegelense recipes [--json]',
      flags: [JSON_FLAG],
      refusals: [
        'Takes no instance. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it.',
      ],
      output:
        "By default, one block per recipe naming its description, inputs, whether it runs serverless or needs a server, and what it makes — or 'no recipes declared yet' when the listing is empty. `--json` prints the raw RecipesAnswer.",
      example: 'dungeonmaster siegelense recipes',
    },
    docs: {
      summary:
        "siegelense docs — this tool's own instructions, scoped to one role. Starts nothing.",
      synopsis: 'dungeonmaster siegelense docs [--for <scope>] [--json]',
      flags: [
        {
          name: '--for',
          value: '<scope>',
          required: false,
          description: `serve one role's page instead of the tool overview: ${siegelenseCallStatics.docs.scopes.join(', ')}. Omitted, docs serves the overview alone.`,
        },
        JSON_FLAG,
      ],
      refusals: [
        'An unrecognised --for value is refused BY NAME and lists the scopes that exist. It never answers an empty document, because "this role has no instructions" is the one answer this call must not give.',
        'There is no scope for a code-reading role, and that absence is deliberate: a session that opens source files and calls nothing here would be handed the vocabulary for driving a browser.',
      ],
      output:
        "With no --for, prints this tool's about overview alone — no role's page. With --for, formatted Markdown by default — the document title and one heading for the requested scope with its audience, summary and bulleted sections; no About block, since a role page is written to stand alone. `--json` prints the raw DocsAnswer either way — about is the preamble for the bare overview form and empty for a role page, and scopes holds one document per scope served (none, for the bare overview form).",
      example: 'dungeonmaster siegelense docs --for walking',
    },
  },
  internal: {
    driver: {
      summary:
        'siegelense driver — the long-running process behind a booted instance (internal — `start` spawns it; nobody types it).',
      synopsis: 'not directly invocable — spawned by `dungeonmaster siegelense start`.',
      flags: [],
      refusals: [],
      output: "internal to the instance's socket protocol; never printed by any call.",
      example: 'dungeonmaster siegelense start --spec stack',
    },
  },
} as const;
