# contracts/ - Data Contracts

**Purpose:** Zod schemas, inferred types, and test stubs

**Folder Structure:**

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

**Naming Conventions:**

- **Filename:** kebab-case ending with `-contract.ts` (e.g., `user-contract.ts`, `email-contract.ts`)
- **Exports:**
    - Schemas: camelCase ending with `Contract` (e.g., `userContract`, `emailContract`)
    - Types: PascalCase (e.g., `User`, `EmailAddress`)
- **Stubs:** kebab-case with `.stub.ts` extension (e.g., `user.stub.ts`)
- **Proxies:** kebab-case with `.proxy.ts` extension (e.g., `user-contract.proxy.ts`)

**Constraints:**

- **ONLY ALLOWED:**
    - Zod schemas (or configured validation library)
    - TypeScript types inferred from schemas: `export type User = z.infer<typeof userContract>`
    - Stub files (`.stub.ts`) for testing
- **MUST** use `.brand<'TypeName'>()` on all Zod string/number schemas (no raw primitives)

**Example:**

```tsx
/**
 * PURPOSE: Validates and brands user ID strings as UserId type
 *
 * USAGE:
 * userIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns branded UserId type
 */
// contracts/user-id/user-id-contract.ts
import {z} from 'zod';

export const userIdContract = z.string()
    .uuid()
    .brand<'UserId'>();
export type UserId = z.infer<typeof userIdContract>;

// contracts/email-address/email-address-contract.ts
import {z} from 'zod';

export const emailAddressContract = z.string()
    .email()
    .brand<'EmailAddress'>();
export type EmailAddress = z.infer<typeof emailAddressContract>;

// contracts/user/user-contract.ts
import {z} from 'zod';
import {userIdContract} from '../user-id/user-id-contract';
import {emailAddressContract} from '../email-address/email-address-contract';

export const userContract = z.object({
    id: userIdContract,
    email: emailAddressContract,
    name: z.string().min(1).brand<'UserName'>()
});

export type User = z.infer<typeof userContract>;

// contracts/user/user.stub.ts
import {userContract} from './user-contract';
import type {User} from './user-contract';
import type {StubArgument} from '@questmaestro/shared/@types';

export const UserStub = ({...props}: StubArgument<User> = {}): User => {
    return userContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'john@example.com',
        name: 'John Doe',
        ...props,
    });
};
```

**Stub Patterns:**

Stubs follow strict patterns enforced by `@questmaestro/enforce-stub-patterns` rule:

1. **Object Stubs (complex types with data properties only)**: Use spread operator with `StubArgument<Type>`
   ```tsx
   import type {StubArgument} from '@questmaestro/shared/@types';

   export const UserStub = ({ ...props }: StubArgument<User> = {}): User =>
     userContract.parse({
       id: '123',
       name: 'John',
       ...props,
     });
   ```

2. **Branded String Stubs (primitives)**: Use single `value` property
   ```tsx
   export const FilePathStub = (
     { value }: { value: string } = { value: '/test/file.ts' }
   ): FilePath => filePathContract.parse(value);
   ```

3. **Mixed Data + Function Stubs (types with both data and functions)**:
   ```tsx
   import type {StubArgument} from '@questmaestro/shared/@types';
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

4. **All stubs MUST**:
    - Use object destructuring parameters
    - Data properties MUST be validated through `contract.parse()`
    - Function properties MUST be preserved outside parse (maintains references for `jest.fn()`)
    - Import colocated contract from same directory

