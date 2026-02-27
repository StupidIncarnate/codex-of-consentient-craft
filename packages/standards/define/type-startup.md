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
- **Integration tests:** Startup and flow files use `.integration.test.ts` files. Startup CAN use colocated `.proxy.ts`
  files for complex setup (spawning processes, managing async clients). All other code uses unit tests (`.test.ts`) with
  proxies.
- **Note:** Entry files (index.tsx, index.js) just import from startup/

**No Branching Logic:**

- Zero `if`, `switch`, or ternary (`? :`) statements allowed in startup files
- No exceptions. If there's a branch, the code belongs in a flow, responder, or broker
- Environment guards (`if (!rootElement)`) move to the flow or responder
- Self-invocation guards (`if (require.main === module)`) move to the entry file (index.ts)

**Import Restrictions:**

- Startup can ONLY import from: `flows/`, `contracts/`, `statics/`, `errors/`
- NO direct imports of: `brokers/`, `adapters/`, `responders/`, `transformers/`, `guards/`, `state/`, `bindings/`,
  `widgets/`
- The delegation chain is: `startup → flows → responders → brokers → adapters`
- Startup mounts the framework and calls flows. Flows route to responders. Responders handle requests.

**Example:**

```tsx
// startup/start-server.ts
import express from 'express';
import {userFlow} from '../flows/user/user-flow';
import {serverPortStatics} from '../statics/server-port/server-port-statics';

export const StartServer = async () => {
    const app = express();
    app.use('/api', userFlow);
    app.listen(serverPortStatics.port);
};
```

**Anti-patterns (DO NOT DO THIS):**

```tsx
// BAD: if-chains in startup
import express from 'express';
import {userFetchBroker} from '../brokers/user/fetch/user-fetch-broker';

export const StartServer = async () => {
    const app = express();
    if (process.env.NODE_ENV === 'production') {  // WRONG: branching in startup
        app.use(helmet());
    }
    app.get('/user', async (req, res) => {        // WRONG: inline callback belongs in a responder
        const user = await userFetchBroker({userId: req.params.id});
        if (!user) {                               // WRONG: more branching
            res.status(404).json({error: 'Not found'});
            return;
        }
        res.json(user);
    });
    app.listen(3000);
};
```

```tsx
// CORRECT: delegate to flows, no branching, no broker imports
import express from 'express';
import {userFlow} from '../flows/user/user-flow';
import {serverPortStatics} from '../statics/server-port/server-port-statics';

export const StartServer = async () => {
    const app = express();
    app.use('/api/user', userFlow);
    app.listen(serverPortStatics.port);
};
// Environment branching lives in the flow or responder.
// Route handlers live in responders. Startup only mounts flows.
```

**IMPORTANT:** The startup/ folder contains bootstrap logic, but tech stacks still need their conventional entry points:

- **Frontend:** `index.html` → `index.tsx` → imports from `startup/start-app.tsx`
- **Backend:** `index.js` → imports from `startup/start-server.ts`
- **Package:** `bin/cli.js` → imports from `startup/start-cli.ts`

The thin entry files just point to startup/ where the real initialization lives.
