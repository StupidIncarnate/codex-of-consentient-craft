import type { StubArgument } from '@dungeonmaster/shared/@types';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { InstanceOwnerStub } from '../instance-owner/instance-owner.stub';
import { InstanceStateStub } from '../instance-state/instance-state.stub';
import { PortPairStub } from '../port-pair/port-pair.stub';
import { SpecHashStub } from '../spec-hash/spec-hash.stub';
import { SpecNameStub } from '../spec-name/spec-name.stub';
import { registryEntryContract } from './registry-entry-contract';
import type { RegistryEntry } from './registry-entry-contract';

export const RegistryEntryStub = ({ ...props }: StubArgument<RegistryEntry> = {}): RegistryEntry =>
  registryEntryContract.parse({
    id: InstanceIdStub(),
    owner: InstanceOwnerStub(),
    questId: null,
    guildId: null,
    specName: SpecNameStub(),
    specHash: SpecHashStub(),
    pid: null,
    pgids: [],
    socketPath: null,
    ports: PortPairStub(),
    state: InstanceStateStub(),
    reservedAtMs: EpochMsStub(),
    bootedAtMs: null,
    lastBeatMs: null,
    prunedAtMs: null,
    prunedByRule: null,
    ...props,
  });
