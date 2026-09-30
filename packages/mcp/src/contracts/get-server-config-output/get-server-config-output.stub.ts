import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getServerConfigOutputContract } from './get-server-config-output-contract';
import type { GetServerConfigOutput } from './get-server-config-output-contract';

export const GetServerConfigOutputStub = ({
  ...props
}: StubArgument<GetServerConfigOutput> = {}): GetServerConfigOutput =>
  getServerConfigOutputContract.parse({
    baseUrl: 'http://localhost:3737',
    port: 3737,
    ...props,
  });
