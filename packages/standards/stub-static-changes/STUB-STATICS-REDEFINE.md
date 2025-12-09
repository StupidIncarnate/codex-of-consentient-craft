# Stub Architecture & Validation Layers

## Core Philosophy

**Stubs are minimal, flexible data factories. Guards encapsulate enum logic and business validation. Contracts define
shape and constraints.**

The key insight: Different types of data integrity require different enforcement mechanisms.

---

## Three Types of Data Integrity

### 1. Enum Sets → Statics + Automatic Exhaustive Testing

**For:** Fixed sets of valid values (tiers, statuses, roles, categories)

**Storage:** `statics/{entity}/{entity}-statics.ts`

**Critical Rule:** Contracts MUST derive enum definitions from statics (no duplication)

**Pattern:**

```typescript
// =====================================
// statics/user/user-statics.ts
// =====================================
export const userStatics = {
    tiers: {
        premium: ['gold', 'diamond'] as const,
        free: ['basic', 'trial'] as const,
    },
    roles: {
        admin: ['superadmin', 'admin'] as const,
        user: ['member', 'guest'] as const,
    },
} as const;

// Extract types from statics (single source of truth)
export type PremiumTier = (typeof userStatics.tiers.premium)[number];
// type PremiumTier = 'gold' | 'diamond'

export type FreeTier = (typeof userStatics.tiers.free)[number];
// type FreeTier = 'basic' | 'trial'

export type SubscriptionTier = PremiumTier | FreeTier;
// type SubscriptionTier = 'gold' | 'diamond' | 'basic' | 'trial'

export type AdminRole = (typeof userStatics.roles.admin)[number];
export type UserRole = (typeof userStatics.roles.user)[number];
export type Role = AdminRole | UserRole;

// =====================================
// guards/is-premium-tier/is-premium-tier-guard.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';
import type {User} from '../../contracts/user/user-contract';

export const isPremiumTierGuard = ({user}: { user: User }): boolean => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    return premiumTiers.includes(user.tier);
};

// =====================================
// guards/is-admin-role/is-admin-role-guard.ts
// =====================================
export const isAdminRoleGuard = ({user}: { user: User }): boolean => {
    const adminRoles: readonly string[] = userStatics.roles.admin;
    return adminRoles.includes(user.role);
};

// =====================================
// contracts/user/user-contract.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';

// ✅ Derive enum from static (single source of truth)
const allTiers = [
    ...userStatics.tiers.premium,
    ...userStatics.tiers.free,
] as const;

const allRoles = [
    ...userStatics.roles.admin,
    ...userStatics.roles.user,
] as const;

export const userContract = z.object({
    id: userIdContract,
    name: z.string().brand<'UserName'>(),
    email: emailAddressContract,
    tier: z.enum(allTiers),    // ✅ Derived from static
    role: z.enum(allRoles),    // ✅ Derived from static
    isPremium: z.boolean(),
});

export type User = z.infer<typeof userContract>;
```

**Benefits:**

- ✅ Single source of truth (statics)
- ✅ Adding tier to static = automatically valid in contract
- ✅ Can't have contract/static mismatch
- ✅ Type safety enforced by TypeScript

**CRITICAL RULE: Static Arrays MUST Be Encapsulated in Guards**

**❌ NEVER use static arrays directly in widgets/brokers/contracts:**

```typescript
// ❌ FORBIDDEN - Direct static reference in widget
export const UserProfileWidget = ({user}: { user: User }) => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    const isPremium = premiumTiers.includes(user.tier);
    return <div>{isPremium && <PremiumBadge / >
}
    </div>;
};

// ❌ FORBIDDEN - Direct static reference in broker
export const userAccessBroker = ({user}: { user: User }) => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    return {canAccessPremium: premiumTiers.includes(user.tier)};
};
```

**✅ ALWAYS encapsulate in guards:**

