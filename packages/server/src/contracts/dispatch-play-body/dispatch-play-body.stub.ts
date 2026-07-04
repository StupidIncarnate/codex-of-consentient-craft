import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dispatchPlayBodyContract } from './dispatch-play-body-contract';
import type { DispatchPlayBody } from './dispatch-play-body-contract';

export const DispatchPlayBodyStub = ({
  ...props
}: StubArgument<DispatchPlayBody> = {}): DispatchPlayBody =>
  dispatchPlayBodyContract.parse({ ...props });
