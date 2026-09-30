import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RepoLocalPathStub } from '../repo-local-path/repo-local-path.stub';
import { instanceManifestContract } from './instance-manifest-contract';
import type { InstanceManifest } from './instance-manifest-contract';

export const InstanceManifestStub = ({
  ...props
}: StubArgument<InstanceManifest> = {}): InstanceManifest =>
  instanceManifestContract.parse({
    instanceId: InstanceIdStub(),
    specName: 'dungeonmaster-stack',
    baseUrl: 'http://localhost:34173',
    home: '/tmp/dm-siege-inst_7f3a9c21',
    evidence: RepoLocalPathStub({
      path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
    }),
    logs: {
      api: RepoLocalPathStub({
        path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/api-server.log',
      }),
      web: RepoLocalPathStub({
        path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/web-server.log',
      }),
    },
    seeded: null,
    queuedMs: 34_000,
    aheadOfMe: 2,
    bootMs: 21_000,
    ...props,
  });
