import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RepoLocalPathStub } from '../repo-local-path/repo-local-path.stub';
import { killResultContract } from './kill-result-contract';
import type { KillResult } from './kill-result-contract';

export const KillResultStub = ({ ...props }: StubArgument<KillResult> = {}): KillResult =>
  killResultContract.parse({
    instanceId: InstanceIdStub(),
    stopped: true,
    portsReleased: [34_172, 34_173],
    homeRemoved: true,
    evidenceKept: RepoLocalPathStub({
      path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
    }),
    reapedPgids: [],
    ...props,
  });
