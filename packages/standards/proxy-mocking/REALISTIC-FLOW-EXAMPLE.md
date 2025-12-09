# Realistic Flow Example: User Dashboard

**Scenario:** User loads a dashboard that displays their profile with name formatting and edit permissions.

**Flow:** Startup → Flow → Responder → Widget (Dashboard) → Widget (Profile) → Binding → Broker → Transformer + Guard +
Error → Adapter

---

## The Complete Call Chain

```
app-startup
  └─ dashboard-routes-flow
      └─ dashboard-get-responder
          └─ DashboardWidget
              └─ UserProfileWidget
                  └─ use-user-profile-binding
                      └─ user-profile-broker
                          ├─ format-user-name-transformer
                          ├─ has-edit-permission-guard
                          ├─ UserNotFoundError (thrown on error)
                          └─ http-adapter (MOCKED - I/O boundary)
```

---

## 1. HTTP Adapter (I/O Boundary - MOCKED)

### Implementation

```typescript
// adapters/http/http-adapter.ts
import axios from 'axios';
import type {Url} from '../../contracts/url/url-contract';
import type {HttpResponse} from '../../contracts/http-response/http-response-contract';

export const httpAdapter = async ({url, method = 'GET'}: {
    url: Url;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}): Promise<HttpResponse> => {
    const response = await axios({url, method});
    return {
        data: response.data,
        status: response.status,
        statusText: response.statusText
    };
};
```

### Proxy (Mocks NPM Dependency)

```typescript
// adapters/http/http-adapter.proxy.ts
import axios from 'axios';
import type {Url} from '../../contracts/url/url-contract';
import type {HttpResponse} from '../../contracts/http-response/http-response-contract';

// ✅ Mock declared in proxy - automatically hoisted when proxy is imported
jest.mock('axios');

export const createHttpAdapterProxy = () => {
    // ✅ Mock the npm dependency (axios), not the adapter!
    // This lets httpAdapter run REAL in all tests (adapter, broker, widget)
    const mock = jest.mocked(axios);

    // ✅ Setup default mock behavior (runs fresh in each test when proxy is created)
    mock.mockImplementation(async () => ({
        data: {},
        status: 200,
        statusText: 'OK'
    }));

    return {
        returns: ({url, response}: { url: Url; response: HttpResponse }) => {
            // Mock axios to return this response
            mock.mockResolvedValueOnce(response);
        },

        throws: ({url, error}: { url: Url; error: Error }) => {
            // Mock axios to throw this error
            mock.mockRejectedValueOnce(error);
        },

        getCallCount: () => mock.mock.calls.length,

        wasCalledWith: ({url, method}: { url: Url; method?: string }) => {
            return mock.mock.calls.some(call => {
                const callConfig = call[0];
                return callConfig.url === url &&
                    (!method || callConfig.method === method);
            });
        }
    };
};
```

### Test (Uses Adapter Proxy)

```typescript
// adapters/http/http-adapter.test.ts
import {httpAdapter} from './http-adapter';
import {createHttpAdapterProxy} from './http-adapter.proxy';  // jest.mock('axios') hoisted from here
import {UrlStub} from '../../contracts/url/url.stub';

it('VALID: makes GET request', async () => {
    // Create fresh proxy for this test (sets up axios mock)
    const httpProxy = createHttpAdapterProxy();

    const url = UrlStub('https://api.example.com/users/1');

    // Use proxy to setup axios mock
    httpProxy.returns({
        url,
        response: {
            data: {id: '1', name: 'Jane'},
            status: 200,
            statusText: 'OK'
        }
    });

    // Test REAL httpAdapter (with mocked axios via proxy)
    const result = await httpAdapter({url});

    expect(result).toStrictEqual({
        data: {id: '1', name: 'Jane'},
        status: 200,
        statusText: 'OK'
    });
});

it('VALID: makes POST request', async () => {
    // Create fresh proxy for this test
    const httpProxy = createHttpAdapterProxy();

    const url = UrlStub('https://api.example.com/users');

    httpProxy.returns({
        url,
        response: {
            data: {id: '2', name: 'Bob'},
            status: 201,
            statusText: 'Created'
        }
    });

    const result = await httpAdapter({url, method: 'POST'});

    expect(result).toStrictEqual({
        data: {id: '2', name: 'Bob'},
        status: 201,
        statusText: 'Created'
    });
    expect(httpProxy.wasCalledWith({url, method: 'POST'})).toBe(true);
});

it('ERROR: axios throws => throws Network error', async () => {
    // Create fresh proxy for this test
    const httpProxy = createHttpAdapterProxy();

    const url = UrlStub('https://api.example.com/users/999');

    httpProxy.throws({url, error: new Error('Network error')});

    await expect(httpAdapter({url})).rejects.toThrow(/^Network error$/);
});
```

---

## 2. User Not Found Error

