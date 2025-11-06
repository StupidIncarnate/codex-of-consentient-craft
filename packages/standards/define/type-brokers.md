# brokers/ - Business Operations

**Purpose:** Business-specific operations using adapters, or orchestrating other brokers

**Folder Structure:**

```
brokers/
  user/
    fetch/
      user-fetch-broker.ts
      user-fetch-broker.proxy.ts       # Setup helper + global mocks
      user-fetch-broker.test.ts
  comment/
    create-process/
      comment-create-process-broker.ts
      comment-create-process-broker.proxy.ts
      comment-create-process-broker.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[domain]-[action]-broker.ts` (e.g., `user-fetch-broker.ts`, `email-send-broker.ts`)
- **Export:** camelCase `[domain][Action]Broker` (e.g., `userFetchBroker`, `emailSendBroker`,
  `commentCreateProcessBroker`)
- **Proxy:** kebab-case ending with `-broker.proxy.ts`, export `[name]BrokerProxy` (e.g., `userFetchBrokerProxy`)
- **Pattern:** brokers/[domain]/[action]/[domain]-[action]-broker.ts

**Constraints:**

- **Two Types:**
    - **Atomic:** Single operations (call one API, query one table)
    - **Orchestration:** Coordinate multiple brokers for workflows
- **Knows** endpoints, database tables, queue names, workflows
- **Max 2 levels:** brokers/[domain]/[action]/ (no deeper nesting)
    - ❌ `brokers/product/inventory/stock/check/`
    - ✅ `brokers/product/check-inventory-stock/`
- **Import patterns:**
    - Same domain: `../create/user-create-broker` (relative)
    - Cross-domain: `../../email/send/email-send-broker` (explicit)

**Example:**

```tsx
/**
 * PURPOSE: Fetches a user by ID from the API
 *
 * USAGE:
 * await userFetchBroker({userId: 'f47ac10b-...'});
 * // Returns validated User object
 */
// brokers/user/fetch/user-fetch-broker.ts (Atomic)
import {axiosGetAdapter} from '../../../adapters/axios/axios-get-adapter';
import type {UserId, User} from '../../../contracts/user/user-contract';
import type {Url} from '../../../contracts/url/url-contract';

export const userFetchBroker = async ({userId}: { userId: UserId }): Promise<User> => {
    const url = `/api/users/${userId}` as Url;
    const response = await axiosGetAdapter({url});
    return userContract.parse(response.data);
};

// brokers/comment/create-process/comment-create-process-broker.ts (Orchestration)
import {commentCreateBroker} from '../create/comment-create-broker';
import {notificationSendBroker} from '../../notification/send/notification-send-broker';
import type {CommentContent, PostId, UserId, Comment} from '../../../contracts';

export const commentCreateProcessBroker = async ({
                                                     content,
                                                     postId,
                                                     userId
                                                 }: {
    content: CommentContent;
    postId: PostId;
    userId: UserId;
}): Promise<Comment> => {
    const comment = await commentCreateBroker({content, postId, userId});
    await notificationSendBroker({
        userId,
        type: 'new_comment',
        data: {commentId: comment.id}
    });
    return comment;
};
```