```typescript
// =====================================
// guards/is-premium-tier/is-premium-tier-guard.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';
import type {User} from '../../contracts/user/user-contract';

/**
 * Checks if user has premium tier subscription.
 *
 * ALIGNS WITH: userStatics.tiers.premium
 */
export const isPremiumTierGuard = ({user}: { user: User }): boolean => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    return premiumTiers.includes(user.tier);
};

// =====================================
// Widget uses guard (clean, no type cast)
// =====================================
export const UserProfileWidget = ({user}: { user: User }) => {
    const isPremium = isPremiumTierGuard({user});

    return <div>{isPremium && <PremiumBadge / >
}
    </div>;
};

// =====================================
// Broker uses guard
// =====================================
export const userAccessBroker = ({user}: { user: User }) => {
    return {
        canAccessPremium: isPremiumTierGuard({user}),
    };
};

// =====================================
// Contract defines schema (no guards in refine to avoid circular deps)
// =====================================
export const userContract = z.object({
    tier: z.enum(allTiers),
    isPremium: z.boolean(),
});
```

**Guards for Composite Logic:**

```typescript
// ✅ Composite guard uses enum membership guard
// Note: Composite guards can reference User type since they don't get called in contract.refine()
export const canAccessPremiumFeaturesGuard = ({user}: { user: User }): boolean => {
    return (
        isPremiumTierGuard({user}) &&
        user.isEmailVerified &&
        !user.isSuspended
    );
};
```

**Why This Rule:**

1. ✅ **Single source of truth** - Static reference exists in ONE place (guard)
2. ✅ **Type casting centralized** - Guard handles readonly array conversion
3. ✅ **Exhaustive testing once** - Guard test has test.each, widgets don't need it
4. ✅ **Semantic naming** - `isPremiumTierGuard({ user })` is clearer than inline check
5. ✅ **Consistent pattern** - LLMs can't choose between guard/inline (always guard)

**Automatic Exhaustive Testing (NO Manual Scenarios):**

When code references a static, lint enforces `test.each` through that static.

**Example 1: Guard with Static Reference**

```typescript
// =====================================
// Guard implementation
// =====================================
// guards/is-premium-tier/is-premium-tier-guard.ts
import {userStatics} from '../../statics/user/user-statics';

export const isPremiumTierGuard = ({user}: { user: User }): boolean => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    //                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // LINT DETECTS THIS STATIC REFERENCE!
    return premiumTiers.includes(user.tier);
};

// =====================================
// Guard test MUST exhaustively test
// =====================================
// guards/is-premium-tier/is-premium-tier-guard.test.ts
import {userStatics} from '../../statics/user/user-statics';

// ✅ PASSES LINT - Tests all premium tiers
test.each(userStatics.tiers.premium)(
    'VALID: {premium tier: %s} => returns true',
    (tier) => {
        const user = UserStub({tier, isPremium: true});
        expect(isPremiumTierGuard({user})).toBe(true);
    }
);

// ✅ PASSES LINT - Tests all free tiers
test.each(userStatics.tiers.free)(
    'VALID: {free tier: %s} => returns false',
    (tier) => {
        const user = UserStub({tier, isPremium: false});
        expect(isPremiumTierGuard({user})).toBe(false);
    }
);

// ❌ FAILS LINT - Missing exhaustive test
describe('isPremiumTierGuard', () => {
    it('returns true for gold tier', () => {
        const user = UserStub({tier: 'gold', isPremium: true});
        expect(isPremiumTierGuard({user})).toBe(true);
    });

    // ERROR: Implementation uses userStatics.tiers.premium
    // but tests don't exhaustively cover all values: ['gold', 'diamond']
});
```

**Example 2: Widget Using Guard (No Static Reference)**

