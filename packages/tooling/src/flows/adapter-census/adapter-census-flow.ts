/**
 * PURPOSE: Orchestrates the adapter census by delegating to the run responder
 *
 * USAGE:
 * await AdapterCensusFlow({ args: process.argv.slice(2) });
 * // Prints the census to stdout
 */

import { AdapterCensusRunResponder } from '../../responders/adapter-census/run/adapter-census-run-responder';

type ResponderParams = Parameters<typeof AdapterCensusRunResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof AdapterCensusRunResponder>>;

export const AdapterCensusFlow = async ({ args }: ResponderParams): Promise<ResponderResult> =>
  AdapterCensusRunResponder({ args });
