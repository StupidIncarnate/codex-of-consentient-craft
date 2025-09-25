# Architecture Discussion Summary - Session Handoff

## Critical Context

**This is an LLM-ONLY development framework** - No humans write code in this system. Everything is optimized for LLM
discoverability and deterministic code placement.

**The Problem Being Solved:** LLMs tend to "squirrel away" code in random locations based on semantic associations. The
same function might land in `utils/`, `helpers/`, `lib/`, or `services/` depending on prompt phrasing. This architecture
forces deterministic placement through unfamiliar terminology and strict rules.

## Core Discussion Topic

Exploring the tensions and evolution patterns in the universal terminology architecture, specifically around adapters,
brokers, triggers, and how cross-cutting concerns fit into the strict hierarchical model.

## The Universal Terms (Complete List)

- **contracts/** - Types, interfaces, validation schemas, boolean functions
- **transformers/** - Pure data transformation (non-boolean returns)
- **errors/** - Error classes
- **flows/** - Route definitions, entry points
- **adapters/** - External package configuration/wrapping
- **brokers/** - Atomic business operations
- **triggers/** - Operation orchestration
- **state/** - Data storage, caches, stores
- **responders/** - Request handlers (pages, controllers)
- **widgets/** - UI components (frontend only)
- **bindings/** - React hooks, data subscriptions
- **startup/** - Bootstrap, initialization
- **assets/** - Static files
- **migrations/** - Database/version migrations

## File Structure Pattern

**Critical Rule:** One export per file, folder name matches main file:

```
brokers/
  user-fetch/
    user-fetch.ts        # Must export userFetch
    user-fetch.test.ts
```

This enables `ls` discoverability - the primary way LLMs understand what's available.

## Key Discoveries and Decisions

### 1. Adapter Evolution Pattern

**Discovery:** Adapters should be created on-demand, not upfront.

**Pattern:**

1. First broker imports npm package directly → Allowed
2. Second broker imports same package → Lint error
3. LLM creates adapter and refactors both brokers
4. Future brokers use the adapter

**Benefit:** Prevents premature abstraction while maintaining consistency.

### 2. Broker Atomicity Rule

**Rule:** "A broker is atomic if it always returns the same type."

**Critical Constraint:** Brokers can only be responsible for ONE main npm package at a time (non-whitelisted packages
like React/lodash don't count).

**Examples:**

- ✅ Valid: Multiple calls to same API (all axios)
- ❌ Invalid: API call + cache (axios + redis = 2 packages → needs trigger)

### 3. Non-Deterministic Evolution Paths

**Problem:** At genesis, LLMs might create either:

- **Path A:** Semantic brokers (`passwordInput`, `emailInput`)
- **Path B:** Parameterized broker (`input({type: 'password'})`)

**Resolution:** Both are valid as long as:

- They maintain same return type
- Local consistency is preserved
- Complexity limits aren't exceeded

### 4. Complexity Linting Rules

Brokers should be refactored when:

- Parameters > 5
- Conditional branches > 3
- Parameter interdependencies exist
- Type union > 4 options

### 5. The MUI Button Question

**Critical Discussion:** Do UI components like MUI Button need brokers?

**Initial confusion:** Seemed absurd to have `buttonRender` broker just to wrap MUI Button.

**Resolution:** Yes, they need brokers because:

- Maintains architectural purity (all npm packages go through adapters)
- Brokers add semantic meaning (`primaryButton`, `dangerButton`)
- Only brokers can call adapters (strict rule)

**Pattern:**

```
@mui/material → adapter (configure) → broker (semantics) → widget (compose)
   Button       button()              primaryButton()      UserForm
```

### 6. Adapter vs Broker Distinction

**Adapters (Configuration Layer):**

- Add project-wide policies (auth, timeouts, retries)
- Know NOTHING about business logic
- Handle HOW to communicate with external systems

**Brokers (Specification Layer):**

- Implement specific business operations
- Know endpoints, database tables, queue names
- Handle WHAT operations to perform

**Example Flow:**

```
axios → adapter (adds auth/retry) → broker (calls /api/users/:id) → trigger (orchestrates)
```

### 6. Cross-Cutting Concerns Resolution

**Problem:** Analytics, caching, logging need to be everywhere but architecture restricts them.

**Explored Solutions:**

- observers/ layer (rejected - reinventing utils)
- platform/ layer (rejected - creates ambiguity)
- aspects/ with decorators (rejected - hidden control flow)

**Final Understanding:** Cross-cutting concerns are actually orchestration patterns that belong in triggers. The "pain"
is the architecture protecting against god functions.

### 7. Frontend vs Backend Evolution Patterns

**Frontend Evolution (Additive):**

- Broker → Widget (composition)
- Original brokers remain unchanged
- No breaking changes

**Backend Evolution (Replacement):**

- Broker → Trigger (orchestration)
- Callers must migrate
- Breaking change

**Why:** UI is compositional, operations are sequential.

### 8. The Two-Layer Pattern

**Discovery:** Every external boundary needs two layers:

1. **Configuration Layer** - How to connect (adapters, bindings)
2. **Specification Layer** - What operations (brokers, widgets)

Then composed into business logic (triggers for operations, widgets for UI).

## Import Hierarchy (Who Can Import Who)

The architecture enforces a strict Directed Acyclic Graph (DAG):

```
errors → contracts → transformers
                ↓
         adapters → brokers → triggers → responders → flows
                         ↓        ↓           ↑
                    bindings → widgets -------┘
                         ↓        ↓
                      state ------┘
```

**Key Rules:**

- Lower layers cannot import from higher layers
- Brokers CANNOT call other brokers (atomicity)
- Triggers CANNOT call other triggers (prevents chains)
- Only brokers can import from adapters
- Widgets can call triggers (for event handlers)

## Important Architectural Principles Confirmed

### 1. No Utils/Helpers/Common

Everything has ONE specific location based on what it does, not how reusable it is.

### 2. Triggers Prevent God Functions

- Responders can't orchestrate → prevents god controllers
- Brokers can't call brokers → prevents god services
- All complexity converges on triggers (testable, reusable)

### 3. Discoverability Through Structure

LLMs use `ls` to understand available functionality. Folder/file names are the primary documentation.

### 4. Evolution Through Lint Enforcement

The architecture self-organizes through lint rules rather than upfront decisions.

## Unresolved Questions and Tensions

### 1. Whitelist Complexity

- Should LLMs check `.importwhitelist.json`?
- Is it too much cognitive overhead?
- Current thinking: Checking whitelist is trivial for LLMs

### 2. Semantic vs Parameterized Brokers

- Both patterns are valid
- Local consistency matters more than global determinism
- Complexity linting provides guardrails

### 3. Widget/Trigger Naming

- Considered merging into "compositions"
- Rejected because they have different import rules
- Widgets are both specification AND composition layers

### 4. Common Patterns Needing Documentation

**Caching Pattern:**
Almost every fetch operation eventually needs caching, forcing trigger creation. Should this be explicitly documented as
a common evolution?

**Analytics Pattern:**
UI elements frequently need analytics, forcing trigger creation for event handlers.

## Real-World Evolution Examples

### Backend Examples:

1. User fetch → Add audit logging → Forced trigger (2 systems)
2. File upload → Add virus scanning → Forced trigger (3 systems)
3. Order creation → Add payment → Forced trigger (3 systems)

### Frontend Examples:

1. Submit button → Add analytics → Forced trigger (2 packages)
2. Search input → Add autocomplete → Forced trigger + binding
3. User avatar → Add presence → Forced trigger + binding

**Pattern:** Real-world requirements naturally push brokers toward triggers because business features rarely stay
confined to a single system.

## Key Insights for Next Session

### 1. The Architecture Works

The strict hierarchy successfully prevents god functions and maintains clear boundaries. The "pain" of creating triggers
is actually the architecture doing its job.

### 2. Pattern Matching Over Rules

LLMs excel at following existing patterns. Non-determinism at genesis is acceptable if local consistency is maintained.

### 3. Evolution is Natural

The adapter creation pattern and broker-to-trigger evolution are natural progressions, not architectural failures.

### 4. Frontend Has Double Two-Layer Patterns

- For UI elements: adapters → brokers
- For data flow: bindings → widgets
  This explains why widgets have a dual role.

### 5. One Main Package Rule

This provides the clearest distinction between brokers and triggers, and is easily lintable.

## Next Steps to Consider

1. **Document the evolution patterns** explicitly in the standards
2. **Create lint rules** for complexity thresholds
3. **Add examples** of common evolution patterns (fetch → fetch with cache)
4. **Clarify the two-layer pattern** in documentation
5. **Consider a decision tree** for LLMs to determine where code belongs


