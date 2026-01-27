import { stdoutContract } from './stdout-contract';

type Stdout = ReturnType<typeof stdoutContract.parse>;

export const StdoutStub = ({ value }: { value?: string } = {}): Stdout =>
  stdoutContract.parse(value ?? '');
