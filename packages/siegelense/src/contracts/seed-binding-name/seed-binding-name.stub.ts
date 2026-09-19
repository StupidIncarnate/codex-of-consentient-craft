import { seedBindingNameContract } from './seed-binding-name-contract';
import type { SeedBindingName } from './seed-binding-name-contract';

export const SeedBindingNameStub = (
  { value }: { value: string } = { value: 'g' },
): SeedBindingName => seedBindingNameContract.parse(value);
