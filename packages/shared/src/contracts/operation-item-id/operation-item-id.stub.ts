import type { OperationItem } from '../operation-item/operation-item-contract';
import { operationItemContract } from '../operation-item/operation-item-contract';

export const OperationItemIdStub = (
  { value }: { value: string } = { value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' },
): OperationItem['id'] => {
  const idContract = operationItemContract.shape.id;
  return idContract.parse(value);
};
