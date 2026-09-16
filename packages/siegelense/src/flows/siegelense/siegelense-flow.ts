/**
 * PURPOSE: Routes `dungeonmaster siegelense`'s calls. `--help`/`-h` is checked BEFORE any parsing —
 * bare, it prints the index; after a built call's name, that call's own page — so a caller piping
 * stdout gets the help it asked for rather than a refusal (siegelense-tooling.md §3.F). `driver
 * --instance <id> [--idle-timeout-ms <ms>]` sits outside the thirteen-call surface entirely —
 * internal, spawned by `start`, never typed by a person — and keeps its own `--instance`/
 * `--idle-timeout-ms` reads, now through the shared `flagValueReadTransformer` rather than a second
 * `indexOf` dance, and its own value parses through `flagContractParseTransformer` so a badly-shaped
 * id or ceiling answers with the contract's own message under its own flag rather than a raw
 * ZodError. `--idle-timeout-ms` is OPTIONAL here exactly as it is on `start` — `start` only carries
 * it through to this same flag when a caller named one. Every other built call goes
 * through `CALL_ROUTES`, a `Map` keyed by the same seven names `siegelenseHelpStatics.calls` holds:
 * each entry parses its own argv and calls its responder — **except `run`, whose entry hands argv
 * straight to `SiegelenseRunResponder` unparsed.** That is not an inconsistency to "tidy" away:
 * `run` accepts `--steps-file`, the named file has to be read from disk before `runArgsParseTransformer`
 * can run, and `flows/` has no `adapters/` in its allowed imports — so the flow cannot do that read.
 * `SiegelenseRunResponder` is the one layer that can, and its own header says so. A built call's
 * `--human` is refused by name for every call whose OWN help entry carries no `--human` flag —
 * derived from `siegelenseHelpStatics.calls[call].flags` rather than a second hardcoded list, so
 * `status` and `cleanup` (the only two with a renderer) stay the only two this admits without a
 * second edit anywhere. `args[0]` outside `CALL_ROUTES` falls through a three-way refusal: a name
 * `siegelenseCallStatics.calls.names` holds with no route answers "not built yet" and lists the
 * built calls, so a caller who read the spec learns the truth rather than being told the spec is
 * wrong; anything else answers "unknown subcommand" with the usage line; absent routes to the bare
 * fleet listing.
 *
 * USAGE:
 * await SiegelenseFlow({ args: ['--help'] });
 * // Writes the index page to stdout
 *
 * await SiegelenseFlow({ args: ['results', '--instance', 'inst_7f3a9c21', '--run', 'run_2'] });
 * // Routes to SiegelenseResultsResponder
 *
 * await SiegelenseFlow({ args: ['driver', '--instance', 'inst_7f3a9c21'] });
 * // Routes to SiegelenseDriverResponder
 *
 * await SiegelenseFlow({ args: [] });
 * // Routes to SiegelenseFleetResponder
 */

import { adapterResultContract, timeoutMsContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { SiegelenseCleanupResponder } from '../../responders/siegelense/cleanup/siegelense-cleanup-responder';
import { SiegelenseCompareResponder } from '../../responders/siegelense/compare/siegelense-compare-responder';
import { SiegelenseDriverResponder } from '../../responders/siegelense/driver/siegelense-driver-responder';
import { SiegelenseFleetResponder } from '../../responders/siegelense/fleet/siegelense-fleet-responder';
import { SiegelenseKillResponder } from '../../responders/siegelense/kill/siegelense-kill-responder';
import { SiegelenseResultsResponder } from '../../responders/siegelense/results/siegelense-results-responder';
import { SiegelenseRunResponder } from '../../responders/siegelense/run/siegelense-run-responder';
import { SiegelenseStartResponder } from '../../responders/siegelense/start/siegelense-start-responder';
import { SiegelenseStatusResponder } from '../../responders/siegelense/status/siegelense-status-responder';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseHelpStatics } from '../../statics/siegelense-help/siegelense-help-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { cleanupArgsParseTransformer } from '../../transformers/cleanup-args-parse/cleanup-args-parse-transformer';
import { compareArgsParseTransformer } from '../../transformers/compare-args-parse/compare-args-parse-transformer';
import { flagContractParseTransformer } from '../../transformers/flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../../transformers/flag-value-read/flag-value-read-transformer';
import { killArgsParseTransformer } from '../../transformers/kill-args-parse/kill-args-parse-transformer';
import { resultsArgsParseTransformer } from '../../transformers/results-args-parse/results-args-parse-transformer';
import { siegelenseHelpRenderTransformer } from '../../transformers/siegelense-help-render/siegelense-help-render-transformer';
import type { SiegelenseCall } from '../../transformers/siegelense-help-render/siegelense-help-render-transformer';
import { startArgsParseTransformer } from '../../transformers/start-args-parse/start-args-parse-transformer';
import { statusArgsParseTransformer } from '../../transformers/status-args-parse/status-args-parse-transformer';

