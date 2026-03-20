import { wardRunIdContract } from './ward-run-id-contract';
import type { WardRunId } from './ward-run-id-contract';

export const WardRunIdStub = (
  { value }: { value: string } = { value: '1773805659495-stub' },
): WardRunId => wardRunIdContract.parse(value);
