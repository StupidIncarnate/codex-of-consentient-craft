import { stderrContract } from './stderr-contract';

type Stderr = ReturnType<typeof stderrContract.parse>;

export const StderrStub = ({ value }: { value?: string } = {}): Stderr =>
  stderrContract.parse(value ?? '');