### Implementation

```typescript
// errors/user-not-found/user-not-found-error.ts
import type { UserId } from '../../contracts/user-id/user-id-contract';

export class UserNotFoundError extends Error {
    public readonly userId: UserId;

    constructor(userId: UserId) {
        super(`User ${userId} not found`);
        this.name = 'UserNotFoundError';
        this.userId = userId;
    }
}
```

### Test (No Proxy Needed)

```typescript
// errors/user-not-found/user-not-found-error.test.ts
import {UserNotFoundError} from './user-not-found-error';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

it('VALID: {userId: "user-1"} => creates error with message and userId', () => {
    const userId = UserIdStub('user-1');

    const error = new UserNotFoundError(userId);

    expect(error).toStrictEqual(expect.objectContaining({
        message: 'User user-1 not found',
        name: 'UserNotFoundError',
        userId: userId
    }));
    expect(error).toBeInstanceOf(Error);
});
```

---

## 3. Format User Name Transformer (Pure Function - RUNS REAL)

### Implementation

```typescript
// transformers/format-user-name/format-user-name-transformer.ts
import type {User} from '../../contracts/user/user-contract';
import type {DisplayName} from '../../contracts/display-name/display-name-contract';

export const formatUserNameTransformer = ({user, includeTitle}: {
    user: User;
    includeTitle: boolean;
}): DisplayName => {
    const parts: string[] = [];

    if (includeTitle && user.title) {
        parts.push(user.title);
    }

    parts.push(user.firstName);

    if (user.middleName) {
        parts.push(user.middleName);
    }

    parts.push(user.lastName);

    return parts.join(' ') as DisplayName;
};
```

### Proxy (Setup Helper - NO MOCKING)

```typescript
// transformers/format-user-name/format-user-name-transformer.proxy.ts

export const createFormatUserNameTransformerProxy = () => {
    // NO jest.mocked() - transformer runs real!

    return {
        // For rare edge cases where you need to verify calls
        // (Usually not needed for pure functions)
    };
};
```

### Test (No Proxy Needed - Pure Function)

```typescript
// transformers/format-user-name/format-user-name-transformer.test.ts
import {formatUserNameTransformer} from './format-user-name-transformer';
import {UserStub} from '../../contracts/user/user.stub';

it('VALID: {includeTitle: true, user.title: "Dr."} => returns "Dr. Jane Marie Smith"', () => {
    const user = UserStub({
        firstName: 'Jane',
        middleName: 'Marie',
        lastName: 'Smith',
        title: 'Dr.'
    });

    const result = formatUserNameTransformer({user, includeTitle: true});

    expect(result).toMatch(/^Dr\. Jane Marie Smith$/);
});

it('VALID: {includeTitle: false} => returns "Jane Smith"', () => {
    const user = UserStub({
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Dr.'
    });

    const result = formatUserNameTransformer({user, includeTitle: false});

    expect(result).toMatch(/^Jane Smith$/);
});

it('VALID: {middleName: undefined} => returns "Jane Smith"', () => {
    const user = UserStub({
        firstName: 'Jane',
        middleName: undefined,
        lastName: 'Smith'
    });

    const result = formatUserNameTransformer({user, includeTitle: false});

    expect(result).toMatch(/^Jane Smith$/);
});
```

---

## 4. Has Edit Permission Guard (RUNS REAL)

### Implementation

```typescript
// guards/has-edit-permission/has-edit-permission-guard.ts
import type {User} from '../../contracts/user/user-contract';
import type {UserId} from '../../contracts/user-id/user-id-contract';

export const hasEditPermissionGuard = ({currentUser, profileUserId}: {
    currentUser: User;
    profileUserId: UserId;
}): boolean => {
    // User can edit their own profile
    if (currentUser.id === profileUserId) {
        return true;
    }

    // Admins can edit any profile
    if (currentUser.isAdmin) {
        return true;
    }

    return false;
};
```

### Proxy (Setup Helper - NO MOCKING)

```typescript
// guards/has-edit-permission/has-edit-permission-guard.proxy.ts

export const createHasEditPermissionGuardProxy = () => {
    // NO jest.mocked() - guard runs real!

    return {};
};
```

### Test (No Proxy Needed - Pure Function)

```typescript
// guards/has-edit-permission/has-edit-permission-guard.test.ts
import {hasEditPermissionGuard} from './has-edit-permission-guard';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

it('VALID: {currentUser.id === profileUserId} => returns true', () => {
    const userId = UserIdStub('user-1');
    const currentUser = UserStub({id: userId, isAdmin: false});

    const result = hasEditPermissionGuard({currentUser, profileUserId: userId});

    expect(result).toBe(true);
});

it('VALID: {currentUser.isAdmin: true} => returns true', () => {
    const currentUser = UserStub({id: UserIdStub('admin-1'), isAdmin: true});
    const profileUserId = UserIdStub('user-2');

    const result = hasEditPermissionGuard({currentUser, profileUserId});

    expect(result).toBe(true);
});

it('VALID: {different user, isAdmin: false} => returns false', () => {
    const currentUser = UserStub({id: UserIdStub('user-1'), isAdmin: false});
    const profileUserId = UserIdStub('user-2');

    const result = hasEditPermissionGuard({currentUser, profileUserId});

    expect(result).toBe(false);
});
```

