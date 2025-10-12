# Proxy Mocking Matrix

**Quick reference:** What gets mocked and what doesn't, with bare-bones examples.

---

## The Rule

**Mock only at I/O boundaries: adapters (npm dependencies) and global functions. Everything else runs real.**

When testing any layer (widget, binding, broker, transformer, guard), only two types of things are mocked:

1. **Adapters** - Mock npm dependencies (axios, fs, etc.) at the adapter boundary
2. **Global functions** - Mock non-deterministic globals (Date.now(), crypto.randomUUID(), etc.)

All business logic, transformers, guards, and React hooks run with real code to ensure contract integrity.

---

## Matrix Overview

| Category         | Own Test                 | Used By Others      | Proxy Purpose                                           | Needs Proxy?     |
|------------------|--------------------------|---------------------|---------------------------------------------------------|------------------|
| **Statics**      | N/A (import directly)    | Import directly     | N/A                                                     | ❌ No             |
| **Contracts**    | Test schema validation   | Use stubs           | N/A                                                     | ❌ No (use stubs) |
| **Guards**       | Runs real                | **Runs real**       | Setup helper (delegates to dependencies)                | ✅ Yes            |
| **Transformers** | Runs real                | **Runs real**       | Setup helper (delegates to dependencies)                | ✅ Yes            |
| **Errors**       | Test error creation      | Throw directly      | N/A                                                     | ❌ No             |
| **Flows**        | Integration test         | N/A                 | N/A                                                     | ❌ No             |
| **Adapters**     | Real adapter, mocked npm | **Runs real**       | **Mocks npm dependency (axios, fs, etc)**               | ✅ Yes            |
| **Middleware**   | Runs real, mocked npm    | **Runs real**       | Setup helper (delegates to adapters)                    | ✅ Yes            |
| **Brokers**      | Runs real, mocked npm    | **Runs real**       | Setup helper (knows URLs, delegates to adapters)        | ✅ Yes            |
| **Bindings**     | Runs real, mocked npm    | **Runs real**       | Setup helper (delegates to brokers)                     | ✅ Yes            |
| **State**        | Runs real                | Import/use directly | N/A (in-memory stores)                                  | ❌ No             |
| **Responders**   | Runs real, mocked npm    | **Runs real**       | Setup helper (delegates to brokers)                     | ✅ Yes            |
| **Widgets**      | Renders real, mocked npm | **Renders real**    | Setup helper + triggers (delegates to bindings/brokers) | ✅ Yes            |
| **Startup**      | Integration test         | N/A                 | N/A                                                     | ❌ No             |
| **Assets**       | N/A (static files)       | N/A                 | N/A                                                     | ❌ No             |
| **Migrations**   | Integration test         | N/A                 | N/A                                                     | ❌ No             |

**KEY INSIGHT:** Only two things are mocked:

1. **npm dependencies** (axios, fs, etc.) - mocked at the adapter level via adapter proxies
2. **global functions** (Date.now(), crypto.randomUUID(), etc.) - mocked in the layer that uses them

Everything else runs real. Adapter proxies mock the npm dependency, not the adapter. All other proxies are setup helpers
that delegate down to the adapter proxy.

### Visual: What Runs Real vs Mocked

```
Widget Test:
┌────────────────────────────────────────────┐
│ Widget                     (REAL)          │ ← Test renders this
│   └─ useBinding           (REAL)          │ ← Real React hook
│       └─ Broker           (REAL)          │ ← Real business logic
│           ├─ Date.now()    (MOCKED)       │ ← Mock global function
│           ├─ Transformer  (REAL)          │ ← Real pure function
│           ├─ Guard        (REAL)          │ ← Real boolean check
│           └─ httpAdapter  (REAL)          │ ← Real adapter code
│               └─ axios    (MOCKED)        │ ← Mock npm dependency
└────────────────────────────────────────────┘

Only 2 things mocked: npm dependencies + global functions


Proxy Creation (when test creates top-level proxy):
const widgetProxy = createWidgetProxy()
  → creates bindingProxy
    → creates brokerProxy
      → jest.spyOn(Date, 'now').mockReturnValue(...)  ← Mock global
      → creates httpAdapterProxy
        → jest.mocked(axios).mockImplementation(...)  ← Mock npm dependency

Setup Chain (via proxies):
widgetProxy.setupUser({userId, user})
  → bindingProxy.setupUser({userId, user})
    → brokerProxy.setupUser({userId, user})
      → httpAdapterProxy.returns({url, response: data})
        → jest.mocked(axios).mockResolvedValue(data)

Execution Chain (real code):
Widget renders
  → Hook executes (useState/useEffect)
    → Broker runs
      → Date.now() called (mocked - returns predictable timestamp)
      → Transformer runs (real)
      → Guard runs (real)
      → httpAdapter runs (real)
        → axios called (mocked - returns test data)
```