```typescript
// =====================================
// Widget uses guard (no direct static reference)
// =====================================
// widgets/user-profile/user-profile-widget.tsx
import {isPremiumTierGuard} from '../../../guards/is-premium-tier/is-premium-tier-guard';

export const UserProfileWidget = ({user}: { user: User }) => {
    const isPremium = isPremiumTierGuard({user});
    // No static reference here - just calling guard

    return (
        <div>
            <h2>{user.name} < /h2>
    {
        isPremium && <PremiumBadge / >
    }
    </div>
)
    ;
};

// =====================================
// Widget test does NOT need test.each
// =====================================
// widgets/user-profile/user-profile-widget.test.tsx

// ✅ PASSES LINT - No static reference = no test.each required
it('VALID: {premium user} => displays premium badge', () => {
    const user = UserStub({tier: 'gold', isPremium: true});
    render(<UserProfileWidget user = {user}
    />);
    expect(screen.getByTestId('PREMIUM_BADGE')).toBeInTheDocument();
});

it('VALID: {free user} => hides premium badge', () => {
    const user = UserStub({tier: 'basic', isPremium: false});
    render(<UserProfileWidget user = {user}
    />);
    expect(screen.queryByTestId('PREMIUM_BADGE')).not.toBeInTheDocument();
});

// Guard is already exhaustively tested - widget just tests integration
```

**Example 3: ESLint Detects Direct Static Reference (FORBIDDEN)**

```typescript
// =====================================
// ❌ Widget uses static directly - LINT ERROR
// =====================================
// widgets/tier-badge/tier-badge-widget.tsx
import {userStatics} from '../../../statics/user/user-statics';

export const TierBadgeWidget = ({user}: { user: User }) => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    //                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // ❌ LINT ERROR!

    const isPremium = premiumTiers.includes(user.tier);

    return <div>{isPremium && <PremiumBadge / >
}
    </div>;
};

// ERROR: Direct static reference in widget
// Static arrays MUST be encapsulated in guards
//
// Required fix:
//   1. Create guard: guards/is-premium-tier/is-premium-tier-guard.ts
//   2. Use guard: isPremiumTierGuard({ user })
```

**ESLint Rules for Static Enforcement:**

### Rule 1: `@dungeonmaster/enforce-static-in-guards-only`

**Scans for:** Direct static references outside of guard files

```typescript
// ❌ LINT ERROR - Static reference in widget
// File: widgets/user-profile/user-profile-widget.tsx
const premiumTiers: readonly string[] = userStatics.tiers.premium;

ERROR: Static
reference
detected
outside
guard
File: widgets / user - profile / user - profile - widget.tsx
Static: userStatics.tiers.premium

Static
arrays
MUST
be
encapsulated in guards.Required
:
1.
Create
guard: guards / is - premium - tier / is - premium - tier - guard.ts
2.
Use
guard in widget
:
isPremiumTierGuard({user})
```

**Allowed locations for static references:**

- ✅ `guards/**/*-guard.ts` files
- ✅ `statics/**/*-statics.ts` files (type definitions)
- ✅ `contracts/**/*-contract.ts` files (enum derivation only)
- ❌ Everywhere else (widgets, brokers, transformers, etc.)

### Rule 2: `@dungeonmaster/enforce-guard-exhaustiveness`

**Scans guards for:** Static references that need exhaustive testing

```typescript
// guards/is-premium-tier/is-premium-tier-guard.ts
export const isPremiumTierGuard = ({user}) => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    //                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // LINT DETECTS THIS
    return premiumTiers.includes(user.tier);
};
```

**Verifies test file has test.each:**

```typescript
// guards/is-premium-tier/is-premium-tier-guard.test.ts
// ✅ PASSES - Has test.each for userStatics.tiers.premium
test.each(userStatics.tiers.premium)(
    'VALID: {tier: %s} => returns true',
    (tier) => { ...
    }
);

// ❌ FAILS - Missing test.each
describe('isPremiumTierGuard', () => {
    it('returns true for gold', () => { ...
    });
});

ERROR: Guard
uses
static
but
tests
don
't loop through all values

File: guards / is - premium - tier / is - premium - tier - guard.ts
Static
reference: userStatics.tiers.premium
Values: ['gold', 'diamond']

Missing
exhaustive
test in
:
guards / is - premium - tier / is - premium - tier - guard.test.ts

Required:
    test.each(userStatics.tiers.premium)(
        'VALID: {tier: %s} => returns true',
        (tier) => { ...
        }
    );
```

