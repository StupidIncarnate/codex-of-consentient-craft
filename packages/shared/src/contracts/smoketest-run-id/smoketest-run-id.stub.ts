import { smoketestRunIdContract } from './smoketest-run-id-contract';
import type { SmoketestRunId } from './smoketest-run-id-contract';

export const SmoketestRunIdStub = ({ value }: { value?: SmoketestRunId } = {}): SmoketestRunId =>
  smoketestRunIdContract.parse(value ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
