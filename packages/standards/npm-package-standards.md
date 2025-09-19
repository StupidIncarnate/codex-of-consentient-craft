# Npm Package Standards

*Read this document alongside [coding-standards.md](coding-standards.md) for universal development standards.*

**Note**: This document extends universal principles for package development. **All functions we write** (both internal
app code and public API exports) follow the universal object destructuring rule. **Exception**: Only when integrating
with 3rd party libraries that require specific signatures.

## NPM Package Structure

```
src/
  types/              # Type definitions only
    domain-type.ts
    public-api-type.ts
  errors/             # Error classes (one per file)
    package-error.ts
    validation-error.ts
  utils/              # Pure functions (folder pattern - can import: types, other utils)
    data/
      data-util.ts
      data-util-format.ts
      data-util-transform.ts
    validation/
      validation-util.ts
      validation-util-email.ts
      validation-util-phone.ts
  modules/            # Business features (can import: types, utils, errors)
    feature-name/
      feature-name-module.ts # Module file - no index.ts
    core-logic/
      core-logic-module.ts   # Module file - no index.ts
  index.ts            # Package entry point - ONLY index.ts in entire package
```

## Layer Definitions and Responsibilities

### Decision Tree for Classification

```
Is it a CLI executable (#!/usr/bin/env node)?
  → bin/ (or keep in feature-folder/feature-hook.ts)

Is it exported in index.ts (part of public API)?
  → modules/

Is it a reusable tool used by modules?
  → utils/

Is it a type definition?
  → types/

Is it a custom error class?
  → errors/
```

### Layer Details

```
index.ts (single public entry point)
    ↑
bin/ (CLI executables - alternative entry point)
    ↑
modules/ (exported features and orchestrators)
    ↑
components/ (React components, when applicable)
    ↑
utils/ (reusable tools - pure or impure)
    ↑
errors/ (custom error classes)
    ↑
types/ (type definitions only)
```

**Modules**: Feature orchestrators that coordinate workflows

- Exported in index.ts (public API)
- Make business decisions (if/else logic)
- Coordinate multiple utilities
- Example: `PreEditLint` orchestrates linting workflow

**Utils**: Reusable tools that do one specific thing

- NOT exported in index.ts (internal only)
- Single responsibility tools
- Can be pure OR have side effects (file I/O, network, etc.)
- Example: `FileUtil` (file I/O), `LintRunner` (ESLint execution), `ViolationAnalyzer` (data analysis)

**Types**: TypeScript type definitions only (no implementation)

**Errors**: Custom error classes (no side effects beyond construction)

## Real Example: @questmaestro/hooks Package

```
packages/hooks/src/
  bin/
    pre-edit-hook.ts          # CLI executable (#!/usr/bin/env node)

  modules/
    pre-edit-lint/
      pre-edit-lint-module.ts # Orchestrates linting workflow (exported)

  utils/
    file/                     # File operations tool (has I/O - still a util!)
      file-util.ts
    lint-runner/              # ESLint execution tool (has side effects - still a util!)
      lint-runner-util.ts
    violation-analyzer/       # Data analysis tool (pure - also a util!)
      violation-analyzer-util.ts

  types/
    lint-type.ts              # Type definitions

  index.ts                    # Exports: PreEditLint from modules
```

**Why this classification:**

- `pre-edit-hook.ts`: CLI entry point → bin/
- `PreEditLint`: Orchestrates the feature → modules/
- `FileUtil`: Reusable file tool (even with I/O) → utils/
- `LintRunner`: Reusable lint tool (even with side effects) → utils/
- `ViolationAnalyzer`: Reusable analysis tool (pure) → utils/

## React Component Libraries

**When your NPM package includes React components** (Ink, React UI libraries, etc.), add a `components/` directory that
follows frontend principles:

```
src/
  components/         # React components (follow frontend-standards.md)
    InkApp/
      InkApp.tsx      # Component file - no index.ts
    InkDetailView/
      InkDetailView.tsx # Component file - no index.ts
    UserProfile/
      UserProfile.tsx # Component file - no index.ts
  modules/            # Business logic
    cli-runner/
      cli-runner-module.ts   # Module file - no index.ts
    data-processor/
      data-processor-module.ts # Module file - no index.ts
  errors/             # Error classes (one per file)
    package-error.ts
    validation-error.ts
  utils/              # Pure functions (folder pattern)
    string/
      string-util.ts
      string-util-capitalize.ts
      string-util-slugify.ts
  types/              # Type definitions
    component-type.ts
  index.ts            # ONLY index.ts in entire package
```

