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
