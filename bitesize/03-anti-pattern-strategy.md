# Anti-Pattern Strategy - Fighting Training Data

## The Core Problem

LLMs are trained on millions of codebases that use conventional patterns:

- `utils/`, `helpers/`, `lib/` folders
- Multiple exports per file
- `export default` everywhere
- Raw `string`/`number` types in function signatures

**These patterns are deeply embedded in training weights.**

When context gets long or attention decays, LLMs fall back to these patterns **automatically**.

## The Solution: Explicit Contrast

Don't just say what TO do. **Show explicitly what NOT to do and why it feels right.**

### Pattern: Training Data Trap

**Template structure:**

```
## ❌ Training Data Trap #1: [Pattern Name]

### What Training Data Makes You Write
[Code that feels natural from training]

### Why This Feels Right
[Explanation that validates the instinct]

### Why It's Wrong Here
[Project-specific reasoning]

### Correct Pattern
[The right way]
```

## Example: Multiple Exports Per File

**Training data makes you write:**

```typescript
// services/userService.ts
export const fetchUser = (id: string) => { /* */ };
export const createUser = (data: UserData) => { /* */ };
export const updateUser = (id: string, data: UserData) => { /* */ };
export const deleteUser = (id: string) => { /* */ };
```

**Why this feels right:**

- **Semantically related** - All user operations together
- **Extremely common** - Seen in thousands of projects
- **Convenient** - One import gets all user functions
- **Intuitive** - Mirrors how you think about domains

**Why it's wrong here:**

1. **Violates single responsibility** - File has multiple purposes
2. **Breaks import rules** - Cross-folder imports require entry files
3. **Ambiguous discovery** - Which file has the function you need?
4. **Merge conflicts** - Multiple devs editing same file
5. **Prevents LLM from learning structure** - Falls back to training data

**Correct pattern:**

```typescript
// brokers/user/fetch/user-fetch-broker.ts
export const userFetchBroker = async ({ userId }: { userId: UserId }): Promise<User> => {
  // Single responsibility: fetch user
};

// brokers/user/create/user-create-broker.ts
export const userCreateBroker = async ({ userData }: { userData: UserCreateData }): Promise<User> => {
  // Single responsibility: create user
};

// brokers/user/update/user-update-broker.ts
export const userUpdateBroker = async ({ userId, userData }: { userId: UserId; userData: UserUpdateData }): Promise<User> => {
  // Single responsibility: update user
};
```

**Benefits:**

- ✅ One file, one purpose, one export
- ✅ Clear file discovery (name matches function)
- ✅ No merge conflicts
- ✅ Enforced by lint

## Positioning Strategy

### 1. Lead Every Guide with Anti-Patterns

**Structure:**

```
# [Folder Name] Guide

## 🚨 STOP: Training Data Will Make You Do This

[Top 3-5 anti-patterns for this folder]

---

## NOW HERE'S THE CORRECT PATTERN

[Rest of guide]
```

**Why this works:**

- **High attention weight** - First content in guide
- **Primes expectations** - LLM knows to fight instincts
- **Explicit contrast** - "Don't do X" is clearer than "Do Y"

### 2. Repeat Anti-Patterns Near Examples

**In every example section:**

```
### Example: User Fetch Broker

**Before writing, check:** Did I fall into training data traps?
- [ ] Using raw `string` instead of `UserId`?
- [ ] Multiple exports in one file?
- [ ] Positional params instead of object destructuring?

**Correct implementation:**
[TypeScript code here]
```

### 3. Create Dedicated Anti-Pattern Gallery

**File:** `.claude/_framework/standards/anti-patterns/training-data-traps.md`

**Structure:**

```
# Training Data Traps - What NOT to Do

## Universal Traps (Apply Everywhere)

### ❌ Trap 1: Raw Primitive Types
### ❌ Trap 2: Multiple Exports Per File
### ❌ Trap 3: Export Default
### ❌ Trap 4: Positional Parameters

## Folder-Specific Traps

### brokers/
- ❌ Putting logic in responders
- ❌ Creating utils/businessLogic.ts

### transformers/
- ❌ Using options for security-sensitive fields
- ❌ Putting transformations in brokers

### adapters/
- ❌ Naming by business domain instead of package API
- ❌ Adding business logic to adapters
```

**Load this file:** When LLM is about to create new files or folders

## Common Training Data Traps

### Trap 1: Folder Structure

**Training data says:**

```
src/
├── utils/
├── helpers/
├── lib/
├── common/
└── shared/
```

**Why it feels right:** Ubiquitous across JavaScript ecosystem

**Why it's wrong:** LLMs "squirrel away" code based on semantic similarity, creating chaos

**Correct approach:**

```
src/
├── statics/
├── contracts/
├── guards/
├── transformers/
├── adapters/
└── brokers/
```

### Trap 2: Type System

**Training data says:**

```typescript
const fetchUser = (userId: string, companyId: string): Promise<User> => {
```

**Why it feels right:** Standard TypeScript practice, seen everywhere

**Why it's wrong:** No type safety for business concepts, allows invalid values

**Correct approach:**

```typescript
const fetchUser = ({userId, companyId}: { userId: UserId; companyId: CompanyId }): Promise<User> => {
```

### Trap 3: Export Patterns

**Training data says:**

```typescript
export default function UserComponent() { /* */
}
```

**Why it feels right:** React documentation, common pattern

