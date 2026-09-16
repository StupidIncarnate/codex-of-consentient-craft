import { instanceOwnerContract } from './instance-owner-contract';
import type { InstanceOwner } from './instance-owner-contract';

export const InstanceOwnerStub = (
  { value }: { value: string } = { value: '42781' },
): InstanceOwner => instanceOwnerContract.parse(value);
