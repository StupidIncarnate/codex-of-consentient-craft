import type { StubArgument } from '@dungeonmaster/shared/@types';

import { SpecNameStub } from '../spec-name/spec-name.stub';
import { profileArgsContract } from './profile-args-contract';
import type { ProfileArgs } from './profile-args-contract';

export const ProfileArgsStub = ({ ...props }: StubArgument<ProfileArgs> = {}): ProfileArgs =>
  profileArgsContract.parse({
    specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
    isJson: false,
    ...props,
  });
