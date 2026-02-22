/**
 * PURPOSE: Validates and returns signal data for agent-to-CLI communication
 *
 * USAGE:
 * const result = signalBackBroker({ input: { signal: 'complete', stepId: '...', summary: '...' } });
 * // Returns { success: true, signal: { signal: 'complete', stepId: '...', summary: '...' } }
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
