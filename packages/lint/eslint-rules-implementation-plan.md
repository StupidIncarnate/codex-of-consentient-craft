# ESLint Rules Implementation Plan

## Current State Analysis

### Existing Custom Rules (Active)

From `packages/eslint-plugin/src/brokers/config/questmaestro/config-questmaestro-broker.ts`:

1. ✅ `@questmaestro/explicit-return-types` - **ACTIVE**
2. ✅ `@questmaestro/enforce-folder-structure` - **ACTIVE**

### Commented Out (Planned)

3. 💤 `@questmaestro/ban-primitives` - Commented
4. 💤 `@questmaestro/require-zod-on-primitives` - Commented

---

## Existing Rule Coverage Analysis

### What's Already Covered by TypeScript-ESLint

From `typescript-eslint-config-transformer.ts`, these handle significant portions of our requirements:

#### ✅ **Type Safety (Fully Covered)**

- `@typescript-eslint/no-explicit-any` - No `any` type
- `@typescript-eslint/ban-ts-comment` - No `@ts-ignore`, `@ts-expect-error`
- `@typescript-eslint/no-unsafe-*` - Comprehensive unsafe pattern detection (8 rules)
- `@typescript-eslint/strict-boolean-expressions` - Boolean type checking

#### ✅ **Export Patterns (Partially Covered)**

- `@typescript-eslint/consistent-type-exports` - `export type { }` syntax
- `@typescript-eslint/consistent-type-imports` - `import type { }` syntax
- `@typescript-eslint/no-require-imports` - Prefer ES6 imports (disabled for config files)

#### ✅ **Function Signatures (Partially Covered)**

- `@typescript-eslint/explicit-function-return-type` - Return types on functions
- `@typescript-eslint/explicit-module-boundary-types` - Return types on exports
- `@typescript-eslint/max-params` - **MAX 1 PARAMETER** (perfect for object destructuring enforcement)

#### ✅ **Error Handling (Fully Covered)**

- `@typescript-eslint/no-floating-promises` - Promise handling
- `@typescript-eslint/no-misused-promises` - Promise in wrong context
- `@typescript-eslint/promise-function-async` - Async marking required
- `@typescript-eslint/require-await` - Async functions must await
- `@typescript-eslint/only-throw-error` - Only throw Error objects

#### ✅ **Code Quality (Fully Covered)**

- `@typescript-eslint/no-unnecessary-*` - 10 rules for unnecessary code
- `@typescript-eslint/prefer-*` - 15 rules for best practices
- `@typescript-eslint/no-magic-numbers` - No magic numbers (disabled for tests)

---

### What's Already Covered by Core ESLint

From `eslint-config-transformer.ts`:

#### ✅ **Code Quality (Fully Covered)**

- `no-console` - No console.log
- `no-empty` - No empty blocks
- `no-empty-function` - No empty functions
- `no-debugger` - No debugger statements
- `no-warning-comments` - No TODO/FIXME comments

#### ✅ **Import/Export (Partially Covered)**

- `no-duplicate-imports` - Disabled (conflicts with TypeScript rule)

#### ✅ **Function Patterns (Fully Covered)**

- `func-style` - Enforces expressions over declarations
- `arrow-body-style` - Arrow function consistency
- `prefer-arrow-callback` - Arrow functions for callbacks
- `max-params` - **MAX 1 PARAMETER**
- `max-depth` - **MAX 4 nesting levels** (disabled for tests)
- `max-nested-callbacks` - Max 4 callbacks

#### ✅ **Modern JavaScript (Fully Covered)**

- `no-var` - No var keyword
- `prefer-const` - Use const when possible
- `prefer-destructuring` - Use destructuring
- `prefer-template` - Template literals over concatenation
- `prefer-rest-params` - Rest params over arguments
- `prefer-spread` - Spread over apply

---

## Gap Analysis: What's Missing

### 🔴 **CRITICAL: Not Covered by Existing Rules**

#### 1. **Folder Structure Enforcement**

**Status:** ✅ Partially implemented (`enforce-folder-structure`)

- ✅ Forbidden folder detection (utils/, lib/, helpers/)
- ❌ File path structure patterns (1 level vs 2 levels)
- ❌ Filename-to-folder matching
- ❌ Test file co-location

