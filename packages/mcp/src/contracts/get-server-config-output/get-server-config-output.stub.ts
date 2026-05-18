import type { StubArgument } from '@dungeonmaster/shared/@types';
import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { getServerConfigOutputContract } from './get-server-config-output-contract';
import type { GetServerConfigOutput } from './get-server-config-output-contract';

export const GetServerConfigOutputStub = ({
  ...props
}: StubArgument<GetServerConfigOutput> = {}): GetServerConfigOutput =>
  getServerConfigOutputContract.parse({
    baseUrl: 'http://localhost:3737',
    port: NetworkPortStub({ value: 3737 }),
    ...props,
  });
