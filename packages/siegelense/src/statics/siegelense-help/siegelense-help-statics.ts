/**
 * PURPOSE: The `--help` text for every `dungeonmaster siegelense <call>` — one entry per built
 * call under `calls`, keyed exactly to `siegelenseCallStatics.calls.names`, plus the index page's
 * headline and its list of the six not-yet-built names. `refusals` carries prose lifted verbatim
 * from the MCP tool description each call is replacing, unchanged except for renaming a JSON field
 * to the flag that now carries it — smoothing that wording is how a refusal stops refusing.
 * `internal.driver` documents the driver process `start` spawns; it sits outside `calls` because
 * nobody types `driver` at a terminal. Reach for this over `siegelenseCallStatics` when you need
 * the prose a caller reads — flags, refusals, an example — rather than just the closed list of
 * call names.
 *
 * USAGE:
 * siegelenseHelpStatics.calls.results.refusals;
 * // Returns the one-element array holding the run-id refusal sentence
 *
 * siegelenseHelpStatics.index.notBuiltYet;
 * // Returns ['capacity', 'profile', 'prune', 'snapshots', 'recipes', 'docs']
 */

import { resultsStatics } from '../results/results-statics';
import { siegelenseOutputStatics } from '../siegelense-output/siegelense-output-statics';

const JSON_FLAG = {
  name: siegelenseOutputStatics.flags.json,
  value: null,
  required: false,
  description: 'print the JSON answer — the default; explicit and refused nowhere.',
} as const;

const HUMAN_FLAG = {
  name: siegelenseOutputStatics.flags.human,
  value: null,
  required: false,
  description: 'render the operator table instead of JSON. Only status and cleanup implement this.',
} as const;

export const siegelenseHelpStatics = {
  index: {
    headline:
      'dungeonmaster siegelense — every built call reachable without installing anything. Seven of thirteen calls are built.',
    notBuiltYet: ['capacity', 'profile', 'prune', 'snapshots', 'recipes', 'docs'],
    footer: "dungeonmaster siegelense <call> --help  for one call's flags and refusals",
  },
  calls: {
    start: {
      summary:
        'siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.',
      synopsis:
        'dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--json]',
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
        JSON_FLAG,
      ],
      refusals: [],
      output:
        'One JSON document on stdout: the manifest — instance id, base URL, and every evidence path this run will want, since there is no lookup call to recover them later.',
      example: 'dungeonmaster siegelense start --spec dungeonmaster-web',
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
        "One JSON document on stdout: the RunResult. Returns a STATUS — an index and a shot list — never the steps' own payloads; query those afterward with `dungeonmaster siegelense results`.",
      example:
        'dungeonmaster siegelense run --instance inst_9b2c --steps [{"step":"goto","path":"/"}]',
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
      ],
      output: 'One JSON document on stdout: the ResultsAnswer. Every answer carries instanceState.',
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
      output: 'One JSON document on stdout: the KillResult.',
      example: 'dungeonmaster siegelense kill --instance inst_9b2c',
    },
    status: {
      summary: 'siegelense status — report the fleet, or one instance in full.',
      synopsis: 'dungeonmaster siegelense status [--instance <id>] [--json] [--human]',
      flags: [
        {
          name: '--instance',
          value: '<id>',
          required: false,
          description:
            'report that one instance in full — last beat, last step, RSS, orphans, evidence paths, likelyCause — instead of the fleet.',
        },
        JSON_FLAG,
        HUMAN_FLAG,
      ],
      refusals: ["Never lists another instance's runs or evidence unless you name it."],
      output: 'One JSON document on stdout: the StatusAnswer.',
      example: 'dungeonmaster siegelense status --instance inst_9b2c',
    },
    cleanup: {
      summary: 'siegelense cleanup — reap every stale instance the registry holds.',
      synopsis: 'dungeonmaster siegelense cleanup [--json] [--human]',
      flags: [JSON_FLAG, HUMAN_FLAG],
      refusals: [
        'Takes no input. Reaps and releases only — it ages no asset, so a clean baseline capture is never touched by this call.',
      ],
      output: 'One JSON document on stdout: the CleanupAnswer.',
      example: 'dungeonmaster siegelense cleanup',
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
        'One JSON document on stdout: the CompareAnswer — console and server error deltas, network non-2xx deltas, and a last-capture pixel change. A READING, never a verdict on whether a unit passes.',
      example: 'dungeonmaster siegelense compare --instance inst_9b2c --run-a run_1 --run-b run_2',
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
      example: 'dungeonmaster siegelense start --spec dungeonmaster-web',
    },
  },
} as const;
