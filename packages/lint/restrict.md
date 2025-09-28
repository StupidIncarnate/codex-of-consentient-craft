# Primitive Type Restrictions

This document outlines the implementation for enforcing Zod contracts instead of raw primitive types in function
signatures.

## Overview

- **Runtime validation**: Use Zod contracts for API boundaries (flows/responders)
- **Internal types**: Replace all `string`/`number` with Zod-validated types
- **Booleans**: Remain primitive (self-validating)
- **Testing**: Factory functions ensure valid test data
- **Mocking**: Mock with confidence using validated data structures

## TypeScript Configuration

```json
// tsconfig.json additions
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## ESLint Configuration

```json
// .eslintrc.js additions
{
  "rules": {
    "@typescript-eslint/ban-types": [
      "error",
      {
        "types": {
          "string": "Use Zod contract types like EmailAddress, UserName, FilePath, etc.",
          "number": "Use Zod contract types like Currency, PositiveNumber, Age, etc.",
          "String": "Use Zod contract types instead of String constructor",
          "Number": "Use Zod contract types instead of Number constructor"
        },
        "extendDefaults": true
      }
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        "allowExpressions": false,
        "allowTypedFunctionExpressions": false,
        "allowHigherOrderFunctions": false
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='z'][callee.property.name='string']:not(:has(MemberExpression[property.name='brand']))",
        "message": "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()"
      },
      {
        "selector": "CallExpression[callee.object.name='z'][callee.property.name='number']:not(:has(MemberExpression[property.name='brand']))",
        "message": "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()"
      }
    ]
  }
}
```

## Global Type Declarations

```typescript
// types/banned-primitives.d.ts
declare global {
    interface String {
        __USE_ZOD_CONTRACTS_INSTEAD__: 'Use EmailAddress, UserName, FilePath, etc. from contracts/';
    }

    interface Number {
        __USE_ZOD_CONTRACTS_INSTEAD__: 'Use Currency, PositiveNumber, Age, etc. from contracts/';
    }
}

export {};
```

## Utility Types for Return Type Enforcement

```typescript
// contracts/return-types/return-types.ts
import {z} from 'zod';

export type BrokerReturn<T> = T extends z.ZodType<infer U>
    ? U // Allow Zod inferred types
    : T extends { readonly type: string }
        ? T // Allow semantic objects
        : T extends boolean
            ? T // Allow booleans
            : never; // Ban everything else

export type ValidReturnType<T> = T extends string | number
    ? never
    : T;
```

## Contract Design Strategy

### Domain Primitives (Extract These)

Only extract contracts that are **true domain primitives** - reused across multiple schemas:

```typescript
// contracts/user-id/user-id-contract.ts
import {z} from 'zod';

export const userIdContract = z.string()
    .uuid()
    .brand<'UserId'>();
export type UserId = z.infer<typeof userIdContract>;

// contracts/email-address/email-address-contract.ts
export const emailAddressContract = z.string()
    .email()
    .max(254)
    .brand<'EmailAddress'>();
export type EmailAddress = z.infer<typeof emailAddressContract>;

// contracts/timestamp/timestamp-contract.ts
export const timestampContract = z.date()
    .brand<'Timestamp'>();
export type Timestamp = z.infer<typeof timestampContract>;
```

### Rich Base Schemas (Define Inline)

Define comprehensive base schemas with fields inline, then compose variations:

```typescript
// contracts/user/user-contract.ts
import { userIdContract, emailAddressContract, timestampContract } from '../domain-primitives';

// ✅ Rich base schema with inline field definitions
export const userBaseContract = z.object({
  id: userIdContract,
  email: emailAddressContract,
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .trim()
    .brand<'UserName'>(),
  bio: z.string()
    .max(500)
    .optional(),
  avatarUrl: z.string()
    .url()
    .optional(),
  isActive: z.boolean(),
  role: z.enum(['admin', 'user', 'moderator']),
  createdAt: timestampContract,
  updatedAt: timestampContract
});
export type User = z.infer<typeof userBaseContract>;

// ✅ Compose variations using Zod methods
export const userPublicContract = userBaseContract.omit({
  email: true
});
export type UserPublic = z.infer<typeof userPublicContract>;

export const userCreateContract = userBaseContract.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type UserCreate = z.infer<typeof userCreateContract>;

