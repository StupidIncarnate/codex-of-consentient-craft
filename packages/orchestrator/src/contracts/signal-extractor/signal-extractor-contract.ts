/**
 * PURPOSE: Defines the data `signalExtractorTransformer` returns
 *
 * USAGE:
 * signalExtractorContract.parse(value);
 * // Returns validated SignalExtractor
 */
import { z } from '#gateway/npm/zod';
import { streamSignalContract } from '../stream-signal/stream-signal-contract';

export const signalExtractorContract = z
  .object({ signal: streamSignalContract.nullable() })
  .brand<'SignalExtractor'>();

export type SignalExtractor = z.infer<typeof signalExtractorContract>;