**Critical:**

1. **Adapter proxies** mock npm dependencies (axios), not the adapters themselves
2. **Layer proxies** mock global functions (Date.now(), crypto.randomUUID()) in their constructors
3. All adapters and business logic run REAL in all tests, ensuring contract integrity

---

## Issue: Knowledge Leak in Higher-Layer Tests

### Problem Statement

When testing higher layers (widgets, bindings), tests need to know implementation details of lower layers (transformers,
guards) to set up test data correctly.

### Example: Widget Test Must Know Transformer/Guard Logic

**The Code:**

```typescript
// Broker logic
const displayName = formatUserNameTransformer({
    user,
    includeTitle: user.isPremium  // ← Transformer depends on isPremium
});

const canEdit = hasEditPermissionGuard({
    currentUser,
    profileUserId: userId  // ← Guard checks if currentUser.id === userId OR currentUser.isAdmin
});
```

**The Widget:**

```typescript
// Widget only cares about the results
<h2>{data.user.displayName} < /h2>
{
    data.canEdit && <button>Edit < /button>}
```

**The Problem in Tests:**

```typescript
// Widget test must know transformer/guard implementation
it('VALID: {own profile} => shows title and edit button', async () => {
    const user = UserStub({
        firstName: 'Jane',
        isPremium: true,    // ← Must know: transformer uses isPremium for title
        isAdmin: false      // ← Must know: guard checks isAdmin for edit permission
    });

    widgetProxy.setupOwnProfile({userId, user});

    // Widget doesn't know WHY these work, but test author must know HOW to make them work
    expect(screen.getByText(/^Dr\./)).toBeInTheDocument();  // Title shown because isPremium
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();  // Edit shown because own profile
});
```

**The Knowledge Leak:**

- Test author must know `isPremium` controls title display (transformer detail)
- Test author must know `isAdmin` and matching `userId` control edit permission (guard detail)
- Widget doesn't care about these - it just displays `data.user.displayName` and conditionally renders button based on
  `data.canEdit`

### Possible Solutions

#### Option 1: Behavior-Driven Setup (Semantic Proxies)

**Approach:** Hide implementation behind semantic proxy methods

```typescript
// Proxy
setupProfileWithEditButton: ({userId, user}: { userId: UserId; user: User }) => {
    // Proxy knows: "edit button" = own profile OR admin
    const userWithEdit = {...user, id: userId};  // Make it their own profile
    brokerProxy.setupOwnProfile({userId, user: userWithEdit});
}

setupProfileWithoutEditButton: ({userId, user, viewerId}: { ... }) => {
    // Proxy knows: "no edit" = different user + not admin
    const nonAdminUser = {...user, isAdmin: false};
    const viewer = UserStub({id: viewerId, isAdmin: false});
    brokerProxy.setupOtherProfile({userId, user: nonAdminUser, currentUserId: viewerId, currentUser: viewer});
}

setupProfileWithTitle: ({userId, user}: { userId: UserId; user: User }) => {
    // Proxy knows: title requires isPremium
    const premiumUser = {...user, isPremium: true};
    brokerProxy.setupOwnProfile({userId, user: premiumUser});
}

// Test
it('VALID: {profile with edit button} => shows edit button', async () => {
    const user = UserStub({firstName: 'Jane'});

    widgetProxy.setupProfileWithEditButton({userId, user});  // ← Semantic!

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
});
```

**Pros:**

- Tests describe WHAT they want, not HOW to achieve it
- Implementation details hidden from test author
- Clear test intent

**Cons:**

- Proxy methods proliferate for every combination
- May not cover all edge cases
- Proxy becomes a "test DSL" that mirrors implementation

#### Option 2: Declarative Setup (Configuration-Based)

**Approach:** Proxy translates test intentions into implementation requirements

