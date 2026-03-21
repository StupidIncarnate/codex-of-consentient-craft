**FOLDER STRUCTURE:**

```
state/
  user-cache/
    user-cache-state.ts
    user-cache-state.proxy.ts    # Jest spies + cleanup
    user-cache-state.test.ts
  app-config/
    app-config-state.ts
    app-config-state.proxy.ts
    app-config-state.test.ts
  db-pool/
    db-pool-state.ts
    db-pool-state.proxy.ts       # Mocks external connection
    db-pool-state.test.ts
```

**THREE TYPES OF STATE:**

1. **In-memory caches**: Maps, Sets, objects for caching data
2. **Configuration**: App-wide constants, feature flags, API URLs
3. **External connections**: Database pools, Redis clients, connection managers

**CRITICAL STRUCTURE RULE:**

State MUST export as **objects with methods/properties** (NOT individual functions):

```typescript
// ✅ CORRECT: Object with methods
export const userCacheState = {
    get: ({id}: { id: UserId }) => cache.get(id),
    set: ({id, user}: { id: UserId; user: User }) => cache.set(id, user),
    clear: () => cache.clear()
} as const;

// ❌ WRONG: Individual functions
export const getUserCache = ({id}: { id: UserId }) => cache.get(id);
export const setUserCache = ({id, user}: { id: UserId; user: User }) => cache.set(id, user);
```

**CONFIGURATION PATTERN:**

Use `satisfies` to validate types while preserving literal inference:

```typescript
export const appConfigState = {
    apiUrl: urlContract.parse(process.env.API_URL),
    features: {
        enableBeta: process.env.ENABLE_BETA === 'true'
    }
} satisfies {
    apiUrl: Url;
    features: Record<string, boolean>;
};
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: In-memory cache for storing and retrieving user objects by ID
 *
 * USAGE:
 * userCacheState.set({id: userId, user});
 * userCacheState.get({id: userId});
 * // Returns User object from cache or undefined
 */
// state/user-cache/user-cache-state.ts
import type {User, UserId} from '../../contracts/user/user-contract';

const cache = new Map<UserId, User>();

export const userCacheState = {
    get: ({id}: { id: UserId }): User | undefined => {
        return cache.get(id);
    },

    set: ({id, user}: { id: UserId; user: User }): void => {
        cache.set(id, user);
    },

    delete: ({id}: { id: UserId }): boolean => {
        return cache.delete(id);
    },

    clear: (): void => {
        cache.clear();
    },

    size: (): number => {
        return cache.size;
    }
} as const;
```

```typescript
/**
 * PURPOSE: Application configuration loaded from environment variables
 *
 * USAGE:
 * appConfigState.apiUrl; // Returns validated Url
 * appConfigState.features.enableBeta; // Returns boolean
 */
// state/app-config/app-config-state.ts
import {urlContract} from '../../contracts/url/url-contract';
import type {Url} from '../../contracts/url/url-contract';

export const appConfigState = {
    apiUrl: urlContract.parse(process.env.API_URL || 'https://api.example.com'),
    port: Number(process.env.PORT) || 3000,
    features: {
        enableBeta: process.env.ENABLE_BETA === 'true',
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true'
    },
    limits: {
        maxRequestsPerMinute: 100,
        maxUploadSize: 10485760 // 10MB
    }
} satisfies {
    apiUrl: Url;
    port: number;
    features: Record<string, boolean>;
    limits: Record<string, number>;
};
```

```typescript
/**
 * PURPOSE: Database connection pool with lifecycle management
 *
 * USAGE:
 * await dbPoolState.init(); // Initialize pool
 * const client = await dbPoolState.getClient(); // Get client
 * await dbPoolState.close(); // Cleanup
 */
// state/db-pool/db-pool-state.ts
import {Pool} from 'pg';
import type {PoolClient} from 'pg';

let pool: Pool | null = null;

export const dbPoolState = {
    init: async (): Promise<void> => {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 20
        });
    },

    getClient: async (): Promise<PoolClient> => {
        if (!pool) {
            throw new Error('Pool not initialized');
        }
        return await pool.connect();
    },

    close: async (): Promise<void> => {
        if (pool) {
            await pool.end();
            pool = null;
        }
    }
} as const;
```

**PROXY PATTERN:**

State proxies spy on methods and clear state in constructor.

