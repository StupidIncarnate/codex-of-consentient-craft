**FOLDER STRUCTURE:**

```
widgets/
  user-card/
    user-card-widget.tsx
    user-card-widget.proxy.ts
    user-card-widget.test.tsx
    avatar-layer-widget.tsx        # Layer widget
    avatar-layer-widget.proxy.ts
    avatar-layer-widget.test.tsx
```

**CRITICAL REACT RULES:**

```typescript
export const UserCardWidget = ({userId}: Props): JSX.Element => {
    // ✅ CORRECT: Use bindings in render phase
    const {data: user} = useUserDataBinding({userId});

    // ✅ CORRECT: Call brokers in event handlers
    const handleUpdate = async () => {
        await userUpdateBroker({userId, data: user});
    };

    // ❌ WRONG: Cannot use bindings in event handlers
    const handleClick = () => {
        const {data} = useUserDataBinding({userId});  // React error: hooks in callback
    };

    return <button onClick={handleUpdate}>Update</button>;
};
```

**PROP TYPES:**

Must export prop types as `[WidgetName]Props`:

```typescript
export type UserCardWidgetProps = {
    userId: UserId;
    onUpdate?: ({userId}: { userId: UserId }) => void;
};

export const UserCardWidget = ({userId, onUpdate}: UserCardWidgetProps): JSX.Element => {
    // ...
};
```

**COMPLEXITY MANAGEMENT:**

- Keep files under 300 lines
- If exceeding, decompose into layer widgets
- Each layer widget has own proxy and tests

**LAYER DECOMPOSITION:**

Create layer widgets when they:

- Call different bindings than parent
- Have focused rendering responsibility
- Need own proxy for test setup

**LAYER FILE EXAMPLE:**

```typescript
// Parent widget
// widgets/user-card/user-card-widget.tsx
import {AvatarLayerWidget} from './avatar-layer-widget';
import {UserMetaLayerWidget} from './user-meta-layer-widget';

export const UserCardWidget = ({userId}: UserCardWidgetProps) => {
    const {data: user} = useUserDataBinding({userId});  // Parent's binding
    return (
        <div>
            <AvatarLayerWidget userId={userId} />
            <h1>{user.name}</h1>
            <UserMetaLayerWidget userId={userId} />
        </div>
    );
};

// Layer widget with own dependency
// avatar-layer-widget.tsx
export const AvatarLayerWidget = ({userId}: AvatarLayerWidgetProps) => {
    const {data: avatar} = useAvatarDataBinding({userId});  // Different binding!
    return <img src={avatar.url} alt={avatar.alt} />;
};

// Layer has own proxy for different dependency
// avatar-layer-widget.proxy.ts
export const avatarLayerWidgetProxy = () => {
    const avatarBindingProxy = useAvatarDataBindingProxy();
    return {
        setupAvatar: ({userId, avatar}) => {
            avatarBindingProxy.setupAvatar({userId, avatar});
        }
    };
};

// Layer test
// avatar-layer-widget.test.tsx
describe('AvatarLayerWidget', () => {
    it('VALID: {avatar url} => renders avatar image', () => {
        const proxy = avatarLayerWidgetProxy();
        const userId = UserIdStub('user-1');
        const avatar = AvatarStub({url: 'https://example.com/avatar.jpg'});

        proxy.setupAvatar({userId, avatar});
        render(<AvatarLayerWidget userId={userId} />);

        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
});
```

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Displays user card with avatar and metadata using layer widgets
 *
 * USAGE:
 * <UserCardWidget userId={userId} />
 * // Renders user card with avatar and name
 */
// widgets/user-card/user-card-widget.tsx (Parent)
import {AvatarLayerWidget} from './avatar-layer-widget';
import {UserMetaLayerWidget} from './user-meta-layer-widget';

export const UserCardWidget = ({userId}: UserCardWidgetProps) => {
    const {data: user} = useUserDataBinding({userId});  // Parent's binding

    return (
        <div>
            <AvatarLayerWidget userId={userId} />  {/* Layer - different binding */}
            <h1>{user.name}</h1>
            <UserMetaLayerWidget userId={userId} />  {/* Layer - different binding */}
        </div>
    );
};

/**
 * PURPOSE: Layer widget that displays user avatar using avatar binding
 *
 * USAGE:
 * <AvatarLayerWidget userId={userId} />
 * // Renders user avatar image
 */
// avatar-layer-widget.tsx (Layer - calls different broker)
export const AvatarLayerWidget = ({userId}: AvatarLayerWidgetProps) => {
    const {data: avatar} = useAvatarDataBinding({userId});  // Different binding!

    return <img src={avatar.url} alt={avatar.alt} />;
};