```typescript
// Proxy
setupProfile: ({userId, user, canEdit, showTitle}: {
    userId: UserId;
    user: User;
    canEdit: boolean;
    showTitle: boolean;
}) => {
    // Translate test config → implementation requirements
    const configuredUser = {
        ...user,
        isPremium: showTitle,  // Proxy knows: isPremium controls title
        id: canEdit ? userId : UserIdStub('different-user'),  // Proxy knows: matching id gives edit
        isAdmin: false
    };

    if (canEdit && configuredUser.id === userId) {
        brokerProxy.setupOwnProfile({userId, user: configuredUser});
    } else {
        const viewer = UserStub({id: UserIdStub('viewer'), isAdmin: false});
        brokerProxy.setupOtherProfile({
            userId,
            user: configuredUser,
            currentUserId: viewer.id,
            currentUser: viewer
        });
    }
}

// Test
it('VALID: {canEdit: true, showTitle: true} => shows title and edit button', async () => {
    widgetProxy.setupProfile({
        userId,
        user: UserStub({firstName: 'Jane'}),
        canEdit: true,      // ← What we want
        showTitle: true     // ← What we want
    });

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);
    expect(screen.getByText(/^Dr\./)).toBeInTheDocument();
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
});
```

**Pros:**

- Clear test intent
- Single proxy method handles combinations
- Test author thinks in terms of desired outcomes

**Cons:**

- Proxy becomes complex translation layer
- May not match all real-world scenarios
- Configuration options grow over time

#### Option 3: Accept the Leak (Integration Testing)

**Approach:** Acknowledge that higher-layer tests ARE integration tests and explicitly test the full chain

```typescript
// Test explicitly documents the integration being tested
it('INTEGRATION: {isPremium: true, viewing own profile} => shows title and edit button', async () => {
    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        isPremium: true,    // ← Explicitly testing transformer integration
        isAdmin: false      // ← Explicitly testing guard integration
    });

    widgetProxy.setupOwnProfile({userId, user});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);

    // Widget test verifies the FULL CHAIN works:
    // Widget → Binding → Broker → Transformer (isPremium) → Guard (own profile)
    expect(screen.getByText(/^Dr\. Jane Smith$/)).toBeInTheDocument();  // Title shown
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();  // Edit allowed
});

it('INTEGRATION: {isPremium: false, non-admin viewing other} => no title, no edit button', async () => {
    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        isPremium: false,   // ← No title
        isAdmin: false
    });

    const viewerId = UserIdStub('viewer-1');
    const viewer = UserStub({
        id: viewerId,
        isAdmin: false      // ← No edit permission
    });

    widgetProxy.setupOtherProfile({userId, user, currentUserId: viewerId, currentUser: viewer});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {viewerId}
    />);

    expect(screen.getByText(/^Jane Smith$/)).toBeInTheDocument();  // No title
    expect(screen.queryByTestId('EDIT_BUTTON')).not.toBeInTheDocument();  // No edit
});
```

**Pros:**

- Tests the real integration, catches contract mismatches
- Clear that this is testing the full stack
- No magic proxy methods to maintain

**Cons:**

- Brittle if transformer/guard logic changes
- Test author must understand implementation
- Knowledge leak is explicit but still present

#### Option 4: Forbid Transformers/Guards in Brokers

**Approach:** Architectural constraint - move transformation/guard logic elsewhere

**Possible Rules:**

1. **Brokers only orchestrate I/O** - no transformation or business logic
2. **Transformers/Guards live in Responders or Widgets** - closer to where they're used
3. **Contracts handle all transformation** - Zod `.transform()` instead of transformer functions

**Example:**

```typescript
// Broker - just fetches, no transformation
export const userProfileBroker = async ({userId, currentUserId}: { ... }) => {
    const response = await httpAdapter({url: `.../${userId}`});
    const user = userContract.parse(response.data);  // Just validation

    const currentUserResponse = await httpAdapter({url: `.../${currentUserId}`});
    const currentUser = userContract.parse(currentUserResponse.data);

    return {user, currentUser};  // Return raw data
};

// Widget/Responder - handles transformation/guards
export const UserProfileWidget = ({userId, currentUserId}: { ... }) => {
    const {data, loading, error} = useUserProfileBinding({userId, currentUserId});

    if (!data) return null;

    // Transformation happens here
    const displayName = formatUserNameTransformer({
        user: data.user,
        includeTitle: data.user.isPremium
    });

    // Guard happens here
    const canEdit = hasEditPermissionGuard({
        currentUser: data.currentUser,
        profileUserId: userId
    });

    return (
        <div>
            <h2>{displayName} < /h2>
    {
        canEdit && <button>Edit < /button>}
        < /div>
    )
        ;
    }
    ;
```

**Pros:**

- No knowledge leak in tests - broker tests only need raw data
- Widget tests control transformation/guard logic directly
- Clear separation: brokers = I/O, widgets = presentation logic

**Cons:**

- Widgets become more complex
- Transformation logic not reusable across layers
- May violate "widgets are thin" principle

### Status: UNRESOLVED

