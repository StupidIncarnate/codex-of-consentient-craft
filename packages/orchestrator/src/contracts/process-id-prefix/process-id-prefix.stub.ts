import { processIdPrefixContract } from './process-id-prefix-contract';

type ProcessIdPrefix = ReturnType<typeof processIdPrefixContract.parse>;

export const ProcessIdPrefixStub = (
  { value }: { value: 'chat' | 'proc' } = { value: 'proc' },
): ProcessIdPrefix => processIdPrefixContract.parse(value);
