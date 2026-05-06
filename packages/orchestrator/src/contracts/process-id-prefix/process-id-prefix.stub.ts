import { processIdPrefixContract } from './process-id-prefix-contract';

type ProcessIdPrefix = ReturnType<typeof processIdPrefixContract.parse>;

export const ProcessIdPrefixStub = (
  { value }: { value: 'chat' | 'design' | 'proc' } = { value: 'proc' },
): ProcessIdPrefix => processIdPrefixContract.parse(value);
