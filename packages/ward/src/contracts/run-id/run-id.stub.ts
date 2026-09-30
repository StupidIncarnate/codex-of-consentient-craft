import type { WardRunResult } from '../ward-run-result/ward-run-result-contract';
import { wardRunResultContract } from '../ward-run-result/ward-run-result-contract';

export const RunIdStub = (
  { value }: { value: string } = { value: '1739625600000-a3f1' },
): WardRunResult['runId'] => {
  const runIdContract = wardRunResultContract.shape.runId;
  return runIdContract.parse(value);
};
