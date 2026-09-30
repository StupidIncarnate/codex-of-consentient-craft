**FOLDER STRUCTURE:**

```
contracts/
  guild/
    guild-contract.ts
    guild-contract.test.ts
    guild.stub.ts
  quest/
    quest-contract.ts
    quest-contract.test.ts
    quest.stub.ts
  active-quest-facade/
    active-quest-facade-contract.ts   # types only: no test, no stub
```

**Plain data is always a schema.** A contract file may export only types when Zod cannot check the shape: a method
set, a function type, a generic. Such a file has no const, no `-contract.test.ts` and no `.stub.ts`. The same
file holds no data member: a type with data goes through a schema (pattern 3 below).

```typescript
// contracts/active-quest-facade/active-quest-facade-contract.ts
export type ActiveQuestFacade = {
    setActive: (quest: unknown) => void;
    clear: () => void;
};
```

**NAMING CONVENTIONS:**

- **Schemas**: camelCase with `Contract` suffix (e.g., `guildContract`, `questContract`)
- **Inferred Types**: PascalCase (e.g., `Guild`, `Quest`)
- **No standalone scalar contract.** A lone branded string or number (`UserId`, `FilePath`, `Url`) does not exist;
  a value is a field of its owner's object contract. A parameter that holds an owner's id takes `Guild['id']`; any
  other loose text or number is a plain `string` or `number`.

**CONTRACT CREATION PATTERN:**

Every object contract, every object nested in it, and every string and number field carries `.brand<'…'>()`, with
the text derived from the owner and the key: field `id` of `Guild` is `'GuildId'`, field `name` is `'GuildName'`, the
object itself is `'Guild'`. Import `z` through the gateway (`#gateway/npm/zod`), never from `'zod'`.

```typescript
// contracts/guild/guild-contract.ts
import {z} from '#gateway/npm/zod';

export const guildContract = z
    .object({
        id: z.uuid().brand<'GuildId'>(),
        name: z.string().min(1).brand<'GuildName'>(),
        path: z.string().min(1).brand<'GuildPath'>(),
        createdAt: z.iso.datetime().brand<'GuildCreatedAt'>(),
    })
    .brand<'Guild'>();

export type Guild = z.infer<typeof guildContract>;
```

A field that holds another owner's object reuses that owner's contract instead of restating its shape. A value of a
top-level `z.record` or `z.array` contract takes no brand, and neither does a contract used only as a generic
constraint. A record or array that is a field of an object contract brands its values, owner plus key.

**CRITICAL - TEST IMPORTS:**

- Test files import each stub from its own `.stub.ts` file, never from a contract or a production barrel
- ✅ CORRECT: `import { GuildStub } from "./guild.stub"`
- ❌ WRONG: `import { guildContract } from "./guild-contract"`
- This is enforced by the `@dungeonmaster/enforce-contract-usage-in-tests` ESLint rule; a contract's own
  `-contract.test.ts` is the one test that imports the contract
- A stub parses its data through its contract; it does not re-export the contract
- A test of code that takes a types-only contract's type passes an object literal; TypeScript types it structurally,
  so the test names no contract and no stub

**STUB PATTERNS:**

Stubs follow strict patterns enforced by `@dungeonmaster/enforce-stub-patterns` rule:

**1. Object Stubs (complex types with data properties only):**

Use spread operator with `StubArgument<Type>`

```typescript
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {guildContract} from './guild-contract';
import type {Guild} from './guild-contract';

export const GuildStub = ({...props}: StubArgument<Guild> = {}): Guild =>
    guildContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Guild',
        path: '/home/user/my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        ...props,
    });
```

There is no stub for a lone branded string or number: no standalone scalar contract exists to stub.

**2. Mixed Data + Function Stubs (our own types with both data and functions):**

A type with data and functions keeps the const for its data half and a stub. A type whose every member is a function,
a function type or a generic method set has no schema to write: its file exports only types (see FOLDER STRUCTURE), with
no const, stub or test.

