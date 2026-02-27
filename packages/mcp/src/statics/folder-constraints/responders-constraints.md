**FOLDER STRUCTURE:**

```
responders/
  user/
    get/
      user-get-responder.ts
      user-get-responder.integration.test.ts
    profile/
      user-profile-responder.tsx      # Frontend page
      user-profile-responder.integration.test.tsx
  email/
    process-queue/
      email-process-queue-responder.ts
      email-process-queue-responder.integration.test.ts
```

**FOUR TYPES OF RESPONDERS:**

1. **Frontend pages** - Return `JSX.Element`, called from Route components
2. **Backend controllers** - Accept `{req, res}`, call response methods
3. **Queue processors** - Process message queue jobs
4. **Scheduled tasks** - Execute on cron/time triggers

**GOLDEN RULE:**

**If a route points to it → responder**
**If a component renders it → widget**

```typescript
// flows/user/user-flow.tsx
<Route path="/users/:id" element={<UserProfileResponder />} />
// ↑ Route points to it = RESPONDER

// responders/user/profile/user-profile-responder.tsx
export const UserProfileResponder = (): JSX.Element => {
    return <UserCardWidget user={user} />;  // ← Component renders it = WIDGET
};
```

**RESPONDER RESPONSIBILITIES:**

Responders handle **ONLY** these four things:

1. **Input validation/parsing** - Validate external inputs through contracts
2. **Calling brokers** - Orchestrate business logic
3. **Output formatting** - Transform data through transformers
4. **HTTP status codes** - Set appropriate response codes

**NO business logic in responders!** All business logic goes in brokers/.

```typescript
// ✅ CORRECT - Responder with proper responsibilities
export const UserCreateResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    // 1. Validation
    const body: unknown = req.body;
    const validated = userCreateContract.safeParse(body);
    if (!validated.success) {
        return res.status(400).json({error: validated.error});
    }

    // 2. Call broker (business logic)
    const user = await userCreateBroker({userData: validated.data});

    // 3. Transform output
    const userDto = userToDtoTransformer({user});

    // 4. HTTP status code
    res.status(201).json(userDto);
};

// ❌ WRONG - Business logic in responder
export const UserCreateResponder = async ({req, res}) => {
    const userData = userCreateContract.parse(req.body);

    // Business validation in responder!
    if (userData.email.includes('@competitor.com')) {
        return res.status(400).json({error: 'Competitor emails not allowed'});
    }

    // Multi-step orchestration in responder!
    const user = await userCreateBroker({userData});
    if (userData.plan === 'premium') {
        await subscriptionCreateBroker({userId: user.id});
        await emailSendBroker({to: user.email, template: 'premium-welcome'});
    }

    res.json(user);  // Also wrong - no transformation!
};
```

**DATA TRANSFER PATTERN:**

**Rule:** Never return raw broker data - ALWAYS transform through transformers/ or return specific fields.

```typescript
// ✅ CORRECT - Transform before sending
export const UserGetResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    const userId = req.params.id as UserId;
    const user = await userFetchBroker({userId});
    const userDto = userToDtoTransformer({user});  // Transform!
    res.json(userDto);
};

// ❌ WRONG - Returning raw entity
export const UserGetResponder = async ({req, res}) => {
    const user = await userFetchBroker({userId: req.params.id});
    res.json(user);  // Exposes internal fields like passwordHash, timestamps!
};
```

**Why critical:**

- Raw entities expose internal fields (passwordHash, createdAt, deletedAt)
- Different clients need different shapes (public API vs admin API)
- Transformers provide security boundary and type safety

**BOUNDARY VALIDATION PATTERN:**

ALL inputs from external sources MUST use `unknown` type and validate through contracts.

**External sources requiring validation:**

- HTTP: `req.body`, `req.params`, `req.query`
- React Router: `useParams()`, `useSearchParams()`
- Browser storage: `localStorage`, `sessionStorage`
- Files: `JSON.parse()` results, CSV rows
- Message queues: `job.data`
- CLI: `stdin`, process arguments
- WebSocket: message handlers

