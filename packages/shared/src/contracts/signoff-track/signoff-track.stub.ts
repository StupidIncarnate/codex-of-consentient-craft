import { signoffTrackContract } from './signoff-track-contract';
import type { SignoffTrack } from './signoff-track-contract';

export const SignoffTrackStub = (
  { value }: { value: string } = { value: 'flowrider' },
): SignoffTrack => signoffTrackContract.parse(value);