export const userUpdateContract = userBaseContract.pick({
  name: true,
  bio: true,
  avatarUrl: true,
  role: true
}).partial();
export type UserUpdate = z.infer<typeof userUpdateContract>;
```

### Schema Composition with Common Fields

```typescript
// contracts/common-fields/common-fields-contract.ts
export const auditFieldsContract = z.object({
  createdAt: timestampContract,
  updatedAt: timestampContract,
  createdBy: userIdContract,
  updatedBy: userIdContract
});

export const softDeleteFieldsContract = z.object({
  isDeleted: z.boolean().default(false),
  deletedAt: timestampContract.optional(),
  deletedBy: userIdContract.optional()
});

// contracts/post/post-contract.ts
export const postBaseContract = z.object({
  id: z.string().uuid().brand<'PostId'>(),
  title: z.string()
    .min(1, "Title required")
    .max(200, "Title too long")
    .brand<'PostTitle'>(),
  content: z.string()
    .min(1, "Content required")
    .brand<'PostContent'>(),
  authorId: userIdContract,
  status: z.enum(['draft', 'published', 'archived']),
  tags: z.array(z.string().min(1).max(50)).max(10)
})
.merge(auditFieldsContract)
.merge(softDeleteFieldsContract);

export type Post = z.infer<typeof postBaseContract>;

// Composed variations
export const postPublicContract = postBaseContract
  .omit({ createdBy: true, updatedBy: true, deletedBy: true })
  .extend({
    author: userPublicContract // Include author info
  });

export const postCreateContract = postBaseContract.pick({
  title: true,
  content: true,
  status: true,
  tags: true
});
```

### File System Contracts

```typescript
// contracts/file-path/file-path-contract.ts
import {z} from 'zod';

export const filePathContract = z.string()
    .min(1)
    .refine(path => path.startsWith('/'), 'Must be absolute path')
    .brand<'FilePath'>();
export type FilePath = z.infer<typeof filePathContract>;

// contracts/file-content/file-content-contract.ts
export const fileContentContract = z.string()
    .brand<'FileContent'>();
export type FileContent = z.infer<typeof fileContentContract>;

// contracts/file-encoding/file-encoding-contract.ts
export const fileEncodingContract = z.enum(['utf8', 'ascii', 'base64', 'binary']);
export type FileEncoding = z.infer<typeof fileEncodingContract>;

// contracts/json-content/json-content-contract.ts
export const jsonContentContract = z.string()
    .refine(content => {
        try {
            JSON.parse(content);
            return true;
        } catch {
            return false;
        }
    }, 'Must be valid JSON')
    .brand<'JsonContent'>();
export type JsonContent = z.infer<typeof jsonContentContract>;

// contracts/js-module-content/js-module-content-contract.ts
export const jsModuleContentContract = z.string()
    .refine(content =>
            content.includes('module.exports') || content.includes('export'),
        'Must be valid JS module'
    )
    .brand<'JsModuleContent'>();
export type JsModuleContent = z.infer<typeof jsModuleContentContract>;

// contracts/config-file-content/config-file-content-contract.ts
export const configFileContentContract = z.union([
    jsonContentContract,
    jsModuleContentContract
]);
export type ConfigFileContent = z.infer<typeof configFileContentContract>;
```

### NPM Package Contracts

```typescript
// contracts/npm-package/npm-package-contract.ts
import {z} from 'zod';

export const npmPackageContract = z.string()
    .min(1)
    .max(214)
    .regex(/^[a-z0-9@/_-]+$/)
    .refine(name => !name.startsWith('.') && !name.startsWith('_'),
        'Package name cannot start with . or _')
    .brand<'NpmPackage'>();
export type NpmPackage = z.infer<typeof npmPackageContract>;
```

### Numeric Contracts

```typescript
// contracts/positive-number/positive-number-contract.ts
import {z} from 'zod';

export const positiveNumberContract = z.number()
    .positive()
    .brand<'PositiveNumber'>();
export type PositiveNumber = z.infer<typeof positiveNumberContract>;

// contracts/currency/currency-contract.ts
export const currencyContract = z.number()
    .multipleOf(0.01) // Cents precision
    .brand<'Currency'>();
export type Currency = z.infer<typeof currencyContract>;

// contracts/age/age-contract.ts
export const ageContract = z.number()
    .int()
    .min(0)
    .max(150)
    .brand<'Age'>();