**Why it's wrong:** Breaks import discoverability, unnamed in debugging

**Correct approach:**

```typescript
export const UserWidget = (): JSX.Element => { /* */
};
```

### Trap 4: File Naming

**Training data says:**

```
UserService.ts
userHelpers.ts
formatUtils.ts
```

**Why it feels right:** PascalCase for classes, camelCase for utilities

**Why it's wrong:** Inconsistent, semantic grouping instead of structural

**Correct approach:**

```
user-fetch-broker.ts
format-date-transformer.ts
has-permission-guard.ts
```

### Trap 5: Error Handling

**Training data says:**

```typescript
try {
    const data = await fetchData();
    return data;
} catch (error) {
    return null;  // Silent failure
}
```

**Why it feels right:** "Fail gracefully" is common wisdom

**Why it's wrong:** Loses critical error information, breaks contracts

**Correct approach:**

```typescript
try {
    const content = await readFile(path, 'utf8');
    return configContract.parse(JSON.parse(content));
} catch (error) {
    throw new Error(`Failed to load config from ${path}: ${error}`);
}
```

### Trap 6: React Data Fetching

**Training data says:**

```typescript
const UserCard = ({userId}) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser(userId).then(setUser);  // Broker in component!
    }, [userId]);

    return <div>{user?.name
}
    </div>;
};
```

**Why it feels right:** Common React pattern, seen in tutorials

**Why it's wrong:** Violates layer separation, no error handling structure

**Correct approach:**

```typescript
// bindings/use-user-data/use-user-data-binding.ts
export const useUserDataBinding = ({userId}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        userFetchBroker({userId})
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [userId]);

    return {data, loading, error};
};

// widgets/user-card/user-card-widget.tsx
export const UserCardWidget = ({userId}) => {
    const {data: user, loading, error} = useUserDataBinding({userId});

    if (loading) return <div>Loading
...
    </div>;
    if (error) return <div>Error < /div>;
    return <div>{user?.name
}
    </div>;
};
```

## The "Feels Right" Validation

For each anti-pattern, include:

1. **What training data suggests** - The code LLM wants to write
2. **Why it feels right** - Validate the instinct, acknowledge the pattern
3. **Why it's wrong HERE** - Project-specific reasoning
4. **Correct pattern** - The alternative with benefits listed

**This validates the LLM's instincts** while redirecting them.

## Anti-Pattern Checklist Format

**In every guide:**

```
## Before Writing Code - Anti-Pattern Check

Did I fall into these training data traps?

### Universal Traps
- [ ] Using raw `string`/`number` types?
- [ ] Multiple exports in one file?
- [ ] Using `export default`?
- [ ] Positional parameters instead of object destructuring?

### [Folder-Specific] Traps
- [ ] [Specific trap 1]
- [ ] [Specific trap 2]
- [ ] [Specific trap 3]

If YES to any: Stop and read the anti-pattern guide.
```

## Cognitive Priming Technique

**At the start of EVERY guide:**

```
# [Folder] Guide

⚠️ **WARNING: Your Training Data Will Mislead You**

This project uses unconventional patterns to prevent code squirreling.
Your instincts will be wrong.

**Read the anti-patterns first** before writing any code in this folder.
```

**This primes the LLM to:**

1. Expect to fight training data
2. Question initial instincts
3. Look for explicit guidance
4. Check against anti-patterns

## Visual Contrast Pattern

**Use visual markers:**

**Example: Correct Broker**

✅ **DO THIS:**

```typescript
export const userFetchBroker = ({ userId }: { userId: UserId }): Promise<User> => {
```

❌ **NOT THIS (Training Data):**

```typescript
export const fetchUser = (userId: string): Promise<User> => {
```

**Diff:**

- ✅ `userFetchBroker` (domain-action-suffix pattern)
- ❌ `fetchUser` (action-domain, no suffix)
- ✅ `{ userId }: { userId: UserId }` (destructured, branded type)
- ❌ `userId: string` (positional, raw primitive)

## Loading Strategy

**When to load anti-pattern docs:**

1. **Always:** First 100 lines of every folder guide (high attention)
2. **Before file creation:** Load full anti-pattern gallery
3. **Before folder choice:** Load which-folder anti-patterns
4. **On lint error:** Load relevant anti-pattern explanation

**Context budget:**

- Anti-pattern section: ~200 lines
- Full anti-pattern gallery: ~400 lines
- Still leaves 800 lines for positive guidance

## Success Metrics

| Metric                     | Target | Indicates                           |
|----------------------------|--------|-------------------------------------|
| **Correct folder choice**  | 90%    | Not falling into utils/helpers trap |
| **Branded types usage**    | 95%    | Not using raw primitives            |
| **Single export per file** | 98%    | Not grouping semantically           |
| **Correct naming pattern** | 95%    | Not using training data conventions |

## Key Takeaways

1. **Validate instincts first** - "This feels right because..." acknowledges training
2. **Explicit contrast** - Show wrong and right side-by-side
3. **Position strategically** - Anti-patterns at high attention positions
4. **Repeat frequently** - In guides, examples, checklists
5. **Make checkable** - Provide specific anti-pattern checklists

## Next Steps

- **[Package Ecosystem Design](04-package-ecosystem.md)** - How to distribute anti-patterns via npm
- **[Rule Repetition Pattern](14-rule-repetition.md)** - Advanced repetition techniques
