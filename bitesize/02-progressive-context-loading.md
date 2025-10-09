# Progressive Context Loading Strategy

## Core Principle

**Stop thinking "one document." Start thinking "context orchestration system."**

The goal: Never load more than 1000 lines into LLM context for any single task.

## The Hierarchy

```
📁 .claude/
├── 📄 CORE-RULES.md                 (Always loaded, 300 lines MAX)
├── 📁 folders/
│   ├── 📄 contracts-guide.md        (Loaded when touching contracts/)
│   ├── 📄 brokers-guide.md          (Loaded when touching brokers/)
│   ├── 📄 transformers-guide.md
│   ├── 📄 adapters-guide.md
│   └── 📄 frontend-guide.md         (Loaded for widget/binding work)
├── 📁 decisions/
│   ├── 📄 extend-vs-create.md       (Loaded when making that choice)
│   ├── 📄 which-folder.md           (Decision tree)
│   └── 📄 naming-patterns.md
└── 📁 anti-patterns/
    └── 📄 training-data-traps.md    (What NOT to do)
```

**Rule:** Never load more than 1000 lines at once.

## Loading Strategy

### Implementation Pattern

Root CLAUDE.md contains strategy for WHEN to load each sub-document:

- LLM says: "I need to create a broker" → loads core + brokers-guide + naming
- LLM says: "Should I extend this file?" → loads extend-vs-create decision guide

### Example Task Flow

**Task: "Create a user fetch broker"**

**Step 1: Parse task**

- Identifies: Business operation = broker

**Step 2: Load baseline context**

- Root CLAUDE.md (300 lines)
- core-rules.md (250 lines)
- **Subtotal: 550 lines**

**Step 3: Load task-specific guide**

- brokers-guide.md (450 lines)
- **Total: 1000 lines**

**Step 4: Check for existing files**

```bash
rg -l "userFetchBroker" src/brokers/
```

**Step 5: If exists, load decision guide**

- extend-vs-create.md (350 lines)
- **Total: 1350 lines** (still manageable)

**Step 6: Generate code**

## The "Rule Proximity" Principle

**Every example must carry its own rule context.**

### ❌ Current Structure (Rules Distant From Examples):

```markdown
Line 68: Rule - must use branded types
Line 491: Rule - contracts use .brand<'TypeName'>()
...
Line 912: Example broker code
```

*Problem: 844 lines between rule and application*

### ✅ New Structure (Rules Adjacent to Examples):

```markdown
## brokers/ - Business Operations

### Before Writing ANY Broker - Checklist
□ Uses branded Zod types for ALL params (UserId not string)
□ Object destructuring syntax ({ user }: { user: User })
□ Explicit return type with contract (Promise<User>)
□ One export per file ending in -broker.ts
□ Validates output through contract before return

### Example: Atomic Broker

⚠️ **Critical Rules Applied Here:**
- Line 3: UserId is branded type from contract (not raw string)
- Line 3: Object destructuring ({ userId }: { ... })
- Line 3: Explicit return type Promise<User>
- Line 5: Contract validation before return

```typescript
// brokers/user/fetch/user-fetch-broker.ts
import type { UserId, User } from '../../../contracts/user/user-contract';
//            ^^^^^^ Branded type, not string

export const userFetchBroker = async ({ userId }: { userId: UserId }): Promise<User> => {
//                                      ^^^^^^^ Destructured  ^^^^^^ Branded  ^^^^^^^ Explicit
  const response = await axiosGetAdapter({ url: `/api/users/${userId}` });
  return userContract.parse(response.data);
  //     ^^^^^^^^^^^^^^^ Contract validation required
};
```

### Anti-Pattern: What Training Data Makes You Write

```typescript
// ❌ DON'T: Training data instinct
// utils/userHelpers.ts
export const fetchUser = (userId: string) => {
//    ❌ No destructuring     ❌ Raw string
  return axios.get(`/api/users/${userId}`).then(r => r.data);
  //     ❌ No adapter         ❌ No contract validation
};
```

```

**Key insight:** Rules, examples, and anti-patterns in the SAME viewport (< 50 lines apart)

## The "Repetition Ladder" Pattern

**State critical rules in EVERY relevant section using different framings.**

### Rule Appears 6 Times:

**Occurrence 1 (CORE-RULES.md, line 20):**
```markdown
## Type System Foundation
ALL function parameters must use branded Zod types. NEVER use raw string/number.
```

**Occurrence 2 (contracts-guide.md, line 5):**

```markdown
⚠️ REMEMBER: Every contract must use .brand<'TypeName'>() - no raw primitives.
```

**Occurrence 3 (brokers-guide.md, line 15):**

```markdown
### Broker Type Safety Checklist
□ All parameters use branded types (UserId, EmailAddress, etc.)
□ NO raw string/number in function signatures
```

**Occurrence 4 (transformers-guide.md, line 12):**

```markdown
⚠️ Transform inputs AND outputs must be branded contracts
```

**Occurrence 5 (Every example header):**

```typescript
// 🔍 Type Safety Rules Applied:
// - userId: UserId (branded) ✓
// - return: Promise<User> (contract type) ✓
export const userFetchBroker = ({ userId }: { userId: UserId }): Promise<User> => {
```

**Occurrence 6 (Anti-pattern section):**

```typescript
// ❌ TRAINING DATA TRAP: Using raw primitives
const badFunction = ({ userId }: { userId: string }) => {
//                                          ^^^^^^ NO! Use UserId branded type
```

**Why this works:** If LLM forgets any ONE occurrence, it hits another within 200 lines.

