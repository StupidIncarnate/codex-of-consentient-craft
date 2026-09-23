import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questWorkInstanceContract } from './quest-work-instance-contract';
import type { QuestWorkInstance } from './quest-work-instance-contract';

export const QuestWorkInstanceStub = ({
  ...props
}: StubArgument<QuestWorkInstance> = {}): QuestWorkInstance =>
  questWorkInstanceContract.parse({
    instanceId: 'inst_7f3a9c21',
    baseUrl: 'http://localhost:34173',
    apiUrl: null,
    home: '/tmp/dm-siege-inst_7f3a9c21',
    logs: {
      api: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/api-server.log',
      web: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/web-server.log',
    },
    ...props,
  });
