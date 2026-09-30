import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../process-group-id/process-group-id.stub';
import { instanceHeartbeatContract } from './instance-heartbeat-contract';
import type { InstanceHeartbeat } from './instance-heartbeat-contract';

export const InstanceHeartbeatStub = ({
  ...props
}: StubArgument<InstanceHeartbeat> = {}): InstanceHeartbeat =>
  instanceHeartbeatContract.parse({
    instanceId: InstanceIdStub(),
    pid: 'proc-12345',
    pgids: [ProcessGroupIdStub()],
    beatAtMs: 1,
    rssMB: null,
    ...props,
  });
