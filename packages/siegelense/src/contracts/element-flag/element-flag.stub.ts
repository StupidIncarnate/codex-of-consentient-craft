import { elementFlagContract } from './element-flag-contract';
import type { ElementFlag } from './element-flag-contract';

export const ElementFlagStub = (
  { value }: { value: string } = { value: 'disabled' },
): ElementFlag => elementFlagContract.parse(value);
