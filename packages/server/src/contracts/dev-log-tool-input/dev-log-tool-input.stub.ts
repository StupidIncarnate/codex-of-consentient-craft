import type { StubArgument } from '@dungeonmaster/shared/@types';
import { devLogToolInputContract } from './dev-log-tool-input-contract';
import type { DevLogToolInput } from './dev-log-tool-input-contract';

export const DevLogToolInputStub = ({
  ...props
}: StubArgument<DevLogToolInput> = {}): DevLogToolInput =>
  devLogToolInputContract.parse({ ...props });
