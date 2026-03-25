/**
 * PURPOSE: Extracts a StreamSignal from a StreamJsonLine by delegating to signalFromStreamTransformer
 *
 * USAGE:
 * signalExtractorTransformer({ line: StreamJsonLineStub({ value: '{"type":"assistant",...}' }) });
 * // Returns { signal: StreamSignal } if found, { signal: null } otherwise
 */

import type { StreamJsonLine } from '@dungeonmaster/shared/contracts';
import type { StreamSignal } from '../../contracts/stream-signal/stream-signal-contract';
import { signalFromStreamTransformer } from '../signal-from-stream/signal-from-stream-transformer';

export const signalExtractorTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): { signal: StreamSignal | null } => {
  const signal = signalFromStreamTransformer({ line });
  return { signal };
};
