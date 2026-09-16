import type { z } from 'zod';

import { instanceStateContract } from './instance-state-contract';
import type { InstanceState } from './instance-state-contract';

type InstanceStateInput = z.input<typeof instanceStateContract>;

export const InstanceStateStub = ({ value }: { value?: InstanceStateInput } = {}): InstanceState =>
  instanceStateContract.parse(value ?? 'alive');