### Rule 3: `@dungeonmaster/ban-contract-guard-imports`

**What it does:** Prevents contracts from importing guards (creates circular dependency)

**Blocks:**

```typescript
// ❌ Contract imports guard
// File: contracts/user/user-contract.ts
import {isPremiumTierGuard} from '../../guards/is-premium-tier/is-premium-tier-guard';

export const userContract = z.object({...})
    .refine((user) => isPremiumTierGuard({user}));
```

**Allows:**

```typescript
// ✅ Guards can import contract types
// File: guards/is-premium-tier/is-premium-tier-guard.ts
import type {User} from '../../contracts/user/user-contract';
```

**Error message:**

```
Contract cannot import guard (creates circular dependency)

File: contracts/user/user-contract.ts
Import: isPremiumTierGuard from guards/is-premium-tier/is-premium-tier-guard

Contracts define shape. Guards validate logic.
Use guards in brokers/widgets, not in contract.refine()
```

### Rule 4: `@dungeonmaster/enforce-enum-from-statics`

**What it does:** Detects hardcoded enum arrays in contracts, requires deriving from statics

**Blocks:**

```typescript
// ❌ Hardcoded enum in contract
export const userContract = z.object({
    tier: z.enum(['gold', 'diamond', 'basic', 'trial']),
});
```

**Requires:**

```typescript
// ✅ Derived from statics
import {userStatics} from '../../statics/user/user-statics';

const allTiers = [
    ...userStatics.tiers.premium,
    ...userStatics.tiers.free,
] as const;

export const userContract = z.object({
    tier: z.enum(allTiers),
});
```

**Error message:**

```
Hardcoded enum detected in contract

File: contracts/user/user-contract.ts
Enum values: ['gold', 'diamond', 'basic', 'trial']

Enums MUST be derived from statics (single source of truth).

Required:
  1. Define in: statics/user/user-statics.ts
  2. Derive: const allTiers = [...userStatics.tiers.premium, ...userStatics.tiers.free]
  3. Use: z.enum(allTiers)
```

### Rule 5: `@dungeonmaster/ban-hardcoded-enum-checks`

**What it does:** Detects hardcoded array checks anywhere in codebase

**Blocks:**

```typescript
// ❌ Hardcoded array check
const isPremium = ['gold', 'diamond'].includes(user.tier);

// ❌ Hardcoded OR chain
if (tier === 'gold' || tier === 'diamond') { ...
}
```

**Requires:**

```typescript
// ✅ Use guard
const isPremium = isPremiumTierGuard({user});
```

**Error message:**

```
Hardcoded enum check detected

File: brokers/user-access/user-access-broker.ts
Pattern: ['gold', 'diamond'].includes(user.tier)

Enum checks MUST use guards.

Required:
  1. Create guard: guards/is-premium-tier/is-premium-tier-guard.ts
  2. Use: isPremiumTierGuard({ user })
```

### Rule 6: `@dungeonmaster/enforce-guard-type-import`

**What it does:** Ensures guards only use `import type` when importing from contracts

**Blocks:**

```typescript
// ❌ Value import in guard
import {User} from '../../contracts/user/user-contract';
```

**Requires:**

```typescript
// ✅ Type-only import
import type {User} from '../../contracts/user/user-contract';
```

**Error message:**

```
Guard must use type-only import from contract

File: guards/is-premium-tier/is-premium-tier-guard.ts
Import: User from contracts/user/user-contract

Use type-only import to avoid circular dependencies:
  import type { User } from '../../contracts/user/user-contract';
```

### Rule 7: `@dungeonmaster/enforce-stub-minimal-defaults`

