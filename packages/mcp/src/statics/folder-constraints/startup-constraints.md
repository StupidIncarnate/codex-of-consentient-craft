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
- **Can import from anywhere** - Only folder with unrestricted imports (it's the top-level orchestrator)
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

**INTEGRATION TEST PROXIES (Startup Only):**

**When complex setup is needed** (spawning processes, creating clients, managing async resources), startup integration
tests can use a colocated proxy:

```typescript
// startup/start-mcp-server.proxy.ts
import {JsonRpcResponseStub} from '../contracts/json-rpc-response/json-rpc-response.stub';
import {McpServerClientStub} from '../contracts/mcp-server-client/mcp-server-client.stub';

type McpServerClient = ReturnType<typeof McpServerClientStub>;
type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;

// Startup folder uses PascalCase for exports
export const StartMcpServerProxy = (): {
    createClient: () => Promise<McpServerClient>;
} => {
    const createClient = async (): Promise<McpServerClient> => {
        // Complex setup: spawn process, setup listeners, etc.
        const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {...});

        // Return contract-compliant object with methods
        return {
            process: serverProcess,
            sendRequest: async (request) => { /* ... */
            },
            close: async () => { /* ... */
            },
        };
    };

    return {createClient};
};
```

**Key principles for integration proxies:**

- Extract types via `ReturnType<typeof Stub>` - never import from contracts
- Service objects with methods (clients, connections) ARE contracts
- Use statics for magic numbers (timeouts, delays)
- Avoid `let` - use const objects with mutable properties: `const state = { value: '' }`
- Proxies CAN have nested functions - the create-per-test pattern requires returning objects with helper methods

**All core testing principles apply:** No hooks, no conditionals, branded types everywhere, types from stubs.

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
 * PURPOSE: Initializes Express server with routes, middleware, and database connection
 *
 * USAGE:
 * await StartServer();
 * // Starts HTTP server on port 3000
 */
// startup/start-server.ts
import express from 'express';
import {userFlow} from '../flows/user/user-flow';
import {authFlow} from '../flows/auth/auth-flow';
import {dbPoolState} from '../state/db-pool/db-pool-state';
import {errorTrackingMiddleware} from '../middleware/error-tracking/error-tracking-middleware';

const PORT = 3000;

export const StartServer = async (): Promise<void> => {
    const app = express();

    // Initialize state
    await dbPoolState.init();

    // Middleware
    app.use(express.json());
    app.use((req, res, next) => errorTrackingMiddleware({req, res, next}));

    // Routes
    app.use('/api/users', userFlow);
    app.use('/api/auth', authFlow);

    // Start server
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
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
import {EmailProcessQueueResponder} from '../responders/email/process-queue/email-process-queue-responder';
import {ReportProcessQueueResponder} from '../responders/report/process-queue/report-process-queue-responder';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const StartQueueWorker = async (): Promise<void> => {
    const emailQueue = new Queue('email', REDIS_URL);
    const reportQueue = new Queue('report', REDIS_URL);

    // Register responders
    emailQueue.process(EmailProcessQueueResponder);
    reportQueue.process(ReportProcessQueueResponder);

    console.log('Queue worker started');
};
```

**INTEGRATION TEST EXAMPLE:**

```typescript
// startup/start-mcp-server.integration.test.ts
import {StartMcpServer} from './start-mcp-server';
import {StartMcpServerProxy} from './start-mcp-server.proxy';
import {JsonRpcRequestStub} from '../contracts/json-rpc-request/json-rpc-request.stub';
import {JsonRpcResponseStub} from '../contracts/json-rpc-response/json-rpc-response.stub';
import {RpcIdStub} from '../contracts/rpc-id/rpc-id.stub';
import {RpcMethodStub} from '../contracts/rpc-method/rpc-method.stub';

type JsonRpcRequest = ReturnType<typeof JsonRpcRequestStub>;
type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;
type RpcId = ReturnType<typeof RpcIdStub>;
type RpcMethod = ReturnType<typeof RpcMethodStub>;

describe('StartMcpServer', () => {
    describe('with valid server startup', () => {
        it('VALID: {} => starts server and responds to tools/list request', async () => {
            const proxy = StartMcpServerProxy();
            const client = await proxy.createClient();

            const requestId = RpcIdStub({value: 1});
            const request = JsonRpcRequestStub({
                id: requestId,
                method: RpcMethodStub({value: 'tools/list'}),
                params: {},
            });

            const response = await client.sendRequest(request);

            expect(response).toStrictEqual(JsonRpcResponseStub({
                id: requestId,
                result: {
                    tools: expect.any(Array),
                },
            }));

            await client.close();
        });

        it('VALID: {method: "tools/call"} => executes tool and returns result', async () => {
            const proxy = StartMcpServerProxy();
            const client = await proxy.createClient();

            const requestId = RpcIdStub({value: 2});
            const request = JsonRpcRequestStub({
                id: requestId,
                method: RpcMethodStub({value: 'tools/call'}),
                params: {name: 'get-architecture', arguments: {}},
            });

            const response = await client.sendRequest(request);

            expect(response).toStrictEqual(JsonRpcResponseStub({
                id: requestId,
                result: {content: expect.any(String)},
            }));

            await client.close();
        });
    });

    describe('with server startup failure', () => {
        it('ERROR: {invalid spawn path} => throws error during client creation', async () => {
            const proxy = StartMcpServerProxy();

            await expect(proxy.createClient()).rejects.toThrow(/spawn.*failed/iu);
        });
    });
});
```
