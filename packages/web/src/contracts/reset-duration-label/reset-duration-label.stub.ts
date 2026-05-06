import { resetDurationLabelContract } from './reset-duration-label-contract';
import type { ResetDurationLabel } from './reset-duration-label-contract';

export const ResetDurationLabelStub = (
  { value }: { value: string } = { value: '2h5m' },
): ResetDurationLabel => resetDurationLabelContract.parse(value);