**Pattern:**

```typescript
// Backend boundary (responder)
export const UserCreateResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    const body: unknown = req.body;  // Explicit unknown
    const validated = userCreateContract.safeParse(body);
    if (!validated.success) {
        return res.status(400).json({error: validated.error});
    }
    // Use validated.data with full type safety
    const user = await userCreateBroker({userData: validated.data});
    res.json(user);
};

// Frontend boundary (React Router)
export const UserProfileResponder = (): JSX.Element => {
    const params = useParams();  // External source
    const validated = userIdContract.safeParse(params.id);
    if (!validated.success) {
        return <ErrorWidget message="Invalid user ID" />;
    }
    // Use validated.data with full type safety
    const userId = validated.data;
    return <UserProfileWidget userId={userId} />;
};

// CLI/Hook boundary
export const HookResponder = async ({input}: { input: unknown }): Promise<Result> => {
    const validated = hookDataContract.safeParse(input);
    if (!validated.success) {
        throw new Error(`Invalid input: ${validated.error}`);
    }
    // Use validated.data with full type safety
    return processHook({data: validated.data});
};
```

**Why critical:**

- Without `unknown`, LLMs use `req.body` directly → injection vulnerabilities
- Without validation, external data bypasses type safety
- `safeParse()` prevents throwing on invalid input (allows error handling)

**TESTING (ESLint Enforced):**

Responders use `.integration.test.ts` (NOT `.test.ts`). This is enforced by ESLint rule `@dungeonmaster/enforce-implementation-colocation`.

Responders do NOT use `.proxy.ts` files.

**LAYER FILE STRUCTURE:**

```
responders/user/create/
  user-create-responder.ts                        # Parent
  user-create-responder.integration.test.ts

  validate-request-layer-responder.ts             # Layer
  validate-request-layer-responder.integration.test.ts
```

**LAYER FILE EXAMPLE:**

```typescript
// Parent responder
// responders/user/create/user-create-responder.ts
import {validateRequestLayerResponder} from './validate-request-layer-responder';
import {processUserCreationLayerResponder} from './process-user-creation-layer-responder';

export const UserCreateResponder = async ({req, res}: ResponderParams) => {
    const userData = validateRequestLayerResponder({req, res});
    if (!userData) return;
    const user = await processUserCreationLayerResponder({userData, res});
    res.status(201).json(user);
};

// Layer implementation - focused responsibility
// validate-request-layer-responder.ts
export const validateRequestLayerResponder = ({req, res}: {
    req: Request;
    res: Response;
}): UserCreateData | undefined => {
    const body: unknown = req.body;
    const validated = userCreateContract.safeParse(body);
    if (!validated.success) {
        res.status(400).json({error: validated.error});
        return undefined;
    }
    return validated.data;
};

// Layer test
// validate-request-layer-responder.integration.test.ts
describe('validateRequestLayerResponder', () => {
    it('VALID: {valid body} => returns parsed data', () => {
        const req = {body: {name: 'John', email: 'john@example.com'}} as Request;
        const res = {status: jest.fn(), json: jest.fn()} as never;

        const result = validateRequestLayerResponder({req, res});

        expect(result).toStrictEqual({name: 'John', email: 'john@example.com'});
    });
});
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Handles GET request for user by ID, returns user data as JSON
 *
 * USAGE:
 * router.get('/users/:id', (req, res) => UserGetResponder({req, res}));
 * // Returns user JSON response
 */
// responders/user/get/user-get-responder.ts (Backend HTTP)
import {userFetchBroker} from '../../../brokers/user/fetch/user-fetch-broker';
import {userToDtoTransformer} from '../../../transformers/user-to-dto/user-to-dto-transformer';
import type {UserId} from '../../../contracts/user/user-contract';
import type {Request, Response} from 'express';

export const UserGetResponder = async ({req, res}: {
    req: Request;
    res: Response;
}): Promise<void> => {
    const userId = req.params.id as UserId;
    const user = await userFetchBroker({userId});
    const userDto = userToDtoTransformer({user});
    res.json(userDto);
};

/**
 * PURPOSE: Renders user profile page with user data from route params
 *
 * USAGE:
 * <Route path="/users/:id" element={<UserProfileResponder />} />
 * // Renders user profile page at /users/:id
 */
// responders/user/profile/user-profile-responder.tsx (Frontend page)
import {useParams} from 'react-router-dom';
import {useUserDataBinding} from '../../../bindings/use-user-data/use-user-data-binding';
import {UserCardWidget} from '../../../widgets/user-card/user-card-widget';
import type {UserId} from '../../../contracts/user/user-contract';

export const UserProfileResponder = (): JSX.Element => {
    const {id} = useParams<{ id: UserId }>();
    const {data: user, loading, error} = useUserDataBinding({userId: id});

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!user) return <div>User not found</div>;

    return <UserCardWidget user={user} />;
};
```

