# Testing Philosophy: What TypeScript Can't Catch

**Status:** Active discussion - exploring when to mock vs when to integrate

## The Core Question

When `ComponentA` calls `ComponentB` or `ResponderA` calls `BrokerB`, do we:

- **Mock everything** for strict isolation?
- **Only mock external boundaries** (adapters/bindings) and let app code integrate?

## What Bugs Arise With Strong Typing?

### Example 1: Props/Interface Bugs ✅ CAUGHT BY TYPESCRIPT

```typescript
type WidgetBProps = { userName: UserName };  // Branded type

// WidgetA passes it
<WidgetB userName = {user.name}
/>

// If WidgetB's props change, TypeScript breaks WidgetA AT COMPILE TIME
// Mocking vs not mocking doesn't matter - types catch this
```

**Verdict:** TypeScript prevents interface contract bugs. No runtime testing needed.

---

### Example 2: Context Bugs ❌ NOT CAUGHT BY TYPESCRIPT

```typescript
const WidgetA = () => (
    <ThemeProvider theme = "dark" >
        <WidgetB / >
        </ThemeProvider>
);

const WidgetB = () => {
    const theme = useContext(ThemeContext);  // Expects context
    return <div className = {theme} > Content < /div>;
};

// If we MOCK WidgetB:
jest.mock('./WidgetB');
// - Never test that context flows through
// - Never catch if ThemeProvider is missing
// - Test passes, production breaks

// If we RENDER real WidgetB:
render(<WidgetA / >);
// - Catch missing context at test time
// - Catch context value bugs
```

**TypeScript can't help here.** Context is runtime behavior.

**Conclusion:** Mocking hides context wiring bugs. Integration catches them.

---

### Example 3: Suspense Behavior ❌ NOT CAUGHT BY TYPESCRIPT

```typescript
const WidgetA = () => (
    <Suspense fallback = { < Loading / >
}>
<WidgetB userId = {userId}
/>
< /Suspense>
)
;

const WidgetB = ({userId}) => {
    const user = useUserDataBinding({userId});  // Suspends!
    return <div>{user.name} < /div>;
};

// If we MOCK WidgetB:
jest.mock('./WidgetB');
MockWidgetB.mockReturnValue(<div>Mocked
User < /div>);
// - Suspense never triggers
// - Can't test fallback shows
// - Can't test loading states
// - Missing user-visible behavior

// If we RENDER real WidgetB (with mocked binding):
const userProxy = createUserDataBindingProxy();
userProxy.loading({userId});
render(<WidgetA userId = {userId}
/>);
// - Suspense works
// - Can test loading → loaded transitions
// - Test what users actually see
```

**This is user-visible behavior.** Users see the loading state. Mocking hides it.

**Conclusion:** Mocking widgets hides async/Suspense behavior that users experience.

---

### Example 4: Event Propagation ❌ NOT CAUGHT BY TYPESCRIPT

```typescript
const WidgetA = () => {
    const handleClick = () => console.log('A clicked');
    return (
        <div onClick = {handleClick} >
            <WidgetB / >
            </div>
    );
};

const WidgetB = () => {
    const handleClick = (e) => {
        e.stopPropagation();  // BUG: stops parent handler
    };
    return <button onClick = {handleClick} > Click < /button>;
};

// If we MOCK WidgetB:
jest.mock('./WidgetB');
// - Never renders real button
// - stopPropagation never fires
// - Parent onClick always works in test
// - Test incorrectly passes
// - Production: clicking button doesn't trigger parent

// If we RENDER real WidgetB:
render(<WidgetA / >);
fireEvent.click(screen.getByRole('button'));
// - stopPropagation fires
// - Parent onClick doesn't fire
// - Test correctly fails
// - Catches the bug
```

**Behavioral bug.** TypeScript has no idea about event propagation.

**Conclusion:** Mocking hides DOM event behavior bugs.

---

### Example 5: Broker Integration ❌ NOT CAUGHT BY TYPESCRIPT

```typescript
const UserProfileResponder = async ({userId}: { userId: UserId }) => {
    const user = await userFetchBroker({userId});
    return {name: user.name};
};

// If we MOCK the broker:
jest.mock('../../../brokers/user/fetch/user-fetch-broker');
mockBroker.mockResolvedValue(UserStub());
// - Never test that responder calls broker correctly
// - Never test broker's error handling
// - Never test null/undefined flows
// - Never test validation logic in broker

// If we DON'T mock broker (mock adapter instead):
const fsProxy = createFsReadFileProxy();
fsProxy.returns(FilePathStub('/users/123.json'), FileContentsStub(JSON.stringify(user)));

await UserProfileResponder({userId});
// - Responder + broker run together
// - Broker's business logic executes
// - Error handling flows: responder ← broker ← adapter
// - Validation runs
// - Integration tested
```

**Business logic bug.** Broker might have validation, transformation, error handling.

**Conclusion:** Mocking brokers hides business logic bugs in the integration.

---

### Example 6: Error Propagation ❌ NOT CAUGHT BY TYPESCRIPT

