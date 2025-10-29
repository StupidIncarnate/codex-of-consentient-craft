import { discoverResultContract } from './discover-result-contract';
import type { DiscoverResult } from './discover-result-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const DiscoverResultStub = ({ ...props }: StubArgument<DiscoverResult> = {}): DiscoverResult =>
  discoverResultContract.parse({
    results: [
      {
        name: 'userFetchBroker',
        path: '/test/brokers/user/fetch/user-fetch-broker.ts',
        type: 'broker',
        purpose: 'Fetches user data from the API by user ID',
        usage:
          "const user = await userFetchBroker({ userId: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479') });",
      },
    ],
    count: 1,
    ...props,
  });
