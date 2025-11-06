# bindings/ - Reactive Connections

**Purpose:** Reactive connections that watch for changes (React hooks, file watchers)

**Folder Structure:**

```
bindings/
  use-user-data/
    use-user-data-binding.ts
    use-user-data-binding.proxy.ts  # Delegates to broker proxy
    use-user-data-binding.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case starting with `use-` and ending with `-binding.ts` (e.g., `use-user-data-binding.ts`)
- **Export:** camelCase starting with `use` and ending with `Binding` (e.g., `useUserDataBinding`,
  `useFileWatcherBinding`)
- **Proxy:** kebab-case ending with `-binding.proxy.ts`, export `[name]BindingProxy` (e.g., `useUserDataBindingProxy`)
- **Pattern:** bindings/use-[resource]/use-[resource]-binding.ts

**Constraints:**

- **Frontend:** React hooks for data binding (must start with `use`)
- **CLI:** Reactive watchers and monitors (must start with `use`)
- **Backend:** Not applicable
- **Must** return `{data, loading, error}` pattern for async operations
- **Must** wrap single broker calls only (no orchestration)

**Example:**

```tsx
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
```