**Decision needed:** Which approach aligns with project goals?

- **Option 1/2**: Better test ergonomics, more proxy maintenance
- **Option 3**: Embrace integration testing, accept knowledge leak
- **Option 4**: Architectural constraint, may require rethinking layer responsibilities

**Considerations:**

1. How often does transformer/guard logic change?
2. Is test brittleness worth integration coverage?
3. Should proxies be "smart" or "dumb"?
4. Where should business logic live?

---

## Insight: Why Guards Need Proxy Helper Functions

### The Pattern

Guards are pure boolean functions with multiple logical paths. When testing layers that use guards, you need to set up
data that triggers each path. Guard proxies provide semantic helpers for this.

### Example: Edit Permission Guard

```typescript
// guards/has-edit-permission/has-edit-permission-guard.ts
export const hasEditPermissionGuard = ({currentUser, profileUserId}: {
    currentUser: User;
    profileUserId: UserId;
}): boolean => {
    // Path 1: User can edit their own profile
    if (currentUser.id === profileUserId) {
        return true;
    }

    // Path 2: Admins can edit any profile
    if (currentUser.isAdmin) {
        return true;
    }

    // Path 3: Default deny
    return false;
};
```

**The guard has 3 logical paths. Higher-layer tests need to exercise all 3.**

### Without Guard Proxy Helpers

```typescript
// Widget test - must know guard implementation details
it('VALID: {same user} => shows edit button', async () => {
    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,           // ← Must know: matching id gives edit permission
        isAdmin: false
    });

    widgetProxy.setupOwnProfile({userId, user});
    // ...
});

it('VALID: {admin, different user} => shows edit button', async () => {
    const userId = UserIdStub('user-1');
    const user = UserStub({id: userId, isAdmin: false});

    const adminId = UserIdStub('admin-1');
    const admin = UserStub({
        id: adminId,
        isAdmin: true         // ← Must know: isAdmin gives edit permission
    });

    widgetProxy.setupOtherProfile({userId, user, currentUserId: adminId, currentUser: admin});
    // ...
});

it('VALID: {different user, not admin} => no edit button', async () => {
    const userId = UserIdStub('user-1');
    const user = UserStub({id: userId, isAdmin: false});

    const otherId = UserIdStub('other-1');
    const other = UserStub({
        id: otherId,
        isAdmin: false        // ← Must know both conditions for denial
    });

    widgetProxy.setupOtherProfile({userId, user, currentUserId: otherId, currentUser: other});
    // ...
});
```

**Problem:** Test author must understand guard logic to construct appropriate test data.

### With Guard Proxy Helpers

```typescript
// guards/has-edit-permission/has-edit-permission-guard.proxy.ts
export const createHasEditPermissionGuardProxy = () => {
    // NO jest.mocked() - guard runs real!
    // Proxy provides SEMANTIC HELPERS for setting up test data

    return {
        // Helper: Make current user match profile user (Path 1)
        setUserAsCurrentUser: ({user, userId}: { user: User; userId: UserId }): User => {
            return {...user, id: userId};
        },

        // Helper: Make current user different from profile user (Path 3)
        setUserAsNotCurrentUser: ({user, userId}: { user: User; userId: UserId }): User => {
            const differentId = UserIdStub(`different-from-${userId}`);
            return {...user, id: differentId};
        },

        // Helper: Make user an admin (Path 2)
        setUserAsAdmin: ({user}: { user: User }): User => {
            return {...user, isAdmin: true};
        },

        // Helper: Make user a non-admin (Path 3)
        setUserAsNonAdmin: ({user}: { user: User }): User => {
            return {...user, isAdmin: false};
        },

        // Composed helpers for common scenarios
        setupForOwnProfileEdit: ({userId}: { userId: UserId }): User => {
            const user = UserStub({id: userId});
            return {...user, id: userId, isAdmin: false};
        },

        setupForAdminEdit: (): User => {
            const admin = UserStub();
            return {...admin, isAdmin: true};
        },

        setupForNoEdit: ({userId}: { userId: UserId }): User => {
            const differentId = UserIdStub(`different-from-${userId}`);
            const user = UserStub({id: differentId});
            return {...user, id: differentId, isAdmin: false};
        }
    };
};
```

### Higher-Layer Proxy Uses Guard Helpers

