**FOLDER STRUCTURE:**

```
startup/
  start-app.ts                      # Frontend app bootstrap
  start-app.integration.test.ts
  start-server.ts                   # Backend server init
  start-server.integration.test.ts
  start-queue-worker.ts             # Queue processor bootstrap
  start-queue-worker.integration.test.ts
  start-cli.ts                      # CLI entry point
  start-cli.integration.test.ts
```

**CRITICAL CONSTRAINTS:**

- **Folder depth: 0** - Startup files live at root of startup/ (no nesting)
- **Wiring only** - Must NOT contain business logic, only initialization and wiring
- **Restricted imports** - Can only import from `flows/`, `contracts/`, `statics/` and `errors/`. Importing from `brokers/`, `responders/`, `transformers/`, `guards/`, `state/`, `bindings/`, `widgets/` or `middleware/` is forbidden. A startup file imports no outside package: a flow imports it through `#gateway/<folder>/<subpath>` (`#gateway/npm/hono`, `#gateway/node/path`), and the startup file calls the flow.
- **No branching logic** - Zero `if`, `switch`, or ternary operators allowed in startup files. If there's a branch, the code belongs in a flow, responder, or broker.
- **Static constants allowed** - `const PORT = 3000` is fine here
- **Environment loading** - Read environment values in a flow or broker through `getEnv` from `#gateway/node/process`, never `process.env`
- **Queue/scheduler registration** - Wire up responders to queues/cron jobs

**TESTING (ESLint Enforced):**

Startup files use `.integration.test.ts` (NOT `.test.ts`).

**ESLint rule `@dungeonmaster/enforce-implementation-colocation`:**

- Requires `.integration.test.ts` for startup files
- Forbids `.test.ts` (unit tests) for startup files - will cause lint error

```typescript
// startup/start-server.integration.test.ts  ✅ CORRECT
// startup/start-server.test.ts              ❌ WRONG

// guards/is-admin/is-admin-guard.test.ts    ✅ CORRECT (unit test)
// guards/is-admin/is-admin-guard.integration.test.ts  ❌ WRONG
```

**Why?** Startup wires up the entire app - that's integration testing. Everything else is unit tested.

Startup files do NOT use `.proxy.ts` files. This is enforced by ESLint — creating a proxy file for a startup will cause
a lint error.

**ENTRY POINTS PATTERN:**

Startup/ contains bootstrap logic, but conventional entry files still needed:

```
Frontend: index.html → index.tsx → StartApp()
Backend:  index.js → StartServer()
CLI:      bin/cli.js → StartCli()
```

The thin entry files just call startup/ functions.

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Initializes the HTTP server by collecting domain route flows and delegating to ServerFlow
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server with the guild, quest and health endpoints
 */
// startup/start-server.ts
import { GuildFlow } from '../flows/guild/guild-flow';
import { HealthFlow } from '../flows/health/health-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { ServerFlow } from '../flows/server/server-flow';

export const StartServer = ({
  serveWebBundle = false,
}: {
  serveWebBundle?: boolean;
} = {}): void => {
  ServerFlow({
    subApps: [GuildFlow(), QuestFlow(), HealthFlow()],
    serveWebBundle,
  });
};
```

```typescript
/**
 * PURPOSE: Initializes the web application by delegating to the app mount flow
 *
 * USAGE:
 * StartApp();
 * // Mounts React app into #root DOM element
 */
// startup/start-app.ts
import { AppMountFlow } from '../flows/app-mount/app-mount-flow';

export const StartApp = (): void => {
  AppMountFlow();
};
```

```typescript
/**
 * PURPOSE: Initializes the queue worker by delegating to one flow per queue
 *
 * USAGE:
 * StartQueueWorker();
 * // Starts processing the email and report queues
 */
// startup/start-queue-worker.ts (hypothetical: the flows hold the queue library, reached through #gateway/npm/<subpath>)
import { emailProcessQueueFlow } from '../flows/email-process-queue/email-process-queue-flow';
import { reportProcessQueueFlow } from '../flows/report-process-queue/report-process-queue-flow';

export const StartQueueWorker = (): void => {
  emailProcessQueueFlow();
  reportProcessQueueFlow();
};
```

**INTEGRATION TEST EXAMPLE:**

```typescript
// startup/start-install.integration.test.ts
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';
import { StartInstall } from './start-install';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context: no existing config} => delegates to flow and creates config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'startup-delegate',
      });

      const result = await StartInstall({
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

      expect({ success: result.success, action: result.action }).toStrictEqual({
        success: true,
        action: 'created',
      });
      expect(configContent).toMatch(/"framework": "monorepo"/u);
    });
  });
});
```
