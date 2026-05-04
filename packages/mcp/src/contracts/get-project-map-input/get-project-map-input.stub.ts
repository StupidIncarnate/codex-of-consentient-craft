import { getProjectMapInputContract } from './get-project-map-input-contract';
import type { GetProjectMapInput } from './get-project-map-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const GetProjectMapInputStub = ({
  ...props
}: StubArgument<GetProjectMapInput> = {}): GetProjectMapInput =>
  getProjectMapInputContract.parse({
    packages: ['mcp'],
    ...props,
  });