---

## 5. User Profile Broker (RUNS REAL)

### Implementation

```typescript
// brokers/user/profile/user-profile-broker.ts
import {httpAdapter} from '../../../adapters/http/http-adapter';
import {formatUserNameTransformer} from '../../../transformers/format-user-name/format-user-name-transformer';
import {hasEditPermissionGuard} from '../../../guards/has-edit-permission/has-edit-permission-guard';
import {UserNotFoundError} from '../../../errors/user-not-found/user-not-found-error';
import {userContract} from '../../../contracts/user/user-contract';
import type {UserId} from '../../../contracts/user-id/user-id-contract';
import type {User} from '../../../contracts/user/user-contract';

export const userProfileBroker = async ({userId, currentUserId}: {
    userId: UserId;
    currentUserId: UserId;
}) => {
    // Fetch user data
    const response = await httpAdapter({
        url: `https://api.example.com/users/${userId}`,
        method: 'GET'
    });

    if (response.status === 404) {
        throw new UserNotFoundError(userId);
    }

    const user = userContract.parse(response.data);

    // Fetch current user for permission check
    const currentUserResponse = await httpAdapter({
        url: `https://api.example.com/users/${currentUserId}`,
        method: 'GET'
    });

    const currentUser = userContract.parse(currentUserResponse.data);

    // Format name
    const displayName = formatUserNameTransformer({
        user,
        includeTitle: user.isPremium
    });

    // Check edit permission
    const canEdit = hasEditPermissionGuard({
        currentUser,
        profileUserId: userId
    });

    return {
        user: {
            ...user,
            displayName
        },
        canEdit
    };
};
```

### Proxy (Setup Helper - Knows URLs)

```typescript
// brokers/user/profile/user-profile-broker.proxy.ts
import { createHttpAdapterProxy } from '../../../adapters/http/http-adapter.proxy';
import type { UserId } from '../../../contracts/user-id/user-id-contract';
import type { User } from '../../../contracts/user/user-contract';

export const createUserProfileBrokerProxy = () => {
    // Create child proxy (which sets up axios mock)
    const httpProxy = createHttpAdapterProxy();

    // NO jest.mocked(broker) - broker runs real!

    return {
        // Semantic setup - encapsulates what "viewing own profile" means
        setupOwnProfile: ({userId, user}: {userId: UserId; user: User}) => {
            const userUrl = UrlStub(`https://api.example.com/users/${userId}`);

            // Broker makes 2 HTTP calls (profile user + current user)
            // When viewing own profile, both calls are to same URL
            // Setup mock to return same user twice
            httpProxy.returns({
                url: userUrl,
                response: {
                    data: user,
                    status: 200,
                    statusText: 'OK'
                }
            });

            // Second call (for current user) - same URL, same user
            httpProxy.returns({
                url: userUrl,
                response: {
                    data: user,
                    status: 200,
                    statusText: 'OK'
                }
            });
        },

        // Semantic setup - viewing someone else's profile
        setupOtherProfile: ({userId, user, currentUserId, currentUser}: {
            userId: UserId;
            user: User;
            currentUserId: UserId;
            currentUser: User;
        }) => {
            const userUrl = UrlStub(`https://api.example.com/users/${userId}`);
            const currentUserUrl = UrlStub(`https://api.example.com/users/${currentUserId}`);

            httpProxy.returns({
                url: userUrl,
                response: {
                    data: user,
                    status: 200,
                    statusText: 'OK'
                }
            });

            httpProxy.returns({
                url: currentUserUrl,
                response: {
                    data: currentUser,
                    status: 200,
                    statusText: 'OK'
                }
            });
        },

        setupUserNotFound: ({userId, currentUserId}: {userId: UserId; currentUserId: UserId}) => {
            const userUrl = UrlStub(`https://api.example.com/users/${userId}`);

            httpProxy.returns({
                url: userUrl,
                response: {
                    data: null,
                    status: 404,
                    statusText: 'Not Found'
                }
            });
        },

        getHttpCallCount: () => httpProxy.getCallCount()
    };
};
```

### Test (Uses Broker Proxy)

```typescript
// brokers/user/profile/user-profile-broker.test.ts
import {userProfileBroker} from './user-profile-broker';
import {createUserProfileBrokerProxy} from './user-profile-broker.proxy';
import {UserStub} from '../../../contracts/user/user.stub';
import {UserIdStub} from '../../../contracts/user-id/user-id.stub';
import {UserNotFoundError} from '../../../errors/user-not-found/user-not-found-error';

