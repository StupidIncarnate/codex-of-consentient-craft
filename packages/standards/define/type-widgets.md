# widgets/ - UI Components

**Purpose:** Display and presentation logic

**Folder Structure:**

```
widgets/
  user-card/
    user-card-widget.tsx
    user-card-widget.proxy.ts   # Setup + triggers + selectors
    user-card-widget.test.tsx
    avatar-widget.tsx
    avatar-widget.proxy.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-widget.tsx` (e.g., `user-card-widget.tsx`, `avatar-widget.tsx`)
- **Export:** PascalCase ending with `Widget` (e.g., `UserCardWidget`, `AvatarWidget`)
- **Proxy:** kebab-case ending with `-widget.proxy.ts`, export `[name]WidgetProxy` (e.g., `userCardWidgetProxy`)
- **Pattern:** widgets/[name]/[name]-widget.tsx

**Constraints:**

- **Must** return JSX.Element
- **Must** export prop types as `[WidgetName]Props` (e.g., `UserCardWidgetProps`)
- **Sub-components:** Live in same folder, no separate folders
- **CAN** use bindings in render phase
- **CAN** use brokers in event handlers
- **CANNOT** use bindings in event handlers (React will error)
- **CAN** use React useState for component-local UI state

**Example:**

```tsx
// widgets/user-card/user-card-widget.tsx
import {useState} from 'react';
import {useUserDataBinding} from '../../bindings/use-user-data/use-user-data-binding';
import {userUpdateBroker} from '../../brokers/user/update/user-update-broker';
import {AvatarWidget} from './avatar-widget';
import type {UserId} from '../../contracts/user/user-contract';

export type UserCardWidgetProps = {
    userId: UserId;
    onUpdate?: ({userId}: { userId: UserId }) => void;
};

export const UserCardWidget = ({userId, onUpdate}: UserCardWidgetProps): JSX.Element => {
    const {data: user, loading, error} = useUserDataBinding({userId});

    const handleUpdate = async (): Promise<void> => {
        if (user) {
            await userUpdateBroker({userId, data: user});
            onUpdate?.({userId});
        }
    };

    if (loading) return <div>Loading</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!user) return <div>No user found </div>;

    return (
        <div>
            <AvatarWidget userId={userId}/>
            <button onClick={handleUpdate}> Update< /button>
        </div>
    );
};
```