```typescript
const responder = async ({userId}: { userId: UserId }) => {
    try {
        const user = await userFetchBroker({userId});
        return {success: true, user};
    } catch (error) {
        return {success: false, error: 'User not found'};
    }
};

const userFetchBroker = async ({userId}: { userId: UserId }) => {
    const data = await fsReadFileAdapter({filePath: `/users/${userId}.json`});
    if (!data) {
        throw new Error('User data is empty');  // Broker's validation
    }
    return userContract.parse(JSON.parse(data));
};

// If we MOCK broker:
mockBroker.mockRejectedValue(new Error('User not found'));
// - Never test broker's actual error logic
// - Never test if broker throws the RIGHT error
// - Never test adapter error → broker error transformation

// If we DON'T mock broker (mock adapter):
fsProxy.throws(FilePathStub('/users/123.json'), new Error('ENOENT'));
// - Adapter throws
// - Broker catches, validates, wraps error
// - Responder catches broker's error
// - Full error flow tested
```

**Error handling bug.** The transformation `ENOENT` → `"User data is empty"` → `"User not found"` is business logic.

**Conclusion:** Mocking hides error transformation logic through layers.

---

## Testing Library's Insight

Testing Library philosophy: **"Test how users interact, not implementation details"**

**Users see:**

- ✅ Real component rendering and behavior
- ✅ Real Suspense fallbacks and loading states
- ✅ Real DOM events (clicks, propagation, focus)
- ✅ Real error messages
- ✅ Real data validation

**If we mock components/brokers, we test:**

- ❌ That ComponentA calls ComponentB (implementation detail)
- ❌ That ResponderA calls BrokerB (implementation detail)
- ❌ NOT what users actually experience

---

## When Enzyme/Shallow Rendering Failed

**Enzyme philosophy:** Mock everything, shallow render components.

**Why it failed:**

- Hid React context bugs (context never flowed)
- Hid Suspense bugs (never actually suspended)
- Hid event propagation bugs (stopPropagation never fired)
- Hid integration bugs (components never rendered together)

**Result:** Tests passed ✅, production broke ❌

The industry moved to Testing Library for a reason.

---

## Current Best Practice

### For Frontend (Widgets)

**ONLY mock bindings** (the I/O boundary):

```typescript
// ✅ GOOD - Mock the binding (external boundary)
const userProxy = createUserDataBindingProxy();
userProxy.returns({userId}, UserStub());

render(<WidgetA userId = {userId}
/>);
// - Renders REAL WidgetA
// - Renders REAL WidgetB (child)
// - Renders REAL WidgetC (grandchild)
// - Binding is mocked (no actual broker/adapter runs)
```

**Benefits:**

- Test real component integration
- Catch context bugs
- Catch Suspense bugs
- Catch event bugs
- Catch rendering logic bugs

### For Backend (Responders/Brokers)

**ONLY mock adapters** (the I/O boundary):

```typescript
// ✅ GOOD - Mock adapter (external boundary), let broker run
const fsProxy = createFsReadFileProxy();
fsProxy.returns(FilePathStub('/users/123.json'), FileContentsStub(userJson));

await responder({userId});
// - Runs REAL responder
// - Runs REAL broker
// - Runs REAL business logic
// - Adapter is mocked (no actual fs access)
```

**Benefits:**

- Test real broker integration
- Catch business logic bugs
- Catch error handling bugs
- Catch validation bugs
- Catch null/undefined handling

---

## Why This Works

**What we're testing:**

- Responder + Broker integration (business logic flow)
- WidgetA + WidgetB integration (user-visible behavior)
- Error propagation through layers
- Suspense/async behavior
- Context wiring
- Event handling

**What we're NOT hitting:**

- Real file system (adapter mocked)
- Real HTTP calls (adapter mocked)
- Real database (adapter mocked)
- Real external APIs (adapter mocked)

**What TypeScript ensures:**

- Interface contracts (props, function signatures)
- Type safety (branded types prevent raw primitives)
- Compile-time correctness

**What integration testing catches:**

- Runtime behavior
- Logic bugs
- Null/undefined handling
- Error flows
- Async/await bugs
- Context bugs
- Event bugs

---

## The Trade-off: Knowing What Adapters Are Used

### The Problem

If you test 3 layers up and don't mock brokers, you need to mock **all adapters** used in the tree:

```
UserProfileResponder (testing this)
  └─> userFetchWithCompanyBroker (runs)
       ├─> userFetchBroker (runs)
       │    └─> fsReadFileAdapter (NEED TO MOCK)
       └─> companyFetchBroker (runs)
            └─> httpGetAdapter (NEED TO MOCK)
```

Test needs both proxies:

```typescript
const fsProxy = createFsReadFileProxy();
const httpProxy = createHttpGetProxy();

fsProxy.returns('/users/123.json', userJson);
httpProxy.returns('https://api/companies/456', companyJson);
```

**You have to know** what adapters are buried deep in the call tree.

### Is This Acceptable?

**In practice:**

- Most responders call 1-2 brokers
- Most brokers use 1-3 adapters
- Usually obvious (user data → fs, API call → http)
- If someone adds a DB call tomorrow, test breaks → you add `dbProxy`

**The benefit:** You catch integration bugs TypeScript can't.

**The cost:** More test setup, need to know adapter usage.

---

## Open Question

**Should we always mock only adapters, or sometimes mock brokers?**

**Arguments for "only mock adapters":**

- Integration testing catches real bugs
- TypeScript already prevents interface bugs
- Same philosophy as Testing Library (test behavior, not implementation)

**Arguments for "sometimes mock brokers":**

- Simpler test setup
- Don't need to know deep adapter dependencies
- Faster to write tests

**Current stance:** Lean toward "only mock adapters" for the same reason Testing Library replaced Enzyme.
