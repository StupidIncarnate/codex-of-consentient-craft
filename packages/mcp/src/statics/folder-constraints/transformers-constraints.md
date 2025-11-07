**FOLDER STRUCTURE:**

```
transformers/
  format-date/
    format-date-transformer.ts
    format-date-transformer.test.ts
  user-to-dto/
    user-to-dto-transformer.ts
    user-to-dto-transformer.test.ts
```

**TRANSFORMERS VS GUARDS:**

|               | Transformers                                | Guards                           |
|---------------|---------------------------------------------|----------------------------------|
| **Returns**   | Data (any type)                             | Boolean only                     |
| **Purpose**   | Transform data shape                        | Validate conditions              |
| **Examples**  | formatDateTransformer, userToDtoTransformer | isAdminGuard, hasPermissionGuard |
| **Mutations** | Cannot mutate inputs                        | Cannot mutate inputs             |

Both are pure functions, but transformers return transformed data while guards return true/false.

**PURITY REQUIREMENTS:**

Transformers MUST be pure functions:

- ✅ Return transformed data based only on input parameters
- ✅ No external API calls, database queries, file I/O
- ✅ No side effects (mutations, logging, state changes)
- ❌ Cannot call adapters or brokers
- ❌ Cannot modify input parameters

**OUTPUT VALIDATION:**

All transformers MUST validate output using contracts:

```typescript
export const formatDateTransformer = ({date}: { date: Date }): DateString => {
    const formatted = date.toISOString().split('T')[0];
    return dateStringContract.parse(formatted);  // ✅ Validates output
};

// ❌ WRONG: Returning raw string
return formatted;  // Type error - not branded
```

**VARIANTS VS OPTIONS (CRITICAL SECURITY RULE):**

**Rule:** Each distinct output shape = separate transformer file. NEVER use options to conditionally include/exclude
fields.

```typescript
// ✅ CORRECT - Separate files for different shapes
// transformers/user-to-dto/user-to-dto-transformer.ts
export const userToDtoTransformer = ({user}: { user: User }): UserDto => {
    return userDtoContract.parse({
        id: user.id,
        name: user.name,
        email: user.email  // Public API response
    });
};

// transformers/user-to-admin-dto/user-to-admin-dto-transformer.ts
export const userToAdminDtoTransformer = ({user}: { user: User }): UserAdminDto => {
    return userAdminDtoContract.parse({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash  // Admin-only fields
    });
};

// ❌ WRONG - Options for security-sensitive fields
export const userToDtoTransformer = ({user, includePassword}: {
    user: User;
    includePassword?: boolean;  // DANGEROUS!
}): UserDto => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        ...(includePassword && {passwordHash: user.passwordHash})  // Security risk!
    };
};
```

**Why critical:**

- Options make it easy to accidentally expose sensitive fields (passwordHash, deletedAt, internalNotes)
- Each output shape has different security requirements
- Separate files make security boundaries explicit and auditable
- Type system can't catch `includePassword: true` in wrong context

**When to create variant transformers:**

- Different output shapes (DTO vs summary vs admin)
- Different security contexts (public vs authenticated vs admin)
- Different use cases (list view vs detail view)

**OBJECT ARGUMENTS FOR STATICS:**

When using static objects, use the Record pattern:

```typescript
// ✅ CORRECT: Record pattern for flexible static access
folderConfigs: Record<string, (typeof folderConfigStatics)[keyof typeof folderConfigStatics]>

// ❌ WRONG: Duplicating the entire static type
folderConfigs: typeof folderConfigStatics
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Transforms a Date object into a formatted date string (YYYY-MM-DD)
 *
 * USAGE:
 * formatDateTransformer({date: new Date('2024-01-15')});
 * // Returns '2024-01-15' as branded DateString
 */
// transformers/format-date/format-date-transformer.ts
import {dateStringContract} from '../../contracts/date-string/date-string-contract';
import type {DateString} from '../../contracts/date-string/date-string-contract';

export const formatDateTransformer = ({date}: { date: Date }): DateString => {
    const formatted = date.toISOString().split('T')[0];
    return dateStringContract.parse(formatted);
};

/**
 * PURPOSE: Transforms a folder type and config into human-readable purpose description
 *
 * USAGE:
 * folderPurposeTransformer({folderType: 'brokers', folderConfigs: folderConfigStatics});
 * // Returns purpose text from folder config
 */
// Using Record pattern with statics
import {folderConfigStatics} from '../../statics/folder-config/folder-config-statics';
import type {FolderType} from '../../contracts/folder-type/folder-type-contract';
import type {ContentText} from '../../contracts/content-text/content-text-contract';

export const folderPurposeTransformer = ({
                                             folderType,
                                             folderConfigs
                                         }: {
    folderType: FolderType;
    folderConfigs: Record<string, (typeof folderConfigStatics)[keyof typeof folderConfigStatics]>;
}): ContentText => {
    const config = folderConfigs[folderType];
    return contentTextContract.parse(config.purpose);
};
```

**PROXY PATTERN:**

Transformers are pure functions - **no proxy needed**. They run real in all tests.

Optional transformer proxies only build test data, never mock the transformer itself.

```typescript
// transformers/format-date/format-date-transformer.proxy.ts
// Empty proxy - transformer runs real
export const formatDateTransformerProxy = (): Record<PropertyKey, never> => ({});
```

**Why no proxies:**

- Transformers are pure data transformations
- No side effects to mock
- Input → Output is deterministic
- Testing the real transformer validates the transformation logic

**When you might create a transformer proxy:**

- Complex test data builders (rare)
- Multiple test scenarios need specific input combinations

**Most transformers don't need proxies** - just call them directly in tests with test data.

**TEST EXAMPLE:**

```typescript
// transformers/format-date/format-date-transformer.test.ts
import {formatDateTransformer} from './format-date-transformer';
import {DateStringStub} from '../../contracts/date-string/date-string.stub';

type DateString = ReturnType<typeof DateStringStub>;

describe('formatDateTransformer', () => {
    describe('valid dates', () => {
        it('VALID: {date: 2024-01-15} => returns "2024-01-15"', () => {
            const date = new Date('2024-01-15T00:00:00.000Z');

            const result = formatDateTransformer({date});

            expect(result).toBe('2024-01-15');
        });

        it('VALID: {date: 2024-12-31} => returns "2024-12-31"', () => {
            const date = new Date('2024-12-31T23:59:59.999Z');

            const result = formatDateTransformer({date});

            expect(result).toBe('2024-12-31');
        });

        it('VALID: {date: 2024-02-29 leap year} => returns "2024-02-29"', () => {
            const date = new Date('2024-02-29T12:00:00.000Z');

            const result = formatDateTransformer({date});

            expect(result).toBe('2024-02-29');
        });
    });

    describe('edge cases', () => {
        it('EDGE: {date: epoch} => returns "1970-01-01"', () => {
            const date = new Date(0);

            const result = formatDateTransformer({date});

            expect(result).toBe('1970-01-01');
        });

        it('EDGE: {date: year 2000} => returns "2000-01-01"', () => {
            const date = new Date('2000-01-01T00:00:00.000Z');

            const result = formatDateTransformer({date});

            expect(result).toBe('2000-01-01');
        });
    });
});
```
