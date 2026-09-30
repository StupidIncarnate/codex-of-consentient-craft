import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { profileBootContract } from './profile-boot-contract';
import type { ProfileBoot } from './profile-boot-contract';

export const ProfileBootStub = ({ ...props }: StubArgument<ProfileBoot> = {}): ProfileBoot =>
  profileBootContract.parse({
    instanceId: InstanceIdStub(),
    specHash: 'a3f9c2e1',
    bootMs: 20_000,
    recordedAtMs: 1,
    ...props,
  });
