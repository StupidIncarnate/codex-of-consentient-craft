# state/ - Data Storage and Memory

**Purpose:** Pure in-memory data storage and lifecycle management

**Folder Structure:**

```
state/
  user-cache/
    user-cache-state.ts
    user-cache-state.proxy.ts    # Jest spies + cleanup
    user-cache-state.test.ts
  redis-client/
    redis-client-state.ts
    redis-client-state.proxy.ts  # Mocks Redis → in-memory
    redis-client-state.test.ts
  app-config/
    app-config-state.ts
    app-config-state.proxy.ts    # Simple proxy for direct access
    app-config-state.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-state.ts` (e.g., `user-cache-state.ts`, `app-config-state.ts`)
- **Export:** camelCase ending with `State` (e.g., `userCacheState`, `appConfigState`)
- **Proxy:** kebab-case ending with `-state.proxy.ts`, export `[name]StateProxy` (e.g., `userCacheStateProxy`)
- **Pattern:** state/[name]/[name]-state.ts

**Constraints:**

- **Frontend:** React contexts, Zustand/Redux stores
- **Backend:** Caches, session stores, connection pools
- **Pure storage:** In-memory only (Maps, Sets, objects) OR external systems (Redis, DB pools)
- **Configuration:** App-wide constants, feature flags, API base URLs live here
- **Must** export as objects with methods/properties (not individual functions)
- **Proxy required for:** Stateful data that persists between tests or external systems (Redis, DB)
- **Proxy optional for:** Simple configuration that rarely changes

**Example:**

```tsx
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
    clear: (): void => {
        cache.clear();
    }
};

// state/app-config/app-config-state.ts
import {urlContract} from '../../contracts/url/url-contract';
import type {Url} from '../../contracts/url/url-contract';

export const appConfigState = {
    apiUrl: urlContract.parse(process.env.API_URL || 'https://api.example.com')
} satisfies { apiUrl: Url };
```

**Proxy Implementation:** See [Testing Standards - Proxy Architecture](testing-standards.md#proxy-architecture) for
complete proxy patterns and examples.
