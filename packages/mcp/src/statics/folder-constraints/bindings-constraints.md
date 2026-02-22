**FOLDER STRUCTURE:**

```
bindings/
  use-user-data/
    use-user-data-binding.ts
    use-user-data-binding.proxy.ts
    use-user-data-binding.test.ts
  use-users-list/
    use-users-list-binding.ts
    use-users-list-binding.proxy.ts
    use-users-list-binding.test.ts
```

**WHAT ARE BINDINGS:**

Reactive connections that watch for changes:

- **Frontend**: React hooks for data binding
- **CLI**: File watchers and event monitors
- **Backend**: NOT applicable (no reactive paradigm)

**CRITICAL RULE:**

Bindings wrap **single broker calls only** (no orchestration, no multiple brokers):

```typescript
// ✅ CORRECT: Single broker call
export const useUserDataBinding = ({userId}) => {
    useEffect(() => {
        userFetchBroker({userId})  // Single broker
            .then(setData)
            .catch(setError);
    }, [userId]);
    return {data, loading, error};
};

// ❌ WRONG: Orchestrating multiple brokers (that's a broker's job)
export const useUserProfileBinding = ({userId}) => {
    useEffect(() => {
        const user = await userFetchBroker({userId});      // Multiple brokers
        const posts = await postsListBroker({userId});     // = orchestration
        setData({user, posts});  // ← This belongs in a broker!
    }, [userId]);
};
```

**RETURN PATTERN:**

Must return `{data, loading, error}` for async operations:

```typescript
export const useUserDataBinding = ({userId}: { userId: UserId }): {
    data: User | null;
    loading: boolean;
    error: Error | null;
} => {
    // ...
    return {data, loading, error};
};
```

**NAMING:**

Must start with `use` prefix (enforced by React rules of hooks):

- ✅ useUserDataBinding, useFileWatcherBinding
- ❌ userDataBinding, getUserBinding

**EXAMPLES:**

```typescript
/**
 * PURPOSE: React hook that fetches and manages user data with loading/error states
 *
 * USAGE:
 * const {data, loading, error} = useUserDataBinding({userId});
 * // Returns {data: User | null, loading: boolean, error: Error | null}
 */
// bindings/use-user-data/use-user-data-binding.ts
import {useState, useEffect} from 'react';
import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker';
import type {UserId, User} from '../../contracts/user/user-contract';

export const useUserDataBinding = ({userId}: { userId: UserId }): {
    data: User | null;
    loading: boolean;
    error: Error | null;
} => {
    const [data, setData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        userFetchBroker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading, error};
};

/**
 * PURPOSE: React hook that fetches and manages list of all users with loading/error states
 *
 * USAGE:
 * const {data, loading, error} = useUsersListBinding();
 * // Returns {data: User[], loading: boolean, error: Error | null}
 */
// bindings/use-users-list/use-users-list-binding.ts
import {useState, useEffect} from 'react';
import {usersListBroker} from '../../brokers/users/list/users-list-broker';
import type {User} from '../../contracts/user/user-contract';

export const useUsersListBinding = (): {
    data: User[];
    loading: boolean;
    error: Error | null;
} => {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        usersListBroker()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return {data, loading, error};
};
```

**PROXY PATTERN:**

Binding proxies delegate to broker proxies. The binding itself runs REAL.

```typescript
// bindings/use-user-data/use-user-data-binding.proxy.ts
import {userFetchBrokerProxy} from '../../brokers/user/fetch/user-fetch-broker.proxy';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

type User = ReturnType<typeof UserStub>;
type UserId = ReturnType<typeof UserIdStub>;

export const useUserDataBindingProxy = () => {
    // Delegate to broker proxy (which sets up adapter mocks, globals, etc.)
    const brokerProxy = userFetchBrokerProxy();

    // NO jest.mocked(useUserDataBinding) - binding runs real!

    return {
        // Semantic setup - delegate to broker
        setupUser: ({userId, user}: { userId: UserId; user: User }) => {
            brokerProxy.setupUserFetch({userId, user});
        },

        setupUserNotFound: ({userId}: { userId: UserId }) => {
            brokerProxy.setupUserNotFound({userId});
        },

        setupLoadingState: ({userId}: { userId: UserId }) => {
            // Can delay broker response to test loading state
            brokerProxy.setupUserFetch({
                userId,
                user: UserStub(),
                delay: 100 // If broker proxy supports delay
            });
        }
    };
};
```

**Key principles:**

- Delegate to broker proxy (which owns the full mock chain)
- Binding runs REAL - tests verify React hook behavior with real code
- Proxy methods describe data scenarios, not implementation
- Never mock the binding's useEffect/useState logic

**TEST EXAMPLE:**

```typescript
// bindings/use-user-data/use-user-data-binding.test.ts
import {renderHook, waitFor} from '@testing-library/react';
import {useUserDataBinding} from './use-user-data-binding';
import {useUserDataBindingProxy} from './use-user-data-binding.proxy';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';
import {UserStub} from '../../contracts/user/user.stub';

type UserId = ReturnType<typeof UserIdStub>;
type User = ReturnType<typeof UserStub>;

describe('useUserDataBinding', () => {
    describe('successful fetch', () => {
        it('VALID: {userId} => returns user with loading states', async () => {
            const proxy = useUserDataBindingProxy();
            const userId = UserIdStub({value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'});
            const user = UserStub({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com',
            });

            proxy.setupUser({userId, user});

            const {result} = renderHook(() => useUserDataBinding({userId}));

            expect(result.current).toStrictEqual({
                loading: true,
                data: null,
                error: null,
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current).toStrictEqual({
                loading: false,
                data: {
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                    name: 'John Doe',
                    email: 'john@example.com',
                },
                error: null,
            });
        });

        it('VALID: {different userId} => returns different user', async () => {
            const proxy = useUserDataBindingProxy();
            const userId = UserIdStub({value: '12345678-1234-1234-1234-123456789abc'});
            const user = UserStub({
                id: userId,
                name: 'Jane Smith',
                email: 'jane@example.com',
            });

            proxy.setupUser({userId, user});

            const {result} = renderHook(() => useUserDataBinding({userId}));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current).toStrictEqual({
                loading: false,
                data: {
                    id: '12345678-1234-1234-1234-123456789abc',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                },
                error: null,
            });
        });
    });

    describe('error cases', () => {
        it('ERROR: {nonexistent userId} => returns error state', async () => {
            const proxy = useUserDataBindingProxy();
            const userId = UserIdStub({value: 'nonexistent-id'});

            proxy.setupUserNotFound({userId});

            const {result} = renderHook(() => useUserDataBinding({userId}));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current).toStrictEqual({
                loading: false,
                data: null,
                error: expect.objectContaining({
                    message: expect.stringMatching(/not found/iu),
                }),
            });
        });

        it('ERROR: {network error} => returns error state', async () => {
            const proxy = useUserDataBindingProxy();
            const userId = UserIdStub({value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'});

            proxy.setupNetworkError({userId});

            const {result} = renderHook(() => useUserDataBinding({userId}));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current).toStrictEqual({
                loading: false,
                data: null,
                error: expect.objectContaining({
                    message: expect.stringMatching(/network/iu),
                }),
            });
        });
    });
});
```
