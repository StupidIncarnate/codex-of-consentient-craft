import { signoffDenominatorTrackContract } from './signoff-denominator-track-contract';
import type { SignoffDenominatorTrack } from './signoff-denominator-track-contract';

export const SignoffDenominatorTrackStub = (
  { value }: { value: string } = { value: 'flowrider' },
): SignoffDenominatorTrack => signoffDenominatorTrackContract.parse(value);
