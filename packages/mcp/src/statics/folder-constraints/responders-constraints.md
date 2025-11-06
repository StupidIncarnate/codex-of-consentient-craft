**FOLDER STRUCTURE:**

```
responders/
  user/
    get/
      user-get-responder.ts
      user-get-responder.proxy.ts
      user-get-responder.test.ts
    profile/
      user-profile-responder.tsx      # Frontend page
      user-profile-responder.proxy.ts
      user-profile-responder.test.tsx
  email/
    process-queue/
      email-process-queue-responder.ts
      email-process-queue-responder.proxy.ts
      email-process-queue-responder.test.ts
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
<Route path = "/users/:id"
element = { < UserProfileResponder / >
}
/>
// ↑ Route points to it = RESPONDER

// responders/user/profile/user-profile-responder.tsx
export const UserProfileResponder = (): JSX.Element => {
    return <UserCardWidget user = {user}
    />;  /
    / ← Component renders it = WIDGET
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
        return <ErrorWidget message = "Invalid user ID" / >;
    }
    // Use validated.data with full type safety
    const userId = validated.data;
    return <UserProfileWidget userId = {userId}
    />;
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

// responders/user/profile/user-profile-responder.tsx (Frontend page)
import {useParams} from 'react-router-dom';
import {useUserDataBinding} from '../../../bindings/use-user-data/use-user-data-binding';
import {UserCardWidget} from '../../../widgets/user-card/user-card-widget';
import type {UserId} from '../../../contracts/user/user-contract';

export const UserProfileResponder = (): JSX.Element => {
    const {id} = useParams<{ id: UserId }>();
    const {data: user, loading, error} = useUserDataBinding({userId: id});

    if (loading) return <div>Loading
...
    </div>;
    if (error) return <div>Error
:
    {
        error.message
    }
    </div>;
    if (!user) return <div>User
    not
    found < /div>;

    return <UserCardWidget user = {user}
    />;
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

**PROXY PATTERN:**

Responder proxies delegate to broker proxies. Responder code runs REAL.

```typescript
// responders/user/create/user-create-responder.proxy.ts
import {userCreateBrokerProxy} from '../../../brokers/user/create/user-create-broker.proxy';
import {UserStub} from '../../../contracts/user/user.stub';
import {UserCreateDataStub} from '../../../contracts/user-create-data/user-create-data.stub';

type User = ReturnType<typeof UserStub>;
type UserCreateData = ReturnType<typeof UserCreateDataStub>;

export const userCreateResponderProxy = () => {
    // Delegate to broker proxy
    const brokerProxy = userCreateBrokerProxy();

    // NO jest.mocked(responder) - responder runs real!

    return {
        // Semantic setup - delegate to broker
        setupUserCreate: ({userData, user}: { userData: UserCreateData; user: User }) => {
            brokerProxy.setupUserCreate({userData, user});
        },

        setupDuplicateEmail: ({userData}: { userData: UserCreateData }) => {
            brokerProxy.setupDuplicateEmailError({userData});
        }
    };
};
```

**Key principles:**

- Delegate to broker proxies (which own the full mock chain)
- Responder runs REAL - tests verify request validation and response formatting
- Proxy methods describe scenarios from responder's perspective
- Tests verify HTTP status codes, response shapes, error handling

**TEST EXAMPLE:**

```typescript
// responders/user/create/user-create-responder.test.ts
import {UserCreateResponder} from './user-create-responder';
import {userCreateResponderProxy} from './user-create-responder.proxy';
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
            const proxy = userCreateResponderProxy();
            const userId = UserIdStub({value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'});
            const user = UserStub({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com',
            });
            const req = mockRequest({body: {name: 'John Doe', email: 'john@example.com'}});
            const res = mockResponse();

            proxy.setupUserCreate({
                userData: {name: 'John Doe', email: 'john@example.com'},
                user,
            });

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
            const proxy = userCreateResponderProxy();
            const req = mockRequest({body: {name: 'John Doe', email: 'invalid-email'}});
            const res = mockResponse();

            await UserCreateResponder({req, res});

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringMatching(/Invalid email/u),
            });
        });

        it('INVALID_MULTIPLE: {missing name and email} => returns 400 with error', async () => {
            const proxy = userCreateResponderProxy();
            const req = mockRequest({body: {}});
            const res = mockResponse();

            await UserCreateResponder({req, res});

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringMatching(/required/iu),
            });
        });
    });

    describe('error cases', () => {
        it('ERROR: {duplicate email} => returns 409 with error', async () => {
            const proxy = userCreateResponderProxy();
            const req = mockRequest({body: {name: 'John Doe', email: 'existing@example.com'}});
            const res = mockResponse();

            proxy.setupDuplicateEmail({
                userData: {name: 'John Doe', email: 'existing@example.com'},
            });

            await UserCreateResponder({req, res});

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringMatching(/already exists/iu),
            });
        });
    });
});
```