```typescript
// brokers/user/profile/user-profile-broker.proxy.ts
import {createHasEditPermissionGuardProxy} from '../../../guards/has-edit-permission/has-edit-permission-guard.proxy';

export const createUserProfileBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();
    const guardProxy = createHasEditPermissionGuardProxy();

    return {
        // Semantic setup using guard helpers
        setupOwnProfileWithEdit: ({userId, user}: { userId: UserId; user: User }) => {
            // Use guard proxy helper to ensure edit permission
            const editableUser = guardProxy.setupForOwnProfileEdit({userId});
            const configuredUser = {...user, ...editableUser};

            httpProxy.returns({
                url: UrlStub(`https://api.example.com/users/${userId}`),
                response: {data: configuredUser, status: 200, statusText: 'OK'}
            });

            // Second call for currentUser (same user = can edit)
            httpProxy.returns({
                url: UrlStub(`https://api.example.com/users/${userId}`),
                response: {data: configuredUser, status: 200, statusText: 'OK'}
            });
        },

        setupAdminViewingProfile: ({userId, user, adminId}: { ... }) => {
            // Use guard proxy helper to create admin
            const admin = guardProxy.setupForAdminEdit();

            httpProxy.returns({
                url: UrlStub(`https://api.example.com/users/${userId}`),
                response: {data: user, status: 200, statusText: 'OK'}
            });

            httpProxy.returns({
                url: UrlStub(`https://api.example.com/users/${adminId}`),
                response: {data: admin, status: 200, statusText: 'OK'}
            });
        },

        setupProfileWithoutEdit: ({userId, user, viewerId}: { ... }) => {
            // Use guard proxy helper to ensure no edit permission
            const viewer = guardProxy.setupForNoEdit({userId});

            httpProxy.returns({
                url: UrlStub(`https://api.example.com/users/${userId}`),
                response: {data: user, status: 200, statusText: 'OK'}
            });

            httpProxy.returns({
                url: UrlStub(`https://api.example.com/users/${viewerId}`),
                response: {data: viewer, status: 200, statusText: 'OK'}
            });
        }
    };
};
```

### Widget Tests With Semantic Setup

```typescript
// Now widget tests are semantic - no knowledge of guard implementation
it('VALID: {own profile} => shows edit button', async () => {
    widgetProxy.setupOwnProfileWithEdit({userId, user});  // ← Semantic!

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
});

it('VALID: {admin viewing profile} => shows edit button', async () => {
    widgetProxy.setupAdminViewingProfile({userId, user, adminId});  // ← Semantic!

    render(<UserProfileWidget userId = {userId}
    currentUserId = {adminId}
    />);
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
});

it('VALID: {non-admin viewing other} => no edit button', async () => {
    widgetProxy.setupProfileWithoutEdit({userId, user, viewerId});  // ← Semantic!

    render(<UserProfileWidget userId = {userId}
    currentUserId = {viewerId}
    />);
    expect(screen.queryByTestId('EDIT_BUTTON')).not.toBeInTheDocument();
});
```

### Key Benefits

1. **Semantic Test Intent**: Tests describe WHAT scenario, not HOW to construct it
2. **Guard Logic Encapsulated**: Only guard proxy knows `isAdmin` controls permission
3. **Reusable Helpers**: Guard proxy helpers used across all higher layers
4. **Single Source of Truth**: Change guard logic → update guard proxy → all tests adapt
5. **Guard Still Runs Real**: Helpers construct data, guard executes normally

### The Pattern: Guard Proxies Are Data Builders

```
Guard Proxy Purpose:
┌─────────────────────────────────────────────────┐
│ NOT: Mock the guard (it runs real)             │
│ YES: Provide semantic helpers to build data    │
│      that exercises each guard path            │
└─────────────────────────────────────────────────┘

Guard itself:
  hasEditPermissionGuard({currentUser, profileUserId})  // Runs REAL

Guard proxy:
  setUserAsAdmin({user})           // Helper: {...user, isAdmin: true}
  setupForOwnProfileEdit({userId}) // Helper: User with matching id

Higher-layer proxy:
  setupOwnProfileWithEdit({...})
    → guardProxy.setupForOwnProfileEdit()  // Use helper
    → httpProxy.returns({...})             // Setup HTTP mock
