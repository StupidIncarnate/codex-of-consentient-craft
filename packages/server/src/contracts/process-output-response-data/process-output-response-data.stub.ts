import type { StubArgument } from '@dungeonmaster/shared/@types';
import { processOutputResponseDataContract } from './process-output-response-data-contract';
import type { ProcessOutputResponseData } from './process-output-response-data-contract';

export const ProcessOutputResponseDataStub = ({
  ...props
}: StubArgument<ProcessOutputResponseData> = {}): ProcessOutputResponseData =>
  processOutputResponseDataContract.parse({
    slots: {},
    ...props,
  });
