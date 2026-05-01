import { getProjectInventoryInputContract } from './get-project-inventory-input-contract';
import type { GetProjectInventoryInput } from './get-project-inventory-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GetProjectInventoryInputStub = ({
  ...props
}: StubArgument<GetProjectInventoryInput> = {}): GetProjectInventoryInput =>
  getProjectInventoryInputContract.parse({
    packageName: 'web',
    ...props,
  });