```typescript

// src/contracts/notifier/notifier-contract.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {z} from '#gateway/npm/zod';

// Contract defines ONLY data properties (no z.function())
export const notifierContract = z.object({
    channel: z.string().brand<'NotifierChannel'>().optional(),
});

// Type adds functions via intersection
export type Notifier = z.infer<typeof notifierContract> & {
    send: (...args: unknown[]) => unknown;
};

// src/contracts/notifier/notifier.stub.ts

export const NotifierStub = ({
                                 ...props
                             }: StubArgument<Notifier> = {}): Notifier => {
    // Separate function props from data props
    const {send, ...dataProps} = props;

    // Return: validated data + functions (preserved references)
    return {
        // Data properties validated through contract
        ...notifierContract.parse({
            channel: 'alerts',
            ...dataProps,
        }),
        // Function properties preserved (not parsed to maintain references)
        send: send ?? ((..._args: unknown[]): unknown => true),
    };
};
```

**An outside type is never copied into a contract.** A type a library owns (an AST node, a rule context, a
`ChildProcess`) is reached through the gateway, and a test gets its value from the gateway's stub, imported from its
own file (`#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub`). A contract-and-stub pair that
re-declares a library type by hand is wrong.

**A field holding an outside package's type reuses the gateway's schema, branded `'#Gateway<Type>'`.** Never
`z.custom` or `z.instanceof` in a contract.

**A contract nothing in production parses is deleted, with its stub and test.**

**3. All stubs MUST:**

- Use object destructuring parameters
- Data properties MUST be validated through `contract.parse()`
- Function properties MUST be preserved outside parse (maintains references for `jest.fn()`)
- Import colocated contract from same directory

A stub of a types-only contract exists only where a test double has many users. It imports the type with
`import type` and returns a typed literal without a parse.

**STUBS vs PROXIES:**

Contracts use `.stub.ts` files to create test data, NOT `.proxy.ts` files.

**Critical distinction:**

- **Stubs** = Data factories that create valid instances of a type
- **Proxies** = Test setup helpers that mock dependencies

```typescript
// ✅ CORRECT - Stub for creating test data
// contracts/guild/guild.stub.ts
export const GuildStub = ({...props}: StubArgument<Guild> = {}): Guild =>
    guildContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Guild',
        path: '/home/user/my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        ...props
    });

// ✅ CORRECT - Tests import stubs, NEVER contracts
import {GuildStub} from './guild.stub';

// ❌ WRONG - Importing contract in test
import type {Guild} from './guild-contract'; // Forbidden!
```

**Why no proxies for contracts:**

- Contracts define data structures, not behavior
- Stubs are the test interface for contracts
- Tests validate contract schemas by using stubs
- No mocking needed - contracts are pure validation

**Function props in stubs:**

When contracts have function properties, tests pass `jest.fn()` to stubs:

```typescript
// Test passes jest.fn() when verifying calls
it('VALID: calls handler => executes callback', () => {
    const mockHandler = jest.fn();
    const service = ServiceStub({handler: mockHandler});

    service.handler();

    expect(mockHandler).toHaveBeenCalledTimes(1);
});
```

Stubs never use `jest.fn()` internally - they accept mocks via props to preserve references.

**TEST EXAMPLE:**

```typescript
// contracts/guild/guild-contract.test.ts
import {guildContract} from './guild-contract';
import {GuildStub} from './guild.stub';

describe('guildContract', () => {
    describe('valid guilds', () => {
        it('VALID: full guild => parses successfully', () => {
            const guild = GuildStub();

            const result = guildContract.parse(guild);

            expect(result).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'My Guild',
                path: '/home/user/my-guild',
                createdAt: '2024-01-15T10:00:00.000Z',
            });
        });

        it('VALID: {name: "Custom Guild"} => parses with the custom name', () => {
            const guild = GuildStub({name: 'Custom Guild'});

            const result = guildContract.parse(guild);

            expect(result.name).toBe('Custom Guild');
        });
    });

    describe('invalid guilds', () => {
        it('INVALID: {} => throws validation error', () => {
            expect(() => {
                guildContract.parse({});
            }).toThrow(/received undefined/u);
        });

        it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
            const baseGuild = GuildStub();

            expect(() => {
                guildContract.parse({
                    ...baseGuild,
                    id: 'not-a-uuid',
                });
            }).toThrow(/Invalid UUID/u);
        });

        it('INVALID: {createdAt: "not-a-timestamp"} => throws validation error', () => {
            const baseGuild = GuildStub();

            expect(() => {
                guildContract.parse({
                    ...baseGuild,
                    createdAt: 'not-a-timestamp',
                });
            }).toThrow(/Invalid ISO datetime/u);
        });
    });
});
```