```

This explains why guards need proxies even though they're pure functions - the proxy isn't mocking anything, it's
providing semantic builders for test data that flows through the guard's logical paths.

---

## Pattern: Global Function Mocks in Proxy Bootstrap

### The Problem

Some functions use global APIs that need to be deterministic in tests:

- `Date.now()` - for predictable timestamps
- `crypto.randomUUID()` - for predictable IDs
- `Math.random()` - for predictable randomness
- `console.log()` - to suppress/verify logging

**Where do these mocks belong in the proxy architecture?**

### The Solution: Bootstrap Method

Global function mocks go in the **proxy's `bootstrap()` method** for the lowest layer that uses them.

### Example: Broker Uses Date.now()

```typescript
// brokers/user/create/user-create-broker.ts
export const userCreateBroker = async ({userData}: { userData: UserData }): Promise<User> => {
    const user = {
        ...userData,
        id: crypto.randomUUID(),        // ← Uses global crypto
        createdAt: Date.now(),          // ← Uses global Date
        updatedAt: Date.now()
    };

    await httpAdapter({
        url: 'https://api.example.com/users',
        method: 'POST',
        data: user
    });

    return userContract.parse(user);
};
```

**Proxy sets up global mocks in bootstrap:**

```typescript
// brokers/user/create/user-create-broker.proxy.ts
import {createHttpAdapterProxy} from '../../../adapters/http/http-adapter.proxy';

export const createUserCreateBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: () => {
            // Setup HTTP adapter bootstrap
            httpProxy.bootstrap();

            // Mock global Date.now for predictable timestamps
            jest.spyOn(Date, 'now').mockReturnValue(1609459200000);

            // Mock global crypto.randomUUID for predictable IDs
            jest.spyOn(crypto, 'randomUUID')
                .mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

            // Note: @questmaestro/testing automatically resets all mocks globally
            // No manual cleanup needed!
        },

        // Semantic setup methods
        setupUserCreate: ({userData, timestamp, id}: {
            userData: UserData;
            timestamp?: number;
            id?: string;
        }) => {
            // Override global mocks for this specific scenario (optional)
            if (timestamp !== undefined) {
                jest.spyOn(Date, 'now').mockReturnValue(timestamp);
            }
            if (id !== undefined) {
                jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
            }

            // Mock the HTTP response
            // NOTE: We do NOT manually set id/createdAt/updatedAt here!
            // The broker generates these using the mocked globals above.
            // We're just mocking what the server returns (if it echoes back).
            httpProxy.returns({
                url: UrlStub('https://api.example.com/users'),
                response: {
                    data: {success: true},  // Server response (not the user object)
                    status: 201,
                    statusText: 'Created'
                }
            });
        }
    };
};
```

**Test file calls bootstrap once:**

```typescript
// brokers/user/create/user-create-broker.test.ts
import {userCreateBroker} from './user-create-broker';
import {createUserCreateBrokerProxy} from './user-create-broker.proxy';

const brokerProxy = createUserCreateBrokerProxy();

beforeEach(() => {
    brokerProxy.bootstrap();  // ← Sets up global mocks + HTTP adapter
    // Note: @questmaestro/testing automatically resets mocks after each test
});

it('VALID: {userData} => creates user with mocked ID and timestamps', async () => {
    const userData = UserDataStub({
        firstName: 'Jane',
        lastName: 'Smith'
    });

    brokerProxy.setupUserCreate({userData});

    const result = await userCreateBroker({userData});

    // Test that broker USED the mocked global functions
    expect(result).toStrictEqual({
        ...userData,
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // Generated by mocked crypto.randomUUID()
        createdAt: 1609459200000,                     // Generated by mocked Date.now()
        updatedAt: 1609459200000                      // Generated by mocked Date.now()
    });

    // Verify the broker called the global functions
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(Date.now).toHaveBeenCalledTimes(2);  // createdAt + updatedAt
});

it('VALID: {specific timestamp} => creates user with that timestamp', async () => {
    const userData = UserDataStub({firstName: 'Bob'});
    const customTimestamp = 1234567890000;

    // Override the bootstrap default for this test
    brokerProxy.setupUserCreate({
        userData,
        timestamp: customTimestamp  // ← Override Date.now() for this scenario
    });

    const result = await userCreateBroker({userData});

    expect(result).toStrictEqual({
        ...userData,
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // Still uses bootstrap default
        createdAt: customTimestamp,                   // Uses overridden timestamp
        updatedAt: customTimestamp
    });
});