**Critical Rules:**

- **No nested index.ts files** - Only the package root has index.ts
- **Direct component imports** - `import { InkApp } from './components/InkApp/InkApp'`
- **Components follow frontend standards** - Props types, component patterns, etc.
- **Public API still follows npm-package rules** - Single exports in package index.ts

## Public API Design

### Single Entry Point Pattern

**Critical Rule**: Only `index.ts` should be importable by consumers.

```typescript
// src/index.ts - The ONLY public interface
export {PreEditLint} from './modules/pre-edit-lint/pre-edit-lint-module'
export {LintRunner} from './modules/lint-runner/lint-runner-module'
export type {PreEditLintConfig, LintResult} from './types/public-api-type'

// Do NOT export internal utilities
// Do NOT export implementation details
// Do NOT export module internals

// ✅ Consumer imports (allowed)
import {PreEditLint, type PreEditLintConfig} from 'my-package'

// ❌ Consumer imports (prevent these)
import {formatMessage} from 'my-package/dist/utils/message-formatter'
import {validateConfig} from 'my-package/dist/modules/pre-edit-lint/validators'
```

### Internal vs External Code Organization

**Critical Distinction**: NPM packages have two types of code with different export strategies:

#### Utils (Internal Consumption Only)

**Never exported to consumers** - only used within your package:

```typescript
// src/utils/string/string-util.ts - INTERNAL ONLY (Main export aggregator)
import {capitalize} from './string-util-capitalize';
import {slugify} from './string-util-slugify';
import {truncate} from './string-util-truncate';

export const StringUtil = {
    capitalize,
    slugify,
    truncate
}

// src/utils/validation/validation-util.ts - INTERNAL ONLY (Main export aggregator)
import {isValidEmail} from './validation-util-email';
import {isStrongPassword} from './validation-util-password';

export const ValidationUtil = {
    isValidEmail,
    isStrongPassword
}
```

**Why namespaced exports for utils**: LLM clarity and maintainability within your package.

#### Modules (External Consumption)

**These ARE your public API** - consumed by other projects:

```typescript
// src/modules/user-manager/user-manager-module.ts - EXTERNAL (one export per file)
import {StringUtil} from '../utils/string/string-util'  // ✅ Internal util usage
import {ValidationUtil} from '../utils/validation/validation-util'

export class UserManager {  // ✅ Single export for tree-shaking
    constructor(private config: UserConfig) {
    } // Exception: class constructor signature

    createUser({userData}: { userData: UserData }) {
        const email = StringUtil.slugify({str: userData.email})  // Internal util
        if (!ValidationUtil.isValidEmail({email})) {
            throw new Error('Invalid email')
        }
        // ... implementation
    }
}

// src/modules/data-formatter/data-formatter-module.ts - EXTERNAL (one export per file)
import {StringUtil} from '../utils/string/string-util'

export const formatUserData = ({user}: { user: User }): FormattedUser => {  // ✅ Single export
    return {
        displayName: StringUtil.capitalize({str: user.name}),
        // ... formatting logic
    }
}
```

#### Public API (Entry Point)

**Only modules are exported to consumers**:

```typescript
// src/index.ts - Package entry point
export {UserManager} from './modules/user-manager/user-manager-module'
export {formatUserData} from './modules/data-formatter/data-formatter-module'
export type {UserConfig, UserData} from './types/public-api-type'

// ❌ NEVER export utils
// export { StringUtil } from './utils/string/string-util'  // DON'T DO THIS
```

## Version Management and Breaking Changes

### Semantic Versioning Rules

```typescript
// v1.0.0 - Initial public API
export interface UserConfig {
    apiKey: string
    timeout: number
}

export const createUser = (config: UserConfig): User

// v1.1.0 - MINOR: Add optional property (backward compatible)
export interface UserConfig {
    apiKey: string
    timeout: number
    retries?: number  // ✅ Optional addition
}

// v1.2.0 - MINOR: Add optional parameter (backward compatible)
export const createUser = (
    config: UserConfig,
    options?: { debug?: boolean }  // ✅ Optional parameter
): User

// v2.0.0 - MAJOR: Breaking change (requires version bump)
export interface UserConfig {
    apiKey: string
    timeout: number
    retries: number  // ❌ Required property (breaking)
}

export const createUser = (
    config: UserConfig,
    options: { debug: boolean }  // ❌ Required parameter (breaking)
): User
```