it('VALID: {viewing own profile} => returns profile with displayName and canEdit true', async () => {
    // Create fresh proxy for this test (sets up axios mock)
    const brokerProxy = createUserProfileBrokerProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Dr.',
        isPremium: true,
        isAdmin: false
    });

    // Broker proxy encapsulates "own profile" setup
    brokerProxy.setupOwnProfile({userId, user});

    // Real broker runs:
    //   - Mocked HTTP returns user data
    //   - Real transformer formats name
    //   - Real guard checks permission (same user)
    const result = await userProfileBroker({userId, currentUserId: userId});

    expect(result).toStrictEqual({
        user: {
            ...user,
            displayName: 'Dr. Jane Smith'  // Real transformer
        },
        canEdit: true  // Real guard
    });
});

it('VALID: {admin viewing other profile} => returns profile with canEdit true', async () => {
    // Create fresh proxy for this test
    const brokerProxy = createUserProfileBrokerProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({id: userId, firstName: 'Jane', lastName: 'Doe', isPremium: false, isAdmin: false});

    const adminId = UserIdStub('admin-1');
    const admin = UserStub({id: adminId, firstName: 'Admin', lastName: 'User', isPremium: false, isAdmin: true});

    brokerProxy.setupOtherProfile({userId, user, currentUserId: adminId, currentUser: admin});

    const result = await userProfileBroker({userId, currentUserId: adminId});

    expect(result).toStrictEqual({
        user: {
            ...user,
            displayName: 'Jane Doe'  // Real transformer (isPremium false = no title)
        },
        canEdit: true  // Real guard recognizes admin
    });
});

it('VALID: {non-admin viewing other profile} => returns profile with canEdit false', async () => {
    // Create fresh proxy for this test
    const brokerProxy = createUserProfileBrokerProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({id: userId, firstName: 'Jane', lastName: 'Doe', isPremium: false, isAdmin: false});

    const otherUserId = UserIdStub('user-2');
    const otherUser = UserStub({
        id: otherUserId,
        firstName: 'Bob',
        lastName: 'Smith',
        isPremium: false,
        isAdmin: false
    });

    brokerProxy.setupOtherProfile({userId, user, currentUserId: otherUserId, currentUser: otherUser});

    const result = await userProfileBroker({userId, currentUserId: otherUserId});

    expect(result).toStrictEqual({
        user: {
            ...user,
            displayName: 'Jane Doe'
        },
        canEdit: false  // Real guard denies access
    });
});

it('ERROR: {user not found} => throws UserNotFoundError', async () => {
    // Create fresh proxy for this test
    const brokerProxy = createUserProfileBrokerProxy();

    const userId = UserIdStub('user-999');
    const currentUserId = UserIdStub('user-1');

    brokerProxy.setupUserNotFound({userId, currentUserId});

    await expect(userProfileBroker({userId, currentUserId}))
        .rejects
        .toThrow(UserNotFoundError);
});
```

---

## 6. Use User Profile Binding (React Hook - RUNS REAL)

### Implementation

```typescript
// bindings/use-user-profile/use-user-profile-binding.ts
import {useState, useEffect} from 'react';
import {userProfileBroker} from '../../brokers/user/profile/user-profile-broker';
import {UserNotFoundError} from '../../errors/user-not-found/user-not-found-error';
import type {UserId} from '../../contracts/user-id/user-id-contract';

export const useUserProfileBinding = ({userId, currentUserId}: {
    userId: UserId;
    currentUserId: UserId;
}) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);

            try {
                const profile = await userProfileBroker({userId, currentUserId});
                setData(profile);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, currentUserId]);

    return {data, loading, error};
};
```

### Proxy (Setup Helper - Delegates to Broker)

```typescript
// bindings/use-user-profile/use-user-profile-binding.proxy.ts
import {createUserProfileBrokerProxy} from '../../brokers/user/profile/user-profile-broker.proxy';
import type {UserId} from '../../contracts/user-id/user-id-contract';
import type {User} from '../../contracts/user/user-contract';

export const createUseUserProfileBindingProxy = () => {
    // Create child proxy (which creates httpProxy and sets up axios mock)
    const brokerProxy = createUserProfileBrokerProxy();

    // NO jest.mocked(binding) - binding runs real!

    return {
        // Delegate to broker proxy (don't know URLs)
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }) => {
            brokerProxy.setupOwnProfile({userId, user});
        },

        setupOtherProfile: ({userId, user, currentUserId, currentUser}: {
            userId: UserId;
            user: User;
            currentUserId: UserId;
            currentUser: User;
        }) => {
            brokerProxy.setupOtherProfile({userId, user, currentUserId, currentUser});
        },

        setupUserNotFound: ({userId, currentUserId}: { userId: UserId; currentUserId: UserId }) => {
            brokerProxy.setupUserNotFound({userId, currentUserId});
        },

        getBrokerCallCount: () => brokerProxy.getHttpCallCount()
    };
};
```

### Test (Uses Binding Proxy)

```typescript
// bindings/use-user-profile/use-user-profile-binding.test.ts
import {renderHook, waitFor} from '@testing-library/react';
import {useUserProfileBinding} from './use-user-profile-binding';
import {createUseUserProfileBindingProxy} from './use-user-profile-binding.proxy';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