it('VALID: {specific ID} => creates user with that ID', async () => {
    const userData = UserDataStub({firstName: 'Alice'});
    const customId = 'custom-uuid-12345';

    // Override the bootstrap default for this test
    brokerProxy.setupUserCreate({
        userData,
        id: customId  // ← Override crypto.randomUUID() for this scenario
    });

    const result = await userCreateBroker({userData});

    expect(result).toStrictEqual({
        ...userData,
        id: customId,           // Uses overridden ID
        createdAt: 1609459200000,  // Still uses bootstrap default
        updatedAt: 1609459200000
    });
});
```

### When to Use Global Mocks

**Use `jest.spyOn()` for:**

- `Date.now()`, `Date.UTC()`, `new Date()`
- `crypto.randomUUID()`, `crypto.getRandomValues()`
- `Math.random()`
- `console.log()`, `console.error()`, `console.warn()`
- `process.env` access
- `setTimeout()`, `setInterval()` (when using fake timers)

**Don't use for:**

- npm package dependencies (use adapter proxies with `jest.mock()`)
- Custom functions (use contracts/stubs)

### Higher-Layer Proxies Inherit Global Mocks

```typescript
// widgets/user-profile/user-profile-widget.proxy.ts
export const createUserProfileWidgetProxy = () => {
    const bindingProxy = createUseUserProfileBindingProxy();

    return {
        bootstrap: () => {
            // Delegates to binding proxy, which delegates to broker proxy
            // Broker proxy's bootstrap() sets up global mocks
            bindingProxy.bootstrap();

            // Global mocks are already set up by the time we get here!
        },

        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }) => {
            bindingProxy.setupOwnProfile({userId, user});
        }
    };
};

// Widget test
const widgetProxy = createUserProfileWidgetProxy();

beforeEach(() => {
    widgetProxy.bootstrap();  // ← Also sets up Date.now(), crypto.randomUUID() via delegation
});

it('VALID: {own profile} => displays user', async () => {
    // Global mocks are active from bootstrap()
    widgetProxy.setupOwnProfile({userId, user});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);

    // All layers share the same mocked Date.now() and crypto.randomUUID()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
});
```

### The Pattern

```
Test Lifecycle:
┌────────────────────────────────────────┐
│ beforeEach(() => {                     │
│   proxy.bootstrap()                    │
│     ↓                                  │
│   1. Mock global functions             │
│      - Date.now()                      │
│      - crypto.randomUUID()             │
│   2. Setup adapter mocks               │
│      - jest.mock('axios')              │
│   3. Delegate to child proxies         │
│ })                                     │
│                                        │
│ it('test', () => {                     │
│   proxy.setupScenario()                │
│     ↓                                  │
│   Use semantic helpers                 │
│ })                                     │
│                                        │
│ afterEach(() => {                      │
│   proxy.cleanup?.()  // Optional       │
│ })                                     │
└────────────────────────────────────────┘
```

### Why Bootstrap?

1. **Centralized**: All setup in one place
2. **Automatic**: Higher layers inherit global mocks via delegation
3. **Deterministic**: Every test gets same predictable values
4. **Auto-Cleanup**: `@questmaestro/testing` resets all mocks globally - no manual cleanup needed
5. **Explicit**: Clear what globals are mocked

### Critical: Don't Manually Construct Generated Values

**❌ WRONG - Manually setting values the function generates:**

```typescript
setupUserCreate: ({userData}) => {
    httpProxy.returns({
        response: {
            data: {
                ...userData,
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',  // ❌ Don't set this!
                createdAt: 1609459200000                      // ❌ Don't set this!
            }
        }
    });
}

// Test verifies we set it, not that broker generated it
expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');  // ❌ Meaningless test
```

**✅ CORRECT - Let the function generate values, test they used mocked globals:**

```typescript
setupUserCreate: ({userData}) => {
    httpProxy.returns({
        response: {
            data: {success: true},  // ✅ Just mock server response
            status: 201
        }
    });
}

// Test verifies broker generated values using mocked globals
const result = await userCreateBroker({userData});
expect(result.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');  // ✅ Verifies broker used mocked crypto.randomUUID()
expect(result.createdAt).toBe(1609459200000);                     // ✅ Verifies broker used mocked Date.now()

// Can also verify the calls happened
expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
expect(Date.now).toHaveBeenCalledTimes(2);
```

**Why this matters:**

1. **Tests actual functionality** - broker must call the mocked globals
2. **Catches bugs** - if broker stops generating IDs, test fails
3. **No false positives** - we're not testing that we can copy/paste values

**The pattern:**

```
Mock globals in bootstrap:
  jest.spyOn(crypto, 'randomUUID').mockReturnValue('abc-123')
  jest.spyOn(Date, 'now').mockReturnValue(1234567890)

Function generates values:
  const id = crypto.randomUUID()        // Returns 'abc-123'
  const timestamp = Date.now()          // Returns 1234567890

Test verifies generated values:
  expect(result.id).toBe('abc-123')     // Function used mocked global
  expect(result.timestamp).toBe(1234567890)  // Function used mocked global
```

### Alternative: Test File Direct Mocking

For simple cases or globals used across ALL tests:

```typescript
// ❌ Don't repeat in every test
it('test 1', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    // ...
});

