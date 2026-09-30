import type { WardRunResult } from '../ward-result/ward-result-contract';
import { wardRunResultContract } from '../ward-result/ward-result-contract';

export const RunIdStub = (
  { value }: { value: string } = { value: '1739625600000-a3f1' },
): WardRunResult['runId'] => wardRunResultContract.shape.runId.parse(value);
