import { processOutputContract } from './process-output-contract';
import type { ProcessOutput } from './process-output-contract';

export const ProcessOutputStub = ({ value }: { value: string } = { value: '' }): ProcessOutput =>
  processOutputContract.parse(value);
