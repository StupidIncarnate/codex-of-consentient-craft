import type { StubArgument } from '@dungeonmaster/shared/@types';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { SpecHashStub } from '../spec-hash/spec-hash.stub';
import { profileBootContract } from './profile-boot-contract';
import type { ProfileBoot } from './profile-boot-contract';

export const ProfileBootStub = ({ ...props }: StubArgument<ProfileBoot> = {}): ProfileBoot =>
  profileBootContract.parse({
    instanceId: InstanceIdStub(),
    specHash: SpecHashStub(),
    bootMs: 20_000,
    recordedAtMs: EpochMsStub(),
    ...props,
  });
