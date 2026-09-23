import { verificationTrackContract } from './verification-track-contract';
import type { VerificationTrack } from './verification-track-contract';

export const VerificationTrackStub = (
  { value }: { value: string } = { value: 'flowrider' },
): VerificationTrack => verificationTrackContract.parse(value);
