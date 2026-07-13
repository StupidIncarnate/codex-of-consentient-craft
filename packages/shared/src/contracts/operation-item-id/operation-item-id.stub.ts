import { operationItemIdContract } from './operation-item-id-contract';
import type { OperationItemId } from './operation-item-id-contract';

export const OperationItemIdStub = (
  { value }: { value: string } = { value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' },
): OperationItemId => operationItemIdContract.parse(value);
