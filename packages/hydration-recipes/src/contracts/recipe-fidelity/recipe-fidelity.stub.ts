import { recipeFidelityContract } from './recipe-fidelity-contract';
import type { RecipeFidelity } from './recipe-fidelity-contract';

export const RecipeFidelityStub = (
  { value }: { value: string } = { value: 'direct' },
): RecipeFidelity => recipeFidelityContract.parse(value);
