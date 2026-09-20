import { specNameContract } from './spec-name-contract';
import type { SpecName } from './spec-name-contract';

export const SpecNameStub = (
  { value }: { value: string } = { value: 'dungeonmaster-stack' },
): SpecName => specNameContract.parse(value);
