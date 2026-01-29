import { processIdContract, type ProcessId } from './process-id-contract';

export const ProcessIdStub = ({ value }: { value: number } = { value: 12345 }): ProcessId =>
  processIdContract.parse(value);
