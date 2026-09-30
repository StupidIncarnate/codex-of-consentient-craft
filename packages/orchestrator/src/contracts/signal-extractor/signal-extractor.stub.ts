/**
 * PURPOSE: Builds a valid SignalExtractor for tests
 *
 * USAGE:
 * SignalExtractorStub();
 * // Returns a valid SignalExtractor
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

import { signalExtractorContract } from './signal-extractor-contract';
import type { SignalExtractor } from './signal-extractor-contract';

export const SignalExtractorStub = ({
  ...props
}: StubArgument<SignalExtractor> = {}): SignalExtractor =>
  signalExtractorContract.parse({ signal: StreamSignalStub(), ...props });
