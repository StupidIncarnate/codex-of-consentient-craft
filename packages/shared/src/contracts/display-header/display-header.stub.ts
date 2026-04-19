import { displayHeaderContract, type DisplayHeader } from './display-header-contract';

export const DisplayHeaderStub = (
  { value }: { value: string } = { value: 'QUEST CREATED' },
): DisplayHeader => displayHeaderContract.parse(value);
