**FOLDER STRUCTURE:**

```
responders/
  user/
    get/
      user-get-responder.ts
      user-get-responder.test.ts
      user-get-responder.proxy.ts
    profile/
      user-profile-responder.ts       # Frontend page (.ts — JSX lives in the widget)
      user-profile-responder.test.ts
      user-profile-responder.proxy.ts
  email/
    process-queue/
      email-process-queue-responder.ts
      email-process-queue-responder.test.ts
      email-process-queue-responder.proxy.ts
```

**FOUR TYPES OF RESPONDERS:**

1. **Frontend pages** - Name the widget a route renders. `.ts` only — no JSX
2. **Backend controllers** - Accept `{params}` or `{body}` typed `unknown`, return `{status, data}` for the flow to send
3. **Queue processors** - Process message queue jobs
4. **Scheduled tasks** - Execute on cron/time triggers

**RESPONDERS ARE `.ts`, NEVER `.tsx`:**

`fileSuffix` is `-responder.ts` only — a `-responder.tsx` fails the project-structure
rule. A frontend page responder therefore holds **no JSX**: it names the widget the route
renders, and that widget (`.tsx`) owns the markup, the hooks, and the route-param reads.

```typescript
// responders/user/profile/user-profile-responder.ts
import {UserProfileWidget} from '../../../widgets/user-profile/user-profile-widget';

export const UserProfileResponder = UserProfileWidget;
```

The responder stays a component reference, so a flow renders `<UserProfileResponder />`
exactly as before. When a page needs its own setup before delegating, keep the JSX in a
widget and have the responder call it — never introduce JSX into the `.ts` file.

**GOLDEN RULE:**

**If a route points to it → responder**
**If a component renders it → widget**

```typescript
// flows/user/user-flow.tsx
<Route path="/users/:id" element={<UserProfileResponder />} />
// ↑ Route points to it = RESPONDER

// responders/user/profile/user-profile-responder.ts
export const UserProfileResponder = UserCardWidget;  // ← Component renders it = WIDGET
```

**RESPONDER RESPONSIBILITIES:**

Responders handle **ONLY** these four things:

1. **Input validation/parsing** - Validate external inputs through contracts
2. **Calling brokers** - Orchestrate business logic
3. **Output formatting** - Transform data through transformers
4. **HTTP status codes** - Return the status code beside the data

**NO business logic in responders!** All business logic goes in brokers/.

**ERROR BOUNDARY:**

Responders are the **only valid catch-and-transform site** in the architecture. Catch errors at this boundary and return
appropriate HTTP status codes or error responses. All other layers (brokers and gateway wrappers) should let errors propagate up
to responders.

```typescript
// ✅ CORRECT - Responder with proper responsibilities
export const GuildAddResponder = async ({ body }: { body: unknown }): Promise<ResponderResult> => {
  // 1. Validation
  const parsedBody = guildAddBodyContract.safeParse(body);
  if (!parsedBody.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: responderErrorDataContract.parse({ error: 'name and path are required strings' }),
    });
  }

  // 2. Call the owning package or broker (business logic)
  const { name, path } = parsedBody.data;
  const guild = await StartOrchestrator.addGuild({ name, path });

  // 3. Transform output through the contract, 4. HTTP status code
  return responderResultContract.parse({
    status: httpStatusStatics.success.created,
    data: guildContract.parse(guild),
  });
};

// ❌ WRONG - Business logic in responder
export const UserCreateResponder = async ({ body }: { body: unknown }) => {
  const userData = userCreateContract.parse(body);

  // Business validation in responder!
  if (userData.email.includes('@competitor.com')) {
    return { status: 400, data: { error: 'Competitor emails not allowed' } };
  }

  // Multi-step orchestration in responder!
  const user = await userCreateBroker({ userData });
  if (userData.plan === 'premium') {
    await subscriptionCreateBroker({ userId: user.id });
    await emailSendBroker({ to: user.email, template: 'premium-welcome' });
  }

  return { status: 200, data: user }; // Also wrong - no transformation!
};
```

**DATA TRANSFER PATTERN:**

**Rule:** Never return raw broker data - ALWAYS transform through transformers/ or return specific fields.

```typescript
// ✅ CORRECT - Transform before sending
export const UserGetResponder = async ({ params }: { params: unknown }): Promise<ResponderResult> => {
  const parsedParams = userIdParamsContract.safeParse(params);
  if (!parsedParams.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: responderErrorDataContract.parse({ error: 'userId is required' }),
    });
  }
  const user = await userFetchBroker({ userId: parsedParams.data.userId });
  const userDto = userToDtoTransformer({ user }); // Transform!
  return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: userDto });
};

// ❌ WRONG - Returning raw entity
export const UserGetResponder = async ({ params }: { params: unknown }) => {
  const user = await userFetchBroker({ userId: params.userId as User['id'] }); // a cast is not validation
  return { status: 200, data: user }; // Exposes internal fields like passwordHash, timestamps!
};
```

**Why critical:**

- Raw entities expose internal fields (passwordHash, createdAt, deletedAt)
- Different clients need different shapes (public API vs admin API)
- Transformers provide security boundary and type safety

**BOUNDARY VALIDATION PATTERN:**

ALL inputs from external sources MUST use `unknown` type and validate through contracts.

**External sources requiring validation:**

- HTTP: request bodies, route params, query strings
- React Router: `useParams()`, `useSearchParams()`
- Browser storage: `localStorage`, `sessionStorage`
- Files: `JSON.parse()` results, CSV rows
- Message queues: `job.data`
- CLI: `stdin`, process arguments
- WebSocket: message handlers

**Pattern:**

