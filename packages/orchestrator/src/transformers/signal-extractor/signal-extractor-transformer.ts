/**
 * PURPOSE: Extracts a StreamSignal from a normalized Claude line object by delegating to signalFromStreamTransformer
 *
 * USAGE:
 * signalExtractorTransformer({ parsed: {type:'assistant',...} });
 * // Returns { signal: StreamSignal } if found, { signal: null } otherwise
 */

import type { StreamSignal } from '../../contracts/stream-signal/stream-signal-contract';
import { signalFromStreamTransformer } from '../signal-from-stream/signal-from-stream-transformer';

export const signalExtractorTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): { signal: StreamSignal | null } => {
  const signal = signalFromStreamTransformer({ parsed });
  return { signal };
};
