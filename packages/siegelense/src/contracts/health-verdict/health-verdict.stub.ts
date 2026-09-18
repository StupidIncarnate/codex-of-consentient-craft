import type { z } from 'zod';

import { healthVerdictContract } from './health-verdict-contract';
import type { HealthVerdict } from './health-verdict-contract';

type HealthVerdictInput = z.input<typeof healthVerdictContract>;

export const HealthVerdictStub = ({ value }: { value?: HealthVerdictInput } = {}): HealthVerdict =>
  healthVerdictContract.parse(value ?? 'HEALTHY');
