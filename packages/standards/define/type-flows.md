# flows/ - Route Definitions

**Purpose:** Route definitions and entry points (maps paths to responders)

**Folder Structure:**

```
flows/
  user/
    user-flow.ts
    user-flow.test.ts       # Unit test with proxy
    user-flow.proxy.ts      # Proxy for mocking dependencies
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-flow.ts` or `-flow.tsx` (e.g., `user-flow.tsx`)
- **Export:** PascalCase ending with `Flow` (e.g., `UserFlow`, `CheckoutFlow`)
- **Tests:** kebab-case ending with `.test.ts` - unit tests with proxy
- **Proxy:** kebab-case ending with `-flow.proxy.ts`, export `[Name]FlowProxy` (e.g., `UserFlowProxy`)
- **Pattern:** flows/[domain]/[domain]-flow.ts(x)

**Constraints:**

- **Frontend:** Use react-router-dom Route/Routes
- **Backend:** Use express.Router
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