# flows/ - Route Definitions

**Purpose:** Route definitions and entry points (maps inputs to responders). Flows are the routing layer for ALL
transport types — HTTP, MCP tools, CLI commands, hooks, queues.

**Folder Structure:**

```
flows/
  guild/
    guild-flow.ts                    # One domain per flow
    guild-flow.integration.test.ts
  quest/
    quest-flow.ts
    quest-flow.integration.test.ts
  install/
    install-flow.ts                  # Package install delegation
    install-flow.integration.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-flow.ts` or `-flow.tsx` (e.g., `guild-flow.ts`)
- **Export:** PascalCase ending with `Flow` (e.g., `GuildFlow`, `InstallFlow`)
- **Tests:** kebab-case ending with `.integration.test.ts` (NOT `.test.ts` - these are integration tests)
    - **ESLint enforced:** `@dungeonmaster/enforce-implementation-colocation` requires `.integration.test.ts` and
      forbids `.test.ts` for flow files
- **No proxies:** Flows do NOT use `.proxy.ts` files. Flows are routing/wiring only and should be tested as integration.
- **Pattern:** flows/[domain]/[domain]-flow.ts(x)
- **Integration tests must test full hookup.** Flow tests verify the complete delegation chain — startup → flow →
  responder — with real code running end-to-end. Use `installTestbedCreateBroker` from `@dungeonmaster/testing` for
  filesystem isolation. Tests that only assert `typeof Flow === 'function'` are worthless and not acceptable.

**Import Rules:**

- Can import from: `flows/`, `responders/`, `contracts/`, `transformers/`, `guards/`, `statics/`, `errors/`
- Whitelisted npm packages: `hono`, `react-router-dom`, `express` (routing frameworks only)
- Cannot import from: `adapters/`, `brokers/`, `state/`, `widgets/`, `bindings/`, `middleware/`, or any
  non-whitelisted npm package
- **Flows can import other flows** for composition — a parent flow assembles child flows into a unified routing tree

**Everything is a route.** HTTP endpoints, MCP tool calls, CLI subcommands, hook events, queue job types — all forms
of routing. They all follow the same pattern: startup → flow → responder.

**One flow per domain/concern.** Never create a single mega-flow that handles all routes. Split by domain:

```
startup/start-server.ts             → mounts GuildFlow, QuestFlow, SessionFlow, etc.
flows/guild/guild-flow.ts           → wires guild routes to guild responders
flows/quest/quest-flow.ts           → wires quest routes to quest responders

startup/start-mcp-server.ts         → mounts ArchitectureFlow, QuestFlow, WardFlow, etc.
flows/architecture/architecture-flow.ts → wires architecture tool calls to responders
flows/quest/quest-flow.ts           → wires quest tool calls to responders
```

**Flows do routing ONLY.** A flow maps inputs to responders. A flow does NOT:

- Create servers or transports (that's adapter territory)
- Initialize state (that's a responder or broker concern)
- Contain business logic of any kind

**Flows CAN contain branching.** The `ban-startup-branching` lint rule only targets `startup/` files. Flows can use
`if`/`switch`/ternary for routing logic — that is their purpose.

**Constraints:**

- **Frontend:** Use react-router-dom Route/Routes
- **Backend:** Use hono or express.Router
- **CLI:** Route subcommands to responders
- **MCP:** Route tool calls to responders
- **Hooks:** Route hook events to responders
- **Package:** Entry files that delegate to a responder

**Examples:**

```tsx
// flows/user/user-flow.tsx (Frontend — React Router)
import {Route} from 'react-router-dom';
import {UserProfileResponder} from '../../responders/user/profile/user-profile-responder';

export const UserFlow = () => (
    <Route path="/users">
        <Route path=":id" element={<UserProfileResponder/>}/>
    </Route>
);
```

```tsx
// flows/guild/guild-flow.ts (Backend — Hono)
import {Hono} from 'hono';
import {GuildListResponder} from '../../responders/guild/list/guild-list-responder';
import {GuildGetResponder} from '../../responders/guild/get/guild-get-responder';
import {GuildAddResponder} from '../../responders/guild/add/guild-add-responder';

const router = new Hono();
router.get('/', async (c) => {
    const result = await GuildListResponder();
    return c.json(result.data, result.status);
});
router.get('/:guildId', async (c) => {
    const result = await GuildGetResponder({params: {guildId: c.req.param('guildId')}});
    return c.json(result.data, result.status);
});
router.post('/', async (c) => {
    const result = await GuildAddResponder({body: await c.req.json()});
    return c.json(result.data, result.status);
});

export const GuildFlow = router;
```

```tsx
// flows/install/install-flow.ts (Package — thin delegate)
import {InstallAddDevDepsResponder} from '../../responders/install/add-dev-deps/install-add-dev-deps-responder';

type ResponderParams = Parameters<typeof InstallAddDevDepsResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallAddDevDepsResponder>>;

export const InstallFlow = async ({context}: ResponderParams): Promise<ResponderResult> =>
    InstallAddDevDepsResponder({context});
```

```tsx
// flows/cli/init/cli-init-flow.ts (CLI — subcommand routing)
import {InitResponder} from '../../responders/cli/init/cli-init-responder';

export const CliInitFlow = async ({args}: {args: readonly string[]}): Promise<void> => {
    await InitResponder({args});
};
```

**Flow Composition — Parent flows assembling child flows:**

Flows can import other flows to compose routing trees. A parent flow assembles domain-specific child flows into a
unified structure. Each child flow owns its domain's routes; the parent flow handles top-level wiring.

```tsx
// flows/app/app-flow.tsx (Frontend — parent flow composing child flows)
import {Routes, Route} from 'react-router-dom';
import {HomeFlow} from '../home/home-flow';
import {QuestChatFlow} from '../quest-chat/quest-chat-flow';
import {AppLayoutResponder} from '../../responders/app/layout/app-layout-responder';

export const AppFlow = (): React.JSX.Element => (
    <Routes>
        <Route element={<AppLayoutResponder/>}>
            {HomeFlow()}
            {QuestChatFlow()}
        </Route>
    </Routes>
);
```

```tsx
// flows/home/home-flow.tsx (Frontend — child flow returning Route elements)
import {Route} from 'react-router-dom';
import {AppHomeResponder} from '../../responders/app/home/app-home-responder';

export const HomeFlow = (): React.JSX.Element => (
    <Route path="/" element={<AppHomeResponder/>}/>
);
```

```ts
// flows/server/server-flow.ts (Backend — parent flow composing Hono sub-routers)
import {Hono} from 'hono';
import {GuildFlow} from '../guild/guild-flow';
import {QuestFlow} from '../quest/quest-flow';
import {SessionFlow} from '../session/session-flow';

const app = new Hono();
app.route('/api/guilds', GuildFlow);
app.route('/api/quests', QuestFlow);
app.route('/api/sessions', SessionFlow);

export const ServerFlow = app;
```
