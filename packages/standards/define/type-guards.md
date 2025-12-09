# guards/ - Type Guards and Boolean Checks

**Purpose:** Pure boolean functions for type guards and business logic checks

**Folder Structure:**

```
guards/
  has-permission/
    has-permission-guard.ts
    has-permission-guard.proxy.ts  # Test helper for data building
    has-permission-guard.test.ts
  is-valid-email/
    is-valid-email-guard.ts
    is-valid-email-guard.proxy.ts
    is-valid-email-guard.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-guard.ts` (e.g., `has-permission-guard.ts`, `is-admin-guard.ts`)
- **Export:** camelCase ending with `Guard`, starting with `is/has/can/should/will/was` (e.g., `hasPermissionGuard`,
  `isValidEmailGuard`)
- **Proxy:** kebab-case ending with `-guard.proxy.ts`, export `[name]GuardProxy` (e.g., `hasPermissionGuardProxy`)

**Constraints:**

- **MUST be pure functions** (no external calls, no side effects)
- **MUST return boolean**
- **MUST have explicit return types**
- **MUST use optional parameters** (enforced by `@dungeonmaster/enforce-optional-guard-params` rule)
- **MUST validate parameters exist** before using them

**Example:**

```tsx
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

// guards/is-admin/is-admin-guard.ts
import type {User} from '../../contracts/user/user-contract';
import {userStatics} from '../../statics/user/user-statics';

export const isAdminGuard = ({user}: { user?: User }): boolean => {
    if (!user) {
        return false;
    }
    return user.role === userStatics.roles.ADMIN;
};

// guards/can-edit-post/can-edit-post-guard.ts
import type {User} from '../../contracts/user/user-contract';
import type {Post} from '../../contracts/post/post-contract';

export const canEditPostGuard = ({user, post}: {
    user?: User;
    post?: Post;
}): boolean => {
    if (!user || !post) {
        return false;
    }
    return user.id === post.authorId || user.role === 'admin';
};
```
