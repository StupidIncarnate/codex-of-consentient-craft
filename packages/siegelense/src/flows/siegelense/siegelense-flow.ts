/**
 * PURPOSE: Routes `dungeonmaster siegelense`'s calls. `--help`/`-h` is checked BEFORE any parsing —
 * bare, it prints the index; after a built call's name, that call's own page — so a caller piping
 * stdout gets the help it asked for rather than a refusal (siegelense-tooling.md §3.F). `driver
 * --instance <id> [--idle-timeout-ms <ms>]` sits outside the twelve-call surface entirely —
 * internal, spawned by `start`, never typed by a person — and keeps its own `--instance`/
 * `--idle-timeout-ms` reads, now through the shared `flagValueReadTransformer` rather than a second
 * `indexOf` dance, and its own value parses through `flagContractParseTransformer` so a badly-shaped
 * id or ceiling answers with the contract's own message under its own flag rather than a raw
 * ZodError. `--idle-timeout-ms` is OPTIONAL here exactly as it is on `start` — `start` only carries
 * it through to this same flag when a caller named one. Before either read, `callArgs` is scanned
 * against `DRIVER_KNOWN_FLAGS` (DEF-50) so a mistyped flag is refused BY NAME — the same "Unknown
 * flag: X\n\nAccepted flags: Y" shape every built call's own args-parse transformer throws, reusing
 * this file's own `USAGE` line rather than a driver-specific one — instead of falling through to
 * `--instance is required`, which named the wrong problem. Every other built call goes
 * through `CALL_ROUTES`, a `Map` keyed by the same names `siegelenseHelpStatics.calls` holds.
 * **A `CALL_ROUTES` entry names ONE layer flow and does nothing else.** One file per call, each
 * owning that call's whole argument surface and carrying its own `.integration.test.ts` beside it —
 * so parsing, responder choice and per-call shaping live in the layer, never here, and this file
 * stays a routing table a reader takes in at a glance however many calls it holds. Each built call's
 * own args-parse transformer owns its known-flag set (`KNOWN_FLAGS`) and refuses anything outside
 * it — this flow routes `callArgs` straight through without inspecting or refusing any flag itself.
 * `args[0]` outside `CALL_ROUTES` falls through a two-way refusal: a name answers "unknown
 * subcommand" with the usage line; absent routes to `SiegelenseStatusLayerFlow` with an empty
 * `callArgs` — the SAME call `status` with no flags reaches, so a bare invocation prints the
 * identical table (columns, `--since` window) rather than a second fleet view of its own. Also
 * registers ONE listener for `process.stdout`'s `error` event here, before any routing, guarded by
 * a module-level flag this function alone sets — never `process.stdout.listenerCount('error') ===
 * 0`, which measured 2 even before this function ever ran (Node's own internal pipe-cleanup
 * listeners from an unrelated `.pipe(process.stdout)` upstream), so that count can never tell
 * whether THIS listener is the one missing. The flag keeps a repeat call (every test in this
 * file, chiefly) from stacking a second listener. A caller piping any siegelense output into a
 * command that exits early — `head`, chiefly, and agents reach for it constantly — closes the read
 * end of that pipe; Node's default for an unhandled `error` event is to throw and crash the process
 * with a raw stack trace, even though nothing the CLI did failed. An `EPIPE` there means the reader
 * is gone, so it is swallowed; any other code still throws, same as before this listener existed.
 * Lives here, in the flow every call funnels through, rather than in `start-siegelense.ts` — a
 * startup file must not branch, and this needs an `if` both to guard the flag and to tell EPIPE
 * apart from everything else.
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
 * // Routes to SiegelenseStatusLayerFlow with no flags — the same table `status` prints
 */

