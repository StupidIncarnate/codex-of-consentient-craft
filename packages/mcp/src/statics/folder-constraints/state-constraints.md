**FOLDER STRUCTURE:**

```
state/
  quest-execution-queue/
    quest-execution-queue-state.ts
    quest-execution-queue-state.proxy.ts    # clears the state, exposes semantic reads
    quest-execution-queue-state.test.ts
  app-config/
    app-config-state.ts
    app-config-state.proxy.ts
    app-config-state.test.ts
  db-pool/
    db-pool-state.ts
    db-pool-state.proxy.ts       # composes the gateway wrapper's proxy
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
export const questExecutionQueueState = {
    getActive: (): QuestQueueEntry | undefined => state.entries[0],
    removeByQuestId: ({questId}: { questId: Quest['id'] }): number => { /* ... */ },
    clear: (): void => { state.entries = []; }
};

// ❌ WRONG: Individual functions
export const getActiveQuestQueueEntry = (): QuestQueueEntry | undefined => state.entries[0];
export const removeQuestQueueEntry = ({questId}: { questId: Quest['id'] }): number => { /* ... */ };
```

A parameter that holds another object's id takes that owner's field type: `Quest['id']`, never a standalone id type.

**CONFIGURATION PATTERN:**

Use `satisfies` to validate types while preserving literal inference:

```typescript
export const appConfigState = {
    apiUrl: 'https://api.example.com',
    features: {
        enableBeta: false
    }
} satisfies {
    apiUrl: string;
    features: Record<string, boolean>;
};
```

A value read from the environment comes through `getEnv` from `#gateway/node/process`, never `process.env`.

**EXAMPLES:**

```typescript
/**
 * PURPOSE: In-memory cross-guild FIFO queue of quests awaiting execution — one runner picks the head, runs it, dequeues on terminal
 *
 * USAGE:
 * questExecutionQueueState.enqueue({ entry });
 * questExecutionQueueState.getActive();
 * // Returns the head QuestQueueEntry or undefined
 */
// state/quest-execution-queue/quest-execution-queue-state.ts
import type { Quest, QuestQueueEntry } from '@dungeonmaster/shared/contracts';

const state: {
  entries: QuestQueueEntry[];
} = {
  entries: [],
};

export const questExecutionQueueState = {
  enqueue: ({ entry }: { entry: QuestQueueEntry }): void => {
    state.entries.push(entry);
  },

  getActive: (): QuestQueueEntry | undefined => state.entries[0],

  getAll: (): readonly QuestQueueEntry[] => state.entries.slice(),

  removeByQuestId: ({ questId }: { questId: Quest['id'] }): number => {
    const before = state.entries.length;
    state.entries = state.entries.filter((entry) => entry.questId !== questId);
    return before - state.entries.length;
  },

  clear: (): void => {
    state.entries = [];
  },
};
```

```typescript
/**
 * PURPOSE: Application configuration constants
 *
 * USAGE:
 * appConfigState.apiUrl; // Returns the API base URL
 * appConfigState.features.enableBeta; // Returns boolean
 */
// state/app-config/app-config-state.ts
export const appConfigState = {
    apiUrl: 'https://api.example.com',
    port: 3000,
    features: {
        enableBeta: false,
        enableAnalytics: false
    },
    limits: {
        maxRequestsPerMinute: 100,
        maxUploadSize: 10485760 // 10MB
    }
} satisfies {
    apiUrl: string;
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
// state/db-pool/db-pool-state.ts (hypothetical: no `pg` wrapper exists yet; the shape is the real one for any outside package)
import { Pool } from '#gateway/npm/pg';
import type { PoolClient } from '#gateway/npm/pg';
import { DbPoolNotInitializedError } from '../../errors/db-pool-not-initialized/db-pool-not-initialized-error';

let pool: Pool | null = null;

export const dbPoolState = {
    init: async (): Promise<void> => {
        pool = new Pool({ max: 20 });
    },

    getClient: async (): Promise<PoolClient> => {
        if (!pool) {
            throw new DbPoolNotInitializedError();
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

State proxies clear the state in the constructor and expose semantic setup and reads. The state itself runs REAL.

```typescript
// state/quest-execution-queue/quest-execution-queue-state.proxy.ts
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';

import { questExecutionQueueState } from './quest-execution-queue-state';

type QueueEntry = ReturnType<typeof QuestQueueEntryStub>;

export const questExecutionQueueStateProxy = (): {
  setupEmpty: () => void;
  getAllEntries: () => readonly QueueEntry[];
} => ({
  setupEmpty: (): void => {
    questExecutionQueueState.clear();
  },
  getAllEntries: (): readonly QueueEntry[] => questExecutionQueueState.getAll(),
});
```

**External System State (DB, Redis):**

A state that wraps an outside package imports it through the gateway wrapper, and its proxy composes that wrapper's
proxy, imported from its own `.proxy` file. The wrapper's proxy names each scenario; a test never builds a failure by hand:

```typescript
// state/db-pool/db-pool-state.proxy.ts (hypothetical wrapper, same shape as `readFileIfExistsProxy`)
import { poolProxy } from '#gateway/npm/pg/pool/pool.proxy';

export const dbPoolStateProxy = () => {
    const pool = poolProxy();

    return {
        setupConnection: () => {
            pool.connects();
        },

        setupConnectionRefused: () => {
            pool.connectRefused();
        }
    };
};
```

For a live wrapper proxy, read
`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`: its `returns`, `missing` and `denied`
scenarios are what a proxy composes. A pass-through wrapper (`path`) runs real and has no proxy.

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
- State object runs REAL - the proxy only clears and reads
- For external systems (DB, Redis), compose the gateway wrapper's proxy, imported from its own file

**TEST EXAMPLE:**

```typescript
// state/quest-execution-queue/quest-execution-queue-state.test.ts
import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';

import { questExecutionQueueState } from './quest-execution-queue-state';
import { questExecutionQueueStateProxy } from './quest-execution-queue-state.proxy';

describe('questExecutionQueueState', () => {
  describe('enqueue / getActive / getAll', () => {
    it('VALID: {enqueue 3 entries} => getActive returns head, getAll returns FIFO order', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();
      const a = QuestQueueEntryStub({ questId: 'q-a' });
      const b = QuestQueueEntryStub({ questId: 'q-b' });
      const c = QuestQueueEntryStub({ questId: 'q-c' });

      questExecutionQueueState.enqueue({ entry: a });
      questExecutionQueueState.enqueue({ entry: b });
      questExecutionQueueState.enqueue({ entry: c });

      expect(questExecutionQueueState.getActive()).toStrictEqual(a);
      expect(questExecutionQueueState.getAll()).toStrictEqual([a, b, c]);
    });

    it('EMPTY: {no entries} => getActive returns undefined, getAll returns empty array', () => {
      const proxy = questExecutionQueueStateProxy();
      proxy.setupEmpty();

      expect(questExecutionQueueState.getActive()).toBe(undefined);
      expect(questExecutionQueueState.getAll()).toStrictEqual([]);
    });
  });
});
```
