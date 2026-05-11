import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import {
  capturedOrchestrationEmitContract,
  type CapturedOrchestrationEmit,
} from './captured-orchestration-emit-contract';

export const CapturedOrchestrationEmitStub = ({
  ...props
}: StubArgument<CapturedOrchestrationEmit> = {}): CapturedOrchestrationEmit =>
  capturedOrchestrationEmitContract.parse({
    processId: ProcessIdStub({ value: 'proc-aaaaaaaa-1111-4222-9333-444444444444' }),
    payload: {},
    ...props,
  });
