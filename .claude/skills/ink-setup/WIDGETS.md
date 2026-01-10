# Widget Patterns

Widgets are React components that use ink adapters for UI rendering. Complex widgets use layer files for screen
decomposition.

## Main Orchestrator Widget

The main app widget manages screen state and routes to layer widgets:

```typescript
// src/widgets/cli-app/cli-app-widget.tsx
/**
 * PURPOSE: Main orchestrator widget for the CLI app managing screen state and navigation
 *
 * USAGE:
 * <CliAppWidget
 *   initialScreen="menu"
 *   onSpawnAgent={({userInput}) => spawnAgent(userInput)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders the appropriate screen based on state and handles navigation
 */
import React from 'react';

import {reactUseStateAdapter} from '../../adapters/react/use-state/react-use-state-adapter';
import {HelpScreenLayerWidget} from './help-screen-layer-widget';
import {MenuScreenLayerWidget} from './menu-screen-layer-widget';

export type CliAppScreen = 'menu' | 'help' | 'list';

export interface CliAppWidgetProps {
    initialScreen: CliAppScreen;
    onExit: () => void;
}

export const CliAppWidget = ({
                                 initialScreen,
                                 onExit,
                             }: CliAppWidgetProps): React.JSX.Element => {
    const [screen, setScreen] = reactUseStateAdapter<CliAppScreen>({
        initialValue: initialScreen,
    });

    if (screen === 'help') {
        return (
            <HelpScreenLayerWidget
                onBack = {()
    =>
        {
            setScreen('menu');
        }
    }
        />
    )
        ;
    }

    // Default: menu screen
    return (
        <MenuScreenLayerWidget
            onSelect = {({option})
=>
    {
        setScreen(option as CliAppScreen);
    }
}
    onExit = {onExit}
    />
)
    ;
};
```

## Screen Layer Widget

Layer widgets handle specific screens with their own input handling:

```typescript
// src/widgets/cli-app/menu-screen-layer-widget.tsx
/**
 * PURPOSE: Displays the main menu with navigation options for the CLI app
 *
 * USAGE:
 * <MenuScreenLayerWidget
 *   onSelect={({option}) => setScreen(option)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders menu with arrow key navigation
 */
import React from 'react';

import {inkBoxAdapter} from '../../adapters/ink/box/ink-box-adapter';
import {inkTextAdapter} from '../../adapters/ink/text/ink-text-adapter';
import {inkUseInputAdapter} from '../../adapters/ink/use-input/ink-use-input-adapter';
import {reactUseStateAdapter} from '../../adapters/react/use-state/react-use-state-adapter';
import {menuIndexContract} from '../../contracts/menu-index/menu-index-contract';
import type {MenuIndex} from '../../contracts/menu-index/menu-index-contract';
import {cliStatics} from '../../statics/cli/cli-statics';

export interface MenuScreenLayerWidgetProps {
    onSelect: ({option}: { option: string }) => void;
    onExit: () => void;
}

export const MenuScreenLayerWidget = ({
                                          onSelect,
                                          onExit,
                                      }: MenuScreenLayerWidgetProps): React.JSX.Element => {
    const Box = inkBoxAdapter();
    const Text = inkTextAdapter();

    const [selectedIndex, setSelectedIndex] = reactUseStateAdapter<MenuIndex>({
        initialValue: menuIndexContract.parse(0),
    });

    const {options} = cliStatics.menu;

    inkUseInputAdapter({
        handler: ({input, key}) => {
            if (key.upArrow) {
                setSelectedIndex((prev) =>
                    menuIndexContract.parse(prev > 0 ? prev - 1 : options.length - 1),
                );
            } else if (key.downArrow) {
                setSelectedIndex((prev) =>
                    menuIndexContract.parse(prev < options.length - 1 ? prev + 1 : 0),
                );
            } else if (key.return) {
                const selectedOption = options[selectedIndex];
                if (selectedOption) {
                    onSelect({option: selectedOption.id});
                }
            } else if (input === 'q' || key.escape) {
                onExit();
            }
        },
    });

    return (
        <Box flexDirection = "column" >
            <Text bold > {cliStatics.meta.name} < /Text>
            < Text > {cliStatics.meta.description} < /Text>
            < Text > </Text>
    {
        options.map((option, index) =>
            index === selectedIndex ? (
                <Text key = {option.id} color = "cyan" >
                {'> '}
        {
            option.label
        }
        -{option.description}
        < /Text>
    ) :
        (
            <Text key = {option.id} >
                {'  '}
        {
            option.label
        }
        -{option.description}
        < /Text>
    ),
    )
    }
    <Text></Text>
    < Text
    dimColor > Use
    arrow
    keys
    to
    navigate, Enter
    to
    select, q
    to
    quit < /Text>
    < /Box>
)
    ;
};
```

## Layer Widget Naming

Layer widgets follow the pattern: `{descriptive-name}-layer-widget.tsx`

- `menu-screen-layer-widget.tsx` - Menu screen UI
- `help-screen-layer-widget.tsx` - Help screen UI
- `add-screen-layer-widget.tsx` - Add/input screen UI

All layer widgets are co-located with the main orchestrator widget in the same folder.

## Key Rules

1. **Get adapters at function start**: `const Box = inkBoxAdapter();`
2. **Use destructured props**: `({ onBack }: Props)`
3. **Explicit return type**: `React.JSX.Element`
4. **Use React.createElement in startup**: Not JSX in `.ts` files
5. **Layer widgets for screens**: Decompose complex widgets with `-layer-widget` suffix
6. **PURPOSE/USAGE comments**: All widgets have metadata headers
7. **Contracts for state**: Use Zod contracts for validated state types

## Widget Proxies

Widget proxies are typically no-ops since widgets render with real ink:

```typescript
// src/widgets/cli-app/cli-app-widget.proxy.ts
/**
 * PURPOSE: Proxy for CliAppWidget - no-op since real ink is used
 *
 * USAGE:
 * cliAppWidgetProxy(); // Sets up nothing - real widget renders
 */
export const cliAppWidgetProxy = (): Record<PropertyKey, never> => ({});
```
