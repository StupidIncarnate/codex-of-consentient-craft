import { siegelenseHelpStatics } from '../../statics/siegelense-help/siegelense-help-statics';

import { siegelenseHelpRenderTransformer } from './siegelense-help-render-transformer';

type CallKey = keyof typeof siegelenseHelpStatics.calls;

const CALL_KEYS = Object.keys(siegelenseHelpStatics.calls) as readonly CallKey[];

describe('siegelenseHelpRenderTransformer', () => {
  describe('one call, with a refusal', () => {
    it('VALID: {call: results} => the exact rendered page', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'results' });

      expect(result).toBe(
        'siegelense results — read evidence off disk for one instance. Starts nothing.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense results --instance <id> [--run <runId> | --since boot] [--step <n>] [--kind <kind>] [--where-path <p>] [--where-method <M>] [--where-nth <n>] [--where-level <l>] [--where-steps <a-b>] [--fields <a,b,c>] [--json]\n' +
          '\n' +
          'FLAGS\n' +
          '  --instance <id>      required   the instance to read evidence from.\n' +
          '  --run <runId>                   the run to read. Required against a finished instance.\n' +
          '  --step <n>                      narrow to one step index within the run.\n' +
          '  --kind <kind>                   narrow to one evidence kind: console, network, ws, server, screenshots, steps.\n' +
          '  --where-path <p>                narrow network evidence to this request path.\n' +
          '  --where-method <M>              narrow network evidence to this HTTP method.\n' +
          '  --where-nth <n>                 narrow to the nth matching row.\n' +
          '  --where-level <l>               narrow console or server evidence to this log level.\n' +
          '  --where-steps <a-b>             narrow to a step range, e.g. 4-9.\n' +
          '  --fields <a,b,c>                project the answer down to this comma-separated list of fields.\n' +
          "  --since boot                    read from the beginning of the instance's lifetime, in place of naming a run.\n" +
          '  --json                          print raw JSON output instead of the human-readable view.\n' +
          '\n' +
          'REFUSES\n' +
          '  Against a finished instance you must name --run (or --since boot); omit both and the call refuses rather than guessing which run you meant.\n' +
          '\n' +
          'OUTPUT\n' +
          '  By default, an instance header followed by formatted step readings, or a notice when none matched. `--json` prints the raw ResultsAnswer. Every answer carries instanceState.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense results --instance inst_9b2c --run run_2 --step 7\n',
      );
    });
  });

  describe('cleanup — the ages-assets refusal', () => {
    it('VALID: {call: cleanup} => the page carries the ages-assets sentence', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'cleanup' });

      expect(result).toBe(
        'siegelense cleanup — reap every stale instance the registry holds.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense cleanup [--json]\n' +
          '\n' +
          'FLAGS\n' +
          '  --json             print raw JSON output instead of the human-readable view.\n' +
          '\n' +
          'REFUSES\n' +
          "  Takes no input. Reaps, releases, and ages assets out on their own windows — video first on a shorter one. It refuses exactly what prune refuses, so a capture a VERIFIED prelude or an open quest's WALKED line still cites is never touched, and the instance it belongs to says so in leftAlone.\n" +
          '\n' +
          'OUTPUT\n' +
          '  By default, what was reaped, which ports and locks came back, how much evidence aged out, and what was left alone and why. `--json` prints the raw CleanupAnswer.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense cleanup\n',
      );
    });
  });

  describe('recipes — the no-instance-needed page', () => {
    it('VALID: {call: recipes} => the exact rendered page', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'recipes' });

      expect(result).toBe(
        'siegelense recipes — list what states can be created. No instance needed.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense recipes [--json]\n' +
          '\n' +
          'FLAGS\n' +
          '  --json             print raw JSON output instead of the human-readable view.\n' +
          '\n' +
          'REFUSES\n' +
          '  Takes no instance. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it.\n' +
          '\n' +
          'OUTPUT\n' +
          "  By default, one block per recipe naming its description, inputs, whether it runs serverless or needs a server, and what it makes — or 'no recipes declared yet' when the listing is empty. `--json` prints the raw RecipesAnswer.\n" +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense recipes\n',
      );
    });
  });

  describe('a call whose refusals array is empty', () => {
    it('EDGE: {call: kill, refusals: []} => no REFUSES heading', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'kill' });

      expect(result).toBe(
        'siegelense kill — stop one running instance.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense kill --instance <id> [--json]\n' +
          '\n' +
          'FLAGS\n' +
          '  --instance <id>  required   the instance to stop. Accepts an already-dead instance id too, reaping its orphaned process groups from its heartbeat file when the driver itself is unreachable.\n' +
          '  --json                      print raw JSON output instead of the human-readable view.\n' +
          '\n' +
          'OUTPUT\n' +
          '  By default, three lines: the instance id, the processes reaped, and whether the throwaway home was removed or preserved. `--json` prints the raw KillResult.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense kill --instance inst_9b2c\n',
      );
    });
  });

  describe('start now carries an idle-timeout-ms flag and a refusal', () => {
    it('VALID: {call: start} => the exact rendered page, flag and refusal included', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'start' });

      expect(result).toBe(
        'siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--seed <recipeName>] [--idle-timeout-ms <ms>] [--json]\n' +
          '\n' +
          'FLAGS\n' +
          '  --spec <specName>       required   the lane spec to boot.\n' +
          "  --quest <questId>                  files the instance's evidence under that quest's guild. Omitted, the instance is unowned.\n" +
          '  --guild <guildId>                  the guild to file evidence under, when there is no quest.\n' +
          "  --seed <recipeName>                runs that recipe against the lane once it is up, and returns the ids it made on the manifest's `seeded`. `dungeonmaster siegelense recipes` lists every name with its produces: line. Omitted, the instance starts empty and `seeded` is null.\n" +
          "  --idle-timeout-ms <ms>             raises this instance's idle ceiling above driverStatics.idle.timeoutMs (900000ms) — the length of think-time between runs the served lane survives before reaping itself with no run received. Omitted, the default applies.\n" +
          '  --json                             print raw JSON output instead of the human-readable view.\n' +
          '\n' +
          'REFUSES\n' +
          '  A --seed that FAILS tears the instance down and reports the failure, rather than handing back a lane whose state is not what you asked for. `seeded: null` means no --seed was given, never that one was given and produced nothing.\n' +
          '  --idle-timeout-ms only RAISES the ceiling for this one instance — it never disables the idle timeout or makes it infinite. The timeout is the only backstop against an abandoned lane holding a port pair and a browser open forever.\n' +
          '\n' +
          'OUTPUT\n' +
          '  A human summary by default: instance id, spec, URLs, home and evidence paths, boot time, and one line per seeded binding — since there is no lookup call to recover any of it later. `--json` prints the InstanceManifest unabridged, seeded rows included.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense start --spec stack\n',
      );
    });
  });

  describe('the index, call: null', () => {
    it('VALID: {call: null} => the index listing every built call and the not-built names, with a derived headline count', () => {
      const result = siegelenseHelpRenderTransformer({ call: null });

      expect(result).toBe(
        'dungeonmaster siegelense — every built call reachable without installing anything. 13 of 13 calls are built.\n' +
          '\n' +
          'CALLS\n' +
          '  siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.\n' +
          '  siegelense run — submit one batch of steps to a running instance and block until it finishes.\n' +
          '  siegelense results — read evidence off disk for one instance. Starts nothing.\n' +
          '  siegelense kill — stop one running instance.\n' +
          '  siegelense capacity — how many instances this machine can take right now. Ask before opening a pool. Starts nothing.\n' +
          '  siegelense profile — what one instance of a lane spec costs, measured. Starts nothing.\n' +
          '  siegelense status — report the fleet, or one instance in full.\n' +
          '  siegelense cleanup — reap every stale instance the registry holds.\n' +
          '  siegelense prune — reclaim asset space deliberately, rather than waiting for the age-out window.\n' +
          "  siegelense compare — diff two runs of one instance's timeline.\n" +
          '  siegelense snapshots — list the points `reset level: state` can return to for one instance. Starts nothing.\n' +
          '  siegelense recipes — list what states can be created. No instance needed.\n' +
          "  siegelense docs — this tool's own instructions, scoped to one role. Starts nothing.\n" +
          '\n' +
          "dungeonmaster siegelense <call> --help  for one call's flags and refusals\n",
      );
    });
  });

  it.each(CALL_KEYS)("VALID: {call: %s} => the first line is that call's summary", (call) => {
    const result = siegelenseHelpRenderTransformer({ call });

    expect(result.split('\n')[0]).toBe(siegelenseHelpStatics.calls[call].summary);
  });
});
