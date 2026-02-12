import { processIdContract } from './process-id-contract';

type ProcessId = ReturnType<typeof processIdContract.parse>;

export const ProcessIdStub = ({ value }: { value: string } = { value: 'proc-12345' }): ProcessId =>
  processIdContract.parse(value);