// avatar-layer-widget.proxy.ts (Layer has own proxy for different dependency)
export const avatarLayerWidgetProxy = () => {
    const avatarBindingProxy = useAvatarDataBindingProxy();  // Different dependency

    return {
        setupAvatar: ({userId, avatar}) => {
            avatarBindingProxy.setupAvatar({userId, avatar});
        }
    };
};
```

**PROXY PATTERN:**

Widget proxies delegate to child binding proxies and provide UI-specific test helpers.

```typescript
// widgets/user-card/user-card-widget.proxy.ts
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useUserDataBindingProxy} from '../../bindings/use-user-data/use-user-data-binding.proxy';
import {UserStub} from '../../contracts/user/user.stub';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';

type User = ReturnType<typeof UserStub>;
type UserId = ReturnType<typeof UserIdStub>;

export const userCardWidgetProxy = () => {
    // Create child binding proxy (which creates entire chain and sets up all mocks)
    const bindingProxy = useUserDataBindingProxy();

    // NO jest.mocked(widget) - widget renders real!

    return {
        // Delegate to binding proxy for data setup
        setupUser: ({userId, user}: { userId: UserId; user: User }) => {
            bindingProxy.setupUser({userId, user});
        },

        // Widget-specific UI triggers
        triggerEdit: async () => {
            const button = screen.queryByTestId('EDIT_BUTTON');
            if (!button) {
                throw new Error('Edit button not visible');
            }
            await userEvent.click(button);
        },

        triggerDelete: async () => {
            const button = screen.queryByTestId('DELETE_BUTTON');
            if (!button) {
                throw new Error('Delete button not visible');
            }
            await userEvent.click(button);
        },

        // Widget-specific selectors
        isLoading: (): boolean => screen.queryByTestId('LOADING') !== null,
        hasError: (): boolean => screen.queryByTestId('ERROR') !== null,
        getUserName: (): string | null => {
            const element = screen.queryByTestId('USER_NAME');
            return element?.textContent ?? null;
        }
    };
};
```

**Key principles:**

- Delegate to child binding/broker proxies for data setup
- Provide UI-specific helpers (triggers for clicks, selectors for assertions)
- Widget renders REAL - proxy only sets up dependencies and provides test helpers
- Use semantic method names that describe user actions (triggerEdit, not clickButton)

**TEST EXAMPLE:**

```typescript
// widgets/user-card/user-card-widget.test.tsx
import {render, screen} from '@testing-library/react';
import {UserCardWidget} from './user-card-widget';
import {userCardWidgetProxy} from './user-card-widget.proxy';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';
import {UserStub} from '../../contracts/user/user.stub';

type UserId = ReturnType<typeof UserIdStub>;
type User = ReturnType<typeof UserStub>;

describe('UserCardWidget', () => {
    describe('with user data', () => {
        it('VALID: {userId} => renders user name', () => {
            const proxy = userCardWidgetProxy();
            const userId = UserIdStub({value: 'user-123'});
            const user = UserStub({
                id: userId,
                name: 'John Doe',
                email: 'john@example.com',
            });

            proxy.setupUser({userId, user});

            render(<UserCardWidget userId={userId} />);

            expect(proxy.getUserName()).toBe('John Doe');
        });

        it('VALID: {userId with edit permission} => shows edit button', async () => {
            const proxy = userCardWidgetProxy();
            const userId = UserIdStub({value: 'user-123'});
            const user = UserStub({id: userId, name: 'John Doe'});

            proxy.setupUser({userId, user});

            render(<UserCardWidget userId={userId} />);

            await proxy.triggerEdit();

            expect(screen.getByTestId('EDIT_MODAL')).toBeInTheDocument();
        });
    });

    describe('loading states', () => {
        it('VALID: {loading} => shows loading indicator', () => {
            const proxy = userCardWidgetProxy();
            const userId = UserIdStub({value: 'user-123'});

            proxy.setupLoadingState({userId});

            render(<UserCardWidget userId={userId} />);

            expect(proxy.isLoading()).toBe(true);
        });
    });

    describe('error states', () => {
        it('ERROR: {user not found} => shows error message', () => {
            const proxy = userCardWidgetProxy();
            const userId = UserIdStub({value: 'nonexistent'});

            proxy.setupUserNotFound({userId});

            render(<UserCardWidget userId={userId} />);

            expect(proxy.hasError()).toBe(true);
        });
    });
});
```
