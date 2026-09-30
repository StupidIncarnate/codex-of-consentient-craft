**FOLDER STRUCTURE:**

```
flows/
  user/
    user-flow.tsx        # Frontend: React Router
    user-flow.integration.test.ts
  api/
    api-flow.ts          # Backend: Hono sub-app
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

1. **Frontend flows**: React components using react-router-dom Route/Routes, imported through `#gateway/npm/react-router-dom`
2. **Backend flows**: Hono sub-apps
3. **Package flows**: Entry point files that compose public API exports

**KEY PRINCIPLE:**

Flows are **routing/wiring only** - they map paths to responders but contain NO business logic.

**OUTSIDE PACKAGES:**

A flow imports an outside package, type or value, only through its gateway wrapper:
`#gateway/npm/react-router-dom`, `#gateway/npm/hono`. A raw `react-router-dom` or `hono` import is refused.

**FRONTEND PATTERN (React Router):**

```typescript
import { Route } from '#gateway/npm/react-router-dom';

import { AppHomeResponder } from '../../responders/app/home/app-home-responder';

export const HomeFlow = (): React.JSX.Element => <Route path="/" element={<AppHomeResponder />} />;
```

**BACKEND PATTERN (Hono):**

```typescript
import { Hono } from '#gateway/npm/hono';

import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const HealthFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.health.check, (c) =>
    c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );

  return app;
};
```

**TESTING (ESLint Enforced):**

Flows use `.integration.test.ts` (NOT `.test.ts`). This is enforced by ESLint rule
`@dungeonmaster/enforce-implementation-colocation`.

Flows do NOT use `.proxy.ts` files. Integration tests run real code through the full flow → responder → broker → gateway chain.

**TEST EXAMPLE:**

```typescript
// flows/install/install-flow.integration.test.ts
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context: no existing config} => creates .dungeonmaster.json config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'create-config',
      });

      const result = await InstallFlow({
        context: InstallContextStub({
          value: {
            targetProjectRoot: testbed.guildPath,
            dungeonmasterRoot: testbed.dungeonmasterPath,
          },
        }),
      });

      const configContent = testbed.readFile({
        relativePath: '.dungeonmaster.json',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'created',
        message: 'Created .dungeonmaster.json',
      });
      expect(configContent).toMatch(/"framework": "monorepo"/u);
    });
  });
});
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Composes child flows into a complete route tree with shared layout
 *
 * USAGE:
 * <AppFlow />
 * // Renders Routes with AppLayoutResponder wrapping HomeFlow, QueueFlow, QuestChatFlow, and SessionViewFlow
 */
// flows/app/app-flow.tsx (Frontend with React Router)
import { Route, Routes } from '#gateway/npm/react-router-dom';

import { AppLayoutResponder } from '../../responders/app/layout/app-layout-responder';
import { HomeFlow } from '../home/home-flow';
import { QueueFlow } from '../queue/queue-flow';

export const AppFlow = (): React.JSX.Element => (
  <Routes>
    <Route element={<AppLayoutResponder />}>
      {HomeFlow()}
      {QueueFlow()}
    </Route>
  </Routes>
);
```

```typescript
/**
 * PURPOSE: Creates a Hono sub-app with guild routes that delegate to guild responders
 *
 * USAGE:
 * const guildApp = GuildFlow();
 * app.route('', guildApp);
 * // Registers GET /api/guilds and GET /api/guilds/:guildId
 */
// flows/guild/guild-flow.ts (Backend with Hono)
import { Hono } from '#gateway/npm/hono';
import type { ContentfulStatusCode } from '#gateway/npm/hono__utils__http-status';

import { GuildListResponder } from '../../responders/guild/list/guild-list-responder';
import { GuildGetResponder } from '../../responders/guild/get/guild-get-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const GuildFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.guilds.list, async (c) => {
    const result = await GuildListResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildGetResponder({ params: { guildId: c.req.param('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
```