### Deprecation Strategy

```typescript
// v1.5.0 - Deprecate old API
/**
 * @deprecated Use createUserManager() instead. Will be removed in v2.0.0
 */
export const createUser = ({ config }: { config: UserConfig }): User => {
  console.warn('createUser() is deprecated. Use createUserManager() instead.')
  return createUserManager({ config }).getUser()
}

export const createUserManager = ({ config }: { config: UserConfig }): UserManager => {
  // New preferred API
}

// v2.0.0 - Remove deprecated API
// export const createUser() - REMOVED
export const createUserManager = ({ config }: { config: UserConfig }): UserManager => {
  // Only this remains
}
```

## Package Internal Organization

### Module Boundary Enforcement

```typescript
// ✅ CORRECT - Modules are self-contained
// src/modules/auth/auth-module.ts
export { AuthHandler } from './auth-handler'
export type { AuthConfig } from './auth-type'

// src/modules/auth/auth-handler-module.ts
import {ValidationUtil} from '../../utils/validation/validation-util'  // ✅ Shared utility
import { AuthUser } from './types'  // ✅ Internal type

export class AuthHandler {
  // Implementation stays in module
}

// ❌ AVOID - Cross-module dependencies
// src/modules/auth/auth-handler-module.ts
import { UserManager } from '../user-management/user-manager'  // ❌ Module coupling
import { formatUserData } from '../user-management/formatters'  // ❌ Internal import
```

### Shared Code Organization

```typescript
// src/utils/validation/validation-util.ts - Shared across ALL modules (Main export aggregator)
import {isValidEmail} from './validation-util-email';
import {isNonEmpty} from './validation-util-empty';

export const ValidationUtil = {
    isValidEmail,
    isNonEmpty
}

// src/types/ - Shared type definitions
export type Config = {
    apiKey: ApiKey
    timeout: number
}

export type Result<T, E = Error> = {
    success: boolean
    data?: T
    error?: E
}
```

## Package Configuration Patterns

### Flexible Configuration API

```typescript
// types/config-type.ts
export interface PackageConfig {
    // Required core options
    apiKey: string

    // Optional with sensible defaults
    timeout?: number
    retries?: number
    debug?: boolean

    // Plugin system for extensibility
    plugins?: PackagePlugin[]
}

export interface PackagePlugin {
    name: Plugin['name']
    apply: ({context}: { context: PluginContext }) => void
}

// src/index.ts
export const createPackage = ({config}: { config: PackageConfig }): Package => {
    const defaultConfig = {
        timeout: 5000,
        retries: 3,
        debug: false,
        plugins: []
    }

    const finalConfig = {...defaultConfig, ...config}

    return new Package(finalConfig)
}
```

### Error Handling for Packages

```typescript
// errors/package-error.ts
export class PackageError extends Error {
    constructor({
                    message,
                    code,
                    cause
                }: {
        message: Error['message'];
        code: ErrorCode;
        cause?: Error;
    }) {
        super(message)
        this.name = 'PackageError'
        this.code = code
        this.cause = cause
    }
}

// errors/configuration-error.ts
export class ConfigurationError extends PackageError {
    constructor({message, cause}: { message: Error['message']; cause?: Error }) {
        super(message, 'CONFIGURATION_ERROR', cause)
    }
}

// errors/validation-error.ts
export class ValidationError extends PackageError {
    constructor({message, cause}: { message: Error['message']; cause?: Error }) {
        super(message, 'VALIDATION_ERROR', cause)
    }
}

// modules/user-management/user-manager-module.ts
export class UserManager {
    constructor({config}: { config: UserConfig }) {
        if (!config.apiKey) {
            throw new ConfigurationError({message: 'API key is required'})
        }

        if (!ValidationUtil.isValidUrl({url: config.apiUrl})) {
            throw new ValidationError({message: 'Invalid API URL format'})
        }
    }

    async getUser({id}: { id: User['id'] }): Promise<User> {
        try {
            return await this.httpClient.get(`/users/${id}`)
        } catch (error) {
            throw new PackageError({
                message: 'Failed to fetch user',
                code: 'FETCH_ERROR',
                cause: error instanceof Error ? error : new Error(String(error))
            })
        }
    }
}
```

