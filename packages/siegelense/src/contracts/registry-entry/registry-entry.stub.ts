import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { InstanceOwnerStub } from '../instance-owner/instance-owner.stub';
import { InstanceStateStub } from '../instance-state/instance-state.stub';
import { PortPairStub } from '../port-pair/port-pair.stub';
import { SpecHashStub } from '../spec-hash/spec-hash.stub';
import { registryEntryContract } from './registry-entry-contract';
import type { RegistryEntry } from './registry-entry-contract';

export const RegistryEntryStub = ({ ...props }: StubArgument<RegistryEntry> = {}): RegistryEntry =>
  registryEntryContract.parse({
    id: InstanceIdStub(),
    owner: InstanceOwnerStub(),
    questId: null,
    guildId: null,
    specName: 'dungeonmaster-stack',
    specHash: SpecHashStub(),
    pid: null,
    pgids: [],
    socketPath: null,
    ports: PortPairStub(),
    state: InstanceStateStub(),
    reservedAtMs: 1,
    bootedAtMs: null,
    lastBeatMs: null,
    prunedAtMs: null,
    prunedByRule: null,
    branch: null,
    ...props,
  });
