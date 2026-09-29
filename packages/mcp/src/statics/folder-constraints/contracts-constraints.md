**FOLDER STRUCTURE:**

```
contracts/
  user/
    user-contract.ts
    user-contract.test.ts
    user.stub.ts
  user-id/
    user-id-contract.ts
    user-id-contract.test.ts
    user-id.stub.ts
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

- **Schemas**: camelCase with `Contract` suffix (e.g., `userContract`, `emailAddressContract`)
- **Inferred Types**: PascalCase (e.g., `User`, `EmailAddress`, `UserId`)

**CONTRACT CREATION PATTERN:**

All contracts MUST use `.brand<'TypeName'>()` on primitives (string, number):

```typescript
import {z} from 'zod';

// Branded primitive
export const userIdContract = z.string()
    .uuid()
    .brand<'UserId'>();
export type UserId = z.infer<typeof userIdContract>;

// Object with branded fields
export const userContract = z.object({
    id: userIdContract,
    email: z.string().email().brand<'EmailAddress'>(),
    name: z.string().min(1).brand<'UserName'>()
});
export type User = z.infer<typeof userContract>;
```

**CRITICAL - TEST IMPORTS:**

- Test files MUST import from `.stub.ts` files, NOT from `-contract.ts` files
- ✅ CORRECT: `import { UserStub } from "./user.stub"`
- ❌ WRONG: `import { userContract } from "./user-contract"`
- This is enforced by `@dungeonmaster/ban-contract-in-tests` ESLint rule
- Stub files re-export the contract implementation for test use
- A test of code that takes a types-only contract's type passes an object literal; TypeScript types it structurally,
  so the test names no contract and no stub

**STUB PATTERNS:**

Stubs follow strict patterns enforced by `@dungeonmaster/enforce-stub-patterns` rule:

**1. Object Stubs (complex types with data properties only):**

Use spread operator with `StubArgument<Type>`

```typescript
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {userContract} from './user-contract';
import type {User} from './user-contract';

export const UserStub = ({...props}: StubArgument<User> = {}): User =>
    userContract.parse({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        ...props,
    });
```

**2. Branded String Stubs (primitives):**

Use single `value` property

```typescript
import {filePathContract} from './file-path-contract';
import type {FilePath} from './file-path-contract';

export const FilePathStub = (
    {value}: { value: string } = {value: '/test/file.ts'}
): FilePath => filePathContract.parse(value);
```

**3. Mixed Data + Function Stubs (our own types with both data and functions):**

A type with data and functions keeps the const for its data half and a stub. A type whose every member is a function,
a function type or a generic method set has no schema to write: its file exports only types (see FOLDER STRUCTURE), with
no const, stub or test.

```typescript

// src/contracts/notifier/notifier-contract.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {z} from 'zod';

// Contract defines ONLY data properties (no z.function())
export const notifierContract = z.object({
    channel: z.string().brand<'Channel'>().optional(),
});

// Type adds functions via intersection
export type Notifier = z.infer<typeof notifierContract> & {
    send: (...args: unknown[]) => unknown;
};

const channelContract = z.string().brand<'Channel'>();

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
            channel: channelContract.parse('alerts'),
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

**4. All stubs MUST:**

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
// contracts/user/user.stub.ts
export const UserStub = ({...props}: StubArgument<User> = {}): User =>
    userContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'John Doe',
        email: 'john@example.com',
        ...props
    });

// ✅ CORRECT - Tests import stubs, NEVER contracts
import {UserStub} from './user.stub';

type User = ReturnType<typeof UserStub>;

// ❌ WRONG - Importing contract in test
import type {User} from './user-contract'; // Forbidden!
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
// contracts/user/user-contract.test.ts
import {userContract} from './user-contract';
import {UserStub} from './user.stub';

type User = ReturnType<typeof UserStub>;

describe('userContract', () => {
    describe('valid users', () => {
        it('VALID: {id, name, email} => parses successfully', () => {
            const user = UserStub({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John Doe',
                email: 'john@example.com',
            });

            const result = userContract.parse(user);

            expect(result).toStrictEqual({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John Doe',
                email: 'john@example.com',
            });
        });

        it('VALID: {stub with name override} => parses with custom name', () => {
            const user = UserStub({name: 'Jane Smith'});

            const result = userContract.parse(user);

            expect(result.name).toBe('Jane Smith');
        });
    });

    describe('invalid users', () => {
        it('INVALID: {email: "not-an-email"} => throws validation error', () => {
            expect(() => {
                return userContract.parse({
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                    name: 'John Doe',
                    email: 'not-an-email',
                });
            }).toThrow(/Invalid email/u);
        });

        it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
            expect(() => {
                return userContract.parse({
                    id: 'not-a-uuid',
                    name: 'John Doe',
                    email: 'john@example.com',
                });
            }).toThrow(/Invalid uuid/u);
        });

        it('INVALID: {missing name and email} => throws validation error', () => {
            expect(() => {
                return userContract.parse({
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                });
            }).toThrow(/Required/u);
        });
    });
});
```