import { adapterResultContract, timeoutMsContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { SiegelenseDriverResponder } from '../../responders/siegelense/driver/siegelense-driver-responder';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../../transformers/flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../../transformers/flag-value-read/flag-value-read-transformer';
import { siegelenseHelpRenderTransformer } from '../../transformers/siegelense-help-render/siegelense-help-render-transformer';
import type { SiegelenseCall } from '../../transformers/siegelense-help-render/siegelense-help-render-transformer';
import { SiegelenseCapacityLayerFlow } from './siegelense-capacity-layer-flow';
import { SiegelenseCleanupLayerFlow } from './siegelense-cleanup-layer-flow';
import { SiegelenseCompareLayerFlow } from './siegelense-compare-layer-flow';
import { SiegelenseDocsLayerFlow } from './siegelense-docs-layer-flow';
import { SiegelenseKillLayerFlow } from './siegelense-kill-layer-flow';
import { SiegelensePruneLayerFlow } from './siegelense-prune-layer-flow';
import { SiegelenseRecipesLayerFlow } from './siegelense-recipes-layer-flow';
import { SiegelenseResultsLayerFlow } from './siegelense-results-layer-flow';
import { SiegelenseRunLayerFlow } from './siegelense-run-layer-flow';
import { SiegelenseSnapshotsLayerFlow } from './siegelense-snapshots-layer-flow';
import { SiegelenseStartLayerFlow } from './siegelense-start-layer-flow';
import { SiegelenseStatusLayerFlow } from './siegelense-status-layer-flow';

const HELP_FLAG = siegelenseOutputStatics.flags.help;
const HELP_SHORT_FLAG = siegelenseOutputStatics.flags.helpShort;
const DRIVER_CALL_NAME = 'driver';
const INSTANCE_FLAG = '--instance';
const IDLE_TIMEOUT_MS_FLAG = '--idle-timeout-ms';
const DRIVER_KNOWN_FLAGS = [INSTANCE_FLAG, IDLE_TIMEOUT_MS_FLAG] as const;
const USAGE =
  'Usage: dungeonmaster siegelense [--help | start | run | results | kill | capacity | status | ' +
  'cleanup | prune | compare | snapshots | recipes | docs | driver --instance <instanceId>]';
const STDOUT_ERROR_EVENT = 'error';
const EPIPE_ERROR_CODE = 'EPIPE';

let isEpipeGuardInstalled = false;

const CALL_ROUTES = new Map<
  SiegelenseCall,
  (callArgs: readonly string[]) => Promise<AdapterResult>
>([
  ['start', async (callArgs) => SiegelenseStartLayerFlow({ callArgs })],
  ['run', async (callArgs) => SiegelenseRunLayerFlow({ callArgs })],
  ['results', async (callArgs) => SiegelenseResultsLayerFlow({ callArgs })],
  ['kill', async (callArgs) => SiegelenseKillLayerFlow({ callArgs })],
  ['capacity', async (callArgs) => SiegelenseCapacityLayerFlow({ callArgs })],
  ['status', async (callArgs) => SiegelenseStatusLayerFlow({ callArgs })],
  ['cleanup', async (callArgs) => SiegelenseCleanupLayerFlow({ callArgs })],
  ['prune', async (callArgs) => SiegelensePruneLayerFlow({ callArgs })],
  ['compare', async (callArgs) => SiegelenseCompareLayerFlow({ callArgs })],
  ['snapshots', async (callArgs) => SiegelenseSnapshotsLayerFlow({ callArgs })],
  ['recipes', async (callArgs) => SiegelenseRecipesLayerFlow({ callArgs })],
  ['docs', async (callArgs) => SiegelenseDocsLayerFlow({ callArgs })],
]);

export const SiegelenseFlow = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
  if (!isEpipeGuardInstalled) {
    isEpipeGuardInstalled = true;
    process.stdout.on(STDOUT_ERROR_EVENT, (error: NodeJS.ErrnoException) => {
      if (error.code !== EPIPE_ERROR_CODE) {
        throw error;
      }
    });
  }

  const [callName, ...callArgs] = args;

  if (callName === HELP_FLAG || callName === HELP_SHORT_FLAG) {
    process.stdout.write(siegelenseHelpRenderTransformer({ call: null }));
    return adapterResultContract.parse({ success: true });
  }

  if (callName === DRIVER_CALL_NAME) {
    for (let i = 0; i < callArgs.length; i++) {
      const arg = callArgs[i];

      if (arg === INSTANCE_FLAG || arg === IDLE_TIMEOUT_MS_FLAG) {
        // A following token that looks like a flag is not this flag's value — leave it for the
        // next iteration, so a missing value is refused naming THIS flag, never a token further
        // on (same shape as every built call's own args-parse transformer, e.g.
        // statusArgsParseTransformer).
        const nextToken = callArgs[i + 1];
        if (nextToken !== undefined && !nextToken.startsWith('--')) {
          i++;
        }
        continue;
      }

      if (arg?.startsWith('--')) {
        throw new Error(
          `Unknown flag: ${arg}\n\nAccepted flags: ${DRIVER_KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
        );
      }
    }

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

    return routeHandler(callArgs);
  }

  if (callName !== undefined) {
    throw new Error(`Unknown siegelense subcommand: ${callName}\n\n${USAGE}`);
  }

  return SiegelenseStatusLayerFlow({ callArgs: [] });
};
