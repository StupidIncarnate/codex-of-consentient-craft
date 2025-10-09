# Lint-Driven Learning - Using ESLint as Pedagogical Feedback

## The Concept

ESLint errors become **just-in-time documentation** that catches what LLM attention decay misses.

**Key insight:** Specific, recent error messages have HIGH attention weight, even after reading 1000+ lines.

## Current Flow (High Failure Rate)

```
1. User: "Create user transformer"
2. LLM: [Reads 1780 lines]
3. LLM: [Generates code, forgets branded type rule from line 68]
4. Code committed with violation ❌
```

**Problem:** Rule from line 68 has weak attention after 1700+ lines

## New Flow (Self-Correcting)

```
1. User: "Create user transformer"
2. LLM: [Loads core rules + transformer guide = 600 lines]
3. LLM: [Generates code]
4. Pre-commit hook: ESLint runs
5. Lint error: "Return type uses raw 'string', must use branded type"
6. Error fed back to LLM context (HIGH attention weight - fresh)
7. LLM: "I'll fix line 8 to use UserName branded type"
8. Code re-generated correctly ✓
```

**Why this works:** Error is SPECIFIC, not general, so has high attention weight

## Pedagogical Error Messages

### ❌ Bad Error (Technical Only)

```
error: Expected explicit return type (explicit-return-type)
  at user-transformer.ts:5:14
```

**Problems:**

- No context on WHY
- No guidance on HOW to fix
- No link to learn more

### ✅ Good Error (Pedagogical)

```
error: Missing explicit return type

Transformers must return branded contract types, not raw primitives.

Expected: ': UserDto' where UserDto comes from userDtoContract

Example:
  export const userToDto = ({ user }: { user: User }): UserDto => {
    return userDtoContract.parse({ ... });
  };

Why: Ensures type safety for transformed data, prevents raw primitives

Learn more:
  - .claude/_framework/standards/core-rules.md#explicit-return-types
  - .claude/_framework/standards/folders/transformers-guide.md
  - .claude/_framework/lint/rule-explanations.md#explicit-return-type

  at user-transformer.ts:5:14
```

**Benefits:**

- ✅ Explains WHY rule exists
- ✅ Shows HOW to fix with example
- ✅ Links to framework docs for deep dive
- ✅ Contextual (transformer-specific guidance)

## Implementation Pattern

### ESLint Rule Structure

```javascript
// @questmaestro/eslint-plugin/rules/explicit-return-type.js

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require explicit return types on exported functions',
      category: 'Type Safety',
      recommended: true,
      url: '.claude/_framework/lint/rule-explanations.md#explicit-return-type'
    },
    messages: {
      missingReturnType: [
        'Missing explicit return type',
        '',
        '{{context}}',
        '',
        'Example:',
        '{{example}}',
        '',
        'Why: {{reason}}',
        '',
        'Learn more:',
        '  - .claude/_framework/standards/core-rules.md#explicit-return-types',
        '  - {{folderGuide}}',
        '  - .claude/_framework/lint/rule-explanations.md#explicit-return-type'
      ].join('\n')
    }
  },

  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (isFunction(node) && !hasExplicitReturnType(node)) {
          const folderType = detectFolderType(context.getFilename());

          context.report({
            node,
            messageId: 'missingReturnType',
            data: {
              context: getContextMessage(folderType),
              example: getExampleFix(folderType),
              reason: getReasonMessage(folderType),
              folderGuide: getFolderGuideLink(folderType)
            }
          });
        }
      }
    };
  }
};

function getContextMessage(folderType) {
  const messages = {
    transformers: 'Transformers must return branded contract types, not raw primitives.\n\nExpected: \': UserDto\' where UserDto comes from userDtoContract',
    brokers: 'Brokers must return branded contract types.\n\nExpected: \': Promise<User>\' where User comes from userContract',
    guards: 'Guards must return explicit boolean type.\n\nExpected: \': boolean\'',
  };
  return messages[folderType] || 'All exported functions require explicit return types';
}

function getExampleFix(folderType) {
  const examples = {
    transformers: `  export const userToDto = ({ user }: { user: User }): UserDto => {
    return userDtoContract.parse({ ... });
  };`,
    brokers: `  export const userFetchBroker = ({ userId }: { userId: UserId }): Promise<User> => {
    return userContract.parse(await fetch(...));
  };`,
    guards: `  export const hasPermissionGuard = ({ user, permission }: { ... }): boolean => {
    return user.permissions.includes(permission);
  };`,
  };
  return examples[folderType] || '  export const myFunction = (...): ReturnType => { ... };';
}

function getReasonMessage(folderType) {
  const reasons = {
    transformers: 'Ensures type safety for transformed data, prevents accidental raw primitives',
    brokers: 'Documents expected data shape, enables compile-time validation',
    guards: 'Makes boolean intent explicit, prevents accidental truthy/falsy returns',
  };
  return reasons[folderType] || 'Improves code clarity and type safety';
}

function getFolderGuideLink(folderType) {
  return `.claude/_framework/standards/folders/${folderType}-guide.md`;
}
```