**What it does:** Ensures stubs default to empty arrays and undefined optionals

**Blocks:**

```typescript
// ❌ Non-empty defaults
export const UserStub = () => userContract.parse({
    projects: [ProjectIdStub('proj-1')],  // Should be []
    metadata: {foo: 'bar'},             // Should be undefined
});
```

**Allows exception when contract requires minimum:**

```typescript
// ✅ OK when contract has .min(1)
export const orderContract = z.object({
    items: z.array(orderItemContract).min(1),
});

export const OrderStub = () => orderContract.parse({
    items: [OrderItemStub()],  // Minimum required by contract
});
```

**Error message:**

```
Stub has non-minimal defaults

File: contracts/user/user.stub.ts
Field: projects
Default: [ProjectIdStub('proj-1')]

Stubs must default to empty arrays (unless contract requires minimum).
Tests should set cardinality inline per test.

Change to: projects: []
```

**Key Rules:**

- ❌ No hardcoded enum arrays in code: `['gold', 'diamond'].includes(tier)`
- ❌ No enum duplication in contracts: `z.enum(['gold', 'diamond'])`
- ❌ No direct static references in widgets/brokers/contracts
- ❌ No guard imports in contracts (circular dependency)
- ✅ Define once in statics, derive in contracts
- ✅ Encapsulate static checks in guards (ALWAYS)
- ✅ Guards exhaustively tested with test.each
- ✅ Guards use `import type` from contracts
- ✅ Widgets/brokers/contracts use guards (no test.each needed)
- ✅ Stubs default to empty/undefined (minimal defaults)
- ✅ One pattern only = consistent, LLM-friendly

---

### 2. Contract Schema → Shape & Constraints

**For:** Defining entity shape, field types, and enum constraints

**Storage:** `contracts/{entity}/{entity}-contract.ts`

**Pattern:**

```typescript
// contracts/user/user-contract.ts
import {z} from 'zod';
import {emailAddressContract} from '../email-address/email-address-contract';

export const userContract = z.object({
    id: userIdContract,
    name: z.string().brand<'UserName'>(),
    email: emailAddressContract,
    tier: z.enum(allTiers),
    role: z.enum(allRoles),
    isPremium: z.boolean(),
    hasCoupon: z.boolean(),
    couponCode: z.string().brand<'CouponCode'>().optional(),
    isEmailVerified: z.boolean(),
    isSuspended: z.boolean(),
    projects: z.array(projectIdContract),
});

export type User = z.infer<typeof userContract>;
```

**Stub provides minimal data factory:**

```typescript
// contracts/user/user.stub.ts
import {userContract} from './user-contract';
import type {User} from './user-contract';
import type {StubArgument} from '@dungeonmaster/shared/@types';
import {UserIdStub} from '../user-id/user-id.stub';
import {EmailStub} from '../email/email.stub';
import {CouponCodeStub} from '../coupon-code/coupon-code.stub';

export const UserStub = ({...props}: StubArgument<User> = {}): User => {
    return userContract.parse({
        id: UserIdStub('user-1'),
        name: 'John Doe',
        email: EmailStub('john@example.com'),
        tier: 'basic',
        role: 'member',
        isPremium: false,
        hasCoupon: true,
        couponCode: CouponCodeStub('WELCOME'),
        isEmailVerified: true,
        isSuspended: false,
        projects: [],  // Empty by default (see cardinality section)
        ...props,
    });
};

// ✅ Valid user
const user = UserStub({
    tier: 'gold',
    isPremium: true,
});
```

**Key Rules:**

- ✅ Contracts define shape and enum constraints
- ✅ Guards validate enum membership and business logic
- ✅ Guards do NOT call contract validation (avoids circular dependencies)
- ✅ Stubs provide minimal, flexible data factories
- ✅ Use guards in brokers/widgets for business logic validation

---

### 3. Cardinality → Test-Specific Inline

**For:** Array lengths, optional fields, item counts (0, 1, 2, many)

