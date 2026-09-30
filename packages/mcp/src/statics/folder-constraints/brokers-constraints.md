**FOLDER STRUCTURE:**

```
brokers/
  planned-work/
    read/
      planned-work-read-broker.ts
      planned-work-read-broker.proxy.ts       # Composes the gateway wrapper proxies the broker calls
      planned-work-read-broker.test.ts
  quest/
    advance/
      quest-advance-broker.ts
      quest-advance-broker.proxy.ts
      quest-advance-broker.test.ts
```

**WHAT BROKERS KNOW:**

Brokers contain business-specific knowledge:

- API endpoints (URLs, HTTP methods)
- Database table names and queries
- Queue names and message formats
- Business workflows and orchestration logic
- Domain-specific validation rules

**ERROR HANDLING:**

- **Let errors propagate upward** — don't catch unless wrapping with additional context
- Responders (not brokers) are the error boundary — brokers throw, responders catch and translate to HTTP status
- **Fire-and-forget:** Non-critical background operations use
  `.catch((error) => { process.stderr.write('[context] failed: ' + String(error) + '\n'); })` — log but don't block

**NESTING RULES:**

- **Max 2 levels:** brokers/[domain]/[action]/ (no deeper nesting)
- ❌ WRONG: `brokers/product/inventory/stock/check/` (too deep)
- ✅ CORRECT: `brokers/product/check-inventory-stock/` (2 levels, descriptive action name)

**IMPORT PATTERNS:**

- **Same domain:** Use relative imports
  ```typescript
  // In brokers/planned-work/write/
  import {plannedWorkReadBroker} from '../read/planned-work-read-broker';
  ```
- **Cross-domain:** Use explicit relative path
  ```typescript
  // In brokers/quest/advance/
  import {plannedWorkReadBroker} from '../../planned-work/read/planned-work-read-broker';
  ```

**TWO TYPES OF BROKERS:**

- **Atomic:** Single operations (call one gateway wrapper, query one table, one focused task)
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

**EXAMPLES:**

An outside package, type or value, is imported only through `#gateway/<kind>/<subpath>`. A parameter that holds
another owner's id takes `Owner['id']`; every other parameter is plain.

```typescript
/**
 * PURPOSE: Reads one operation item's planned work off disk, or returns null when no plan exists
 *
 * USAGE:
 * await plannedWorkReadBroker({questFolderPath: '/quests/add-auth', operationItemId});
 * // Returns the parsed WorkPlan, or null
 */
// brokers/planned-work/read/planned-work-read-broker.ts (Atomic)
import type {OperationItem} from '@dungeonmaster/shared/contracts';
import {readFileIfExists} from '#gateway/node/fs__promises';
import {join} from '#gateway/node/path';
import {workPlanContract} from '../../../contracts/work-plan/work-plan-contract';
import type {WorkPlan} from '../../../contracts/work-plan/work-plan-contract';

export const plannedWorkReadBroker = async ({questFolderPath, operationItemId}: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
}): Promise<WorkPlan | null> => {
    const filePath = join(questFolderPath, 'planned-work', `${String(operationItemId)}.json`);
    const contents = await readFileIfExists(filePath);
    if (contents === null) {
        return null;
    }
    return workPlanContract.parse(JSON.parse(contents));
};

/**
 * PURPOSE: Reads the plan for the quest's first pending operation item
 *
 * USAGE:
 * await questAdvanceBroker({questFolderPath, quest});
 * // Returns that item's WorkPlan, or null
 *
 * (simplified: the real broker of this name advances the operations ledger)
 */
// brokers/quest/advance/quest-advance-broker.ts (Orchestration)
import {plannedWorkReadBroker} from '../../planned-work/read/planned-work-read-broker';
import type {Quest} from '@dungeonmaster/shared/contracts';
import type {WorkPlan} from '../../../contracts/work-plan/work-plan-contract';

export const questAdvanceBroker = async ({questFolderPath, quest}: {
    questFolderPath: string;
    quest: Quest;
}): Promise<WorkPlan | null> => {
    const next = quest.operations.find((item) => item.status === 'pending');
    if (next === undefined) {
        return null;
    }
    return plannedWorkReadBroker({questFolderPath, operationItemId: next.id});
};
```

**PROXY PATTERN:**

A broker proxy composes the proxy of every gateway wrapper the broker calls and of every child broker, each imported
from its own `.proxy` file (`#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy`), and provides semantic setup
methods. A pass-through wrapper (`join` from `#gateway/node/path`) runs real and has no proxy.

