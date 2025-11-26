import { importPathContract } from './import-path-contract';

export const ImportPathStub = (
  { value }: { value: string } = { value: './test' },
): ReturnType<typeof importPathContract.parse> => importPathContract.parse(value);
