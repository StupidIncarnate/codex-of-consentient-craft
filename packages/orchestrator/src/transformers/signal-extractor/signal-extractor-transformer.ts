/**
 * PURPOSE: Extracts a StreamSignal from a normalized Claude line object by delegating to signalFromStreamTransformer
 *
 * USAGE:
 * signalExtractorTransformer({ parsed: {type:'assistant',...} });
 * // Returns { signal: StreamSignal } if found, { signal: null } otherwise
 */

import { signalExtractorContract } from '../../contracts/signal-extractor/signal-extractor-contract';
import type { SignalExtractor } from '../../contracts/signal-extractor/signal-extractor-contract';
import { signalFromStreamTransformer } from '../signal-from-stream/signal-from-stream-transformer';

export const signalExtractorTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): SignalExtractor => {
  const signal = signalFromStreamTransformer({ parsed });
  return signalExtractorContract.parse({ signal });
};
