import type { StubArgument } from '@dungeonmaster/shared/@types';

import { healthSnapshotContract } from './health-snapshot-contract';
import type { HealthSnapshot } from './health-snapshot-contract';

export const HealthSnapshotStub = ({
  ...props
}: StubArgument<HealthSnapshot> = {}): HealthSnapshot =>
  healthSnapshotContract.parse({
    status: 'ok',
    timestamp: '2026-05-05T13:00:00.000Z',
    uptimeSeconds: 745,
    version: '0.1.0',
    port: 3737,
    home: '/home/user/.dungeonmaster',
    orchestrationMode: 'claude',
    ...props,
  });
