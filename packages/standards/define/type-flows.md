# flows/ - Route Definitions

**Purpose:** Route definitions and entry points (maps paths to responders)

**Folder Structure:**

```
flows/
  user/
    user-flow.tsx
    user-flow.integration.test.tsx    # Integration test
  api/
    api-flow.ts
    api-flow.integration.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-flow.ts` or `-flow.tsx` (e.g., `user-flow.tsx`)
- **Export:** PascalCase ending with `Flow` (e.g., `UserFlow`, `CheckoutFlow`)
- **Tests:** kebab-case ending with `.integration.test.ts` (NOT `.test.ts` - these are integration tests)
    - **ESLint enforced:** `@dungeonmaster/enforce-implementation-colocation` requires `.integration.test.ts` and
      forbids
      `.test.ts` for flow files
- **No proxies:** Flows do NOT use `.proxy.ts` files. Flows are routing/wiring only and should be tested as integration.
- **Pattern:** flows/[domain]/[domain]-flow.ts(x)

**Import Rules:**

- Can import from: `responders/`
- Whitelisted npm packages: `hono`, `react-router-dom`, `express` (routing frameworks only)
- Cannot import from: `adapters/`, `brokers/`, `state/`, `transformers/`, `guards/`, `widgets/`, `bindings/`,
  `middleware/`, or any non-whitelisted npm package

**Constraints:**

- **Frontend:** Use react-router-dom Route/Routes
- **Backend:** Use hono or express.Router
- **Package:** Entry files that compose public API

**Example:**

```tsx
// flows/user/user-flow.tsx (Frontend)
import {Route} from 'react-router-dom';
import {UserProfileResponder} from '../../responders/user/profile/user-profile-responder';

export const UserFlow = () => (
    <Route path="/users">
        <Route path=":id" element={<UserProfileResponder/>}/>
    </Route>
);

// flows/user/user-flow.ts (Backend)
import {Router} from 'express';
import {UserGetResponder} from '../../responders/user/get/user-get-responder';

const router = Router();
router.get('/users/:id', async (req, res, next) => {
    try {
        await UserGetResponder({req, res});
    } catch (error) {
        next(error);
    }
});

export const UserFlow = router;
```