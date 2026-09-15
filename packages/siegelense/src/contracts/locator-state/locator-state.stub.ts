import type { z } from 'zod';

import { locatorStateContract } from './locator-state-contract';
import type { LocatorState } from './locator-state-contract';

type LocatorStateInput = z.input<typeof locatorStateContract>;

export const LocatorStateStub = ({ value }: { value?: LocatorStateInput } = {}): LocatorState =>
  locatorStateContract.parse(value ?? 'visible');
