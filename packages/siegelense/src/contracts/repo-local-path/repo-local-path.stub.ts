import type { StubArgument } from '@dungeonmaster/shared/@types';

import { repoLocalPathContract } from './repo-local-path-contract';
import type { RepoLocalPath } from './repo-local-path-contract';

export const RepoLocalPathStub = ({ ...props }: StubArgument<RepoLocalPath> = {}): RepoLocalPath =>
  repoLocalPathContract.parse({
    path: '/repo/.siegelense/guilds/g1/instances/inst_1',
    linkPresent: true,
    ...props,
  });
