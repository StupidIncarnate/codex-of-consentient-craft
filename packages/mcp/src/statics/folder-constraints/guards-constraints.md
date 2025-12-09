**FOLDER STRUCTURE:**

```
guards/
  has-permission/
    has-permission-guard.ts
    has-permission-guard.test.ts
  is-admin/
    is-admin-guard.ts
    is-admin-guard.test.ts
```

**NAMING CONVENTIONS:**

Guards MUST start with one of these prefixes:

- `is` - Type checks (isAdminGuard, isValidEmailGuard)
- `has` - Possession checks (hasPermissionGuard, hasAccessGuard)
- `can` - Ability checks (canEditPostGuard, canDeleteGuard)
- `should` - Conditional logic (shouldShowButtonGuard)
- `will`/`was` - Temporal checks (willExpireGuard, wasRecentGuard)

**PURITY REQUIREMENTS:**

Guards MUST be pure functions:

- ✅ Return boolean based only on input parameters
- ✅ No external API calls, database queries, file I/O
- ✅ No side effects (mutations, logging, state changes)
- ❌ Cannot call adapters or brokers
- ❌ Cannot modify input parameters

**OPTIONAL PARAMETERS PATTERN:**

All parameters MUST be optional (enforced by `@dungeonmaster/enforce-optional-guard-params`):

```typescript
export const hasPermissionGuard = ({user, permission}: {
    user?: User;        // Optional with ?
    permission?: Permission;  // Optional with ?
}): boolean => {
    // MUST validate existence first
    if (!user || !permission) {
        return false;
    }
    // Safe to use after validation
    return user.permissions.includes(permission);
};
```

**OBJECT ARGUMENTS FOR STATICS:**

When using static objects, use the Record pattern:

```typescript
// ✅ CORRECT: Record pattern avoids duplication
export const isValidFolderTypeGuard = ({
                                           folderType,
                                           folderConfigs
                                       }: {
    folderType?: string;
    folderConfigs: Record<string, (typeof folderConfigStatics)[keyof typeof folderConfigStatics]>;
}): folderType is FolderType => {
    if (!folderType) return false;
    return folderType in folderConfigs;
};

// ❌ WRONG: Duplicating the static type
folderConfigs: typeof folderConfigStatics;  // Entire object, not flexible
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Validates if a user has a specific permission
 *
 * USAGE:
 * hasPermissionGuard({user, permission: 'admin:delete'});
 * // Returns true if user has the permission, false otherwise
 */
// guards/has-permission/has-permission-guard.ts
import type {User} from '../../contracts/user/user-contract';
import type {Permission} from '../../contracts/permission/permission-contract';

export const hasPermissionGuard = ({user, permission}: {
    user?: User;
    permission?: Permission;
}): boolean => {
    if (!user || !permission) {
        return false;
    }
    return user.permissions.includes(permission);
};

/**
 * PURPOSE: Checks if a user has admin role
 *
 * USAGE:
 * isAdminGuard({user});
 * // Returns true if user has admin role, false otherwise
 */
// guards/is-admin/is-admin-guard.ts
import type {User} from '../../contracts/user/user-contract';
import {userStatics} from '../../statics/user/user-statics';

export const isAdminGuard = ({user}: { user?: User }): boolean => {
    if (!user) {
        return false;
    }
    return user.role === userStatics.roles.ADMIN;
};

/**
 * PURPOSE: Validates if a string is a valid folder type using folder configs
 *
 * USAGE:
 * isValidFolderTypeGuard({folderType: 'brokers', folderConfigs: folderConfigStatics});
 * // Returns true if folderType exists in folderConfigs, false otherwise
 */
// Using Record pattern with statics
import {folderConfigStatics} from '../../statics/folder-config/folder-config-statics';
import type {FolderType} from '../../contracts/folder-type/folder-type-contract';

export const isValidFolderTypeGuard = ({
                                           folderType,
                                           folderConfigs
                                       }: {
    folderType?: string;
    folderConfigs: Record<string, (typeof folderConfigStatics)[keyof typeof folderConfigStatics]>;
}): folderType is FolderType => {
    if (!folderType) {
        return false;
    }
    return folderType in folderConfigs;
};
```

**PROXY PATTERN:**

Guards are pure functions - typically **no proxy needed** for mocking.

**Optional Guard Proxies (Data Builders):**

