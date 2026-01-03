# startup/ - Application Bootstrap

**Purpose:** Application initialization and wiring (no business logic)

**Folder Structure (depending on project type):**

```
startup/
  start-app.tsx                     // Frontend app bootstrap
  start-app.integration.test.tsx    // Integration test - wires up entire app
  start-server.ts                   // Backend server initialization
  start-server.integration.test.ts  // Integration test - wires up entire server
  start-server.proxy.ts             // Proxy if complex setup needed (spawning processes, etc.)
  start-queue-worker.ts             // Queue processor bootstrap
  start-queue-worker.integration.test.ts
  start-scheduler-service.ts        // Scheduled tasks bootstrap
  start-scheduler-service.integration.test.ts
  start-cli.ts                      // CLI entry point
  start-cli.integration.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case starting with `start-` (e.g., `start-server.ts`, `start-app.tsx`, `start-cli.ts`)
- **Export:** PascalCase starting with `Start` (e.g., `StartServer`, `StartApp`, `StartCli`)
- **Tests:** kebab-case ending with `.integration.test.ts` (NOT `.test.ts` - these are integration tests)
  - **ESLint enforced:** `@dungeonmaster/enforce-implementation-colocation` requires `.integration.test.ts` and forbids
    `.test.ts` for startup files
- **Proxies:** kebab-case ending with `.proxy.ts` (e.g., `start-server.proxy.ts`, export `StartServerProxy` in
  PascalCase)
- **Pattern:** startup/start-[name].ts

**Constraints:**

- **Must NOT** contain business logic (only wiring)
- **Static constants:** Can live here (e.g., `const PORT = 3000`)
- **Environment loading:** Happens here
- **Queue/Scheduled registration:** Register responders here
- **Integration tests:** Only startup files have `.integration.test.ts` files. These CAN use colocated `.proxy.ts` files
  for complex setup (spawning processes, managing async clients). All other code uses unit tests (`.test.ts`) with
  proxies.
- **Note:** Entry files (index.tsx, index.js) just import from startup/

**Example:**

```tsx
// startup/start-server.ts
import express from 'express';
import {userFlow} from '../flows/user/user-flow';
import {dbPoolState} from '../state/db-pool/db-pool-state';
import {errorTrackingMiddleware} from '../middleware/error-tracking/error-tracking-middleware';

export const StartServer = async () => {
    const app = express();
    await dbPoolState.init();
    app.use((req, res, next) => errorTrackingMiddleware({req, res, next}));
    app.use('/api', userFlow);
    app.listen(3000);
};
```

**IMPORTANT:** The startup/ folder contains bootstrap logic, but tech stacks still need their conventional entry points:

- **Frontend:** `index.html` → `index.tsx` → imports from `startup/start-app.tsx`
- **Backend:** `index.js` → imports from `startup/start-server.ts`
- **Package:** `bin/cli.js` → imports from `startup/start-cli.ts`

The thin entry files just point to startup/ where the real initialization lives.