```typescript
// brokers/planned-work/read/planned-work-read-broker.proxy.ts
import type {OperationItem} from '@dungeonmaster/shared/contracts';
import {readFileIfExistsProxy} from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import type {WorkPlanStub} from '../../../contracts/work-plan/work-plan.stub';

type WorkPlan = ReturnType<typeof WorkPlanStub>;

const planPathFor = ({questFolderPath, operationItemId}: {
    questFolderPath: string;
    operationItemId: OperationItem['id'];
}): string => `${questFolderPath}/planned-work/${String(operationItemId)}.json`;

export const plannedWorkReadBrokerProxy = () => {
    // Compose the wrapper proxy; it stages readFile by the exact path and encoding
    const readFileProxy = readFileIfExistsProxy();

    return {
        // Semantic setup methods name the scenario, not the mock
        setupPlanFound: ({questFolderPath, operationItemId, plan}: {
            questFolderPath: string;
            operationItemId: OperationItem['id'];
            plan: WorkPlan;
        }) => {
            readFileProxy.returns({
                path: planPathFor({questFolderPath, operationItemId}),
                contents: JSON.stringify(plan)
            });
        },

        setupPlanMissing: ({questFolderPath, operationItemId}: {
            questFolderPath: string;
            operationItemId: OperationItem['id'];
        }) => {
            readFileProxy.missing({path: planPathFor({questFolderPath, operationItemId})});
        },

        setupReadDenied: ({questFolderPath, operationItemId}: {
            questFolderPath: string;
            operationItemId: OperationItem['id'];
        }) => {
            readFileProxy.denied({path: planPathFor({questFolderPath, operationItemId})});
        }
    };
};
```

A failure comes from the wrapper proxy's named scenario (`missing`, `denied`), or a recorded-failure stub from the
gateway (`FsErrorStub`). Never a hand-made `Error`.

A global the broker reads (`Date.now`, `crypto.randomUUID`) is mocked in the proxy constructor through `registerMock`
or `registerSpyOn`. A function that takes arguments is staged per call, by its arguments.

**Empty Proxy Pattern:**

For brokers with no dependencies to mock:

```typescript
export const pureBrokerProxy = (): Record<PropertyKey, never> => ({});
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

- Delegate to child proxies (gateway wrapper, broker and state proxies)
- Mock globals (Date.now, crypto.randomUUID) via registerMock or registerSpyOn in the constructor if the broker uses them
- Export semantic methods that describe scenarios, not implementation details
- Tests never call registerMock directly - only use proxy semantic methods

**TEST EXAMPLE:**

```typescript
// brokers/planned-work/read/planned-work-read-broker.test.ts
import {OperationItemIdStub} from '@dungeonmaster/shared/contracts/operation-item-id/operation-item-id.stub';
import {WorkPlanStub} from '../../../contracts/work-plan/work-plan.stub';
import {plannedWorkReadBroker} from './planned-work-read-broker';
import {plannedWorkReadBrokerProxy} from './planned-work-read-broker.proxy';

describe('plannedWorkReadBroker', () => {
    describe('a plan exists on disk', () => {
        it('VALID: {questFolderPath, operationItemId} => returns the parsed WorkPlan', async () => {
            const proxy = plannedWorkReadBrokerProxy();
            const questFolderPath = '/quests/add-auth';
            const operationItemId = OperationItemIdStub({value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479'});
            const plan = WorkPlanStub({operationItemId});

            proxy.setupPlanFound({questFolderPath, operationItemId, plan});

            const result = await plannedWorkReadBroker({questFolderPath, operationItemId});

            expect(result).toStrictEqual(plan);
        });
    });

    describe('no plan has been written', () => {
        it('EMPTY: {no planned-work file} => returns null', async () => {
            const proxy = plannedWorkReadBrokerProxy();
            const questFolderPath = '/quests/no-plan-yet';
            const operationItemId = OperationItemIdStub({value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479'});

            proxy.setupPlanMissing({questFolderPath, operationItemId});

            const result = await plannedWorkReadBroker({questFolderPath, operationItemId});

            expect(result).toBe(null);
        });
    });

    describe('error cases', () => {
        it('ERROR: {file exists but cannot be read} => throws the raw read error', async () => {
            const proxy = plannedWorkReadBrokerProxy();
            const questFolderPath = '/quests/read-fails';
            const operationItemId = OperationItemIdStub({value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479'});

            proxy.setupReadDenied({questFolderPath, operationItemId});

            await expect(plannedWorkReadBroker({questFolderPath, operationItemId})).rejects.toThrow(
                /^EACCES: op '\/quests\/read-fails\/planned-work\/c3d4e5f6-58cc-4372-a567-0e02b2c3d479\.json'$/u
            );
        });
    });
});
```