**Default:** Arrays empty, optionals undefined

**Pattern:**

```typescript
// contracts/order/order.stub.ts
export const OrderStub = ({...props}: StubArgument<Order> = {}): Order => {
    return orderContract.parse({
        id: OrderIdStub('order-1'),
        userId: UserIdStub('user-1'),
        items: [],  // ✅ Empty by default
        subtotal: 0,
        discount: 0,
        total: 0,
        couponCode: undefined,  // ✅ Undefined by default
        ...props,
    });
};

// contracts/product/product.stub.ts
export const ProductStub = ({...props}: StubArgument<Product> = {}): Product => {
    return productContract.parse({
        id: ProductIdStub('product-1'),
        name: 'Widget',
        price: 100,
        ownerId: UserIdStub('owner-1'),
        collaboratorIds: [],  // ✅ Empty by default
        tags: [],  // ✅ Empty by default
        metadata: undefined,  // ✅ Undefined by default
        ...props,
    });
};

// contracts/user/user.stub.ts
export const UserStub = ({...props}: StubArgument<User> = {}): User => {
    return userContract.parse({
        id: UserIdStub('user-1'),
        name: 'John Doe',
        email: EmailStub('john@example.com'),
        projects: [],  // ✅ Empty by default
        permissions: [],  // ✅ Empty by default
        ...props,
    });
};
```

**Tests Set Cardinality Inline:**

```typescript
// Zero items (empty array)
it('EMPTY: {order with no items} => shows empty cart', () => {
    const order = OrderStub({items: []});
    // OR just: OrderStub() - default is empty

    render(<Cart order = {order}
    />);
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
});

// One item
it('VALID: {order with one item} => displays item details', () => {
    const order = OrderStub({
        items: [
            OrderItemStub({
                productName: 'Widget',
                quantity: 1,
                price: 100,
            }),
        ],
        subtotal: 100,
        total: 100,
    });

    render(<Cart order = {order}
    />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
});

// Two items
it('VALID: {order with two items} => calculates correct subtotal', () => {
    const order = OrderStub({
        items: [
            OrderItemStub({productName: 'Widget', price: 100, quantity: 2}),
            OrderItemStub({productName: 'Gadget', price: 50, quantity: 1}),
        ],
        subtotal: 250,
        total: 250,
    });

    expect(calculateSubtotal({order})).toBe(250);
});

// Many items
it('VALID: {order with 50 items} => paginates item list', () => {
    const order = OrderStub({
        items: Array.from({length: 50}, (_, i) =>
            OrderItemStub({
                productName: `Item ${i + 1}`,
                price: 10,
                quantity: 1,
            })
        ),
    });

    render(<Cart order = {order}
    />);
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
});

// Collaborators: 0, 1, 2, many
it('VALID: {product with no collaborators} => owner-only permissions', () => {
    const product = ProductStub({collaboratorIds: []});
    expect(getCollaborators({product})).toHaveLength(0);
});

it('VALID: {product with 3 collaborators} => shared permissions', () => {
    const product = ProductStub({
        collaboratorIds: [
            UserIdStub('collab-1'),
            UserIdStub('collab-2'),
            UserIdStub('collab-3'),
        ],
    });

    expect(getCollaborators({product})).toHaveLength(3);
});
```

**Key Rules:**

- ✅ Set cardinality per test inline
- ❌ Don't default to non-empty arrays
- ✅ Keep stubs minimal (empty arrays, undefined optionals)
- ✅ Use `Array.from()` for generating many items
- ✅ Tests define exactly what they need

**Exception: When Contract Enforces Minimum Length**

If contract requires non-empty array, stub must provide minimum valid default:

