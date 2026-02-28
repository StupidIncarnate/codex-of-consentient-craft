**FOLDER STRUCTURE:**

```
startup/
  start-app.tsx                     # Frontend app bootstrap
  start-app.integration.test.tsx
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
- **Restricted imports** - Can only import from `flows/`, `contracts/`, `statics/`, `errors/`, and npm packages. Importing from `brokers/`, `adapters/`, `responders/`, `transformers/`, `guards/`, `state/`, `bindings/`, `widgets/`, or `middleware/` is forbidden.
- **No branching logic** - Zero `if`, `switch`, or ternary operators allowed in startup files. If there's a branch, the code belongs in a flow, responder, or broker.
- **Static constants allowed** - `const PORT = 3000` is fine here
- **Environment loading** - Load .env and configure environment here
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
 * PURPOSE: Initializes Express server with routes and error flow
 *
 * USAGE:
 * await StartServer();
 * // Starts HTTP server on port 3000
 */
// startup/start-server.ts
import express from 'express';
import {userFlow} from '../flows/user/user-flow';
import {authFlow} from '../flows/auth/auth-flow';
import {errorTrackingFlow} from '../flows/error-tracking/error-tracking-flow';

const PORT = 3000;

export const StartServer = async (): Promise<void> => {
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(errorTrackingFlow);

    // Routes
    app.use('/api/users', userFlow);
    app.use('/api/auth', authFlow);

    // Start server
    app.listen(PORT);
};
```

```typescript
/**
 * PURPOSE: Initializes React app with router and providers
 *
 * USAGE:
 * StartApp(); // Called from index.tsx
 * // Renders React app into #root element
 */
// startup/start-app.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {UserFlow} from '../flows/user/user-flow';
import {HomeFlow} from '../flows/home/home-flow';

export const StartApp = (): void => {
    const root = ReactDOM.createRoot(document.getElementById('root')!);

    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomeFlow />} />
                    <Route path="/users/*" element={<UserFlow />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
};
```

```typescript
/**
 * PURPOSE: Initializes queue worker that processes background jobs
 *
 * USAGE:
 * await StartQueueWorker();
 * // Starts processing jobs from Redis queue
 */
// startup/start-queue-worker.ts
import Queue from 'bull';
import {emailQueueNameStatic} from '../statics/email-queue-name/email-queue-name-static';
import {reportQueueNameStatic} from '../statics/report-queue-name/report-queue-name-static';
import {emailProcessQueueFlow} from '../flows/email-process-queue/email-process-queue-flow';
import {reportProcessQueueFlow} from '../flows/report-process-queue/report-process-queue-flow';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const StartQueueWorker = async (): Promise<void> => {
    const emailQueue = new Queue(emailQueueNameStatic, REDIS_URL);
    const reportQueue = new Queue(reportQueueNameStatic, REDIS_URL);

    // Register flows
    emailQueue.process(emailProcessQueueFlow);
    reportQueue.process(reportProcessQueueFlow);
};
```

**INTEGRATION TEST EXAMPLE:**

```typescript
// startup/start-install.integration.test.ts
import {installTestbedCreateBroker, BaseNameStub, RelativePathStub} from '@dungeonmaster/testing';
import {FilePathStub} from '@dungeonmaster/shared/contracts';
import {StartInstall} from './start-install';

describe('StartInstall', () => {
    describe('wiring to install flow', () => {
        it('VALID: {context} => delegates to flow and returns install result with all files created', async () => {
            const testbed = installTestbedCreateBroker({
                baseName: BaseNameStub({value: 'startup-wiring'}),
            });

            const result = await StartInstall({
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
                message: 'Created .claude/commands/ with quest.md and quest:start.md, .claude/agents/ with finalizer-quest-agent.md and quest-gap-reviewer.md',
            });
            expect(questContent).toMatch(/ChaosWhisperer/u);
        });
    });
});
```
