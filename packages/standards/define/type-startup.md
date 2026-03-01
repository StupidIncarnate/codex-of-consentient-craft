# startup/ - Application Bootstrap

**Purpose:** Application initialization and wiring (no business logic)

**Folder Structure (depending on project type):**

```
startup/
  start-app.tsx                     // Frontend app bootstrap
  start-app.integration.test.tsx    // Integration test - wires up entire app
  start-server.ts                   // Backend server initialization
  start-server.integration.test.ts  // Integration test - wires up entire server
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
- **No proxies:** Startup files do NOT use `.proxy.ts` files. ESLint enforced.
- **Pattern:** startup/start-[name].ts

**Constraints:**

- **Must NOT** contain business logic (only wiring)
- **Static constants:** Can live here (e.g., `const PORT = 3000`)
- **Environment loading:** Happens here
- **Queue/Scheduled registration:** Register flows here
- **Integration tests:** Startup and flow files use `.integration.test.ts` files. All other code uses unit tests
  (`.test.ts`) with proxies.
- **Note:** Entry files (index.tsx, index.js) just import from startup/

**No Branching Logic:**

- Zero `if`, `switch`, or ternary (`? :`) statements allowed in startup files
- `try/catch` and logical operators (`&&`, `||`, `??`) ARE allowed
- No exceptions. If there's a branch, the code belongs in a flow, responder, or broker
- Environment guards (`if (!rootElement)`) move to the flow or responder
- Self-invocation guards (`if (require.main === module)`) move to a thin entry file at `{packageRoot}/bin/` (outside
  `src/`, so ESLint folder rules don't apply)
- Auto-start guards (`if (NODE_ENV !== 'test')`) are removed entirely — the caller decides when to invoke

**Import Restrictions:**

- Startup can ONLY import from: `flows/`, `contracts/`, `statics/`, `errors/`
- NO npm packages — not even framework packages like express or hono. Those are accessed through flows (for routing
  frameworks) or through the responder → adapter chain (for everything else)
- NO direct imports of: `brokers/`, `adapters/`, `responders/`, `transformers/`, `guards/`, `state/`, `bindings/`,
  `widgets/`
- The delegation chain is: `startup → flows → responders → brokers → adapters`
- Startup calls flows. Flows route to responders. Responders handle requests.

**Example:**

```tsx
// startup/start-server.ts
import {GuildFlow} from '../flows/guild/guild-flow';
import {QuestFlow} from '../flows/quest/quest-flow';
import {SessionFlow} from '../flows/session/session-flow';
import {HealthFlow} from '../flows/health/health-flow';
import {serverPortStatics} from '../statics/server-port/server-port-statics';

export const StartServer = async (): Promise<void> => {
    await GuildFlow();
    await QuestFlow();
    await SessionFlow();
    await HealthFlow();
};
```

**Anti-patterns (DO NOT DO THIS):**

```tsx
// BAD: npm imports, if-chains, and broker imports in startup
import express from 'express';                                     // WRONG: npm import in startup
import {userFetchBroker} from '../brokers/user/fetch/user-fetch-broker'; // WRONG: broker import

export const StartServer = async () => {
    const app = express();                                         // WRONG: npm usage belongs in adapter
    if (process.env.NODE_ENV === 'production') {                   // WRONG: branching in startup
        app.use(helmet());
    }
    app.get('/user', async (req, res) => {                         // WRONG: inline route belongs in flow+responder
        const user = await userFetchBroker({userId: req.params.id});
        res.json(user);
    });
    app.listen(3000);
};
```

**IMPORTANT:** The startup/ folder contains bootstrap logic, but tech stacks still need their conventional entry points:

- **Frontend:** `index.html` → `index.tsx` → imports from `startup/start-app.tsx`
- **Backend:** `index.js` → imports from `startup/start-server.ts`
- **Package:** `bin/cli.js` → imports from `startup/start-cli.ts`

The thin entry files just point to startup/ where the real initialization lives. Self-invocation guards (`isMain`,
`require.main === module`) belong in these thin entry files, NOT in startup.
