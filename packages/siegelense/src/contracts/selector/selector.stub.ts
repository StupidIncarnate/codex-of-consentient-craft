import { selectorContract } from './selector-contract';
import type { Selector } from './selector-contract';

export const SelectorStub = (
  { value }: { value: string } = { value: '[data-testid="GUILD_ADD"]' },
): Selector => selectorContract.parse(value);