## Folder-Aware Errors

**Same rule, different contexts:**

### In transformers/

```
error: Missing explicit return type

Transformers must return branded contract types, not raw primitives.

Expected: ': UserDto' where UserDto comes from userDtoContract

Example:
  export const userToDto = ({ user }: { user: User }): UserDto => {
    return userDtoContract.parse({ id: user.id, name: user.name });
  };

Learn more: .claude/_framework/standards/folders/transformers-guide.md
```

### In brokers/

```
error: Missing explicit return type

Brokers must return branded contract types.

Expected: ': Promise<User>' where User comes from userContract

Example:
  export const userFetchBroker = ({ userId }: { userId: UserId }): Promise<User> => {
    const response = await axiosGetAdapter({ url });
    return userContract.parse(response.data);
  };

Learn more: .claude/_framework/standards/folders/brokers-guide.md
```

**Same violation, context-specific guidance**

## Common Rule Examples

### 1. Branded Types Required

```javascript
// Rule: branded-types.js
context.report({
  node,
  message: [
    'Raw primitive type detected. Use branded Zod types instead.',
    '',
    'Found: string',
    'Expected: UserId (from userIdContract)',
    '',
    'All function parameters must use branded types to prevent invalid values.',
    '',
    'Create branded type:',
    '  export const userIdContract = z.string().uuid().brand<\'UserId\'>();',
    '  export type UserId = z.infer<typeof userIdContract>;',
    '',
    'Use in function:',
    '  export const fetchUser = ({ userId }: { userId: UserId }): Promise<User> => { ... }',
    '',
    'Why: Branded types provide compile-time safety for business concepts',
    '',
    'See:',
    '  - .claude/_framework/standards/core-rules.md#branded-types',
    '  - .claude/_framework/standards/folders/contracts-guide.md#branded-primitives'
  ].join('\n')
});
```

### 2. Single Export Per File

```javascript
// Rule: single-export.js
context.report({
  node,
  message: [
    'Multiple exports detected. Each file must have exactly one primary export.',
    '',
    'Found in this file:',
    '  - export const fetchUser',
    '  - export const createUser',
    '  - export const updateUser',
    '',
    'Correct structure:',
    '  brokers/user/fetch/user-fetch-broker.ts → exports userFetchBroker',
    '  brokers/user/create/user-create-broker.ts → exports userCreateBroker',
    '  brokers/user/update/user-update-broker.ts → exports userUpdateBroker',
    '',
    'Why: Single responsibility per file, clear discoverability',
    '',
    'Exception: Supporting types may be co-exported with their primary function',
    '',
    'See:',
    '  - .claude/_framework/standards/core-rules.md#single-responsibility',
    '  - .claude/_framework/standards/anti-patterns/training-data-traps.md#multiple-exports'
  ].join('\n')
});
```

### 3. Forbidden Folders

```javascript
// Rule: folder-structure.js
context.report({
    node,
    message: [
        `Forbidden folder detected: "${folderName}/"`,
        '',
        'This project does not use utils/, helpers/, lib/, or common/ folders.',
        '',
        'Use these instead:',
        '  - Boolean functions → guards/',
        '  - Data transformation → transformers/',
        '  - External packages → adapters/',
        '  - Business logic → brokers/',
        '',
        'Why: Prevents LLM from "squirreling away" code based on semantic similarity',
        '',
        'See decision tree:',
        '  .claude/_framework/standards/decisions/which-folder.md'
    ].join('\n')
});
```