```typescript
// Contract requires at least one item
export const orderContract = z.object({
    id: orderIdContract,
    items: z.array(orderItemContract).min(1),  // At least 1 required
});

// Stub provides minimum valid state
export const OrderStub = ({...props} = {}) => {
    return orderContract.parse({
        id: OrderIdStub('order-1'),
        items: [OrderItemStub()],  // ✅ Minimum 1 item to satisfy contract
        ...props,
    });
};

// Tests override as needed
it('VALID: {order with 3 items} => ...', () => {
    const order = OrderStub({
        items: [
            OrderItemStub({productName: 'A'}),
            OrderItemStub({productName: 'B'}),
            OrderItemStub({productName: 'C'}),
        ],
    });
});
```

---

## File Organization

```
contracts/
  user/
    user-contract.ts          # Contract schema (shape + enum constraints)
    user-contract.test.ts
    user.stub.ts              # Minimal base stub

statics/
  user/
    user-statics.ts           # Enum sets (single source of truth)
    user-statics.test.ts
    user-statics.proxy.ts     # Override values for edge case tests

guards/
  is-premium-tier/
    is-premium-tier-guard.ts          # Enum membership guard
    is-premium-tier-guard.test.ts     # Exhaustive test.each
  is-free-tier/
    is-free-tier-guard.ts             # Enum membership guard
    is-free-tier-guard.test.ts
  is-admin-role/
    is-admin-role-guard.ts            # Enum membership guard
    is-admin-role-guard.test.ts
  can-access-premium-features/
    can-access-premium-features-guard.ts      # Composite logic (uses enum guards)
    can-access-premium-features-guard.test.ts
```

---

## Complete Example

