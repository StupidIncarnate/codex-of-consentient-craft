import type { StubArgument } from '@dungeonmaster/shared/@types';
import { processIdParamsContract } from './process-id-params-contract';
import type { ProcessIdParams } from './process-id-params-contract';

export const ProcessIdParamsStub = ({
  ...props
}: StubArgument<ProcessIdParams> = {}): ProcessIdParams =>
  processIdParamsContract.parse({
    processId: 'proc-12345',
    ...props,
  });
