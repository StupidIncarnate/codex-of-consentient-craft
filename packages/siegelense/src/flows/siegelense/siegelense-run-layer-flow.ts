/**
 * PURPOSE: The layer flow behind `run`'s route in `SiegelenseFlow`'s `CALL_ROUTES` map. `run` is
 * deliberately the ONE call that hands argv to its responder UNPARSED — every sibling call's own
 * layer runs its own args-parse transformer before calling its responder, but `run` accepts
 * `--steps-file`, the named file has to be read from disk before `runArgsParseTransformer` can run,
 * and `flows/` carries no `adapters/` in its allowed imports, so this flow cannot do that read.
 * `SiegelenseRunResponder` is the one layer that can — its own header says so — and it owns both the
 * disk read and the parse together. Do not move parsing up into this file: that would either
 * duplicate the read `SiegelenseRunResponder` already owns, or hand `runArgsParseTransformer` a
 * `--steps-file` value with no file content behind it.
 *
 * USAGE:
 * await SiegelenseRunLayerFlow({
 *   callArgs: ['--instance', 'inst_7f3a9c21', '--steps', '[{"step":"goto","path":"/"}]'],
 * });
 * // Delegates straight to SiegelenseRunResponder, which parses argv (reading --steps-file itself
 * // first when named) and returns the AdapterResult, or throws
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseRunResponder } from '../../responders/siegelense/run/siegelense-run-responder';

export const SiegelenseRunLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> => SiegelenseRunResponder({ args: callArgs });
