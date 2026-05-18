/**
 * PURPOSE: Validates and returns signal data for agent-to-CLI communication.
 * Requires explicit { questId, workItemId, signal, summary? } from the caller.
 * Routing on these ids replaces the legacy process-state inference path.
 *
 * USAGE:
 * const result = signalBackBroker({ input: { questId, workItemId, signal: 'complete', summary: '...' } });
 * // Returns { success: true, signal: { questId, workItemId, signal: 'complete', summary: '...' } }
 */

import { signalBackInputContract } from '../../../contracts/signal-back-input/signal-back-input-contract';
import { signalBackResultContract } from '../../../contracts/signal-back-result/signal-back-result-contract';
import type { SignalBackResult } from '../../../contracts/signal-back-result/signal-back-result-contract';

export const signalBackBroker = ({ input }: { input: unknown }): SignalBackResult => {
  const validatedSignal = signalBackInputContract.parse(input);

  return signalBackResultContract.parse({
    success: true,
    signal: validatedSignal,
  });
};