const HELP_FLAG = siegelenseOutputStatics.flags.help;
const HELP_SHORT_FLAG = siegelenseOutputStatics.flags.helpShort;
const HUMAN_FLAG = siegelenseOutputStatics.flags.human;
const DRIVER_CALL_NAME = 'driver';
const INSTANCE_FLAG = '--instance';
const IDLE_TIMEOUT_MS_FLAG = '--idle-timeout-ms';
const USAGE =
  'Usage: dungeonmaster siegelense [--help | start | run | results | kill | status | cleanup | compare | driver --instance <instanceId>]';

const CALL_ROUTES = new Map<
  SiegelenseCall,
  (callArgs: readonly string[]) => Promise<AdapterResult>
>([
  [
    'start',
    async (callArgs) => SiegelenseStartResponder(startArgsParseTransformer({ args: callArgs })),
  ],
  ['run', async (callArgs) => SiegelenseRunResponder({ args: callArgs })],
  [
    'results',
    async (callArgs) =>
      SiegelenseResultsResponder({ query: resultsArgsParseTransformer({ args: callArgs }) }),
  ],
  [
    'kill',
    async (callArgs) => SiegelenseKillResponder(killArgsParseTransformer({ args: callArgs })),
  ],
  [
    'status',
    async (callArgs) => SiegelenseStatusResponder(statusArgsParseTransformer({ args: callArgs })),
  ],
  [
    'cleanup',
    async (callArgs) => SiegelenseCleanupResponder(cleanupArgsParseTransformer({ args: callArgs })),
  ],
  [
    'compare',
    async (callArgs) =>
      SiegelenseCompareResponder({ query: compareArgsParseTransformer({ args: callArgs }) }),
  ],
]);

// Derived from each call's own help entry — never a second hardcoded ['status', 'cleanup'] —
// so the ONLY two calls this admits are the ones whose page actually documents a --human flag.
const BUILT_CALL_NAMES = [...CALL_ROUTES.keys()];
const HUMAN_RENDERER_CALLS = BUILT_CALL_NAMES.filter((name) =>
  siegelenseHelpStatics.calls[name].flags.some((flag) => flag.name === HUMAN_FLAG),
);

export const SiegelenseFlow = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
  const [callName, ...callArgs] = args;

  if (callName === HELP_FLAG || callName === HELP_SHORT_FLAG) {
    process.stdout.write(siegelenseHelpRenderTransformer({ call: null }));
    return adapterResultContract.parse({ success: true });
  }

  if (callName === DRIVER_CALL_NAME) {
    const rawInstanceId = flagValueReadTransformer({ args: callArgs, flag: INSTANCE_FLAG });
    if (rawInstanceId === null) {
      throw new Error(`${INSTANCE_FLAG} is required: name the instance to drive.`);
    }
    const instanceId = flagContractParseTransformer({
      flag: INSTANCE_FLAG,
      parse: () => instanceIdContract.parse(rawInstanceId),
    });

    const rawIdleTimeoutMs = flagValueReadTransformer({
      args: callArgs,
      flag: IDLE_TIMEOUT_MS_FLAG,
    });
    if (rawIdleTimeoutMs === null) {
      return SiegelenseDriverResponder({ instanceId });
    }
    const idleTimeoutMs = flagContractParseTransformer({
      flag: IDLE_TIMEOUT_MS_FLAG,
      parse: () => timeoutMsContract.parse(Number(rawIdleTimeoutMs)),
    });
    return SiegelenseDriverResponder({ instanceId, idleTimeoutMs });
  }

  const call = callName === undefined ? undefined : (callName as SiegelenseCall);
  const routeHandler = call === undefined ? undefined : CALL_ROUTES.get(call);

  if (call !== undefined && routeHandler !== undefined) {
    if (callArgs.includes(HELP_FLAG) || callArgs.includes(HELP_SHORT_FLAG)) {
      process.stdout.write(siegelenseHelpRenderTransformer({ call }));
      return adapterResultContract.parse({ success: true });
    }

    if (callArgs.includes(HUMAN_FLAG) && !HUMAN_RENDERER_CALLS.includes(call)) {
      throw new Error(
        `${HUMAN_FLAG} is not implemented for ${call}: only ${HUMAN_RENDERER_CALLS.join(' and ')} ` +
          `render a human table; every other call answers JSON only.`,
      );
    }

    return routeHandler(callArgs);
  }

  if (
    callName !== undefined &&
    siegelenseCallStatics.calls.names.some((name) => name === callName)
  ) {
    throw new Error(
      `${callName} is a siegelense call but is not built yet. Built calls: ` +
        `${BUILT_CALL_NAMES.join(', ')}.`,
    );
  }

  if (callName !== undefined) {
    throw new Error(`Unknown siegelense subcommand: ${callName}\n\n${USAGE}`);
  }

  return SiegelenseFleetResponder();
};
