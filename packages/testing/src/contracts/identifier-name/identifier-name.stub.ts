import { identifierNameContract } from './identifier-name-contract';

export const IdentifierNameStub = (
  { value }: { value: string } = { value: 'execFile' },
): ReturnType<typeof identifierNameContract.parse> => identifierNameContract.parse(value);
