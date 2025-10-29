import { discoverResultItemContract } from './discover-result-item-contract';
import type { DiscoverResultItem } from './discover-result-item-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const DiscoverResultItemStub = ({
  ...props
}: StubArgument<DiscoverResultItem> = {}): DiscoverResultItem =>
  discoverResultItemContract.parse({
    name: 'userFetchBroker',
    path: '/test/brokers/user/fetch/user-fetch-broker.ts',
    type: 'broker',
    purpose: 'Fetches user data from the API by user ID',
    usage:
      "const user = await userFetchBroker({ userId: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479') });",
    signature: '({ userId }: { userId: UserId }): Promise<User>',
    ...props,
  });