it('VALID: {userId} => fetches profile and sets data', async () => {
    // Create fresh proxy for this test (sets up entire chain: axios mock → broker → binding)
    const bindingProxy = createUseUserProfileBindingProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Dr.',
        isPremium: true
    });

    bindingProxy.setupOwnProfile({userId, user});

    const {result} = renderHook(() =>
        useUserProfileBinding({userId, currentUserId: userId})
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    // Real hook → real broker → real transformer/guard
    expect(result.current).toStrictEqual({
        data: {
            user: {
                ...user,
                displayName: 'Dr. Jane Smith'
            },
            canEdit: true
        },
        loading: false,
        error: null
    });
});

it('ERROR: {user not found} => sets error to UserNotFoundError', async () => {
    // Create fresh proxy for this test
    const bindingProxy = createUseUserProfileBindingProxy();

    const userId = UserIdStub('user-999');
    const currentUserId = UserIdStub('user-1');

    bindingProxy.setupUserNotFound({userId, currentUserId});

    const {result} = renderHook(() =>
        useUserProfileBinding({userId, currentUserId})
    );

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    expect(result.current).toStrictEqual({
        data: null,
        loading: false,
        error: expect.any(UserNotFoundError)
    });
    expect(result.current.error).toBeInstanceOf(UserNotFoundError);
});
```

---

## 7. User Profile Widget (RUNS REAL)

### Implementation

```typescript
// widgets/user-profile/user-profile-widget.tsx
import React from 'react';
import {useUserProfileBinding} from '../../bindings/use-user-profile/use-user-profile-binding';
import type {UserId} from '../../contracts/user-id/user-id-contract';

export const UserProfileWidget = ({userId, currentUserId, onEdit}: {
    userId: UserId;
    currentUserId: UserId;
    onEdit?: () => void;
}) => {
    const {data, loading, error} = useUserProfileBinding({userId, currentUserId});

    if (loading) {
        return <div data - testid = "LOADING" > Loading
        profile
    ...
        </div>;
    }

    if (error) {
        return (
            <div data - testid = "ERROR" >
                <h2>Error < /h2>
                < p > {error.message} < /p>
                < /div>
        );
    }

    if (!data) {
        return <div>No
        profile
        data < /div>;
    }

    return (
        <div data - testid = "USER_PROFILE" >
            <h2>{data.user.displayName} < /h2>
            < p > Email
:
    {
        data.user.email
    }
    </p>
    < p > Role
:
    {
        data.user.isAdmin ? 'Admin' : 'User'
    }
    </p>

    {
        data.canEdit && (
            <button data - testid = "EDIT_BUTTON"
        onClick = {onEdit} >
            Edit
        Profile
        < /button>
    )
    }
    </div>
)
    ;
};
```

### Proxy (Setup Helper + Triggers)

```typescript
// widgets/user-profile/user-profile-widget.proxy.ts
import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createUseUserProfileBindingProxy} from '../../bindings/use-user-profile/use-user-profile-binding.proxy';
import type {UserId} from '../../contracts/user-id/user-id-contract';
import type {User} from '../../contracts/user/user-contract';

export const createUserProfileWidgetProxy = () => {
    // Create child proxy (which creates entire chain and sets up all mocks)
    const bindingProxy = createUseUserProfileBindingProxy();

    // NO jest.mocked(widget) - widget renders real!

    return {
        // Delegate to binding proxy
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }) => {
            bindingProxy.setupOwnProfile({userId, user});
        },

        setupOtherProfile: ({userId, user, currentUserId, currentUser}: {
            userId: UserId;
            user: User;
            currentUserId: UserId;
            currentUser: User;
        }) => {
            bindingProxy.setupOtherProfile({userId, user, currentUserId, currentUser});
        },

        setupUserNotFound: ({userId, currentUserId}: { userId: UserId; currentUserId: UserId }) => {
            bindingProxy.setupUserNotFound({userId, currentUserId});
        },

        // Widget-specific triggers
        triggerEdit: async () => {
            const button = screen.queryByTestId('EDIT_BUTTON');

            if (!button) {
                throw new Error(
                    'Edit button not visible.\n\n' +
                    'Requirements:\n' +
                    '1. User must have edit permission (viewing own profile or is admin)\n' +
                    '2. Profile must be loaded (not loading, no error)'
                );
            }

            await userEvent.click(button);
        },

        // Widget-specific selectors
        isLoading: () => {
            return screen.queryByTestId('LOADING') !== null;
        },

        hasError: () => {
            return screen.queryByTestId('ERROR') !== null;
        },

        getDisplayedName: () => {
            const heading = screen.queryByRole('heading', {level: 2});
            return heading?.textContent || null;
        }
    };
};
```

### Test (Uses Widget Proxy)

```typescript
// widgets/user-profile/user-profile-widget.test.tsx
import {render, screen, waitFor} from '@testing-library/react';
import {UserProfileWidget} from './user-profile-widget';
import {createUserProfileWidgetProxy} from './user-profile-widget.proxy';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';
import {EmailStub} from '../../contracts/email/email.stub';