```typescript
/**
 * PURPOSE: Processes email queue jobs by sending emails via broker
 *
 * USAGE:
 * queue.process('email', EmailProcessQueueResponder);
 * // Processes each email job from queue
 */
// responders/email/process-queue/email-process-queue-responder.ts (Queue processor)
import {emailSendBroker} from '../../../brokers/email/send/email-send-broker';
import type {EmailAddress, EmailSubject, EmailBody} from '../../../contracts';

export const EmailProcessQueueResponder = async ({job}: {
    job: {
        data: {
            to: EmailAddress;
            subject: EmailSubject;
            body: EmailBody;
        };
    };
}): Promise<void> => {
    await emailSendBroker({
        to: job.data.to,
        subject: job.data.subject,
        body: job.data.body
    });
};

/**
 * PURPOSE: Generates daily report on schedule and emails it to admin
 *
 * USAGE:
 * cron.schedule('0 0 * * *', ReportGenerateScheduledResponder);
 * // Runs daily at midnight to generate and email report
 */
// responders/report/generate-scheduled/report-generate-scheduled-responder.ts (Scheduled task)
import {reportGenerateBroker} from '../../../brokers/report/generate/report-generate-broker';
import {emailSendBroker} from '../../../brokers/email/send/email-send-broker';
import type {ReportType} from '../../../contracts/report-type/report-type-contract';

export const ReportGenerateScheduledResponder = async (): Promise<void> => {
    const report = await reportGenerateBroker({type: 'daily' as ReportType});
    await emailSendBroker({
        to: 'admin@example.com',
        subject: 'Daily Report',
        body: report
    });
};
```

**TEST EXAMPLE:**

```typescript
// responders/user/create/user-create-responder.integration.test.ts
import {UserCreateResponder} from './user-create-responder';
import {UserStub} from '../../../contracts/user/user.stub';
import {UserIdStub} from '../../../contracts/user-id/user-id.stub';

type User = ReturnType<typeof UserStub>;
type UserId = ReturnType<typeof UserIdStub>;

const mockRequest = ({body}: { body: unknown }) => ({body}) as never;
const mockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    return res as never;
};

describe('UserCreateResponder', () => {
    describe('successful creation', () => {
        it('VALID: {name, email} => returns 201 with user', async () => {
            const userId = UserIdStub({value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'});
            const user = UserStub({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com',
            });
            const req = mockRequest({body: {name: 'John Doe', email: 'john@example.com'}});
            const res = mockResponse();

            await UserCreateResponder({req, res});

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'John Doe',
                email: 'john@example.com',
            });
        });
    });

    describe('validation errors', () => {
        it('INVALID_EMAIL: {invalid email} => returns 400 with error', async () => {
            const req = mockRequest({body: {name: 'John Doe', email: 'invalid-email'}});
            const res = mockResponse();

            await UserCreateResponder({req, res});

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringMatching(/Invalid email/u),
            });
        });

        it('INVALID_MULTIPLE: {missing name and email} => returns 400 with error', async () => {
            const req = mockRequest({body: {}});
            const res = mockResponse();

            await UserCreateResponder({req, res});

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringMatching(/required/iu),
            });
        });
    });
});
```
