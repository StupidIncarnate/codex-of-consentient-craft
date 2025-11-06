## LAYER FILES - Decomposing Complex Components

**When to create layer files:**

1. Parent exceeds 300 lines
2. Layer calls different dependencies than parent (needs own proxy)
3. Layer has distinct responsibility
4. Layer needs >10 test cases

**When NOT to create layer files:**

1. Logic is reusable across multiple parents → extract to `guards/` or `transformers/`
2. Logic is <50 lines → keep inline in parent
3. Logic is pure and doesn't need mocking → might be a pure function in `guards/` or `transformers/`

**Naming:** `{descriptive-name}-layer-{folder-suffix}.{ext}`

**Structure:**

```
parent-domain/
  parent-name-broker.ts              # Parent - orchestrates layers
  parent-name-broker.proxy.ts
  parent-name-broker.test.ts

  validate-step-one-layer-broker.ts  # Layer - focused responsibility
  validate-step-one-layer-broker.proxy.ts
  validate-step-one-layer-broker.test.ts

  validate-step-two-layer-broker.ts  # Layer - different responsibility
  validate-step-two-layer-broker.proxy.ts
  validate-step-two-layer-broker.test.ts
```

**Layer files ARE:**

- ✅ Co-located with parent (same directory, flat structure)
- ✅ Full entities with own `.proxy.ts` and `.test.ts` if complex
- ✅ Independently testable with their own test suite
- ✅ Scoped to parent's domain (not reusable across codebase)
- ✅ Named with `-layer-` infix before folder suffix

**Layer files are NOT:**

- ❌ Utilities (those go in `transformers/` or `guards/`)
- ❌ Reusable across parents (create new domain folder instead)
- ❌ Separate domains (create sibling folder instead)
- ❌ In subfolders (must be flat with parent, no nesting)

**Example - Broker Layers:**

```typescript
// Parent orchestrates layers
// brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts
import {validateFolderLocationLayerBroker} from './validate-folder-location-layer-broker';
import {validateFolderDepthLayerBroker} from './validate-folder-depth-layer-broker';
import {validateFilenamePatternLayerBroker} from './validate-filename-pattern-layer-broker';

export const ruleEnforceProjectStructureBroker = (): EslintRule => ({
    create: (context: unknown) => {
        const ctx = context as EslintContext;

        return {
            Program: (node: Tsestree): void => {
                // Level 1: Folder location
                if (!validateFolderLocationLayerBroker({node, context: ctx})) {
                    return; // Stop early if folder is wrong
                }

                // Level 2: Folder depth
                if (!validateFolderDepthLayerBroker({node, context: ctx})) {
                    return; // Stop early if depth is wrong
                }

                // Level 3: Filename pattern
                validateFilenamePatternLayerBroker({node, context: ctx});
            }
        };
    }
});
```

**Example - Widget Layers:**

```typescript
// Parent widget
// widgets/user-card/user-card-widget.tsx
import {AvatarLayerWidget} from './avatar-layer-widget';
import {UserMetaLayerWidget} from './user-meta-layer-widget';

export const UserCardWidget = ({userId}: UserCardWidgetProps) => {
    const {data: user} = useUserDataBinding({userId});  // Parent's binding

    return (
        <div>
            <AvatarLayerWidget userId = {userId}
    />  {/ * Layer - different
    binding * /}
    < h1 > {user.name} < /h1>
    < UserMetaLayerWidget
    userId = {userId}
    />  {/ * Layer - different
    binding * /}
    < /div>
)
    ;
};

// Layer widget with own dependency
// widgets/user-card/avatar-layer-widget.tsx
export const AvatarLayerWidget = ({userId}: AvatarLayerWidgetProps) => {
    const {data: avatar} = useAvatarDataBinding({userId});  // Different binding!

    return <img src = {avatar.url}
    alt = {avatar.alt}
    />;
};

// Layer has own proxy for different dependency
// widgets/user-card/avatar-layer-widget.proxy.ts
export const avatarLayerWidgetProxy = () => {
    const avatarBindingProxy = useAvatarDataBindingProxy();  // Different dependency

    return {
        setupAvatar: ({userId, avatar}) => {
            avatarBindingProxy.setupAvatar({userId, avatar});
        }
    };
};
```

**Example - Responder Layers:**

```typescript
// Parent responder
// responders/user/create/user-create-responder.ts
import {validateRequestLayerResponder} from './validate-request-layer-responder';
import {processUserCreationLayerResponder} from './process-user-creation-layer-responder';

export const UserCreateResponder = async ({req, res}: ResponderParams) => {
    // Layer 1: Validate request
    const userData = validateRequestLayerResponder({req, res});
    if (!userData) return; // Layer sent error response

    // Layer 2: Process creation
    const user = await processUserCreationLayerResponder({userData, res});

    res.status(201).json(user);
};
```

**Testing Layer Files:**

Each layer has its own test file following standard proxy pattern:

```typescript
// validate-folder-depth-layer-broker.test.ts
import {ruleTester} from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import {validateFolderDepthLayerBroker} from './validate-folder-depth-layer-broker';

ruleTester.run('validate-folder-depth-layer', validateFolderDepthLayerBroker(), {
    valid: [
        {code: '...', filename: 'src/brokers/user/fetch/user-fetch-broker.ts'},
    ],
    invalid: [
        {
            code: '...',
            filename: 'src/brokers/user-fetch-broker.ts',
            errors: [{messageId: 'invalidFolderDepth'}]
        }
    ]
});
```

**Lint Enforcement:**

Layer files are validated by:

- `@questmaestro/enforce-project-structure` - validates folder allows layers
- `@questmaestro/enforce-implementation-colocation` - validates layer has parent in same directory
- File suffix rules - validates `-layer-` appears before folder suffix
