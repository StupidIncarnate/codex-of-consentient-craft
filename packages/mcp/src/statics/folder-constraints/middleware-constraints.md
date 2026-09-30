**FOLDER STRUCTURE:**

```
middleware/
  workspace-package-json-read/
    workspace-package-json-read-middleware.ts
    workspace-package-json-read-middleware.proxy.ts  # Delegates to gateway wrapper proxies
    workspace-package-json-read-middleware.test.ts
  workspace-root-find/
    workspace-root-find-middleware.ts
    workspace-root-find-middleware.proxy.ts
    workspace-root-find-middleware.test.ts
```

**WHAT IS MIDDLEWARE:**

Middleware combines **two or more gateway wrappers** into one infrastructure concern (NOT business logic):

- ✅ Read + validate (check a file exists, read it, parse it)
- ✅ Observability (logging + metrics)
- ✅ Infrastructure concerns (rate limiting + caching)
- ❌ NOT business operations (those are brokers)
- ❌ NOT domain logic (use brokers instead)

**MIDDLEWARE VS BROKERS:**

|              | Middleware                                     | Brokers                                                                 |
|--------------|------------------------------------------------|-------------------------------------------------------------------------|
| **Purpose**  | Infrastructure                                 | Business logic                                                          |
| **Combines** | 2+ gateway wrappers                            | Gateway wrappers, guards, transformers                                  |
| **Examples** | Existence check + read + parse                 | Quest creation, order processing                                        |
| **Imports**  | `#gateway/*`, middleware/, statics/            | brokers/, `#gateway/*`, contracts/, guards/, transformers/              |

An outside package, type or value, is imported only through `#gateway/<kind>/<subpath>`.

**PATTERN:**

Middleware = Compose 2+ gateway wrappers for one infrastructure concern

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Reads and validates one package.json off disk, or null when it does not exist
 * or does not parse as a workspace package.json
 *
 * USAGE:
 * const packageJson = workspacePackageJsonReadMiddleware({packageJsonPath: '/repo/packages/bin/package.json'});
 * // Returns WorkspacePackageJson or null
 */
// middleware/workspace-package-json-read/workspace-package-json-read-middleware.ts
import {existsSync, readFileSync} from '#gateway/node/fs';
import {workspacePackageJsonContract} from '../../contracts/workspace-package-json/workspace-package-json-contract';
import type {WorkspacePackageJson} from '../../contracts/workspace-package-json/workspace-package-json-contract';

export const workspacePackageJsonReadMiddleware = ({packageJsonPath}: {
    packageJsonPath: string;
}): WorkspacePackageJson | null => {
    if (!existsSync(packageJsonPath)) {
        return null;
    }

    const raw = readFileSync(packageJsonPath);
    const parsed = workspacePackageJsonContract.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
};
```

**PROXY PATTERN:**

Middleware proxies delegate to the proxies of the gateway wrappers the middleware calls, each imported from its own
`.proxy` file (`#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy`). Middleware code runs REAL.

```typescript
// middleware/workspace-package-json-read/workspace-package-json-read-middleware.proxy.ts
import {existsSyncProxy} from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import {readFileSyncProxy} from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const workspacePackageJsonReadMiddlewareProxy = () => {
    // Delegate to the wrapper proxies
    const existsProxy = existsSyncProxy();
    const readFileProxy = readFileSyncProxy();

    // NO mocking of middleware - middleware runs real!

    return {
        // Semantic setup stages each wrapper by the path it is called with
        setupPackageJsonAt: ({packageJsonPath, packageJson}: {
            packageJsonPath: string;
            packageJson: Record<PropertyKey, unknown>;
        }) => {
            existsProxy.returns({path: packageJsonPath, exists: true});
            readFileProxy.returns({path: packageJsonPath, contents: JSON.stringify(packageJson)});
        },

        setupMissingAt: ({packageJsonPath}: { packageJsonPath: string }) => {
            existsProxy.returns({path: packageJsonPath, exists: false});
        }
    };
};
```

**Key principles:**

- Delegate to gateway wrapper proxies (which stage what the I/O trap or MSW catches)
- Middleware runs REAL - tests verify the composition
- Proxy methods describe infrastructure scenarios
- Stage each call by its arguments; a function that takes arguments gets no catch-all constructor default
- A failure comes from a wrapper proxy's named scenario or a gateway's recorded-failure stub, never a hand-made `Error`

**TEST EXAMPLE:**

```typescript
// middleware/workspace-package-json-read/workspace-package-json-read-middleware.test.ts
import {workspacePackageJsonReadMiddleware} from './workspace-package-json-read-middleware';
import {workspacePackageJsonReadMiddlewareProxy} from './workspace-package-json-read-middleware.proxy';

describe('workspacePackageJsonReadMiddleware', () => {
    describe('existing, valid package.json', () => {
        it('VALID: {package.json with name + exports} => returns parsed WorkspacePackageJson', () => {
            const proxy = workspacePackageJsonReadMiddlewareProxy();
            const packageJsonPath = '/repo/packages/bin/package.json';
            proxy.setupPackageJsonAt({
                packageJsonPath,
                packageJson: {
                    name: '@dungeonmaster/bin',
                    exports: {'./testing': {source: './testing.ts'}},
                },
            });

            const result = workspacePackageJsonReadMiddleware({packageJsonPath});

            expect(result).toStrictEqual({
                name: '@dungeonmaster/bin',
                exports: {'./testing': {source: './testing.ts'}},
            });
        });
    });

    describe('missing file', () => {
        it('EMPTY: {packageJsonPath does not exist} => returns null', () => {
            const proxy = workspacePackageJsonReadMiddlewareProxy();
            const packageJsonPath = '/repo/packages/ghost/package.json';
            proxy.setupMissingAt({packageJsonPath});

            const result = workspacePackageJsonReadMiddleware({packageJsonPath});

            expect(result).toBe(null);
        });
    });
});
```
