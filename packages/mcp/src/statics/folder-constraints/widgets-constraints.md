**FOLDER STRUCTURE:**

```
widgets/
  user-card/
    user-card-widget.tsx
    user-card-widget.proxy.tsx
    user-card-widget.test.tsx
    avatar-layer-widget.tsx        # Layer widget
    avatar-layer-widget.proxy.tsx
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

**ERROR HANDLING:**

- **Widgets consume the `error` field from bindings** and render error states — no try/catch in widgets
- **Event handlers** (onClick, onChange, onSubmit): Log or show user feedback — never silently swallow errors

**PROP TYPES:**

Must export prop types as `[WidgetName]Props`:

```typescript
export type UserCardWidgetProps = {
    userId: User['id'];
    onUpdate?: ({userId}: { userId: User['id'] }) => void;
};

export const UserCardWidget = ({userId, onUpdate}: UserCardWidgetProps): JSX.Element => {
    // ...
};
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

// avatar-layer-widget.proxy.tsx (Layer has own proxy for different dependency)
export const AvatarLayerWidgetProxy = () => {
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
// widgets/user-card/user-card-widget.proxy.tsx
import {screen} from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';
import {useUserDataBindingProxy} from '../../bindings/use-user-data/use-user-data-binding.proxy';
import {UserStub} from '../../contracts/user/user.stub';

type User = ReturnType<typeof UserStub>;

export const UserCardWidgetProxy = () => {
    // Create child binding proxy (which creates entire chain and sets up all mocks)
    const bindingProxy = useUserDataBindingProxy();

    // NO mocking of widget - widget renders real!

    return {
        // Delegate to binding proxy for data setup
        setupUser: ({userId, user}: { userId: User['id']; user: User }) => {
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
import {render, screen} from '#gateway/npm/testing-library__react';
import {UserCardWidget} from './user-card-widget';
import {UserCardWidgetProxy} from './user-card-widget.proxy';
import {UserStub} from '../../contracts/user/user.stub';

describe('UserCardWidget', () => {
    describe('with user data', () => {
        it('VALID: {userId} => renders user name', () => {
            const proxy = UserCardWidgetProxy();
            const user = UserStub({
                id: 'user-123',
                name: 'John Doe',
                email: 'john@example.com',
            });
            const userId = user.id;

            proxy.setupUser({userId, user});

            render({ui: <UserCardWidget userId={userId} />});

            expect(proxy.getUserName()).toBe('John Doe');
        });

        it('VALID: {userId with edit permission} => shows edit button', async () => {
            const proxy = UserCardWidgetProxy();
            const user = UserStub({id: 'user-123', name: 'John Doe'});
            const userId = user.id;

            proxy.setupUser({userId, user});

            render({ui: <UserCardWidget userId={userId} />});

            await proxy.triggerEdit();

            expect(screen.getByTestId('EDIT_MODAL')).toBeInTheDocument();
        });
    });

    describe('loading states', () => {
        it('VALID: {loading} => shows loading indicator', () => {
            const proxy = UserCardWidgetProxy();
            const userId = UserStub({id: 'user-123'}).id;

            proxy.setupLoadingState({userId});

            render({ui: <UserCardWidget userId={userId} />});

            expect(proxy.isLoading()).toBe(true);
        });
    });

    describe('error states', () => {
        it('ERROR: {user not found} => shows error message', () => {
            const proxy = UserCardWidgetProxy();
            const userId = UserStub({id: 'nonexistent'}).id;

            proxy.setupUserNotFound({userId});

            render({ui: <UserCardWidget userId={userId} />});

            expect(proxy.hasError()).toBe(true);
        });
    });
});
```