```typescript
// Backend boundary (responder)
export const GuildAddResponder = async ({ body }: { body: unknown }): Promise<ResponderResult> => {
  const parsedBody = guildAddBodyContract.safeParse(body);
  if (!parsedBody.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: responderErrorDataContract.parse({ error: 'name and path are required strings' }),
    });
  }
  // Use parsedBody.data with full type safety
  const guild = await StartOrchestrator.addGuild({ ...parsedBody.data });
  return responderResultContract.parse({
    status: httpStatusStatics.success.created,
    data: guildContract.parse(guild),
  });
};

// Frontend boundary (React Router) — the WIDGET validates, because the
// responder is JSX-free .ts. The responder just names the widget:
//   responders/user/profile/user-profile-responder.ts
//   export const UserProfileResponder = UserProfileWidget;

// widgets/user-profile/user-profile-widget.tsx
import { useParams } from '#gateway/npm/react-router-dom';

export const UserProfileWidget = (): React.JSX.Element => {
  const params = useParams(); // External source
  const validated = userContract.shape.id.safeParse(params.id);
  if (!validated.success) {
    return <ErrorWidget message="Invalid user ID" />;
  }
  // Use validated.data with full type safety
  const userId = validated.data;
  return <UserCardWidget userId={userId} />;
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

- Without `unknown`, LLMs use the request body directly → injection vulnerabilities
- Without validation, external data bypasses type safety
- `safeParse()` prevents throwing on invalid input (allows error handling)

**TESTING (ESLint Enforced):**

Responders use `.test.ts` with `.proxy.ts` files. This is enforced by ESLint rule
`@dungeonmaster/enforce-implementation-colocation`.

Responders require `.proxy.ts` files (`requireProxy: true` in folder config). Mock only what the I/O trap or MSW catches,
through the gateway wrapper's proxy, and compose the proxy another workspace package ships beside its API
(`StartOrchestratorProxy`). Never `registerMock` a workspace package's export. All business logic runs real in tests.

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Handles guild retrieval requests by validating params and delegating to the orchestrator
 *
 * USAGE:
 * const result = await GuildGetResponder({ params: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: guild } or { status: 400/500, data: { error } }
 */
// responders/guild/get/guild-get-responder.ts (Backend HTTP)
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { guildIdParamsContract } from '../../../contracts/guild-id-params/guild-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const GuildGetResponder = async ({ params }: { params: unknown }): Promise<ResponderResult> => {
  const parsedParams = guildIdParamsContract.safeParse(params);
  if (!parsedParams.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: responderErrorDataContract.parse({ error: 'guildId is required' }),
    });
  }
  const guild = await StartOrchestrator.getGuild({ guildId: parsedParams.data.guildId });
  return responderResultContract.parse({
    status: httpStatusStatics.success.ok,
    data: guildContract.parse(guild),
  });
};

/**
 * PURPOSE: Provides the home page content as a route element
 *
 * USAGE:
 * <Route path="/" element={<AppHomeResponder />} />
 * // Renders the home content with guild selection and session list
 */
// responders/app/home/app-home-responder.ts (Frontend page)
import { HomeContentWidget } from '../../../widgets/home-content/home-content-widget';

export const AppHomeResponder = HomeContentWidget;
```

The widget behind a frontend page holds every hook and all the JSX. Its route-param read is a boundary, so it parses
through the owner contract (see the boundary example above): `userContract.shape.id.safeParse(params.id)`.

```typescript
/**
 * PURPOSE: Processes email queue jobs by sending emails via broker
 *
 * USAGE:
 * queue.process('email', EmailProcessQueueResponder);
 * // Processes each email job from queue
 */
// responders/email/process-queue/email-process-queue-responder.ts (Queue processor, hypothetical domain)
import { emailSendBroker } from '../../../brokers/email/send/email-send-broker';
import { emailContract } from '../../../contracts/email/email-contract';

export const EmailProcessQueueResponder = async ({ job }: { job: { data: unknown } }): Promise<void> => {
  const email = emailContract.parse(job.data);
  await emailSendBroker({ email });
};

/**
 * PURPOSE: Generates daily report on schedule and emails it to admin
 *
 * USAGE:
 * cron.schedule('0 0 * * *', ReportGenerateScheduledResponder);
 * // Runs daily at midnight to generate and email report
 */
// responders/report/generate-scheduled/report-generate-scheduled-responder.ts (Scheduled task, hypothetical domain)
import { reportGenerateBroker } from '../../../brokers/report/generate/report-generate-broker';
import { emailSendBroker } from '../../../brokers/email/send/email-send-broker';

export const ReportGenerateScheduledResponder = async (): Promise<void> => {
  const report = await reportGenerateBroker({ type: 'daily' });
  await emailSendBroker({ email: report.email });
};
```

**TEST EXAMPLE:**

```typescript
// responders/guild/add/guild-add-responder.test.ts
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildAddResponderProxy } from './guild-add-responder.proxy';

describe('GuildAddResponder', () => {
  describe('successful creation', () => {
    it('VALID: {name, path} => returns 201 with guild', async () => {
      const proxy = GuildAddResponderProxy();
      const guild = GuildStub({ name: 'My Guild', path: '/projects/guild' });
      proxy.setupAddGuild({ name: guild.name, path: guild.path, guild });

      const result = await proxy.callResponder({ body: { name: 'My Guild', path: '/projects/guild' } });

      expect(result).toStrictEqual({
        status: 201,
        data: guild,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null body} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {missing name and path} => returns 400 with error', async () => {
      const proxy = GuildAddResponderProxy();

      const result = await proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'name and path are required strings' },
      });
    });
  });
});
```
