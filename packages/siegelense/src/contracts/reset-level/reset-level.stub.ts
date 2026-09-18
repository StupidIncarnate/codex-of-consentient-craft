import type { z } from 'zod';

import { resetLevelContract } from './reset-level-contract';
import type { ResetLevel } from './reset-level-contract';

type ResetLevelInput = z.input<typeof resetLevelContract>;

export const ResetLevelStub = ({ value }: { value?: ResetLevelInput } = {}): ResetLevel =>
  resetLevelContract.parse(value ?? 'state');