## Context Loading Table

Root CLAUDE.md includes this table for LLM reference:

| Task                         | Load These Files                      | Total Lines |
|------------------------------|---------------------------------------|-------------|
| **Any code creation**        | core-rules.md                         | 250         |
| **Contracts/schemas**        | core-rules.md + contracts-guide.md    | 650         |
| **Business logic**           | core-rules.md + brokers-guide.md      | 700         |
| **Data transformation**      | core-rules.md + transformers-guide.md | 600         |
| **External package wrapper** | core-rules.md + adapters-guide.md     | 650         |
| **UI components**            | core-rules.md + frontend-guide.md     | 750         |
| **Testing**                  | core-rules.md + testing-standards.md  | 650         |
| **Unsure which folder**      | which-folder.md                       | 400         |
| **Create vs extend file**    | extend-vs-create.md                   | 350         |

**Maximum context load:** ~1000 lines (with root CLAUDE.md included)

## The Decision Point Interrupt System

**Identify critical decision points where failure is most likely:**

### Decision Point 1: "Should I create a new file or extend existing?"

**Trigger:** LLM is about to write a new file

**Load:** `decisions/extend-vs-create.md` (350 lines, focused decision tree)

```markdown
# Decision: Create New File or Extend Existing?

## Step 1: Search for existing domain files
```bash
rg -l "userFetchBroker" src/brokers/
rg -l "useUserDataBinding" src/bindings/
```

## Step 2: Does the file exist?

### YES → Go to Extension Decision

### NO → Go to Creation Decision

## Extension Decision Tree

### Are you adding...

- [ ] Optional behavior (filtering, including related data)
  → EXTEND with options/props

- [ ] New action (delete when only fetch exists)
  → CREATE new file

- [ ] Different output shape (DTO vs Admin vs Summary)
  → For transformers: CREATE separate files
  → For others: EXTEND with options

[Concrete examples follow]

```

**Implementation:** LLM self-prompts before file creation:
```

LLM: "I need to create user-fetch-with-company-broker.ts"
LLM: [Internal] "Wait, I should check the extend-vs-create decision guide first"
LLM: [Loads decision guide]
LLM: "Found existing user-fetch-broker.ts. This is optional behavior (include company). Should EXTEND, not create new
file."

```

## Anti-Pattern Leading Strategy

**Put anti-patterns FIRST in every guide (high attention weight position)**

```markdown
# 🚨 brokers/CLAUDE.md

## STOP: Training Data Will Make You Do This

Your instincts from training data will suggest:

### ❌ Training Data Trap #1: Multiple exports per file
```typescript
// services/userService.ts
export const fetchUser = (id: string) => { /* */ };
export const createUser = (data: UserData) => { /* */ };
export const updateUser = (id: string, data: UserData) => { /* */ };
```

**Why this feels right:** Semantically related, common pattern in training data

**Why it's wrong here:** Violates single responsibility, breaks import rules

**Correct pattern:**

```
brokers/user/fetch/user-fetch-broker.ts → exports userFetchBroker
brokers/user/create/user-create-broker.ts → exports userCreateBroker
```

---

## NOW HERE'S THE CORRECT PATTERN

[Rest of guide follows]

```

**Why leading with anti-patterns works:**
1. **High recency** = strong attention weight
2. **Explicit contrast** activates "don't do this" pattern matching
3. **Anticipates errors** before they happen
4. **Cognitive priming** - LLM expects to fight instincts

## Progressive Enforcement Phases

Don't implement all rules at once. Build enforcement progressively:

### Phase 1: Structure Only (Week 1-2)
- **Enforce:** Folder structure, file naming, single export
- **Document:** 500 lines total (achievable)
- **Context load:** ~500 lines per task

### Phase 2: Type Safety (Week 3-4)
- **Add:** Branded types, explicit returns, contract validation
- **Document:** +400 lines (now 900 total)
- **Context load:** ~700 lines per task

### Phase 3: Architectural (Week 5-6)
- **Add:** Extension vs creation, frontend data flow, transaction boundaries
- **Document:** +300 lines (now 1200 total, split across multiple files)
- **Context load:** Still ~800 lines per task (load selectively)

### Phase 4: Polish (Week 7+)
- **Add:** Performance patterns, advanced scenarios, edge cases
- **Document:** Grows organically as needed
- **Context load:** Remains focused (< 1000 lines)

**Why progressive works:**
- LLM builds "muscle memory" for early rules before adding more
- Lint rules added in phases (simpler to debug)
- Team learns in digestible chunks
- Context stays manageable (never load Phase 4 docs unless needed)

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Max context per task** | < 1200 lines | Attention remains focused |
| **Rule proximity** | < 50 lines | Rules adjacent to examples |
| **Repetition frequency** | Every 200-400 lines | Fights attention decay |
| **Anti-pattern position** | First 100 lines | High attention weight |
| **Decision point interrupts** | Before critical choices | Prevents wrong path |

## Key Takeaways

1. **Never load entire doc** - Load only what's needed for current task
2. **Rules near examples** - Keep critical rules < 50 lines from application
3. **Repeat critical rules** - State 4-6 times in different framings
4. **Lead with anti-patterns** - Put "don't do this" at high attention positions
5. **Interrupt at decisions** - Load decision guides at critical choice points

## Next Steps

- **[Anti-Pattern Strategy](03-anti-pattern-strategy.md)** - How to fight training data effectively
- **[Package Ecosystem Design](04-package-ecosystem.md)** - How npm enables this architecture
