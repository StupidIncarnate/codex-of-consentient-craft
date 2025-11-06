**FOLDER STRUCTURE:**

```
brokers/
  user/
    fetch/
      user-fetch-broker.ts
      user-fetch-broker.proxy.ts       # Setup helper + global mocks
      user-fetch-broker.test.ts
  comment/
    create-process/
      comment-create-process-broker.ts
      comment-create-process-broker.proxy.ts
      comment-create-process-broker.test.ts
```

**WHAT BROKERS KNOW:**

Brokers contain business-specific knowledge:

- API endpoints (URLs, HTTP methods)
- Database table names and queries
- Queue names and message formats
- Business workflows and orchestration logic
- Domain-specific validation rules

**NESTING RULES:**

- **Max 2 levels:** brokers/[domain]/[action]/ (no deeper nesting)
- ❌ WRONG: `brokers/product/inventory/stock/check/` (too deep)
- ✅ CORRECT: `brokers/product/check-inventory-stock/` (2 levels, descriptive action name)

**IMPORT PATTERNS:**

- **Same domain:** Use relative imports
  ```typescript
  // In brokers/user/update/
  import {userFetchBroker} from '../fetch/user-fetch-broker';
  ```
- **Cross-domain:** Use explicit relative path
  ```typescript
  // In brokers/comment/create-process/
  import {notificationSendBroker} from '../../notification/send/notification-send-broker';
  ```

**TWO TYPES OF BROKERS:**

- **Atomic:** Single operations (call one adapter, query one table, one focused task)
- **Orchestration:** Coordinate multiple brokers for complex workflows

**TRANSACTION BOUNDARIES:**

**Rule:** Orchestration brokers handle transaction boundaries, NOT atomic brokers.

```typescript
// ✅ CORRECT - Orchestration broker with transaction
// brokers/user/create-with-team/user-create-with-team-broker.ts
export const userCreateWithTeamBroker = async ({userData, teamData}: {
    userData: UserCreateData;
    teamData: TeamCreateData;
}): Promise<{ user: User; team: Team }> => {
    return await db.transaction(async (tx) => {
        const user = await userCreateBroker({userData, tx});
        const team = await teamCreateBroker({teamData: {...teamData, ownerId: user.id}, tx});
        await userAddToTeamBroker({userId: user.id, teamId: team.id, tx});
        return {user, team};
    });
};

// ❌ WRONG - Atomic broker with transaction
export const userCreateBroker = async ({userData}: { userData: UserCreateData }): Promise<User> => {
    return await db.transaction(async (tx) => {  // Too low level!
        return await db.users.create({data: userData, tx});
    });
};
```

**COMPLEXITY MANAGEMENT:**

- Keep files under 300 lines
- If exceeding, decompose into layer files
- Each layer file has own proxy and tests

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Fetches a user by ID from the API
 *
 * USAGE:
 * await userFetchBroker({userId: 'f47ac10b-...'});
 * // Returns validated User object
 */
// brokers/user/fetch/user-fetch-broker.ts (Atomic)
import {axiosGetAdapter} from '../../../adapters/axios/get/axios-get-adapter';
import type {UserId, User} from '../../../contracts/user/user-contract';
import type {Url} from '../../../contracts/url/url-contract';

export const userFetchBroker = async ({userId}: { userId: UserId }): Promise<User> => {
    const url = `/api/users/${userId}` as Url;
    const response = await axiosGetAdapter({url});
    return userContract.parse(response.data);
};

// brokers/comment/create-process/comment-create-process-broker.ts (Orchestration)
import {commentCreateBroker} from '../create/comment-create-broker';
import {notificationSendBroker} from '../../notification/send/notification-send-broker';
import type {CommentContent, PostId, UserId, Comment} from '../../../contracts';