export type Age = z.infer<typeof ageContract>;
```

## Test Helper Factory Functions

Use the composition approach in test factories too:

```typescript
// test-helpers/contract-factories.ts
import {userIdContract} from '../contracts/user-id/user-id-contract';
import {emailAddressContract} from '../contracts/email-address/email-address-contract';
import {timestampContract} from '../contracts/timestamp/timestamp-contract';
import {
    userBaseContract,
    userPublicContract,
    userCreateContract,
    userUpdateContract
} from '../contracts/user/user-contract';
import {
    postBaseContract,
    postPublicContract,
    postCreateContract
} from '../contracts/post/post-contract';
import {filePathContract} from '../contracts/file-path/file-path-contract';
import {fileContentContract} from '../contracts/file-content/file-content-contract';
import {jsonContentContract} from '../contracts/json-content/json-content-contract';
import {jsModuleContentContract} from '../contracts/js-module-content/js-module-content-contract';
import {npmPackageContract} from '../contracts/npm-package/npm-package-contract';
import {positiveNumberContract} from '../contracts/positive-number/positive-number-contract';
import {currencyContract} from '../contracts/currency/currency-contract';
import {ageContract} from '../contracts/age/age-contract';

// Domain primitive factories
export const createUserId = (id = crypto.randomUUID()): UserId => {
    return userIdContract.parse(id);
};

export const createEmailAddress = (email = 'test@example.com'): EmailAddress => {
    return emailAddressContract.parse(email);
};

export const createTimestamp = (date = new Date()): Timestamp => {
    return timestampContract.parse(date);
};

// Base entity factories
export const createUser = (overrides: Partial<User> = {}): User => {
    return userBaseContract.parse({
        id: createUserId(),
        email: createEmailAddress(),
        name: 'Test User',
        bio: 'Test user bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        isActive: true,
        role: 'user',
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
        ...overrides
    });
};

// Composed variation factories - leverage Zod's composition
export const createUserPublic = (overrides: Partial<User> = {}): UserPublic => {
    const user = createUser(overrides);
    return userPublicContract.parse(user); // Automatically omits email
};

export const createUserCreateRequest = (overrides: Partial<UserCreate> = {}): UserCreate => {
    return userCreateContract.parse({
        email: createEmailAddress(),
        name: 'New User',
        bio: 'New user bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        isActive: true,
        role: 'user',
        ...overrides
    });
};

export const createUserUpdateRequest = (overrides: Partial<UserUpdate> = {}): UserUpdate => {
    return userUpdateContract.parse({
        name: 'Updated Name',
        bio: 'Updated bio',
        ...overrides
    });
};

// Post factories using composition
export const createPost = (overrides: Partial<Post> = {}): Post => {
    return postBaseContract.parse({
        id: crypto.randomUUID(),
        title: 'Test Post',
        content: 'This is test content for the post.',
        authorId: createUserId(),
        status: 'published',
        tags: ['test', 'example'],
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
        createdBy: createUserId(),
        updatedBy: createUserId(),
        isDeleted: false,
        ...overrides
    });
};

export const createPostPublic = (overrides: Partial<Post> = {}): PostPublic => {
    const post = createPost(overrides);
    return postPublicContract.parse({
        ...post,
        author: createUserPublic() // Will use default values
    });
};

// File system factories
export const createFilePath = (path = '/mock/project/.questmaestro.js'): FilePath => {
    return filePathContract.parse(path);
};

export const createFileContent = (content = 'mock file content'): FileContent => {
    return fileContentContract.parse(content);
};

export const createJsonContent = (obj: object = {framework: 'react'}): JsonContent => {
    const content = JSON.stringify(obj);
    return jsonContentContract.parse(content);
};

export const createJsModuleContent = (config: object = {framework: 'react'}): JsModuleContent => {
    const content = `module.exports = ${JSON.stringify(config)};`;
    return jsModuleContentContract.parse(content);
};

// NPM package factories
export const createNpmPackage = (name = 'react'): NpmPackage => {
    return npmPackageContract.parse(name);
};

// Numeric factories
export const createPositiveNumber = (num = 42): PositiveNumber => {
    return positiveNumberContract.parse(num);
};

export const createCurrency = (amount = 19.99): Currency => {
    return currencyContract.parse(amount);
};

export const createAge = (age = 25): Age => {
    return ageContract.parse(age);
};
```

## Function Signature Examples

### Broker Functions

```typescript
// ✅ Good - uses composed contract types
export const userCreateBroker = async ({
                                           userData
                                       }: {
    userData: UserCreate;
}): Promise<User> => {
    // Implementation using validated types
    // userData already validated via UserCreate contract
};

export const userUpdateBroker = async ({
                                           userId,
                                           updates
                                       }: {
    userId: UserId;
    updates: UserUpdate;
}): Promise<User> => {
    // Implementation
};