Guard proxies provide semantic data builders for test scenarios. The guard itself runs REAL - proxies just build test
data.

```typescript
// guards/has-edit-permission/has-edit-permission-guard.proxy.ts
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

type User = ReturnType<typeof UserStub>;
type UserId = ReturnType<typeof UserIdStub>;

export const hasEditPermissionGuardProxy = () => {
    // NO jest.mocked() - guard runs real in tests

    return {
        // Semantic helper for "own profile" path
        setupForOwnProfileEdit: ({userId}: { userId: UserId }): User => {
            return UserStub({id: userId, isAdmin: false});
        },

        // Semantic helper for "admin" path
        setupForAdminEdit: (): User => {
            return UserStub({isAdmin: true});
        },

        // Semantic helper for "no permission" path
        setupForNoEdit: ({userId}: { userId: UserId }): User => {
            const differentId = UserIdStub({value: `different-from-${userId}`});
            return UserStub({id: differentId, isAdmin: false});
        }
    };
};
```

**Usage in higher-layer tests:**

```typescript
// widgets/user-profile/user-profile-widget.test.tsx
it('VALID: {admin viewing profile} => shows edit button', () => {
    const widgetProxy = userProfileWidgetProxy();
    const guardProxy = hasEditPermissionGuardProxy();

    const userId = UserIdStub({value: 'user-123'});
    const admin = guardProxy.setupForAdminEdit(); // Semantic!

    widgetProxy.setupProfile({userId, currentUser: admin});
    // ...test that edit button appears
});
```

**Key benefits:**

- **Semantic**: Tests describe WHAT scenario, not HOW to construct it
- **Encapsulated**: Only guard proxy knows implementation details
- **Reusable**: Guard proxy helpers used across all higher layers
- **Guard runs real**: Helpers build data, guard executes normally

**Most guards don't need proxies** - only create when multiple test scenarios need specific data combinations.

**TEST EXAMPLE:**

```typescript
// guards/has-permission/has-permission-guard.test.ts
import {hasPermissionGuard} from './has-permission-guard';
import {UserStub} from '../../contracts/user/user.stub';
import {PermissionStub} from '../../contracts/permission/permission.stub';

type User = ReturnType<typeof UserStub>;
type Permission = ReturnType<typeof PermissionStub>;

describe('hasPermissionGuard', () => {
    describe('valid permissions', () => {
        it('VALID: {user with permission} => returns true', () => {
            const permission = PermissionStub({value: 'admin:delete'});
            const user = UserStub({
                permissions: [permission],
            });

            const result = hasPermissionGuard({user, permission});

            expect(result).toBe(true);
        });

        it('VALID: {user with multiple permissions, checking one} => returns true', () => {
            const readPermission = PermissionStub({value: 'admin:read'});
            const deletePermission = PermissionStub({value: 'admin:delete'});
            const user = UserStub({
                permissions: [readPermission, deletePermission],
            });

            const result = hasPermissionGuard({user, permission: deletePermission});

            expect(result).toBe(true);
        });
    });

    describe('invalid permissions', () => {
        it('INVALID_PERMISSION: {user without permission} => returns false', () => {
            const readPermission = PermissionStub({value: 'admin:read'});
            const deletePermission = PermissionStub({value: 'admin:delete'});
            const user = UserStub({
                permissions: [readPermission],
            });

            const result = hasPermissionGuard({user, permission: deletePermission});

            expect(result).toBe(false);
        });

        it('INVALID_PERMISSION: {user with empty permissions} => returns false', () => {
            const permission = PermissionStub({value: 'admin:delete'});
            const user = UserStub({
                permissions: [],
            });

            const result = hasPermissionGuard({user, permission});

            expect(result).toBe(false);
        });
    });

    describe('empty inputs', () => {
        it('EMPTY: {user: undefined} => returns false', () => {
            const permission = PermissionStub({value: 'admin:delete'});

            const result = hasPermissionGuard({permission});

            expect(result).toBe(false);
        });

        it('EMPTY: {permission: undefined} => returns false', () => {
            const user = UserStub({
                permissions: [PermissionStub({value: 'admin:read'})],
            });

            const result = hasPermissionGuard({user});

            expect(result).toBe(false);
        });

        it('EMPTY: {both undefined} => returns false', () => {
            const result = hasPermissionGuard({});

            expect(result).toBe(false);
        });
    });
});
```