it('VALID: {own profile} => displays name, email, and edit button', async () => {
    // Create fresh proxy for this test (sets up entire chain)
    const widgetProxy = createUserProfileWidgetProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Dr.',
        email: EmailStub('jane@example.com'),
        isPremium: true,
        isAdmin: false
    });

    widgetProxy.setupOwnProfile({userId, user});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);

    // Real widget → real hook → real broker → real transformer/guard
    await waitFor(() => {
        expect(widgetProxy.isLoading()).toBe(false);
    });

    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent(/^Dr\. Jane Smith$/);
    expect(screen.getByText(/^Email: jane@example\.com$/)).toBeInTheDocument();
    expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
});

it('VALID: {non-admin viewing other profile} => displays name without edit button', async () => {
    // Create fresh proxy for this test
    const widgetProxy = createUserProfileWidgetProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Doe',
        isPremium: false,
        isAdmin: false
    });

    const otherUserId = UserIdStub('user-2');
    const otherUser = UserStub({
        id: otherUserId,
        firstName: 'Bob',
        lastName: 'Smith',
        isPremium: false,
        isAdmin: false
    });

    widgetProxy.setupOtherProfile({userId, user, currentUserId: otherUserId, currentUser: otherUser});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {otherUserId}
    />);

    await waitFor(() => {
        expect(widgetProxy.isLoading()).toBe(false);
    });

    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent(/^Jane Doe$/);
    expect(screen.queryByTestId('EDIT_BUTTON')).not.toBeInTheDocument();
});

it('ERROR: {user not found} => displays error message', async () => {
    // Create fresh proxy for this test
    const widgetProxy = createUserProfileWidgetProxy();

    const userId = UserIdStub('user-999');
    const currentUserId = UserIdStub('user-1');

    widgetProxy.setupUserNotFound({userId, currentUserId});

    render(<UserProfileWidget userId = {userId}
    currentUserId = {currentUserId}
    />);

    await waitFor(() => {
        expect(widgetProxy.hasError()).toBe(true);
    });

    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent(/^Error$/);
    expect(screen.getByText(/^User user-999 not found$/)).toBeInTheDocument();
});
```

---

## 8. Dashboard Widget (Parent - RUNS REAL)

### Implementation

```typescript
// widgets/dashboard/dashboard-widget.tsx
import React, {useState} from 'react';
import {UserProfileWidget} from '../user-profile/user-profile-widget';
import type {UserId} from '../../contracts/user-id/user-id-contract';

export const DashboardWidget = ({currentUserId}: {
    currentUserId: UserId;
}) => {
    const [viewingUserId, setViewingUserId] = useState<UserId>(currentUserId);
    const [lastEdit, setLastEdit] = useState<string | null>(null);

    const handleEditClick = () => {
        setLastEdit(new Date().toISOString());
    };

    return (
        <div data - testid = "DASHBOARD" >
            <h1>Dashboard < /h1>

            < div
    data - testid = "PROFILE_SECTION" >
    <UserProfileWidget
        userId = {viewingUserId}
    currentUserId = {currentUserId}
    onEdit = {handleEditClick}
    />
    < /div>

    {
        lastEdit && (
            <div data - testid = "EDIT_TIMESTAMP" >
                Last
        edit
        at: {
            lastEdit
        }
        </div>
    )
    }
    </div>
)
    ;
};
```

### Proxy (Setup Helper - Delegates to Child)

```typescript
// widgets/dashboard/dashboard-widget.proxy.ts
import {createUserProfileWidgetProxy} from '../user-profile/user-profile-widget.proxy';
import type {UserId} from '../../contracts/user-id/user-id-contract';
import type {User} from '../../contracts/user/user-contract';