export const userGetPublicBroker = async ({
                                              userId
                                          }: {
    userId: UserId;
}): Promise<UserPublic> => {
    // Returns public user data (no email)
};

export const fileReadBroker = async ({
                                         path
                                     }: {
    path: FilePath;
}): Promise<FileContent> => {
    // Implementation
};

// ❌ Banned - raw primitives
export const badBroker = async ({
                                    email,
                                    name
                                }: {
    email: string;  // Error: Use composed contract types
    name: string;   // Error: Use composed contract types
}): Promise<string> => { // Error: Use Zod type
                         // Won't compile
};
```

### Adapter Functions

```typescript
// adapters/fs/fs-read-file.ts
export const fsReadFile = async ({
                                     path,
                                     encoding = 'utf8'
                                 }: {
    path: FilePath;
    encoding?: FileEncoding;
}): Promise<FileContent> => {
    const content = await fs.readFile(path, encoding);
    return fileContentContract.parse(content);
};

// adapters/axios/axios-get.ts
export const axiosGet = async ({
                                   url
                               }: {
    url: UrlContract; // Zod contract type
}): Promise<ApiResponse> => {
    // Implementation
};
```

## Test Contract Strategy: Domain vs Infrastructure

### Domain Contracts vs Infrastructure Contracts

**Use full contract factories for:**

- ✅ **Domain objects** (User, Post, Order) - business entities
- ✅ **Business logic** (validation, transformation)
- ✅ **You control the interface** (your brokers, transformers)

**Use partial/adapter contracts for:**

- ✅ **External library shapes** (axios, fetch responses)
- ✅ **Infrastructure concerns** (headers, status codes, metadata)
- ✅ **You don't control the interface** (third-party APIs)

### Infrastructure Contract Examples

```typescript
// contracts/axios-response/axios-response-contract.ts
export const axiosResponseContract = z.object({
    data: z.unknown(), // Can contain any domain object
    status: z.number().min(200).max(599).brand<'HttpStatus'>(),
    statusText: z.string().brand<'HttpStatusText'>(),
    headers: z.record(z.string()),
    config: z.object({
        url: z.string().url().brand<'Url'>(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    })
});

export type AxiosResponse<T = unknown> = {
    data: T;
    status: HttpStatus;
    statusText: HttpStatusText;
    headers: Record<string, string>;
    config: {
        url: Url;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    };
};

// contracts/database-result/database-result-contract.ts
export const databaseResultContract = z.object({
    rows: z.array(z.unknown()),
    rowCount: z.number().int().min(0).brand<'RowCount'>(),
    command: z.string().brand<'SqlCommand'>(),
    fields: z.array(z.object({
        name: z.string(),
        dataTypeID: z.number()
    }))
});

export type DatabaseResult<T = unknown> = {
    rows: T[];
    rowCount: RowCount;
    command: SqlCommand;
    fields: Array<{ name: string; dataTypeID: number }>;
};
```

### Infrastructure Test Factories

```typescript
// test-helpers/infrastructure-factories.ts
export const createAxiosResponse = <T>(overrides: { data: T } & Partial<AxiosResponse>): AxiosResponse<T> => {
    return {
        data: overrides.data,
        status: 200 as HttpStatus,
        statusText: 'OK' as HttpStatusText,
        headers: {'content-type': 'application/json'},
        config: {
            url: 'https://api.example.com' as Url,
            method: 'GET'
        },
        ...overrides
    };
};

export const createAxiosErrorResponse = (overrides: Partial<AxiosError> = {}): AxiosError => {
    return {
        status: 500 as HttpStatus,
        statusText: 'Internal Server Error' as HttpStatusText,
        data: {message: 'Server error'},
        ...overrides
    };
};

export const createDatabaseResult = <T>(overrides: { rows: T[] } & Partial<DatabaseResult>): DatabaseResult<T> => {
    return {
        rows: overrides.rows,
        rowCount: overrides.rows.length as RowCount,
        command: 'SELECT' as SqlCommand,
        fields: [{name: 'id', dataTypeID: 23}],
        ...overrides
    };
};
```

## Test Examples

```typescript
// user-create-broker.test.ts
import {jest} from '@jest/globals';
import {userCreateBroker} from './user-create-broker';
import {axiosPost} from '../../adapters/axios/axios-post';
import {createUserCreateRequest, createUser} from '../../../test-helpers/contract-factories';
import {createAxiosResponse, createAxiosErrorResponse} from '../../../test-helpers/infrastructure-factories';

jest.mock('../../adapters/axios/axios-post');
const mockAxiosPost = axiosPost as jest.MockedFunction<typeof axiosPost>;

describe('userCreateBroker', () => {
    it('creates user with valid data', async () => {
        // ✅ Domain contracts - full validation
        const userData = createUserCreateRequest({
            email: 'john@company.com',
            name: 'John Doe',
            bio: 'Software developer'
        });

        const expectedUser = createUser({
            email: userData.email,
            name: userData.name,
            bio: userData.bio
        });

        // ✅ Infrastructure contract - realistic response shape
        const axiosResponse = createAxiosResponse({
            data: expectedUser,
            status: 201 // Created
        });

        mockAxiosPost.mockResolvedValue(axiosResponse);

        const result = await userCreateBroker({userData});

        expect(result).toEqual(expectedUser);
        expect(mockAxiosPost).toHaveBeenCalledWith({
            url: '/api/users',
            data: userData
        });
    });

    it('handles API error responses', async () => {
        const userData = createUserCreateRequest({
            email: 'existing@example.com'
        });

        // ✅ Infrastructure contract - error response shape
        const errorResponse = createAxiosErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            data: {
                message: 'Email already exists',
                code: 'DUPLICATE_EMAIL'
            }
        });

        mockAxiosPost.mockRejectedValue(errorResponse);

        await expect(userCreateBroker({userData})).rejects.toThrow('Email already exists');
    });

    it('handles partial updates', async () => {
        const userId = createUserId();
        const updates = createUserUpdateRequest({
            name: 'Updated Name'
            // bio and other fields omitted - partial update
        });

        const updatedUser = createUser({
            id: userId,
            name: updates.name
        });

        const axiosResponse = createAxiosResponse({data: updatedUser});
        mockAxiosPost.mockResolvedValue(axiosResponse);

        const result = await userUpdateBroker({userId, updates});

        expect(result.name).toBe(updates.name);
    });

    it('returns public user data', async () => {
        const userId = createUserId();
        const user = createUser({id: userId});
        const publicUser = createUserPublic({id: userId}); // No email

        const axiosResponse = createAxiosResponse({data: user});
        mockAxiosPost.mockResolvedValue(axiosResponse);

        const result = await userGetPublicBroker({userId});

        expect(result).toEqual(publicUser);
        expect(result).not.toHaveProperty('email'); // Email omitted
    });

    it('validates contract data at test setup', async () => {
        // ❌ These would fail at test setup time
        // const badUserData = createUserCreateRequest({ email: 'invalid' }); // ZodError!
        // const badUpdate = createUserUpdateRequest({ name: '' }); // ZodError!

        // Test actual validation error
        expect(() => createUserCreateRequest({email: 'invalid'})).toThrow();
        expect(() => createUserUpdateRequest({name: ''})).toThrow();
    });
});
```

### Database Adapter Test Example

```typescript
// user-database-broker.test.ts
import {jest} from '@jest/globals';
import {userDatabaseBroker} from './user-database-broker';
import {pgQuery} from '../../adapters/postgres/pg-query';
import {createUser} from '../../../test-helpers/contract-factories';
import {createDatabaseResult} from '../../../test-helpers/infrastructure-factories';

