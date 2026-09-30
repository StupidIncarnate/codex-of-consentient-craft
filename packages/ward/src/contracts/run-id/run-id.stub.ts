import type { WardResult } from '../ward-result/ward-result-contract';
import { wardResultContract } from '../ward-result/ward-result-contract';

export const RunIdStub = ({ value }: { value: string } = { value: '1739625600000-a3f1' }): WardResult['runId'] =>
  wardResultContract.shape.runId.parse(value);
