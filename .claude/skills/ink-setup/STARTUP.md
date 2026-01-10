# Startup Entry Point

The startup file initializes ink and handles the CLI lifecycle.

## Entry Point Pattern

```typescript
// src/startup/start-my-cli.ts
#!/usr/
bin / env
node

import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {render} from 'ink';
import React from 'react';

import {MyAppWidget} from '../widgets/my-app/my-app-widget';

export const StartMyCli = async (): Promise<void> => {
    const {waitUntilExit} = render(
        React.createElement(MyAppWidget, {
            initialScreen: 'menu',
            onExit: () => process.exit(0),
        }),
    );

    await waitUntilExit();
};

// ESM-compatible entry point detection (handles npm link symlinks)
const resolveRealPath = (path: string): string => {
    try {
        return realpathSync(path);
    } catch {
        return path;
    }
};

const isMain =
    process.argv[1] !== undefined &&
    resolveRealPath(process.argv[1]) === resolveRealPath(fileURLToPath(import.meta.url));

if (isMain) {
    StartMyCli().catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Error: ${errorMessage}\n`);
        process.exit(1);
    });
}
```

## Why realpathSync?

When using `npm link`:

- `process.argv[1]` = symlink path (e.g., `~/.nvm/.../bin/my-cli`)
- `import.meta.url` = real path (e.g., `/projects/my-cli/dist/...`)

Without `realpathSync`, these don't match and `isMain` is false.

## Using React.createElement

In `.ts` files (not `.tsx`), use `React.createElement`:

```typescript
// ✅ In .ts file
React.createElement(MyAppWidget, { onExit: () => {} })

// ❌ JSX only works in .tsx
<MyAppWidget onExit={() => {}} />
```

## Bundling

The build script bundles the startup file:

```bash
npx esbuild dist/startup/start-my-cli.js \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=dist/bin/my-cli.mjs \
  --external:ink \
  --external:react \
  --external:@dungeonmaster/* \
  --external:zod
```

This resolves all internal imports while keeping dependencies external.