```typescript
// state/user-cache/user-cache-state.proxy.ts
import {userCacheState} from './user-cache-state';
import {registerMock} from '@dungeonmaster/testing/register-mock';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

type User = ReturnType<typeof UserStub>;
type UserId = ReturnType<typeof UserIdStub>;

export const userCacheStateProxy = () => {
    // Clear state in constructor (runs when proxy is created)
    userCacheState.clear();

    // Spy on methods to verify calls via registerMock
    const getHandle = registerMock({fn: userCacheState.get});
    const setHandle = registerMock({fn: userCacheState.set});
    const deleteHandle = registerMock({fn: userCacheState.delete});

    return {
        // Semantic setup for pre-cached data
        setupCachedUser: ({userId, user}: { userId: UserId; user: User }) => {
            userCacheState.set({id: userId, user});
        },

        setupEmptyCache: () => {
            userCacheState.clear(); // Already called in constructor, but semantic
        },

        // Verification helpers using handle.mock.calls
        verifyCacheHit: () => {
            expect(getHandle.mock.calls.length > 0).toBe(true);
        },

        verifyCacheMiss: () => {
            expect(getHandle.mock.calls).toStrictEqual([[]]);
        },

        verifySet: ({userId}: { userId: UserId }) => {
            expect(setHandle.mock.calls[0]).toStrictEqual([{id: userId, user: expect.anything()}]);
        }
    };
};
```

**External System State (DB, Redis):**

For state that wraps external systems, use registerMock:

```typescript
// state/db-pool/db-pool-state.proxy.ts
import {Pool} from 'pg';
import {registerMock} from '@dungeonmaster/testing/register-mock';

export const dbPoolStateProxy = () => {
    const poolHandle = registerMock({fn: Pool});
    const mockConnect = registerMock({fn: Pool.prototype.connect});
    const mockEnd = registerMock({fn: Pool.prototype.end});

    return {
        setupConnection: () => {
            mockConnect.mockResolvedValueOnce({/* mock client */});
        },

        setupConnectionError: () => {
            mockConnect.mockRejectedValueOnce(new Error('Connection failed'));
        }
    };
};
```

**Additional Mock APIs (import all from `@dungeonmaster/testing/register-mock`):**

- `registerSpyOn({ object, method, passthrough? })` — Spy on global object methods (process.stdout.write, Date.now,
  etc.). `passthrough: true` records calls but delegates to real implementation.
- `registerModuleMock({ module, factory })` — Replace a module before load (AST transformer hoists as jest.mock). Use
  when a module must be replaced before import.
- `requireActual({ module })` — Access real module exports when a module is mocked. Use when a parent proxy needs the
  real implementation.
- `registerIsolateModules({ mocks, entrypoint })` — Test entry points with top-level side effects. Wraps
  jest.isolateModules + jest.doMock.

**Key principles:**

- Clear state in constructor for test isolation
- Spy on state methods to verify calls (not mock them)
- State object runs REAL - we only clear and spy
- For external systems (DB, Redis), mock the npm package at adapter layer

**TEST EXAMPLE:**

```typescript
// state/user-cache/user-cache-state.test.ts
import {userCacheState} from './user-cache-state';
import {userCacheStateProxy} from './user-cache-state.proxy';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';
import {UserStub} from '../../contracts/user/user.stub';

type UserId = ReturnType<typeof UserIdStub>;
type User = ReturnType<typeof UserStub>;

describe('userCacheState', () => {
  describe('cache operations', () => {
    it('VALID: {set then get} => returns cached user', () => {
      const proxy = userCacheStateProxy();
      const userId = UserIdStub({value: 'user-123'});
      const user = UserStub({id: userId, name: 'John Doe'});

      userCacheState.set({id: userId, user});
      const result = userCacheState.get({id: userId});

      expect(result).toStrictEqual({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('EMPTY: {get without set} => returns undefined', () => {
      const proxy = userCacheStateProxy();
      const userId = UserIdStub({value: 'nonexistent'});

      const result = userCacheState.get({id: userId});

      expect(result).toBe(undefined);
    });

    it('VALID: {delete existing} => returns true and removes from cache', () => {
      const proxy = userCacheStateProxy();
      const userId = UserIdStub({value: 'user-456'});
      const user = UserStub({id: userId});

      userCacheState.set({id: userId, user});
      const deleted = userCacheState.delete({id: userId});
      const result = userCacheState.get({id: userId});

      expect(deleted).toBe(true);
      expect(result).toBe(undefined);
    });
  });

  describe('cache size', () => {
    it('VALID: {empty cache} => size returns 0', () => {
      const proxy = userCacheStateProxy();

      const result = userCacheState.size();

      expect(result).toBe(0);
    });

    it('VALID: {two items} => size returns 2', () => {
      const proxy = userCacheStateProxy();
      const user1 = UserStub({id: UserIdStub({value: 'user-1'})});
      const user2 = UserStub({id: UserIdStub({value: 'user-2'})});

      userCacheState.set({id: user1.id, user: user1});
      userCacheState.set({id: user2.id, user: user2});

      const result = userCacheState.size();

      expect(result).toBe(2);
    });
  });
});
```
