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
          '  --json                          print the JSON answer — the default; explicit and refused nowhere.\n' +
          '\n' +
          'REFUSES\n' +
          '  Against a finished instance you must name --run (or --since boot); omit both and the call refuses rather than guessing which run you meant.\n' +
          '\n' +
          'OUTPUT\n' +
          '  One JSON document on stdout: the ResultsAnswer. Every answer carries instanceState.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense results --instance inst_9b2c --run run_2 --step 7\n',
      );
    });
  });

  describe('cleanup — the ages-nothing refusal', () => {
    it('VALID: {call: cleanup} => the page carries the ages-nothing sentence', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'cleanup' });

      expect(result).toBe(
        'siegelense cleanup — reap every stale instance the registry holds.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense cleanup [--json] [--human]\n' +
          '\n' +
          'FLAGS\n' +
          '  --json              print the JSON answer — the default; explicit and refused nowhere.\n' +
          '  --human             render the operator table instead of JSON. Only status and cleanup implement this.\n' +
          '\n' +
          'REFUSES\n' +
          '  Takes no input. Reaps and releases only — it ages no asset, so a clean baseline capture is never touched by this call.\n' +
          '\n' +
          'OUTPUT\n' +
          '  One JSON document on stdout: the CleanupAnswer.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense cleanup\n',
      );
    });
  });

  describe('a call whose refusals array is empty', () => {
    it('EDGE: {call: start, refusals: []} => no REFUSES heading', () => {
      const result = siegelenseHelpRenderTransformer({ call: 'start' });

      expect(result).toBe(
        'siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.\n' +
          '\n' +
          'USAGE\n' +
          '  dungeonmaster siegelense start --spec <specName> [--quest <questId>] [--guild <guildId>] [--json]\n' +
          '\n' +
          'FLAGS\n' +
          '  --spec <specName>  required   the lane spec to boot.\n' +
          "  --quest <questId>             files the instance's evidence under that quest's guild. Omitted, the instance is unowned.\n" +
          '  --guild <guildId>             the guild to file evidence under, when there is no quest.\n' +
          '  --json                        print the JSON answer — the default; explicit and refused nowhere.\n' +
          '\n' +
          'OUTPUT\n' +
          '  One JSON document on stdout: the manifest — instance id, base URL, and every evidence path this run will want, since there is no lookup call to recover them later.\n' +
          '\n' +
          'EXAMPLE\n' +
          '  dungeonmaster siegelense start --spec dungeonmaster-web\n',
      );
    });
  });

  describe('the index, call: null', () => {
    it('VALID: {call: null} => the index listing all seven built calls and the six not built', () => {
      const result = siegelenseHelpRenderTransformer({ call: null });

      expect(result).toBe(
        'dungeonmaster siegelense — every built call reachable without installing anything. Seven of thirteen calls are built.\n' +
          '\n' +
          'CALLS\n' +
          '  siegelense start — boot one instance for a lane spec and block until the driver answers or the boot deadline passes.\n' +
          '  siegelense run — submit one batch of steps to a running instance and block until it finishes.\n' +
          '  siegelense results — read evidence off disk for one instance. Starts nothing.\n' +
          '  siegelense kill — stop one running instance.\n' +
          '  siegelense status — report the fleet, or one instance in full.\n' +
          '  siegelense cleanup — reap every stale instance the registry holds.\n' +
          "  siegelense compare — diff two runs of one instance's timeline.\n" +
          '\n' +
          'NOT BUILT YET\n' +
          '  capacity\n' +
          '  profile\n' +
          '  prune\n' +
          '  snapshots\n' +
          '  recipes\n' +
          '  docs\n' +
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
