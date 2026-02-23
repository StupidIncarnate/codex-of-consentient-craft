import type { StubArgument } from '@dungeonmaster/shared/@types';

import { systemInitStreamLineContract } from './system-init-stream-line-contract';
import type { SystemInitStreamLine } from './system-init-stream-line-contract';

export const SystemInitStreamLineStub = ({
  ...props
}: StubArgument<SystemInitStreamLine> = {}): SystemInitStreamLine =>
  systemInitStreamLineContract.parse({
    type: 'system',
    subtype: 'init',
    session_id: 'session-abc-123',
    ...props,
  });