export const createDashboardWidgetProxy = () => {
    // Create child proxy (which creates entire chain and sets up all mocks)
    const profileProxy = createUserProfileWidgetProxy();

    // NO jest.mocked(widget) - widget renders real!

    return {
        // Delegate to child proxy (don't know child's details)
        setupOwnProfile: ({userId, user}: { userId: UserId; user: User }) => {
            profileProxy.setupOwnProfile({userId, user});
        },

        // Dashboard-specific triggers (trigger child via proxy)
        triggerProfileEdit: async () => {
            // Use child proxy to trigger - don't know child's testIds!
            await profileProxy.triggerEdit();
        }
    };
};
```

### Test (Uses Dashboard Proxy)

```typescript
// widgets/dashboard/dashboard-widget.test.tsx
import {render, screen, waitFor} from '@testing-library/react';
import {DashboardWidget} from './dashboard-widget';
import {createDashboardWidgetProxy} from './dashboard-widget.proxy';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

it('VALID: {currentUserId} => displays dashboard with user profile', async () => {
    // Create fresh proxy for this test (sets up entire chain)
    const dashboardProxy = createDashboardWidgetProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        isPremium: false
    });

    dashboardProxy.setupOwnProfile({userId, user});

    render(<DashboardWidget currentUserId = {userId}
    />);

    await waitFor(() => {
        expect(screen.queryByTestId('LOADING')).not.toBeInTheDocument();
    });

    // Real dashboard renders real child widget
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(/^Dashboard$/);
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent(/^Jane Smith$/);
});

it('VALID: {clicking edit} => updates dashboard with timestamp', async () => {
    // Create fresh proxy for this test
    const dashboardProxy = createDashboardWidgetProxy();

    const userId = UserIdStub('user-1');
    const user = UserStub({
        id: userId,
        firstName: 'Jane',
        lastName: 'Doe',
        isPremium: false
    });

    dashboardProxy.setupOwnProfile({userId, user});

    render(<DashboardWidget currentUserId = {userId}
    />);

    await waitFor(() => {
        expect(screen.getByTestId('EDIT_BUTTON')).toBeInTheDocument();
    });

    // Trigger child via proxy - don't know child's testIds!
    await dashboardProxy.triggerProfileEdit();

    // Test parent's response
    expect(screen.getByTestId('EDIT_TIMESTAMP')).toBeInTheDocument();
    expect(screen.getByText(/^Last edit at: /)).toBeInTheDocument();
});
```

---

## 9. Dashboard Get Responder (RUNS REAL)

### Implementation

```typescript
// responders/dashboard/get/dashboard-get-responder.ts
import type {Request, Response} from 'express';