## Package Testing Patterns

### Public API Testing

```typescript
// src/index.test.ts - Test ONLY what consumers can import
import {createPackage, type PackageConfig} from 'my-package' // Import as consumers would

describe('createPackage', () => {
    describe('valid configuration', () => {
        it('VALID: {config: {apiKey: "test-key", timeout: 1000}} => returns package instance', () => {
            const config: PackageConfig = {
                apiKey: 'test-key',
                timeout: 1000
            }

            const result = createPackage({config})

            expect(result).toStrictEqual({
                getUser: expect.any(Function),
                // All expected package methods
            })
        })
    })

    describe('invalid configuration', () => {
        it('INVALID_API_KEY: {config: {}} => throws "API key is required"', () => {
            expect(() => {
                createPackage({config: {} as PackageConfig})
            }).toThrow('API key is required')
        })

        it('EMPTY: {config: null} => throws ConfigurationError', () => {
            expect(() => {
                createPackage({config: null as any})
            }).toThrow('Configuration is required')
        })
    })
})

// ❌ Don't test internal modules directly
// import { UserManager } from '../src/modules/user-management/user-manager'
```

### Internal Module Testing

```typescript
// src/modules/user-manager/user-manager-module.test.ts - Test internal modules directly (when needed)
import { UserManager } from './user-manager-module'
import { UserStub } from '../../test-stubs/user-stub'

describe('UserManager', () => {
  describe('createUser()', () => {
    describe('valid user data', () => {
      it('VALID: {userData: validUserData} => returns created user', async () => {
        const userManager = new UserManager({ config: { apiKey: 'test-key' } })
        const userData = UserStub({ email: 'test@example.com' })

        const result = await userManager.createUser({ userData })

        expect(result).toStrictEqual({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'test@example.com',
          status: 'active'
          // All expected user properties
        })
      })
    })

    describe('validation errors', () => {
      it('INVALID_EMAIL: {userData: {email: "invalid"}} => throws "Invalid email format"', async () => {
        const userManager = new UserManager({ config: { apiKey: 'test-key' } })
        const userData = UserStub({ email: 'invalid' })

        await expect(userManager.createUser({ userData })).rejects.toThrow('Invalid email format')
      })

      it('ERROR: {userData: duplicateEmail} => throws "Email already exists"', async () => {
        const userManager = new UserManager({ config: { apiKey: 'test-key' } })
        const userData = UserStub({ email: 'existing@example.com' })

        await expect(userManager.createUser({ userData })).rejects.toThrow('Email already exists')
      })
    })
  })
})
```

## Dependency Management

### Peer Dependencies vs Dependencies

```json
{
  "dependencies": {
    "zod": "^3.0.0",
    "lodash": "^4.0.0"
  },
  "peerDependencies": {
    "typescript": ">=4.0.0",
    "react": ">=16.8.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.0.0"
  }
}
```

**Rules:**

- `dependencies`: Libraries your package needs to function
- `peerDependencies`: Libraries the consumer's project should provide
- `devDependencies`: Build and test tools (not shipped with package)

### Bundle Size Considerations

**Rule: One export per module file** ensures optimal tree-shaking:

```typescript
// ✅ CORRECT - One export per file
// src/modules/user-manager/user-manager-module.ts
export class UserManager { /* */
}  // Single export

// src/modules/auth-handler/auth-handler-module.ts
export class AuthHandler { /* */
}  // Single export

// src/modules/data-formatter/data-formatter-module.ts
export const formatUserData = ({data}: { data: UserData }) => { /* */
}  // Single export

// src/index.ts - Clean public API
export {UserManager} from './modules/user-manager/user-manager-module'
export {AuthHandler} from './modules/auth-handler/auth-handler-module'
export {formatUserData} from './modules/data-formatter/data-formatter-module'

// Consumer can import only what they need:
import {UserManager} from 'my-package'  // Only UserManager code is bundled

// ❌ AVOID - Multiple exports per file
// src/modules/user-stuff/user-stuff-module.ts
export class UserManager { /* */
}

export class UserValidator { /* */
}

export const formatUser = () => { /* */
}
// Consumer imports "UserManager" but gets all three!

// ❌ AVOID - Barrel exports that prevent tree-shaking
export * from './modules/user-management'
export * from './modules/auth'
// Consumer gets ALL code even if they only use UserManager
```

