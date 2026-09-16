import { siegelenseCallStatics } from '../siegelense-call/siegelense-call-statics';

import { siegelenseHelpStatics } from './siegelense-help-statics';

const CALL_KEYS = Object.keys(
  siegelenseHelpStatics.calls,
) as readonly (keyof typeof siegelenseHelpStatics.calls)[];

const CALL_NAME_SET = new Set(siegelenseCallStatics.calls.names);

describe('siegelenseHelpStatics', () => {
  it('VALID: {index} => toStrictEqual the headline, the six not-built names and the footer', () => {
    expect(siegelenseHelpStatics.index).toStrictEqual({
      headline:
        'dungeonmaster siegelense — every built call reachable without installing anything. Seven of thirteen calls are built.',
      notBuiltYet: ['capacity', 'profile', 'prune', 'snapshots', 'recipes', 'docs'],
      footer: "dungeonmaster siegelense <call> --help  for one call's flags and refusals",
    });
  });

  it('VALID: {calls.start} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.start).toStrictEqual({
      summary:
        'siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.',
      synopsis:
        'dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--idle-timeout-ms <ms>] [--json]',
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
          name: '--idle-timeout-ms',
          value: '<ms>',
          required: false,
          description:
            "raises this instance's idle ceiling above driverStatics.idle.timeoutMs (900000ms) — the length of think-time between runs the served lane survives before reaping itself with no run received. Omitted, the default applies.",
        },
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
      ],
      refusals: [
        '--idle-timeout-ms only RAISES the ceiling for this one instance — it never disables the idle timeout or makes it infinite. The timeout is the only backstop against an abandoned lane holding a port pair and a browser open forever.',
      ],
      output:
        'One JSON document on stdout: the manifest — instance id, base URL, and every evidence path this run will want, since there is no lookup call to recover them later.',
      example: 'dungeonmaster siegelense start --spec dungeonmaster-web',
    });
  });

  it('VALID: {calls.run} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.run).toStrictEqual({
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
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
      ],
      refusals: [],
      output:
        "One JSON document on stdout: the RunResult. Returns a STATUS — an index and a shot list — never the steps' own payloads; query those afterward with `dungeonmaster siegelense results`.",
      example:
        'dungeonmaster siegelense run --instance inst_9b2c --steps [{"step":"goto","path":"/"}]',
    });
  });

  it('VALID: {calls.results} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.results).toStrictEqual({
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
          description:
            'narrow to one evidence kind: console, network, ws, server, screenshots, steps.',
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
          value: 'boot',
          required: false,
          description:
            "read from the beginning of the instance's lifetime, in place of naming a run.",
        },
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
      ],
      refusals: [
        'Against a finished instance you must name --run (or --since boot); omit both and the call refuses rather than guessing which run you meant.',
      ],
      output: 'One JSON document on stdout: the ResultsAnswer. Every answer carries instanceState.',
      example: 'dungeonmaster siegelense results --instance inst_9b2c --run run_2 --step 7',
    });
  });

  it('VALID: {calls.kill} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.kill).toStrictEqual({
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
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
      ],
      refusals: [],
      output: 'One JSON document on stdout: the KillResult.',
      example: 'dungeonmaster siegelense kill --instance inst_9b2c',
    });
  });

  it('VALID: {calls.status} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.status).toStrictEqual({
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
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
        {
          name: '--human',
          value: null,
          required: false,
          description:
            'render the operator table instead of JSON. Only status and cleanup implement this.',
        },
      ],
      refusals: ["Never lists another instance's runs or evidence unless you name it."],
      output: 'One JSON document on stdout: the StatusAnswer.',
      example: 'dungeonmaster siegelense status --instance inst_9b2c',
    });
  });

  it('VALID: {calls.cleanup} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.cleanup).toStrictEqual({
      summary: 'siegelense cleanup — reap every stale instance the registry holds.',
      synopsis: 'dungeonmaster siegelense cleanup [--json] [--human]',
      flags: [
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
        {
          name: '--human',
          value: null,
          required: false,
          description:
            'render the operator table instead of JSON. Only status and cleanup implement this.',
        },
      ],
      refusals: [
        'Takes no input. Reaps and releases only — it ages no asset, so a clean baseline capture is never touched by this call.',
      ],
      output: 'One JSON document on stdout: the CleanupAnswer.',
      example: 'dungeonmaster siegelense cleanup',
    });
  });

  it('VALID: {calls.compare} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.calls.compare).toStrictEqual({
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
        {
          name: '--json',
          value: null,
          required: false,
          description: 'print the JSON answer — the default; explicit and refused nowhere.',
        },
      ],
      refusals: [
        'There is no cross-instance form: name one --instance and two runs (--run-a, --run-b) inside its own timeline — two different instances share nothing but a spec.',
      ],
      output:
        'One JSON document on stdout: the CompareAnswer — console and server error deltas, network non-2xx deltas, and a last-capture pixel change. A READING, never a verdict on whether a unit passes.',
      example: 'dungeonmaster siegelense compare --instance inst_9b2c --run-a run_1 --run-b run_2',
    });
  });

  it('VALID: {internal.driver} => toStrictEqual its summary, synopsis, flags, refusals, output and example', () => {
    expect(siegelenseHelpStatics.internal.driver).toStrictEqual({
      summary:
        'siegelense driver — the long-running process behind a booted instance (internal — `start` spawns it; nobody types it).',
      synopsis: 'not directly invocable — spawned by `dungeonmaster siegelense start`.',
      flags: [],
      refusals: [],
      output: "internal to the instance's socket protocol; never printed by any call.",
      example: 'dungeonmaster siegelense start --spec dungeonmaster-web',
    });
  });

  it.each(CALL_KEYS)('VALID: {%s} => is a member of siegelenseCallStatics.calls.names', (call) => {
    expect(CALL_NAME_SET.has(call)).toBe(true);
  });

  it("VALID: {siegelenseCallStatics.calls.names minus the calls object's own keys} => toStrictEqual index.notBuiltYet", () => {
    const routedNames = new Set(Object.keys(siegelenseHelpStatics.calls));
    const namesWithoutARoute = siegelenseCallStatics.calls.names.filter(
      (name) => !routedNames.has(name),
    );

    expect(namesWithoutARoute).toStrictEqual(siegelenseHelpStatics.index.notBuiltYet);
  });

  it('VALID: {calls.results.refusals} => toStrictEqual the run-id sentence, carried verbatim off the deleted MCP tool description', () => {
    expect(siegelenseHelpStatics.calls.results.refusals).toStrictEqual([
      'Against a finished instance you must name --run (or --since boot); omit both and the call refuses rather than guessing which run you meant.',
    ]);
  });
});