## Integration with Framework Docs

### Rule Explanations Document

**File:** `@questmaestro/eslint-plugin/docs/rule-explanations.md`

```markdown
# ESLint Rule Explanations

## branded-types

**What it enforces:** All function parameters must use branded Zod types

**Why it exists:**

- Training data uses raw `string`/`number` types everywhere
- LLMs default to this pattern when attention decays
- Branded types provide business-level type safety

**How to fix:**

1. Create branded contract in contracts/ folder
2. Import and use in function signature

**Examples:**
[Full examples with before/after]

**Related docs:**

- Core rules: .claude/_framework/standards/core-rules.md#branded-types
- Contracts guide: .claude/_framework/standards/folders/contracts-guide.md

---

## explicit-return-type

[Similar structure for each rule]
```

### Cross-Reference Strategy

**Error message → Framework docs:**

```
Error: Missing explicit return type
→ Links to: .claude/_framework/standards/core-rules.md#explicit-return-types
→ Links to: .claude/_framework/standards/folders/transformers-guide.md
→ Links to: .claude/_framework/lint/rule-explanations.md#explicit-return-type
```

**Claude loads these docs with HIGH attention weight** (error is fresh context)

## The Feedback Loop

### Iteration 1: Initial Code

```typescript
// LLM writes (forgot branded types)
export const userTransformer = ({user}) => {
    return {id: user.id, name: user.name};
};
```

### Iteration 2: Lint Error

```
error: Parameter 'user' has implicit 'any' type
error: Missing explicit return type
error: Return object should use branded types

See: .claude/_framework/standards/folders/transformers-guide.md
```

### Iteration 3: LLM Fixes (guided by errors)

```typescript
// LLM fixes based on specific errors
import type {User} from '../../contracts/user/user-contract';
import {userDtoContract} from '../../contracts/user-dto/user-dto-contract';
import type {UserDto} from '../../contracts/user-dto/user-dto-contract';

export const userTransformer = ({user}: { user: User }): UserDto => {
    return userDtoContract.parse({
        id: user.id,
        name: user.name
    });
};
```

### Iteration 4: Success

```
✓ Lint passed
✓ All rules satisfied
✓ Code committed
```

## Pre-Commit Hook Integration

```javascript
// @questmaestro/hooks/pre-commit/validate-structure.js

const { ESLint } = require('eslint');

async function validateStructure() {
  const eslint = new ESLint({
    baseConfig: require('@questmaestro/eslint-plugin/configs/recommended')
  });

  const results = await eslint.lintFiles(['src/**/*.ts']);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  if (results.some(r => r.errorCount > 0)) {
    console.log(resultText);
    console.log('\n💡 Tip: Errors include links to framework docs for guidance\n');
    process.exit(1);
  }
}

validateStructure();
```

**Result:** Every commit validates against framework rules

## Success Indicators

| Metric                   | Target  | Indicates                    |
|--------------------------|---------|------------------------------|
| **Error clarity rating** | 4.5/5   | Messages are helpful         |
| **Fix time**             | < 2 min | Guidance is actionable       |
| **Self-correction rate** | 90%     | LLM fixes without human help |
| **Repeat violations**    | < 5%    | Learning is happening        |

## Key Insights

1. **Errors are pedagogical** - Teach, don't just report
2. **Context-aware** - Same rule, different guidance per folder
3. **Link to docs** - Errors point to learning resources
4. **Fresh attention** - Recent errors have high activation
5. **Self-correcting loop** - LLM learns from specific feedback

## Implementation Checklist

- [ ] Create pedagogical error messages for all rules
- [ ] Add folder-aware context detection
- [ ] Include example fixes in errors
- [ ] Link to framework docs in messages
- [ ] Create rule-explanations.md
- [ ] Integrate with pre-commit hooks
- [ ] Test self-correction rate

## Next Steps

- **[Version Management](12-version-management.md)** - Keeping rules and docs aligned
- **[Implementation Roadmap](19-implementation-roadmap.md)** - When to build this
