# responders/ - Route Handlers

**Purpose:** Handle requests from flows (HTTP, queue, scheduled, WebSocket)

**Folder Structure:**

```
responders/
  user/
    get/
      user-get-responder.ts
      user-get-responder.integration.test.ts
  email/
    process-queue/
      email-process-queue-responder.ts
      email-process-queue-responder.integration.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[domain]-[action]-responder.ts` (e.g., `user-get-responder.ts`,
  `email-process-queue-responder.ts`)
- **Export:** PascalCase `[Domain][Action]Responder` (e.g., `UserGetResponder`, `EmailProcessQueueResponder`)
- **Tests:** kebab-case ending with `.integration.test.ts` (NOT `.test.ts` - these are integration tests)
  - **ESLint enforced:** `@dungeonmaster/enforce-implementation-colocation` requires `.integration.test.ts` and forbids
    `.test.ts` for responder files
- **No proxies:** Responders do NOT use `.proxy.ts` files. Responders are integration points (they wire brokers to
  request/response boundaries), not isolated units. They should be tested as integration, like startup.
- **Pattern:** responders/[domain]/[action]/[domain]-[action]-responder.ts

**Constraints:**

- **Frontend pages:** Return JSX.Element
- **Backend controllers:** Accept {req, res}, call res methods
- **Queue processors:** Process queue jobs
- **Scheduled tasks:** Execute on time conditions
- **One export per file**
- **If route points to it:** It's a responder, not a widget

**Example:**

```tsx
// responders/user/get/user-get-responder.ts
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

// responders/email/process-queue/email-process-queue-responder.ts (Queue)
import {emailSendBroker} from '../../../brokers/email/send/email-send-broker';
import type {EmailAddress, EmailSubject} from '../../../contracts';

export const EmailProcessQueueResponder = async ({job}: {
    job: { data: { email: EmailAddress; subject: EmailSubject } };
}): Promise<void> => {
    await emailSendBroker({
        to: job.data.email,
        subject: job.data.subject
    });
};
```