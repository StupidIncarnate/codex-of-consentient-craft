import type { z } from 'zod';

import { shotOpenReasonContract } from './shot-open-reason-contract';
import type { ShotOpenReason } from './shot-open-reason-contract';

type ShotOpenReasonInput = z.input<typeof shotOpenReasonContract>;

export const ShotOpenReasonStub = ({
  value,
}: { value?: ShotOpenReasonInput } = {}): ShotOpenReason =>
  shotOpenReasonContract.parse(value ?? 'start');
