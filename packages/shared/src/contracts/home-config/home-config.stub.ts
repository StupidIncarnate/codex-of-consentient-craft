import type { StubArgument } from '../../@types/stub-argument.type';

import { homeConfigContract } from './home-config-contract';
import type { HomeConfig } from './home-config-contract';

export const HomeConfigStub = ({ ...props }: StubArgument<HomeConfig> = {}): HomeConfig =>
  homeConfigContract.parse({
    guilds: [],
    ...props,
  });