it('test 2', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);  // Duplicate!
    // ...
});

// ✅ Put in beforeEach (simple projects)
beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    // @questmaestro/testing will reset this after each test
});

// ✅ Better: Put in proxy bootstrap (this architecture)
beforeEach(() => {
    brokerProxy.bootstrap();  // Sets up Date.now() once for all scenarios
    // @questmaestro/testing will reset this after each test
});
```

**Prefer proxy bootstrap** when:

- Global mock is needed by the layer being tested
- Multiple tests share the same global mock setup
- You want semantic setup methods that assume global mocks are active

**Remember:**

- `@questmaestro/testing` automatically resets/clears/restores all mocks globally
- No manual cleanup needed
- Test that functions USE the mocked globals, don't manually construct the values they generate
- Bootstrap sets **default** mock values - setup methods can override them for specific scenarios

---

## Pattern: Overriding Global Mocks for Specific Scenarios

### Bootstrap Sets Defaults

```typescript
bootstrap: () => {
    // Default values used by all tests unless overridden
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('default-uuid');
}
```

### Setup Methods Can Override

```typescript
setupUserCreate: ({userData, timestamp, id}: {
    userData: UserData;
    timestamp?: number;  // Optional override
    id?: string;         // Optional override
}) => {
    // Override defaults for this specific scenario
    if (timestamp !== undefined) {
        jest.spyOn(Date, 'now').mockReturnValue(timestamp);
    }
    if (id !== undefined) {
        jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    }

    // Setup HTTP mock
    httpProxy.returns({...});
}
```

### Tests Can Specify Custom Values

```typescript
// Test 1: Use defaults
brokerProxy.setupUserCreate({userData});
// Result: id='default-uuid', createdAt=1609459200000

// Test 2: Override timestamp
brokerProxy.setupUserCreate({userData, timestamp: 9999999999});
// Result: id='default-uuid', createdAt=9999999999

// Test 3: Override ID
brokerProxy.setupUserCreate({userData, id: 'custom-id'});
// Result: id='custom-id', createdAt=1609459200000

// Test 4: Override both
brokerProxy.setupUserCreate({userData, timestamp: 8888888888, id: 'special-id'});
// Result: id='special-id', createdAt=8888888888
```

### Individual Tests Can Also Override Directly

```typescript
it('VALID: edge case with specific timestamp', async () => {
    const userData = UserDataStub({firstName: 'Jane'});

    // Setup with defaults
    brokerProxy.setupUserCreate({userData});

    // Override just for this test (after setup)
    jest.spyOn(Date, 'now').mockReturnValue(9999999999);

    const result = await userCreateBroker({userData});

    expect(result.createdAt).toBe(9999999999);
});
```

### When to Use Each Approach

**Bootstrap defaults:**

- Common values used across most tests
- Predictable baseline for all tests

**Setup method overrides:**

- Scenario-specific values (e.g., "old user" vs "new user")
- Semantic setup methods that encode meaning (e.g., `setupUserFromYear2020()`)

**Individual test overrides:**

- Edge cases or one-off scenarios
- Testing specific timestamp/ID-related logic

### Example: Semantic Setup Methods

```typescript
// Proxy with semantic helpers
export const createUserCreateBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        bootstrap: () => {
            httpProxy.bootstrap();
            jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01
            jest.spyOn(crypto, 'randomUUID').mockReturnValue('default-uuid');
        },

        // Semantic helper: User from 2020
        setupUserFrom2020: ({userData}: { userData: UserData }) => {
            const timestamp2020 = 1577836800000; // 2020-01-01
            jest.spyOn(Date, 'now').mockReturnValue(timestamp2020);
            httpProxy.returns({...});
        },

        // Semantic helper: User with specific ID pattern
        setupUserWithShortId: ({userData}: { userData: UserData }) => {
            jest.spyOn(crypto, 'randomUUID').mockReturnValue('short-123');
            httpProxy.returns({...});
        },

        // Generic helper with options
        setupUserCreate: ({userData, timestamp, id}: { ... }) => {
            if (timestamp) jest.spyOn(Date, 'now').mockReturnValue(timestamp);
            if (id) jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
            httpProxy.returns({...});
        }
    };
};

// Test using semantic helpers
it('VALID: {user from 2020} => has 2020 timestamp', async () => {
    brokerProxy.setupUserFrom2020({userData});
    const result = await userCreateBroker({userData});
    expect(result.createdAt).toBe(1577836800000);
});
```

**Key principle:** Bootstrap provides sensible defaults, but the architecture allows overriding at any level for
flexibility.