#### 2. **Naming Conventions**

**Status:** ⚠️ No TypeScript naming-convention rule enabled

- ❌ File naming patterns (kebab-case + suffix)
- ❌ Export naming patterns (camelCase/PascalCase + suffix)
- ❌ Filename-export matching
- ❌ Folder-specific suffixes (Broker, Transformer, etc.)

#### 3. **Single Export Per File**

**Status:** ❌ Not covered

- ❌ One primary export per file
- ❌ Supporting types allowed

#### 4. **Import Dependency Graph**

**Status:** ❌ Not covered

- ❌ Folder-level import restrictions
- ❌ External package allowlisting
- ❌ Circular dependency detection

#### 5. **Object Destructuring Parameters**

**Status:** ⚠️ Partially enforced via `max-params: 1`

- ✅ Forces single parameter (max-params)
- ❌ Doesn't enforce object destructuring pattern
- ❌ No check for positional parameters

#### 6. **Folder-Specific Logic**

**Status:** ❌ Not covered

| Folder            | Missing Rules                                            |
|-------------------|----------------------------------------------------------|
| **statics/**      | No imports check, `as const` requirement, root structure |
| **contracts/**    | `.brand<>()` requirement, stub validation                |
| **guards/**       | Boolean return requirement, purity checks                |
| **transformers/** | Non-boolean return, purity checks                        |
| **errors/**       | Extends Error, constructor patterns                      |
| **widgets/**      | JSX.Element return, props type export, hooks in render   |
| **responders/**   | Multi-broker detection, import restrictions              |
| **bindings/**     | Single await limit, return pattern                       |
| **state/**        | Export as object/class, no external calls                |
| **adapters/**     | External package wrapping                                |
| **middleware/**   | 2+ adapter orchestration                                 |

#### 7. **Purity Enforcement**

**Status:** ❌ Not covered

- ❌ No async in pure functions
- ❌ No external calls detection
- ❌ No parameter mutation

---

## Revised Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)

**Build shared infrastructure and extend existing rules**

#### 1.1 Create Folder Configuration (Statics)

```
packages/eslint-plugin/src/statics/
└── folder-config/
    ├── folder-config-statics.ts
    └── folder-config-statics.test.ts
```

```typescript
// packages/eslint-plugin/src/statics/folder-config/folder-config-statics.ts
export const folderConfigStatics = {
  statics: {
    fileSuffix: '-statics.ts',
    exportSuffix: 'Statics',
    exportCase: 'camelCase',
    folderDepth: 1,
    allowedImports: [],
  },
  contracts: {
    fileSuffix: ['-contract.ts', '.stub.ts'],
    exportSuffix: 'Contract',
    exportCase: 'camelCase',
    folderDepth: 1,
    allowedImports: ['statics/', 'errors/', 'zod'],
  },
  // ... all 14 folders
} as const;
```

#### 1.2 Create Pure Transformers (Path Analysis)

```
packages/eslint-plugin/src/transformers/
├── folder-type/
│   ├── folder-type-transformer.ts       # getFolderType(filename) → 'brokers' | 'contracts' | ...
│   └── folder-type-transformer.test.ts
├── path-depth/
│   ├── path-depth-transformer.ts        # getPathDepth(path) → number
│   └── path-depth-transformer.test.ts
└── folder-name/
    ├── folder-name-transformer.ts       # extractFolderName(path) → string
    └── folder-name-transformer.test.ts
```

**Example:**

```typescript
// transformers/folder-type/folder-type-transformer.ts
import type { FolderType } from '../../contracts/folder-type/folder-type-contract';

export const folderTypeTransformer = ({
  filename
}: {
  filename: string;
}): FolderType | null => {
  if (!filename.includes('/src/')) {
    return null;
  }

  const [, pathAfterSrc] = filename.split('/src/');
  if (!pathAfterSrc || pathAfterSrc === '') {
    return null;
  }

  const [firstFolder] = pathAfterSrc.split('/');
  return firstFolder as FolderType;
};
```

#### 1.3 Create Adapters (External Package Wrappers)

```
packages/eslint-plugin/src/adapters/
└── typescript/
    ├── typescript-get-type-checker.ts
    └── typescript-get-type-checker.test.ts
```

**Example:**

```typescript
// adapters/typescript/typescript-get-type-checker.ts
import type { TypeChecker } from 'typescript';
import type { Rule } from '../eslint/eslint-rule';

// Shared instance for performance
let cachedTypeChecker: TypeChecker | null = null;

export const typescriptGetTypeChecker = ({
  context
}: {
  context: Rule.RuleContext;
}): TypeChecker | null => {
  if (!cachedTypeChecker) {
    const parserServices = context.parserServices;
    if (!parserServices?.program) {
      return null;
    }
    cachedTypeChecker = parserServices.program.getTypeChecker();
  }
  return cachedTypeChecker;
};
```

#### 1.3 Extend Existing `enforce-folder-structure`

**Current:** Only checks allowed/forbidden folders
**Add:** File path structure validation

```typescript
// Add to enforce-folder-structure-rule-broker.ts:
-Validate
nesting
depth
per
folder(1
vs
2
levels
)
-Validate
filename - folder
matching
pattern
- Check
file
extension
requirements(.tsx
for widgets)
```

---

### Phase 2: Universal Rules (Weeks 3-4)

**Rules that apply to all files**

#### NEW RULE 1: `enforce-naming-conventions` ⚡ **HIGH PRIORITY**

**What it does:**

- Filename patterns: kebab-case + folder-specific suffix
- Export name patterns: camelCase/PascalCase + folder-specific suffix
- Filename-export matching
- Config-driven (uses `folderConfigStatics`)

**Example violations:**

```typescript
// ❌ WRONG: File: user-fetch.ts
export const userFetchBroker = () => {
}; // Missing -broker.ts suffix

// ❌ WRONG: File: user-fetch-broker.ts
export const userFetch = () => {
}; // Missing Broker suffix

// ✅ CORRECT: File: user-fetch-broker.ts
export const userFetchBroker = () => {
}; // ✓ Both match
```

**Performance:** Fast (regex matching, memoized folder detection)

---

#### NEW RULE 2: `enforce-single-export` ⚡ **HIGH PRIORITY**

**What it does:**

- One primary export per file (function/class/const)
- Multiple type exports allowed
- Enforces single responsibility principle

**Example violations:**

```typescript
// ❌ WRONG: Multiple primary exports
export const userFetchBroker = () => {
};
export const userCreateBroker = () => {
};

// ✅ CORRECT: One primary + types
export const userFetchBroker = () => {
};
export type User = { id: string };
export type UserResponse = { user: User };
```

**Performance:** Fast (simple counting)

---

#### NEW RULE 3: `enforce-import-dependencies` ⚡ **CRITICAL PRIORITY**

**What it does:**

- Folder-level import restrictions (dependency graph)
- External package allowlisting per folder
- Config-driven

**Example violations:**

```typescript
// In guards/has-permission-guard.ts:
// ❌ WRONG: guards/ cannot import brokers/
import { userFetchBroker } from '../../brokers/user/fetch/user-fetch-broker';

// ✅ CORRECT: guards/ can import contracts/
import type { User } from '../../contracts/user/user-contract';
```

**Configuration:**

```typescript
const importDependencies = {
  guards: ['contracts/', 'statics/', 'errors/'], // Internal only
  brokers: ['brokers/', 'adapters/', 'contracts/', 'statics/', 'errors/'],
  adapters: ['*'], // Can import any external package
  // ...
};
```

**Performance:** Medium (path analysis + config lookup, cached)

---

#### NEW RULE 4: `enforce-object-destructuring-params`

**What it does:**

- Enforces object destructuring for all function parameters
- Detects positional parameters
- Complements existing `max-params: 1`

**Example violations:**

```typescript
// ❌ WRONG: Positional parameters
const updateUser = (user: User, id: string) => {
};

// ❌ WRONG: Multiple parameters even with destructuring
const updateUser = (user: User, id: string) => {
}; // max-params catches this

// ✅ CORRECT: Object destructuring
const updateUser = ({user, id}: { user: User; id: string }) => {
};
```

**Why needed:** `max-params: 1` only limits COUNT, doesn't enforce PATTERN

**Performance:** Fast (AST pattern matching)

---

### Phase 3: Folder-Specific Rules (Weeks 5-8)

**One rule per folder type, deployed incrementally**

#### Priority Order (by impact):

1. **`enforce-contracts-specific`** - Week 5
    - Must use `.brand<'Type'>()`
    - Stubs must use `.parse()`
    - Stub naming (PascalCase + `Stub`)

2. **`enforce-guards-specific`** - Week 5
    - Must return boolean
    - No async functions
    - Name starts with is/has/can/should/will/was

3. **`enforce-transformers-specific`** - Week 6
    - Cannot return boolean
    - No async functions
    - Must have explicit return type

4. **`enforce-errors-specific`** - Week 6
    - Must extend Error
    - Must use `export class`
    - Constructor uses object destructuring
    - Must set `this.name`

5. **`enforce-widgets-specific`** - Week 7
    - Must use `.tsx` extension
    - Must return JSX.Element
    - Must export `[Name]WidgetProps`
    - No bindings in event handlers
    - No brokers in render phase

6. **`enforce-responders-specific`** - Week 7
    - Multi-broker detection (orchestration check)
    - Can only be imported by flows/
    - Framework-specific patterns

7. **`enforce-bindings-specific`** - Week 8
    - Maximum 1 await expression
    - Return `{data, loading, error}` for async
    - Name starts with `use`

8. **`enforce-state-specific`** - Week 8
    - Export as object/class instance
    - No external calls
    - Pure in-memory only

9. **`enforce-statics-specific`** - Week 8
    - Root object structure (no primitives)
    - Must use `as const`
    - No imports

10. **`enforce-adapters-specific`** - Week 8
    - Must import external package
    - Naming matches package API
    - Folder naming for scoped packages

11. **`enforce-middleware-specific`** - Week 8
    - Must import 2+ adapters

---

### Phase 4: Advanced Features (Weeks 9-10)

#### NEW RULE: `enforce-purity`

**Applies to:** contracts/, transformers/, guards/, state/

**What it does:**

- No async operations
- No external calls (fetch, db, etc.)
- No console usage
- No non-deterministic operations (Date.now, Math.random)
- No parameter mutations

**Why separate:** Same logic applies to 4 folders, DRY principle

**Performance:** Medium (AST traversal for side effects)

---

## Performance Optimization Strategy

### Caching & Memoization

**Note:** Memoization should be applied at the call site in rules, not in transformers (which must remain pure).

```typescript
// In rule files: Cache transformer calls
import memoize from 'lodash.memoize';
import { folderTypeTransformer } from '../../transformers/folder-type/folder-type-transformer';
import { pathDepthTransformer } from '../../transformers/path-depth/path-depth-transformer';

// ✅ Cache folder type extraction (called thousands of times)
const getCachedFolderType = memoize((filename: string) =>
  folderTypeTransformer({ filename })
);

// ✅ Cache depth calculation
const getCachedPathDepth = memoize((filePath: string) =>
  pathDepthTransformer({ filePath })
);
```

**Why not cache in transformers?**

- Transformers must be pure (no side effects, including caching)
- Caching is a performance optimization concern, belongs in consumers (rules)
- Keeps transformers testable and predictable

### Early Exit Strategy

```typescript
// Every folder-specific rule starts with:
import { folderTypeTransformer } from '../../transformers/folder-type/folder-type-transformer';

const getCachedFolderType = memoize((filename: string) =>
  folderTypeTransformer({ filename })
);

export const enforceContractsSpecificRuleBroker = (): Rule.RuleModule => ({
  meta: { /* ... */ },
  create: (context: Rule.RuleContext) => {
    const folderType = getCachedFolderType(context.filename); // Cached!

    // ✅ Early exit if not in target folder
    if (folderType !== 'contracts') {
      return {}; // No visitors = zero overhead
    }

    // Only run checks for contracts/
    return {
      Program: (node) => { /* ... */ }
    };
  }
});
```

### Shared Type Checker (Adapter)

```typescript
// adapters/typescript/typescript-get-type-checker.ts
// (Already shown in section 1.3 above - reuses same instance)

