import { instanceIdContract, type InstanceId } from './instance-id-contract';

export const InstanceIdStub = (
  { value }: { value: string } = { value: 'inst_7f3a9c21' },
): InstanceId => instanceIdContract.parse(value);