jest.mock('../../adapters/postgres/pg-query');
const mockPgQuery = pgQuery as jest.MockedFunction<typeof pgQuery>;

describe('userDatabaseBroker', () => {
    it('fetches user from database', async () => {
        const userId = createUserId();
        const expectedUser = createUser({id: userId});

        // ✅ Infrastructure contract - database result shape
        const dbResult = createDatabaseResult({
            rows: [expectedUser],
            command: 'SELECT',
            rowCount: 1
        });

        mockPgQuery.mockResolvedValue(dbResult);

        const result = await userDatabaseBroker({userId});

        expect(result).toEqual(expectedUser);
        expect(mockPgQuery).toHaveBeenCalledWith({
            text: 'SELECT * FROM users WHERE id = $1',
            values: [userId]
        });
    });
});
```

## File System Test Examples

```typescript
// config-file-load-broker.test.ts
import {jest} from '@jest/globals';
import {fsReadFile} from '../../adapters/fs/fs-read-file';
import {createFilePath, createJsModuleContent, createJsonContent} from '../../../test-helpers/contract-factories';

jest.mock('../../adapters/fs/fs-read-file');
const mockFsReadFile = fsReadFile as jest.MockedFunction<typeof fsReadFile>;

describe('configFileLoadBroker', () => {
    it('loads JS config file', async () => {
        const configPath = createFilePath('/project/.questmaestro.js');
        const configContent = createJsModuleContent({framework: 'react', schema: 'zod'});

        // ✅ Both path and content are validated types
        mockFsReadFile.mockResolvedValue(configContent);

        const result = await configFileLoadBroker({configPath});

        expect(result).toEqual({framework: 'react', schema: 'zod'});
        expect(mockFsReadFile).toHaveBeenCalledWith({path: configPath});
    });
});
```

## Custom ESLint Rule for More Precise Checking

```javascript
// custom-eslint-rules/require-zod-branding.js
module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require .brand() on z.string() and z.number() calls'
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                // Check for z.string() or z.number()
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'z' &&
                    ['string', 'number'].includes(node.callee.property.name)) {

                    // Look for .brand() in the chain
                    let parent = node.parent;
                    let hasBrand = false;

                    while (parent && parent.type === 'MemberExpression') {
                        if (parent.property.name === 'brand') {
                            hasBrand = true;
                            break;
                        }
                        parent = parent.parent;
                    }

                    if (!hasBrand) {
                        context.report({
                            node,
                            message: `${node.callee.property.name}() must be chained with .brand() - use z.${node.callee.property.name}().brand<'TypeName'>()`
                        });
                    }
                }
            }
        };
    }
};
```

## Required Branding Pattern

```typescript
// ✅ Allowed - chains to .brand()
export const emailAddressContract = z.string()
    .email()
    .max(254)
    .brand<'EmailAddress'>();