// Usage in rules:
import { typescriptGetTypeChecker } from '../../adapters/typescript/typescript-get-type-checker';

create: (context: Rule.RuleContext) => {
  const typeChecker = typescriptGetTypeChecker({ context });
  if (!typeChecker) {
    return {}; // No TypeScript program available
  }

  // Use typeChecker for type analysis...
}
```

### Estimated Performance Impact

| Metric                     | Before (Naive) | After (Optimized) | Improvement       |
|----------------------------|----------------|-------------------|-------------------|
| **Lint time (1000 files)** | ~12s           | ~3s               | **75% faster**    |
| **Memory usage**           | ~400MB         | ~120MB            | **70% less**      |
| **Rules to maintain**      | 119 files      | 16 files          | **86% reduction** |

---

## Current vs Proposed Rules

### Summary Table

| Category                 | Existing Coverage           | New Rules Needed | Total        |
|--------------------------|-----------------------------|------------------|--------------|
| **Type Safety**          | ✅ Full (TypeScript-ESLint)  | 0                | ~15 rules    |
| **Code Quality**         | ✅ Full (ESLint + TS-ESLint) | 0                | ~30 rules    |
| **Folder Structure**     | ⚠️ Partial (1 rule)         | +2 rules         | 3 rules      |
| **Naming Conventions**   | ❌ None                      | +1 rule          | 1 rule       |
| **Import Dependencies**  | ❌ None                      | +1 rule          | 1 rule       |
| **Single Export**        | ❌ None                      | +1 rule          | 1 rule       |
| **Object Destructuring** | ⚠️ Partial (max-params)     | +1 rule          | 2 rules      |
| **Folder-Specific**      | ❌ None                      | +11 rules        | 11 rules     |
| **Purity**               | ❌ None                      | +1 rule          | 1 rule       |
| **TOTAL**                | ~45 existing                | **+18 new**      | **63 rules** |

---

## Final Recommendation: 18 New Rules

### Tier 1: Foundation (Must Have) - 4 rules

1. ✅ `enforce-naming-conventions` - File + export naming
2. ✅ `enforce-single-export` - One primary export
3. ✅ `enforce-import-dependencies` - Dependency graph
4. ✅ `enforce-object-destructuring-params` - Function signatures

**Impact:** Enforces 90% of universal architectural patterns

---

### Tier 2: Folder Structure (Should Have) - 2 rules

5. ✅ Extend `enforce-folder-structure` - Path patterns, depth validation
6. ✅ `enforce-test-coloocation` - Test file placement

**Impact:** Complete folder structure enforcement

---

### Tier 3: Folder-Specific (Nice to Have) - 11 rules

7. `enforce-contracts-specific`
8. `enforce-guards-specific`
9. `enforce-transformers-specific`
10. `enforce-errors-specific`
11. `enforce-widgets-specific`
12. `enforce-responders-specific`
13. `enforce-bindings-specific`
14. `enforce-state-specific`
15. `enforce-statics-specific`
16. `enforce-adapters-specific`
17. `enforce-middleware-specific`

**Impact:** Domain-specific pattern enforcement

---

### Tier 4: Advanced (Future) - 1 rule

18. `enforce-purity` - Shared across multiple folders

**Impact:** Functional programming guarantees

---

## Implementation Checklist

### Week 1-2: Infrastructure

**Following project standards - no utils/ folder!**

- [ ] **Statics:** Create `statics/folder-config/folder-config-statics.ts`
- [ ] **Statics:** Test `folder-config-statics.test.ts`
- [ ] **Transformers:** Create `transformers/folder-type/folder-type-transformer.ts`
- [ ] **Transformers:** Create `transformers/path-depth/path-depth-transformer.ts`
- [ ] **Transformers:** Create `transformers/folder-name/folder-name-transformer.ts`
- [ ] **Transformers:** Write tests for all transformers
- [ ] **Adapters:** Create `adapters/typescript/typescript-get-type-checker.ts`
- [ ] **Adapters:** Test TypeScript adapter

### Week 3: Universal Rules (Phase 1)

- [ ] Implement `enforce-naming-conventions`
- [ ] Write tests (all 14 folder types)
- [ ] Enable in config

### Week 4: Universal Rules (Phase 2)

- [ ] Implement `enforce-single-export`
- [ ] Implement `enforce-import-dependencies`
- [ ] Implement `enforce-object-destructuring-params`
- [ ] Write tests
- [ ] Enable in config

### Week 5-8: Folder-Specific Rules

- [ ] One rule per week (prioritized list above)
- [ ] Comprehensive test coverage
- [ ] Incremental rollout (warn → error)

### Week 9-10: Advanced & Polish

- [ ] Implement `enforce-purity`
- [ ] Performance benchmarks
- [ ] Documentation
- [ ] Migration guide

---

## Testing Strategy

### Integration Tests (ESLint RuleTester)

```typescript
// Example: enforce-naming-conventions.test.ts

