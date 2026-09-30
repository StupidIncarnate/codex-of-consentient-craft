import type { StubArgument } from '@dungeonmaster/shared/@types';
import { toolingSmoketestStateResponseDataContract } from './tooling-smoketest-state-response-data-contract';
import type { ToolingSmoketestStateResponseData } from './tooling-smoketest-state-response-data-contract';

export const ToolingSmoketestStateResponseDataStub = ({
  ...props
}: StubArgument<ToolingSmoketestStateResponseData> = {}): ToolingSmoketestStateResponseData =>
  toolingSmoketestStateResponseDataContract.parse({
    active: null,
    events: [],
    ...props,
  });