```typescript
// =====================================
// statics/user/user-statics.ts
// =====================================
export const userStatics = {
    tiers: {
        premium: ['gold', 'diamond'] as const,
        free: ['basic', 'trial'] as const,
    },
    roles: {
        admin: ['superadmin', 'admin'] as const,
        user: ['member', 'guest'] as const,
    },
} as const;

export type PremiumTier = (typeof userStatics.tiers.premium)[number];
export type FreeTier = (typeof userStatics.tiers.free)[number];
export type SubscriptionTier = PremiumTier | FreeTier;

export type AdminRole = (typeof userStatics.roles.admin)[number];
export type UserRole = (typeof userStatics.roles.user)[number];
export type Role = AdminRole | UserRole;

// =====================================
// contracts/user/user-contract.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';
import type {SubscriptionTier, Role, PremiumTier, FreeTier, AdminRole} from '../../statics/user/user-statics';

// Derive enum from static (single source of truth)
const allTiers = [
    ...userStatics.tiers.premium,
    ...userStatics.tiers.free,
] as const;

const allRoles = [
    ...userStatics.roles.admin,
    ...userStatics.roles.user,
] as const;

export const userContract = z.object({
    id: userIdContract,
    name: z.string().brand<'UserName'>(),
    email: emailAddressContract,
    tier: z.enum(allTiers),
    role: z.enum(allRoles),
    isPremium: z.boolean(),
    hasCoupon: z.boolean(),
    couponCode: z.string().brand<'CouponCode'>().optional(),
    projects: z.array(projectIdContract),
});

export type User = z.infer<typeof userContract>;

// =====================================
// contracts/user/user.stub.ts
// =====================================
export const UserStub = ({...props}: StubArgument<User> = {}): User => {
    return userContract.parse({
        id: UserIdStub('user-1'),
        name: 'John Doe',
        email: EmailStub('john@example.com'),
        tier: 'basic',
        role: 'member',
        isPremium: false,
        hasCoupon: true,
        couponCode: CouponCodeStub('WELCOME'),
        projects: [],  // Empty by default
        ...props,
    });
};

// =====================================
// guards/is-premium-tier/is-premium-tier-guard.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';
import type {User} from '../../contracts/user/user-contract';

export const isPremiumTierGuard = ({user}: { user: User }): boolean => {
    const premiumTiers: readonly string[] = userStatics.tiers.premium;
    return premiumTiers.includes(user.tier);
};

// =====================================
// guards/is-free-tier/is-free-tier-guard.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';
import type {User} from '../../contracts/user/user-contract';

export const isFreeTierGuard = ({user}: { user: User }): boolean => {
    const freeTiers: readonly string[] = userStatics.tiers.free;
    return freeTiers.includes(user.tier);
};

// =====================================
// guards/is-admin-role/is-admin-role-guard.ts
// =====================================
import {userStatics} from '../../statics/user/user-statics';
import type {User} from '../../contracts/user/user-contract';

export const isAdminRoleGuard = ({user}: { user: User }): boolean => {
    const adminRoles: readonly string[] = userStatics.roles.admin;
    return adminRoles.includes(user.role);
};

// =====================================
// guards/can-access-premium-features/can-access-premium-features-guard.ts
// =====================================
import {isPremiumTierGuard} from '../is-premium-tier/is-premium-tier-guard';
import type {User} from '../../contracts/user/user-contract';

export const canAccessPremiumFeaturesGuard = ({
                                                  user
                                              }: {
    user: User
}): boolean => {
    // ✅ Composite guard uses enum membership guard
    return (
        isPremiumTierGuard({user}) &&
        user.isEmailVerified &&
        !user.isSuspended
    );
};

// =====================================
// Tests
// =====================================

// Test exhaustive premium tier scenarios using guard + static
test.each(userStatics.tiers.premium)(
    'VALID: {premium tier: %s} => displays premium badge',
    (tier) => {
        const user = UserStub({tier, isPremium: true});
        render(<UserProfile user = {user}
        />);

        // Use guard for check
        expect(isPremiumTierGuard({user})).toBe(true);
        expect(screen.getByTestId('PREMIUM_BADGE')).toBeInTheDocument();
    }
);

// Test exhaustive free tier scenarios
test.each(userStatics.tiers.free)(
    'VALID: {free tier: %s} => hides premium badge',
    (tier) => {
        const user = UserStub({tier, isPremium: false, hasCoupon: true});
        render(<UserProfile user = {user}
        />);

        // Use guard for check
        expect(isPremiumTierGuard({user})).toBe(false);
        expect(screen.queryByTestId('PREMIUM_BADGE')).not.toBeInTheDocument();
    }
);

// Test cardinality inline
it('VALID: {user with 3 projects} => displays all projects', () => {
    const user = UserStub({
        projects: [
            ProjectIdStub('proj-1'),
            ProjectIdStub('proj-2'),
            ProjectIdStub('proj-3'),
        ],
    });

    expect(getUserProjects({user})).toHaveLength(3);
});

// Test guard validation in broker
it('VALID: {admin with company email} => allows access', () => {
    const user = UserStub({
        role: 'admin',
        email: EmailStub('admin@company.com'),
    });

    // Broker uses guard to validate
    expect(isAdminRoleGuard({user})).toBe(true);
    expect(() => processAdminAction({user})).not.toThrow();
});
```

---

## Summary: Decision Tree

**When designing test data, ask:**

### 1. **Is this an enum set?** (fixed list of valid values)

- ✅ Define in `statics/`
- ✅ Create guard for enum membership (e.g., `isPremiumTierGuard`)
- ✅ Guard test us es `test.each(static)` for exhaustive coverage
- ✅ Widgets/brokers use guard (no test.each needed)
- ❌ NO direct static references in widgets/brokers

### 2. **Is this business logic validation?** (if A then B)

- ✅ Create guards for validation logic
- ✅ Use guards in brokers/widgets (not in contracts)
- ❌ Don't use guards in contract.refine() (creates circular dependencies)

### 3. **Is this cardinality?** (0, 1, 2, many items)

- ✅ Stub defaults to empty arrays
- ✅ Set cardinality inline per test
- ✅ Tests define exactly what they need

**The result:**

- Stubs stay minimal and flexible
- Contracts define shape and enum constraints
- Guards encapsulate enum membership and business logic
- No circular dependencies (guards don't use User type from contracts in validation)
- Tests are clean, consistent, and LLM-friendly