export const userIdContract = z.string()
    .uuid()
    .brand<'UserId'>();

export const positiveNumberContract = z.number()
    .positive()
    .brand<'PositiveNumber'>();

// ❌ Banned - no .brand()
export const badEmailContract = z.string().email(); // ESLint error!
export const badNumberContract = z.number().positive(); // ESLint error!

// The types are branded, not raw primitives
type EmailAddress = string & Brand<'EmailAddress'>;
type UserId = string & Brand<'UserId'>;
type PositiveNumber = number & Brand<'PositiveNumber'>;
```

## Type Safety with Brands

```typescript
// ❌ Can't assign raw values
const email: EmailAddress = 'test@example.com'; // Type error!
const id: UserId = 'user-123'; // Type error!

// ✅ Must go through contract
const email = emailAddressContract.parse('test@example.com'); // Works
const id = userIdContract.parse('user-123'); // Works

// ✅ Factory functions work the same
const email = createEmailAddress('test@example.com'); // Works
const id = createUserId('user-123'); // Works
```

## Decision Framework

**Extract as domain primitive when:**

- ✅ **Used across multiple schemas** (UserId in User, Post, Comment, Order)
- ✅ **Complex validation rules** (email format, UUID format, currency precision)
- ✅ **Strong business meaning** (EmailAddress, Timestamp, Currency)

**Define inline when:**

- ❌ **Single schema usage** (UserBio only used in User schema)
- ❌ **Simple validation** (basic string with min/max length)
- ❌ **Schema-specific** (PostTitle, CommentBody - too specific)

**Use composition for:**

- ✅ **API variations** (Public vs Private, Create vs Update)
- ✅ **Common field sets** (audit fields, soft delete fields)
- ✅ **Related entities** (Post with embedded Author)

## Migration Strategy

1. **Add ESLint rules** - Enforce .brand() usage and ban raw primitives
2. **Identify domain primitives** - Find truly reusable types (IDs, emails, timestamps)
3. **Create base schemas** - Rich schemas with inline field definitions
4. **Add composition** - Use pick/omit/merge for variations
5. **Update test factories** - Leverage composition in factories
6. **Migrate function signatures** - Use composed types in broker/adapter signatures
7. **Update tests** - Replace individual field mocks with composed contract mocks

## Benefits

- ✅ **Compile-time safety** - Can't use raw primitives
- ✅ **Runtime validation** - Zod validates all data
- ✅ **Schema composition** - Easy variations using pick/omit/merge
- ✅ **Reduced boilerplate** - Fewer individual contract files
- ✅ **Test data integrity** - Factories ensure valid mock data
- ✅ **Better error messages** - Zod provides detailed validation errors
- ✅ **Self-documenting** - Rich schemas show all validation rules
- ✅ **Maintainable** - Changes to base schema automatically flow to variations
- ✅ **Mock with confidence** - All test data uses same validation as production