export const commentCreateProcessBroker = async ({
                                                     content,
                                                     postId,
                                                     userId
                                                 }: {
    content: CommentContent;
    postId: PostId;
    userId: UserId;
}): Promise<Comment> => {
    const comment = await commentCreateBroker({content, postId, userId});
    await notificationSendBroker({
        userId,
        type: 'new_comment',
        data: {commentId: comment.id}
    });
    return comment;
};
```

**PROXY PATTERN:**

Broker proxies compose child adapter/broker proxies and provide semantic setup methods.

```typescript
// brokers/user/fetch/user-fetch-broker.proxy.ts
import {axiosGetAdapterProxy} from '../../../adapters/axios/get/axios-get-adapter.proxy';
import {UserStub} from '../../../contracts/user/user.stub';
import {UserIdStub} from '../../../contracts/user-id/user-id.stub';

type User = ReturnType<typeof UserStub>;
type UserId = ReturnType<typeof UserIdStub>;

export const userFetchBrokerProxy = () => {
    // Compose child adapter proxy
    const httpProxy = axiosGetAdapterProxy();

    // Mock globals if broker uses them
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);

    return {
        // Semantic setup method
        setupUserFetch: ({userId, user}: { userId: UserId; user: User }) => {
            httpProxy.returns({
                url: UrlStub({value: `/api/users/${userId}`}),
                data: user
            });
        },

        setupUserNotFound: ({userId}: { userId: UserId }) => {
            httpProxy.throws({
                url: UrlStub({value: `/api/users/${userId}`}),
                error: new Error('User not found')
            });
        }
    };
};
```

**Empty Proxy Pattern:**

For brokers with no dependencies to mock:

```typescript
export const pureBrokerProxy = (): Record<PropertyKey, never> => ({});
```

**Key principles:**

- Delegate to child proxies (adapter/broker/state proxies)
- Mock globals (Date.now, crypto.randomUUID) in constructor if broker uses them
- Export semantic methods that describe scenarios, not implementation details
- Tests never call jest.mocked() directly - only use proxy methods

**TEST EXAMPLE:**

```typescript
// brokers/user/fetch/user-fetch-broker.test.ts
import {userFetchBroker} from './user-fetch-broker';
import {userFetchBrokerProxy} from './user-fetch-broker.proxy';
import {UserIdStub} from '../../../contracts/user-id/user-id.stub';
import {UserStub} from '../../../contracts/user/user.stub';

type UserId = ReturnType<typeof UserIdStub>;
type User = ReturnType<typeof UserStub>;

describe('userFetchBroker', () => {
    describe('successful fetch', () => {
        it('VALID: {userId} => returns user', async () => {
            const proxy = userFetchBrokerProxy();
            const userId = UserIdStub({value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'});
            const user = UserStub({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com',
            });

            proxy.setupUserFetch({userId, user});

            const result = await userFetchBroker({userId});

            expect(result).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John Doe',
                email: 'john@example.com',
            });
        });

        it('VALID: {different userId} => returns different user', async () => {
            const proxy = userFetchBrokerProxy();
            const userId = UserIdStub({value: '12345678-1234-1234-1234-123456789abc'});
            const user = UserStub({
                id: userId,
                name: 'Jane Smith',
                email: 'jane@example.com',
            });

            proxy.setupUserFetch({userId, user});

            const result = await userFetchBroker({userId});

            expect(result).toStrictEqual({
                id: '12345678-1234-1234-1234-123456789abc',
                name: 'Jane Smith',
                email: 'jane@example.com',
            });
        });
    });

    describe('error cases', () => {
        it('ERROR: {nonexistent userId} => throws user not found error', async () => {
            const proxy = userFetchBrokerProxy();
            const userId = UserIdStub({value: 'nonexistent-user-id'});

            proxy.setupUserNotFound({userId});

            await expect(userFetchBroker({userId})).rejects.toThrow(/User not found/u);
        });

        it('ERROR: {network error} => throws connection error', async () => {
            const proxy = userFetchBrokerProxy();
            const userId = UserIdStub({value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'});

            proxy.setupNetworkError({userId});

            await expect(userFetchBroker({userId})).rejects.toThrow(/Network error/u);
        });
    });
});
```
