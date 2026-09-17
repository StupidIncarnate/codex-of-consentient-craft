import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { AgyStopHookData } from './agy-stop-hook-data-contract';
import { agyStopHookDataContract } from './agy-stop-hook-data-contract';

export const AgyStopHookDataStub = ({
  ...props
}: StubArgument<AgyStopHookData> = {}): AgyStopHookData =>
  agyStopHookDataContract.parse({
    fullyIdle: true,
    terminationReason: 'model_stop',
    ...props,
  });
