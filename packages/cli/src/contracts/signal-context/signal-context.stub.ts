/**
 * PURPOSE: Stub factory for SignalContext branded type
 *
 * USAGE:
 * const context = SignalContextStub();
 * // Returns: 'Gathering authentication requirements'
 */

import { signalContextContract } from './signal-context-contract';
import type { SignalContext } from './signal-context-contract';

export const SignalContextStub = (
  { value }: { value: string } = { value: 'Gathering authentication requirements' },
): SignalContext => signalContextContract.parse(value);