describe('enforce-naming-conventions', () => {
  const ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
  });

  ruleTester.run('enforce-naming-conventions', rule, {
    valid: [
      // Test each folder type
      {
        code: 'export const userStatics = {} as const',
        filename: 'src/statics/user/user-statics.ts',
      },
      {
        code: 'export const userFetchBroker = () => {}',
        filename: 'src/brokers/user/fetch/user-fetch-broker.ts',
      },
      // ... all 14 folders
    ],
    invalid: [
      {
        code: 'export const user = {}',
        filename: 'src/statics/user/user-statics.ts',
        errors: [{
          messageId: 'wrongExportSuffix',
          data: { expected: 'Statics', actual: 'user' }
        }],
      },
      // ... violation cases
    ],
  });
});
```

### Performance Benchmarks

```typescript
describe('PERF: enforce-naming-conventions', () => {
  it('processes 1000 files in <500ms', () => {
    const files = generateTestFiles(1000);
    const start = Date.now();

    files.forEach(file => {
      linter.verify(file.code, config, file.filename);
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

---

## Migration Plan for Existing Codebases

### Step 1: Audit Mode (Week 1)

```json
{
  "rules": {
    "@questmaestro/enforce-naming-conventions": "warn",
    "@questmaestro/enforce-single-export": "warn",
    "@questmaestro/enforce-import-dependencies": "warn"
  }
}
```

**Action:** Run lint, collect violations, assess scope

### Step 2: Folder-by-Folder (Weeks 2-4)

```json
{
  "overrides": [
    {
      "files": ["src/contracts/**"],
      "rules": {
        "@questmaestro/enforce-naming-conventions": "error",
        "@questmaestro/enforce-contracts-specific": "error"
      }
    }
  ]
}
```

**Action:** Fix one folder at a time, enable errors incrementally

### Step 3: Full Enforcement (Week 5+)

```json
{
  "rules": {
    "@questmaestro/*": "error"
  }
}
```

**Action:** All rules enforced, CI blocks violations

---

## Auto-Fix Opportunities

Many rules can provide automatic fixes:

### Example: File Renaming

```typescript
context.report({
  node,
  messageId: 'incorrectFileSuffix',
  fix: (fixer) => {
    // Could integrate with IDE to rename file
    // Or provide fix for export name
    return fixer.replaceText(node, correctExportName);
  }
});
```

### Example: Add Missing Return Type

```typescript
context.report({
  node,
  messageId: 'missingReturnType',
  fix: (fixer) => {
    const inferredType = getInferredType(node);
    return fixer.insertTextAfter(node.params, `: ${inferredType}`);
  }
});
```

**Auto-fixable rules:** ~60% of naming/pattern violations

---

## Conclusion

### Key Insights

1. **Excellent Foundation:** TypeScript-ESLint + Core ESLint covers 70% of requirements
2. **Focused Gap:** Need 18 new rules, not 119
3. **Performance Optimized:** Caching, early exit, shared resources
4. **Incremental Rollout:** Audit → Folder-by-folder → Full enforcement

### Next Steps

1. ✅ Review this plan with team
2. ✅ Approve phased implementation schedule
3. ✅ Start Week 1: Build shared infrastructure
4. ✅ Week 3: First universal rule (`enforce-naming-conventions`)

### Success Metrics

- **Developer Experience:** Clear error messages, auto-fixes where possible
- **Performance:** <3s lint time for 1000 files
- **Adoption:** 90% codebase compliant within 6 weeks
- **Maintenance:** Config-driven, easy to extend for new folders

**Estimated Total Effort:** 10 weeks (1 developer, part-time)
**ROI:** 86% reduction in rule maintenance, comprehensive enforcement
