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

**3. Mixed Data + Function Stubs (types with both data and functions):**

```typescript

// src/contracts/eslint-context/eslint-context-contract.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {z} from 'zod';

// Contract defines ONLY data properties (no z.function())
export const eslintContextContract = z.object({
    filename: z.string().brand<'Filename'>().optional(),
});

// Type adds functions via intersection
export type EslintContext = z.infer<typeof eslintContextContract> & {
    report: (...args: unknown[]) => unknown;
    getFilename?: () => string & z.BRAND<'Filename'>;
};

const filenameContract = z.string().brand<'Filename'>();

// src/contracts/eslint-context/eslint-context.stub.ts

export const EslintContextStub = ({
                                      ...props
                                  }: StubArgument<EslintContext> = {}): EslintContext => {
    // Separate function props from data props
    const {report, getFilename, ...dataProps} = props;

    // Return: validated data + functions (preserved references)
    return {
        // Data properties validated through contract
        ...eslintContextContract.parse({
            filename: filenameContract.parse('/test/file.ts'),
            ...dataProps,
        }),
        // Function properties preserved (not parsed to maintain references)
        report: report ?? ((..._args: unknown[]): unknown => true),
        getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> =>
            filenameContract.parse('/test/file.ts')),
    };
};
```

**4. All stubs MUST:**

- Use object destructuring parameters
- Data properties MUST be validated through `contract.parse()`
- Function properties MUST be preserved outside parse (maintains references for `jest.fn()`)
- Import colocated contract from same directory

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
        it('INVALID_EMAIL: {email: "not-an-email"} => throws validation error', () => {
            expect(() => {
                return userContract.parse({
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                    name: 'John Doe',
                    email: 'not-an-email',
                });
            }).toThrow(/Invalid email/u);
        });

        it('INVALID_ID: {id: "not-a-uuid"} => throws validation error', () => {
            expect(() => {
                return userContract.parse({
                    id: 'not-a-uuid',
                    name: 'John Doe',
                    email: 'john@example.com',
                });
            }).toThrow(/Invalid uuid/u);
        });

        it('INVALID_MULTIPLE: {missing name and email} => throws validation error', () => {
            expect(() => {
                return userContract.parse({
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                });
            }).toThrow(/Required/u);
        });
    });
});
```