export const dashboardGetResponder = async (req: Request, res: Response) => {
    // In a real app, would get userId from session/auth
    const currentUserId = req.session?.userId || 'guest';

    // Return HTML that will render DashboardWidget
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Dashboard</title>
            </head>
            <body>
                <div id="root"></div>
                <script>
                    window.currentUserId = '${currentUserId}';
                </script>
                <script src="/bundle.js"></script>
            </body>
        </html>
    `);
};
```

### Proxy (Setup Helper - No Mocking)

```typescript
// responders/dashboard/get/dashboard-get-responder.proxy.ts

export const createDashboardGetResponderProxy = () => {
    // NO dependencies to setup - just returns HTML

    return {};
};
```

### Test

```typescript
// responders/dashboard/get/dashboard-get-responder.test.ts
import {dashboardGetResponder} from './dashboard-get-responder';
import {createDashboardGetResponderProxy} from './dashboard-get-responder.proxy';
import {UserIdStub} from '../../../contracts/user-id/user-id.stub';

// Export proxy for consistency (even though minimal)
export const responderProxy = createDashboardGetResponderProxy();

it('VALID: {userId in session} => returns dashboard HTML with userId', async () => {
    const userId = UserIdStub('user-1');
    const req = {
        session: {userId}
    } as any;
    const res = {
        send: jest.fn()
    } as any;

    await dashboardGetResponder(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    const htmlResponse = res.send.mock.calls[0][0];
    expect(htmlResponse).toMatch(/Dashboard/);
    expect(htmlResponse).toMatch(new RegExp(userId));
});
```

---

## 10. Dashboard Routes Flow

### Implementation

```typescript
// flows/dashboard-routes/dashboard-routes-flow.ts
import {Router} from 'express';
import {dashboardGetResponder} from '../../responders/dashboard/get/dashboard-get-responder';

export const dashboardRoutesFlow = () => {
    const router = Router();

    router.get('/dashboard', dashboardGetResponder);

    return router;
};
```

### Test (Integration Test)

```typescript
// flows/dashboard-routes/dashboard-routes-flow.test.ts
import request from 'supertest';
import express from 'express';
import {dashboardRoutesFlow} from './dashboard-routes-flow';

it('INTEGRATION: GET /dashboard => returns 200 with dashboard HTML', async () => {
    const app = express();
    app.use(dashboardRoutesFlow());

    const response = await request(app)
        .get('/dashboard')
        .expect(200);

    expect(response.text).toMatch(/Dashboard/);
    expect(response.text).toMatch(/<div id="root">/);
});
```

---

## 11. App Startup

### Implementation

```typescript
// startup/app-startup.ts
import express from 'express';
import session from 'express-session';
import {dashboardRoutesFlow} from '../flows/dashboard-routes/dashboard-routes-flow';

export const appStartup = () => {
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(session({
        secret: 'dev-secret',
        resave: false,
        saveUninitialized: false
    }));

    // Routes
    app.use(dashboardRoutesFlow());

    // Static files
    app.use(express.static('public'));

    return app;
};
```

### Test (Integration Test)

```typescript
// startup/app-startup.test.ts
import request from 'supertest';
import {appStartup} from './app-startup';

it('INTEGRATION: GET /dashboard => returns 200 with dashboard', async () => {
    const app = appStartup();

    const response = await request(app)
        .get('/dashboard')
        .expect(200);

    expect(response.text).toMatch(/Dashboard/);
});

it('INTEGRATION: GET /bundle.js => returns 200 with JavaScript content', async () => {
    const app = appStartup();

    // Assuming bundle.js exists in public/
    const response = await request(app)
        .get('/bundle.js')
        .expect(200);

    expect(response.type).toMatch(/^application\/javascript$/);
});
```

---

## Summary: The Complete Flow

### Proxy Creation Chain (When Test Creates Top-Level Proxy)

```
Test: const dashboardProxy = createDashboardWidgetProxy()
  ↓ creates
profileProxy = createUserProfileWidgetProxy()
  ↓ creates
bindingProxy = createUseUserProfileBindingProxy()
  ↓ creates
brokerProxy = createUserProfileBrokerProxy()
  ↓ creates
httpProxy = createHttpAdapterProxy()
  ↓ sets up axios mock
mock.mockImplementation(() => ({data: {}, status: 200}))

All mocks are now set up! Test can call setup methods.
```

### Setup Chain (Test Setup - Flows UP through Proxies)

```
dashboardProxy.setupOwnProfile({userId, user})
  ↓ delegates to
profileProxy.setupOwnProfile({userId, user})
  ↓ delegates to
bindingProxy.setupOwnProfile({userId, user})
  ↓ delegates to
brokerProxy.setupOwnProfile({userId, user})
  ↓ knows URLs, calls
httpProxy.returns({url, response: { data: user }})
  ↓ actual mock
mock.mockResolvedValueOnce({ data: user })
```

### Execution Chain (Real Code - Flows DOWN)

```
DashboardWidget renders (REAL)
  ↓ renders child
UserProfileWidget renders (REAL)
  ↓ calls hook
useUserProfileBinding executes (REAL - useState/useEffect)
  ↓ calls broker
userProfileBroker runs (REAL - business logic)
  ├─ formatUserNameTransformer runs (REAL - pure function)
  ├─ hasEditPermissionGuard runs (REAL - pure function)
  └─ httpAdapter called (MOCKED - returns test data)
      ↑ ONLY MOCK IN ENTIRE CHAIN
```

### What This Demonstrates

1. **Contract Integrity**: Real code runs together, catches integration issues
2. **Encapsulation**: Each test only knows its direct proxy
3. **Delegation**: Setup flows up through proxy chain
4. **Semantic Helpers**: Proxies provide meaningful setup methods
5. **Error Handling**: Real errors thrown and caught
6. **Pure Functions**: Transformers and guards run real (no mocking)
7. **React Integration**: Real hooks with useState/useEffect
8. **Parent-Child**: Parent triggers child via proxy (hides internals)

### Key Files in Flow

- **11 Layers** tested (adapter → startup)
- **Only 1 mock** (HTTP adapter at I/O boundary)
- **Everything else runs real** (hooks, broker, transformer, guard, error)
- **Proxies are setup helpers** that delegate down the chain
- **Each test creates fresh proxy** (no beforeEach needed!)
- **Proxy creation cascades** (top-level proxy creates entire chain)
- **Mock setup happens in constructors** (runs when proxy is created)

### The Create-Per-Test Pattern

```typescript
it('test', async () => {
    // Create fresh proxy (sets up entire mock chain)
    const widgetProxy = createUserProfileWidgetProxy();

    // Use semantic setup
    widgetProxy.setupOwnProfile({userId, user});

    // Test runs with fresh mocks
    render(<UserProfileWidget userId = {userId}
    currentUserId = {userId}
    />);

    // Assertions...
});
// @dungeonmaster/testing clears mocks after test
```

**Benefits:**

- ✅ No beforeEach/afterEach needed
- ✅ Perfect test isolation (fresh mocks every test)
- ✅ Simpler (one less concept - no bootstrap)
- ✅ Constructor sets up mocks (runs per test)
- ✅ Delegation works automatically

This is a complete, realistic example showing how the entire architecture works together!
