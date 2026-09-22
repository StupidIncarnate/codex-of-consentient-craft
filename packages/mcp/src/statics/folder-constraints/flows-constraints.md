**FOLDER STRUCTURE:**

```
flows/
  user/
    user-flow.tsx        # Frontend: React Router
    user-flow.integration.test.ts
  api/
    api-flow.ts          # Backend: Express Router
    api-flow.integration.test.ts
  install/
    install-flow.ts      # Package: delegates to responder
    install-flow.integration.test.ts
  widget-cli/
    widget-cli-flow.ts                                # Router: resolves command -> layer flow
    widget-cli-flow.integration.test.ts
    widget-cli-create-layer-flow.ts                    # One entry point: the `create` command
    widget-cli-create-layer-flow.integration.test.ts
    widget-cli-list-layer-flow.ts                      # One entry point: the `list` command
    widget-cli-list-layer-flow.integration.test.ts
```

**ONE FLOW FILE PER ENTRY POINT:**

An entry point is one route, one command, or one subcommand. A flow wiring N entry points holds N
layer files. A single map, switch or router with every entry point inline is the shape this rule
refuses.

- The root `-flow.ts` is routing and nothing else — it resolves an entry point to its layer flow. It
  parses no arguments, calls no responder directly, and holds no per-entry-point logic.
- A layer flow owns exactly ONE entry point and that entry point's whole argument surface.
- Every layer flow carries its own `.integration.test.ts`, beside it — same as the root.

Layer flows sit flat beside the router, never in a subfolder: `flows/` keeps `folderDepth: 1` and
takes layer files the same way `widgets/` and `brokers/` do. Naming follows the layer convention —
`{descriptive-name}-layer-flow.ts`, exporting `{DescriptiveName}LayerFlow` — and a layer flow carries
no `.proxy.ts`, same as the root: flows never require one, so their layers don't either.

**THREE TYPES OF FLOWS:**

1. **Frontend flows**: React components using react-router-dom Route/Routes
2. **Backend flows**: Express routers using express.Router
3. **Package flows**: Entry point files that compose public API exports

**KEY PRINCIPLE:**

Flows are **routing/wiring only** - they map paths to responders but contain NO business logic.

**FRONTEND PATTERN (React Router):**

```typescript
export const UserFlow = () => (
    <Route path = "/users" >
        <Route index
element = { < UserListResponder / >
}
/>
< Route
path = ":id"
element = { < UserProfileResponder / >
}
/>
< /Route>
)
;
```

**BACKEND PATTERN (Express Router):**

```typescript
const router = Router();

router.get('/users/:id', async (req, res, next) => {
    try {
        await UserGetResponder({req, res});
    } catch (error) {
        next(error);  // Always pass errors to Express error handler
    }
});

export const UserFlow = router;
```

**TESTING (ESLint Enforced):**

Flows use `.integration.test.ts` (NOT `.test.ts`). This is enforced by ESLint rule
`@dungeonmaster/enforce-implementation-colocation`.

Flows do NOT use `.proxy.ts` files. Integration tests run real code through the full flow → responder → adapter chain.

**TEST EXAMPLE:**

```typescript
// flows/install/install-flow.integration.test.ts
import {installTestbedCreateBroker, BaseNameStub, RelativePathStub} from '@dungeonmaster/testing';
import {FilePathStub} from '@dungeonmaster/shared/contracts';
import {InstallFlow} from './install-flow';

describe('InstallFlow', () => {
    describe('delegation to responder', () => {
        it('VALID: {context} => delegates to responder and returns install result', async () => {
            const testbed = installTestbedCreateBroker({
                baseName: BaseNameStub({value: 'flow-delegation'}),
            });

            const result = await InstallFlow({
                context: {
                    targetProjectRoot: FilePathStub({value: testbed.guildPath}),
                    dungeonmasterRoot: FilePathStub({value: testbed.dungeonmasterPath}),
                },
            });

            const questContent = testbed.readFile({
                relativePath: RelativePathStub({value: '.claude/commands/quest.md'}),
            });

            testbed.cleanup();

            expect(result).toStrictEqual({
                packageName: '@dungeonmaster/orchestrator',
                success: true,
                action: 'created',
                message: 'Created .claude/commands/ with quest.md and quest:start.md, .claude/agents/ with chaoswhisperer-gap-minion.md',
            });
            expect(questContent).toMatch(/ChaosWhisperer/u);
        });
    });
});
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Defines user-related routes mapping paths to responders
 *
 * USAGE:
 * <UserFlow /> // In React app routing
 * // Renders user profile at /users/:id
 */
// flows/user/user-flow.tsx (Frontend with React Router)
import {Route} from 'react-router-dom';
import {UserProfileResponder} from '../../responders/user/profile/user-profile-responder';
import {UserListResponder} from '../../responders/user/list/user-list-responder';

export const UserFlow = () => (
    <Route path = "/users" >
        <Route index
element = { < UserListResponder / >
}
/>
< Route
path = ":id"
element = { < UserProfileResponder / >
}
/>
< /Route>
)
;

/**
 * PURPOSE: Defines API documentation routes mapping paths to responders
 *
 * USAGE:
 * <ApiFlow /> // In React app routing
 * // Renders API docs at /api/docs
 */
// flows/api/api-flow.tsx (Frontend API routes)
import {Route} from 'react-router-dom';
import {ApiDocsResponder} from '../../responders/api/docs/api-docs-responder';

export const ApiFlow = () => (
    <Route path = "/api" >
    <Route path = "docs"
element = { < ApiDocsResponder / >
}
/>
< /Route>
)
;
```

```typescript
/**
 * PURPOSE: Defines user API endpoints and maps them to responders
 *
 * USAGE:
 * app.use('/api', UserFlow); // In Express app
 * // Registers GET /api/users/:id endpoint
 */
// flows/user/user-flow.ts (Backend with Express)
import {Router} from 'express';
import {UserGetResponder} from '../../responders/user/get/user-get-responder';
import {UserCreateResponder} from '../../responders/user/create/user-create-responder';

const router = Router();

router.get('/users/:id', async (req, res, next) => {
    try {
        await UserGetResponder({req, res});
    } catch (error) {
        next(error);
    }
});

router.post('/users', async (req, res, next) => {
    try {
        await UserCreateResponder({req, res});
    } catch (error) {
        next(error);
    }
});

export const UserFlow = router;
```
