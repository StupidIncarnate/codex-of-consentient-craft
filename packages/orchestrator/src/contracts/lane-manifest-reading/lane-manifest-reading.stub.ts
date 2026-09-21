import type { StubArgument } from '@dungeonmaster/shared/@types';

import { laneManifestReadingContract } from './lane-manifest-reading-contract';
import type { LaneManifestReading } from './lane-manifest-reading-contract';

export const LaneManifestReadingStub = ({
  ...props
}: StubArgument<LaneManifestReading> = {}): LaneManifestReading =>
  laneManifestReadingContract.parse({
    instanceId: 'inst_7f3a9c21',
    baseUrl: 'http://localhost:34173',
    home: '/tmp/dm-siege-inst_7f3a9c21',
    logs: {
      api: {
        path: '/repo/.siegelense/g1/instances/inst_7f3a9c21/api-server.log',
        linkPresent: true,
      },
      web: {
        path: '/repo/.siegelense/g1/instances/inst_7f3a9c21/web-server.log',
        linkPresent: true,
      },
    },
    ...props,
  });
