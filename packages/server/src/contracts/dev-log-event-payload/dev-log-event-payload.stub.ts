import type { StubArgument } from '@dungeonmaster/shared/@types';
import { devLogEventPayloadContract } from './dev-log-event-payload-contract';
import type { DevLogEventPayload } from './dev-log-event-payload-contract';

export const DevLogEventPayloadStub = ({
  ...props
}: StubArgument<DevLogEventPayload> = {}): DevLogEventPayload =>
  devLogEventPayloadContract.parse({ ...props });
