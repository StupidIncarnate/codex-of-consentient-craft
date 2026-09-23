import type { StubArgument } from '@dungeonmaster/shared/@types';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { RepoLocalPathStub } from '../repo-local-path/repo-local-path.stub';
import { SpecNameStub } from '../spec-name/spec-name.stub';
import { instanceManifestContract } from './instance-manifest-contract';
import type { InstanceManifest } from './instance-manifest-contract';

export const InstanceManifestStub = ({
  ...props
}: StubArgument<InstanceManifest> = {}): InstanceManifest =>
  instanceManifestContract.parse({
    instanceId: InstanceIdStub(),
    specName: SpecNameStub(),
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
    queuedMs: EpochMsStub({ value: 34_000 }),
    aheadOfMe: ReadingCountStub({ value: 2 }),
    bootMs: EpochMsStub({ value: 21_000 }),
    ...props,
  });
