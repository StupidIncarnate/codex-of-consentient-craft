import { moduleNameContract } from './module-name-contract';

export const ModuleNameStub = (
  { value }: { value: string } = { value: 'fs' },
): ReturnType<typeof moduleNameContract.parse> => moduleNameContract.parse(value);
