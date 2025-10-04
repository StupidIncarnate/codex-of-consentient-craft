# Lintable Rules Repository

This document catalogs all deterministic, programmatically enforceable rules from the project standards. Each rule can
be enforced via ESLint (existing or custom rules) using AST/TypeScript type analysis.

**IMPORTANT: All rules apply only to `src/` and its subdirectories. Project root files are exempt from these rules.**

## Global Lintable Rule Categories

### 1. File Naming

- **Rule**: All filenames must use kebab-case
- **AST Check**: Filename pattern matching
- **Violation**: `UserFetchBroker.ts`, `user_fetch_broker.ts`
- **Valid**: `user-fetch-broker.ts`

### 2. Export Patterns

- **Rule**: All functions use `export const` with arrow functions
- **AST Check**: ExportNamedDeclaration → VariableDeclaration → ArrowFunctionExpression
- **Violation**: `export function fetchUser() {}`
- **Valid**: `export const fetchUser = () => {}`

- **Rule**: Never use `export default`
- **AST Check**: ExportDefaultDeclaration presence
- **Violation**: `export default fetchUser`
- **Valid**: `export const fetchUser = () => {}`

- **Rule**: Error classes use `export class` (exception to arrow function rule)
- **AST Check**: ExportNamedDeclaration → ClassDeclaration where class extends Error
- **Violation**: `export const ValidationError = class {}`
- **Valid**: `export class ValidationError extends Error {}`

### 3. Function Signatures

- **Rule**: All app code functions AND class methods (including constructors) must use object destructuring with inline
  types (no positional parameters)
- **AST Check**: FunctionDeclaration/ArrowFunctionExpression/MethodDefinition → parameters must be ObjectPattern with
  typeAnnotation (not multiple Identifiers)
- **Violation**: `const updateUser = (user: User, id: string) => {}` (positional parameters)
- **Violation**: `constructor(message: string, code: number)` (positional parameters in constructor)
- **Valid**: `const updateUser = ({user, id}: {user: User; id: string}) => {}` (object destructuring)
- **Valid**: `constructor({message, code}: {message: string; code: number})` (object destructuring in constructor)
- **Exception**: External API integration functions (e.g., express middleware, React lifecycle methods)

### 4. Type Export Syntax

- **Rule**: Non-index files only use `export type Name = {}`
- **AST Check**: ExportNamedDeclaration with typeAnnotation (not re-export)
- **Violation (in non-index)**: `export type { User } from './user-contract'`
- **Valid (in non-index)**: `export type User = { id: string }`

- **Rule**: index.ts files only re-export with `export type { Name } from './file'`
- **AST Check**: Filename is index.ts → ExportNamedDeclaration with source
- **Violation (in index.ts)**: `export type User = { id: string }`
- **Valid (in index.ts)**: `export type { User } from './user-contract'`

- **Rule**: Never use inline type syntax `export { type Name }`
- **AST Check**: ExportSpecifier with exportKind: 'type' in ExportNamedDeclaration
- **Violation**: `export { type User }`
- **Valid**: `export type { User } from './user-contract'`

### 5. Import Organization

- **Rule**: All imports at top of file (no inline/dynamic imports except lazy loading)
- **AST Check**: ImportDeclaration position in program body
- **Violation**: Code statements before import statements
- **Valid**: All ImportDeclarations before other statements

- **Rule**: Use ES6 imports over require()
- **AST Check**: CallExpression with callee.name === 'require'
- **Violation**: `const foo = require('./foo')`
- **Valid**: `import {foo} from './foo'`

### 6. Type Safety

- **Rule**: No `any` type usage
- **AST Check**: TSAnyKeyword presence
- **Violation**: `const data: any = {}`
- **Valid**: `const data: unknown = {}`

- **Rule**: No `@ts-ignore` or `@ts-expect-error` comments
- **AST Check**: Comment text matching
- **Violation**: `// @ts-ignore`
- **Valid**: Proper type definitions

- **Rule**: No ESLint disable comments
- **AST Check**: Comment text matching `eslint-disable`
- **Violation**: `/* eslint-disable */`
- **Valid**: Fix the code instead

### 7. Single Responsibility

- **Rule**: Each file contains exactly one primary export
- **AST Check**: Count of ExportNamedDeclaration (excluding types/interfaces)
- **Violation**: Multiple `export const` functions
- **Valid**: One `export const` function + supporting `export type` definitions

### 8. File Extensions

- **Rule**: Use `.tsx` only when file contains JSX
- **AST Check**: JSXElement/JSXFragment presence
- **Violation**: `.tsx` file with no JSX elements
- **Valid**: `.ts` for non-JSX, `.tsx` for JSX

### 9. Promise Handling

- **Rule**: Always use async/await over .then() chains
- **AST Check**: MemberExpression with property.name === 'then' on Promise type
- **Violation**: `promise.then().catch()`
- **Valid**: `await promise`

### 10. Performance Patterns

- **Rule**: Remove console.log statements
- **AST Check**: CallExpression → MemberExpression where object.name === 'console'
- **Violation**: `console.log('debug')`
- **Valid**: Proper logging through adapters

### 11. Error Handling

- **Rule**: No empty catch blocks (must throw, log, or return with context)
- **AST Check**: CatchClause → BlockStatement with no statements or only comments
- **Violation**: `catch (error) {}` or `catch (error) { /* ignore */ }`
- **Valid**: `catch (error) { throw new Error(\`Failed: \${error}\`) }`

- **Rule**: No .catch() chains (use try/catch with async/await instead)
- **AST Check**: MemberExpression with property.name === 'catch' on Promise type
- **Violation**: `promise.catch(err => {})`
- **Valid**: `try { await promise } catch (error) { }`

### 12. Test File Naming

- **Rule**: Test files must end with `.test.ts` or `.test.tsx`
- **AST Check**: Test files filename pattern `^.*\.test\.(ts|tsx)$`
- **Violation**: `user-contract.spec.ts`, `user.tests.ts`
- **Valid**: `user-contract.test.ts`

### 13. TypeScript Only

- **Rule**: No JavaScript files allowed in src/ - only TypeScript (.ts, .tsx)
- **AST Check**: File extension must be .ts or .tsx (not .js, .jsx, .mjs, .cjs) within src/
- **Violation**: `src/brokers/user-fetch-broker.js`, `src/widgets/user-card-widget.jsx`
- **Valid**: `src/brokers/user-fetch-broker.ts`, `src/widgets/user-card-widget.tsx`
- **Note**: Project root files (.js config files, etc.) are not affected by this rule

### 14. Explicit Async Functions

- **Rule**: Functions that return Promises must be explicitly marked `async`
- **AST Check**: If function returns a Promise type (or calls that return Promise without await), must have `async`
  keyword
- **Violation**: `export const fetchUser = () => { return axios.get('/user'); }` (returns Promise but not async)
- **Violation**: `export const fetchUser = (): Promise<User> => { return userBroker(); }` (Promise return type but not
  async)
- **Valid**: `export const fetchUser = async () => { return await axios.get('/user'); }`
- **Valid**: `export const fetchUser = async (): Promise<User> => { return userBroker(); }`
- **Note**: Enforces explicit async marking for better code clarity and prevents implicit async patterns

---

## Folder-Specific Lintable Rules

### statics/ - Immutable Values

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-statics.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-statics\.ts$`
- **Violation**: `user.ts`, `UserStatics.ts`, `user-static.ts`
- **Valid**: `user-statics.ts`, `eslint-statics.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `statics/[name]/[name]-statics.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `statics/user-statics.ts` (missing folder)
- **Valid**: `statics/user/user-statics.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase ending with `Statics`
- **AST Check**: ExportNamedDeclaration → VariableDeclarator → name pattern `^[a-z][a-zA-Z0-9]*Statics$`
- **Violation**: `export const user = {}`, `export const USER_STATICS = {}`
- **Valid**: `export const userStatics = {}`

**4. Single Export Per File**

- **Rule**: Each file must export exactly one object ending with `Statics`
- **AST Check**: Count ExportNamedDeclarations (excluding types) - must equal 1
- **Violation**: Multiple `export const` statements
- **Valid**: Single `export const userStatics = {} as const`

**5. Root Object Structure**

- **Rule**: Root object must contain only objects or arrays (no primitives at root level)
- **AST Check**: Object expression properties must all be ObjectExpression or ArrayExpression
- **Violation**: `export const userStatics = { maxAge: 100 } as const` (primitive at root)
- **Valid**: `export const userStatics = { limits: { maxAge: 100 } } as const`

**6. Must Use `as const`**

- **Rule**: Static exports must use `as const` assertion
- **AST Check**: VariableDeclarator with `as const` assertion
- **Violation**: `export const userStatics = { ... }`
- **Valid**: `export const userStatics = { ... } as const`

**7. No Imports Allowed**

- **Rule**: statics/ cannot import anything (foundational layer)
- **AST Check**: ImportDeclaration presence
- **Violation**: `import {User} from '../../contracts/user/user-contract'`
- **Valid**: No imports

---

### guards/ - Type Guards and Boolean Checks

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-guard.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-guard\.ts$`
- **Violation**: `has-permission.ts`, `HasPermissionGuard.ts`, `has-permission.guard.ts`
- **Valid**: `has-permission-guard.ts`, `is-admin-guard.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `guards/[name]/[name]-guard.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `guards/has-permission-guard.ts` (missing folder)
- **Valid**: `guards/has-permission/has-permission-guard.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase ending with `Guard`, starting with `is/has/can/should/will/was`
- **AST Check**: ExportNamedDeclaration → name pattern `^(is|has|can|should|will|was)[A-Z][a-zA-Z0-9]*Guard$`
- **Violation**: `export const checkPermission = () => {}`, `export const hasPermission = () => {}`
- **Valid**: `export const hasPermissionGuard = (): boolean => {}`

**4. Must Return Boolean**

- **Rule**: Guard functions must explicitly return boolean type
- **AST Check**: Return type annotation must be TSBooleanKeyword
- **Violation**: `export const hasPermissionGuard = () => true` (no return type)
- **Valid**: `export const hasPermissionGuard = (): boolean => true`

**5. Purity Enforcement (No Async)**

- **Rule**: No async functions (must be pure)
- **AST Check**: ArrowFunctionExpression/FunctionDeclaration with async === true
- **Violation**: `export const hasPermissionGuard = async (): boolean => {}`
- **Valid**: `export const hasPermissionGuard = (): boolean => {}`

**6. No External Calls**

- **Rule**: No await expressions, no side effects
- **AST Check**: See "Purity Enforcement Rules" in Cross-Cutting Rules section
- **Violation**: `const result = await fetch()`
- **Valid**: Pure computation only

**7. Import Restrictions**

- **Rule**: guards/ can import contracts/ (types only), statics/, errors/
- **AST Check**: ImportDeclaration → source path must match `contracts/`, `statics/`, or `errors/`
- **Violation**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`
- **Valid**: `import type {User} from '../../contracts/user/user-contract'`,
  `import {userStatics} from '../../statics/user/user-statics'`

---

### contracts/ - Data Contracts (RESTRICTED)

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-contract.ts` or `.stub.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*(-contract\.ts|\.stub\.ts)$`
- **Violation**: `UserContract.ts`, `user.ts`
- **Valid**: `user-contract.ts`, `user.stub.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `contracts/[name]/[name]-contract.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `contracts/user-contract.ts` (missing folder)
- **Valid**: `contracts/user/user-contract.ts`, `contracts/user/user.stub.ts`

**3. Export Naming - Types/Interfaces**

- **Rule**: Type/interface exports must be PascalCase
- **AST Check**: TSTypeAliasDeclaration/TSInterfaceDeclaration → name pattern
- **Violation**: `export type user = {}`
- **Valid**: `export type User = z.infer<typeof userContract>`

**4. Export Naming - Schemas**

- **Rule**: Schema exports must be camelCase ending with `Contract`
- **AST Check**: VariableDeclarator where name ends with 'Contract' and uses a library from
  `allowedExternalImports.contracts` config
- **Violation**: `export const UserSchema = z.object({})`
- **Valid**: `export const userContract = z.object({})`
- **Config-driven**: Checks if imported library is in `allowedExternalImports.contracts` (e.g., ["zod", "yup", "joi"])

**5. Export Naming - Stubs**

- **Rule**: Stub exports must be PascalCase ending with `Stub`
- **AST Check**: ExportNamedDeclaration in `.stub.ts` files → name pattern `^[A-Z][a-zA-Z0-9]*Stub$`
- **Violation**: `export const userStub = () => {}`
- **Valid**: `export const UserStub = (props: Partial<User> = {}): User => {}`

**6. Stubs Must Validate**

- **Rule**: Stub functions must call `.parse()` on the contract to validate the result
- **AST Check**: Stub function body must contain CallExpression with `parse` method on contract
- **Violation**: `return { id: 'test' as UserId }` (type assertion)
- **Valid**: `return userContract.parse({ id: 'test' })`

**7. Must Use Branding**

- **Rule**: All Zod string/number schemas must use `.brand<'Type'>()`
- **AST Check**: Zod string() or number() calls must chain to `.brand()`
- **Violation**: `z.string().email()`
- **Valid**: `z.string().email().brand<'EmailAddress'>()`

**8. Import Restrictions**

- **Rule**: contracts/ can only import from statics/, errors/ (internal) and configured external packages
- **AST Check**: ImportDeclaration → source path must match `statics/`, `errors/`, or packages in
  `allowedExternalImports.contracts` config
- **Violation**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`
- **Valid**: `import {ValidationError} from '../../errors/validation/validation-error'`,
  `import {userStatics} from '../../statics/user/user-statics'`
- **Config-driven**: External packages from `allowedExternalImports.contracts` (e.g., ["zod", "yup", "joi"])

---

### transformers/ - Pure Data Transformation

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-transformer.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-transformer\.(ts|tsx)$`
- **Violation**: `format-date.ts`, `formatDateTransformer.ts`
- **Valid**: `format-date-transformer.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `transformers/[name]/[name]-transformer.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `transformers/format-date-transformer.ts` (missing folder)
- **Valid**: `transformers/format-date/format-date-transformer.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase ending with `Transformer`
- **AST Check**: ExportNamedDeclaration → VariableDeclarator → name pattern `^[a-z][a-zA-Z0-9]*Transformer$`
- **Violation**: `export const formatDate = () => {}`
- **Valid**: `export const formatDateTransformer = () => {}`

**4. Return Type Requirement**

- **Rule**: All exported transformer functions must have explicit return types (and must NOT be boolean)
- **AST Check**: ExportNamedDeclaration → ArrowFunctionExpression must have return type annotation !== TSBooleanKeyword
- **Violation**: `export const formatDateTransformer = () => {}` (missing return type)
- **Violation**: `export const isValidTransformer = (): boolean => {}` (boolean return type)
- **Valid**: `export const formatDateTransformer = (): string => {}`
- **Valid**: `export const userToDtoTransformer = (): UserDto => {}`
- **Note**: Explicit return types enforce clarity and prevent boolean functions in transformers/

**5. Purity Enforcement (No Async)**

- **Rule**: No async functions (must be pure)
- **AST Check**: ArrowFunctionExpression/FunctionDeclaration with async === true
- **Violation**: `export const formatDateTransformer = async () => {}`
- **Valid**: `export const formatDateTransformer = () => {}`

**6. Purity Enforcement (No Side Effects)**

- **Rule**: No await expressions, no external calls
- **AST Check**: See "Purity Enforcement Rules" in Cross-Cutting Rules section
- **Violation**: `const data = await fetch()`
- **Valid**: Pure computation only

**7. Import Restrictions**

- **Rule**: transformers/ can only import from contracts/, statics/, and errors/ (no external packages)
- **AST Check**: ImportDeclaration → source path must match `contracts/`, `statics/`, or `errors/` only
- **Violation**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`,
  `import moment from 'moment'`
- **Valid**: `import {User} from '../../contracts/user/user-contract'`,
  `import {userStatics} from '../../statics/user/user-statics'`
- **Note**: transformers/ is NOT in `allowedExternalImports` config, so cannot import npm packages

---

### errors/ - Error Classes

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-error.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-error\.(ts|tsx)$`
- **Violation**: `validation.ts`, `ValidationError.ts`
- **Valid**: `validation-error.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `errors/[name]/[name]-error.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `errors/validation-error.ts` (missing folder)
- **Valid**: `errors/validation/validation-error.ts`

**3. Export Naming**

- **Rule**: Export must be PascalCase ending with `Error`
- **AST Check**: ClassDeclaration → name pattern `^[A-Z][a-zA-Z0-9]*Error$`
- **Violation**: `export class validationError extends Error {}`
- **Valid**: `export class ValidationError extends Error {}`

**4. Must Extend Error**

- **Rule**: Error classes must extend Error
- **AST Check**: ClassDeclaration → heritage clause includes 'Error'
- **Violation**: `export class ValidationError {}`
- **Valid**: `export class ValidationError extends Error {}`

**5. Must Use Class Export**

- **Rule**: Errors use `export class`, not `export const`
- **AST Check**: ExportNamedDeclaration → ClassDeclaration (not VariableDeclaration)
- **Violation**: `export const ValidationError = class extends Error {}`
- **Valid**: `export class ValidationError extends Error {}`

**6. No Imports Allowed**

- **Rule**: errors/ cannot import anything (foundational layer)
- **AST Check**: ImportDeclaration presence (except type-only imports if needed)
- **Violation**: `import {User} from '../../contracts/user-contract/user-contract'`
- **Valid**: No imports

**7. Constructor Must Use Object Destructuring**

- **Rule**: Error constructors must use object destructuring with inline types
- **AST Check**: MethodDefinition (constructor) → parameters → ObjectPattern with typeAnnotation
- **Violation**: `constructor(message: string, field?: string)`
- **Valid**: `constructor({message, field}: {message: string; field?: string})`

**8. Must Set name Property**

- **Rule**: Error constructors should set this.name to the class name
- **AST Check**: Constructor body contains assignment `this.name = 'ClassName'`
- **Violation**: Constructor missing `this.name = '...'`
- **Valid**: `this.name = 'ValidationError'`

---

### flows/ - Route Definitions

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-flow.ts` or `-flow.tsx`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-flow\.(ts|tsx)$`
- **Violation**: `user.ts`, `UserFlow.ts`
- **Valid**: `user-flow.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `flows/[domain]/[domain]-flow.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `flows/user-flow.ts` (missing folder)
- **Valid**: `flows/user/user-flow.ts`

**3. Export Naming**

- **Rule**: Export must be PascalCase ending with `Flow`
- **AST Check**: ExportNamedDeclaration → VariableDeclarator → name pattern `^[A-Z][a-zA-Z0-9]*Flow$`
- **Violation**: `export const userFlow = () => {}`
- **Valid**: `export const UserFlow = () => {}`

**4. Import Restrictions - ONLY Responders**

- **Rule**: flows/ can ONLY import from responders/ (internal) and configured routing packages
- **AST Check**: ImportDeclaration → source path must match `responders/` or packages in `allowedExternalImports.flows`
  config
- **Violation**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`
- **Valid**: `import {UserGetResponder} from '../../responders/user/get/user-get-responder'`
- **Config-driven**: External packages from `allowedExternalImports.flows` (e.g., ["react-router-dom", "express"])

**5. Must Use Configured Routing Framework**

- **Rule**: Flows must use a routing framework from `allowedExternalImports.flows` config
- **AST Check**: File must import at least one package from `allowedExternalImports.flows`
- **Violation**: `export const UserFlow = {}` (no routing framework imported)
- **Valid**: Import and use any configured routing framework:
    - React Router: `import {Route} from 'react-router-dom'`
    - Express: `import {Router} from 'express'`
    - Vue Router: `import {createRouter} from 'vue-router'`
- **Config-driven**: Framework determined by `allowedExternalImports.flows` (
  e.g., ["react-router-dom", "express", "vue-router"])
- **Note**: The specific routing pattern depends on the framework imported

---

### adapters/ - External Package Configuration

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case `[package-name]-[function-name].ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-[a-z]+(-[a-z]+)*\.(ts|tsx)$` + matches package name
- **Violation**: `axios.ts`, `get.ts`, `AxiosGet.ts`
- **Valid**: `axios-get.ts`, `stripe-charges-create.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `adapters/[package-folder]/[package-folder]-[function-name].ts` pattern
- **AST Check**: File path pattern matching + folder name correlates to package being wrapped
- **Naming convention for special packages**:
    - Scoped packages: Remove `@` and replace `/` with `-` (e.g., `@aws-sdk/client-s3` → `aws-sdk-client-s3/`)
    - Packages with dots: Replace `.` with `-` (e.g., `lodash.debounce` → `lodash-debounce/`)
- **Violations**:
    - `adapters/axios-get.ts` (missing folder)
    - `adapters/@aws-sdk/client-s3/s3-upload.ts` (invalid folder name with special chars)
- **Valid**:
    - `adapters/axios/axios-get.ts`
    - `adapters/aws-sdk-client-s3/aws-sdk-client-s3-upload.ts`
    - `adapters/lodash-debounce/lodash-debounce.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase `[packageName][FunctionName]` (matches package's function name)
- **AST Check**: ExportNamedDeclaration → name pattern matches package + function
- **Violation**: `export const get = () => {}`, `export const fetchData = () => {}`
- **Valid**: `export const axiosGet = () => {}`, `export const stripeChargesCreate = () => {}`

**4. Naming Must Match Package API (Not Business Domain)**

- **Rule**: Export name must reflect package's API, not business logic
- **AST Check**: Export name correlation with package function names (requires package.json lookup)
- **Violation**: `export const payment = () => {}` (business term)
- **Valid**: `export const stripeChargesCreate = () => {}` (package function name)

**5. Import Restrictions**

- **Rule**: adapters/ can import node_modules and middleware/ only
- **AST Check**: ImportDeclaration → source path must be external package or match `middleware/`
- **Violation**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`
- **Valid**: `import axios from 'axios'`,
  `import {httpTelemetryMiddleware} from '../../middleware/http-telemetry/http-telemetry-middleware'`

**6. Must Wrap External Package**

- **Rule**: Adapter file must import an external package (not just internal imports)
- **AST Check**: At least one ImportDeclaration must be from node_modules (not starting with './' or '../')
- **Violation**: `adapters/axios/axios-get.ts` with only internal imports
- **Valid**: `adapters/axios/axios-get.ts` with `import axios from 'axios'`

---

### middleware/ - Infrastructure Orchestration

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-middleware.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-middleware\.(ts|tsx)$`
- **Violation**: `http-telemetry.ts`, `HttpTelemetryMiddleware.ts`
- **Valid**: `http-telemetry-middleware.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `middleware/[name]/[name]-middleware.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `middleware/http-telemetry-middleware.ts` (missing folder)
- **Valid**: `middleware/http-telemetry/http-telemetry-middleware.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase ending with `Middleware`
- **AST Check**: ExportNamedDeclaration → name pattern `^[a-z][a-zA-Z0-9]*Middleware$`
- **Violation**: `export const httpTelemetry = () => {}`
- **Valid**: `export const httpTelemetryMiddleware = () => {}`

**4. Import Restrictions**

- **Rule**: middleware/ can import adapters/, middleware/, and configured external packages
- **AST Check**: ImportDeclaration → source path must match `adapters/`, `middleware/`, or packages in
  `allowedExternalImports.middleware` config
- **Violation**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`
- **Valid**: `import {winstonLog} from '../../adapters/winston/winston-log'`
- **Config-driven**: External packages from `allowedExternalImports.middleware` if needed

**5. Infrastructure-Only Pattern**

- **Rule**: Must combine 2+ adapters (orchestration pattern)
- **AST Check**: Count ImportDeclarations from `adapters/` - should be >= 2
- **Violation**: Single adapter import (should be in adapters/ instead)
- **Valid**: Multiple adapter imports for infrastructure orchestration

---

### brokers/ - Business Operations

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case `[domain]-[action]-broker.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-[a-z]+(-[a-z]+)*-broker\.(ts|tsx)$`
- **Violation**: `user.ts`, `fetch.ts`, `UserFetchBroker.ts`
- **Valid**: `user-fetch-broker.ts`, `comment-create-process-broker.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `brokers/[domain]/[action]/[domain]-[action]-broker.ts` pattern (max 2 levels)
- **AST Check**: File path pattern matching - exactly 2 folder levels before filename
- **Violation**: `brokers/user-fetch-broker.ts` (missing levels)
- **Violation**: `brokers/user/fetch/stock/check/file.ts` (too deep - 4 levels)
- **Valid**: `brokers/user/fetch/user-fetch-broker.ts` (exactly 2 levels)

**3. Export Naming**

- **Rule**: Export must be camelCase `[domain][Action]Broker`
- **AST Check**: ExportNamedDeclaration → name pattern matching domain and action
- **Violation**: `export const fetchUser = () => {}`
- **Valid**: `export const userFetchBroker = () => {}`, `export const commentCreateProcessBroker = () => {}`

**4. Import Restrictions**

- **Rule**: brokers/ can import brokers/, adapters/, contracts/, errors/, and configured external packages
- **AST Check**: ImportDeclaration → source path must match allowed folders or packages in
  `allowedExternalImports.brokers` config
- **Violation**: `import {UserCardWidget} from '../../widgets/user-card/user-card-widget'`
- **Valid**: `import {axiosGet} from '../../../adapters/axios/axios-get'`
- **Config-driven**: External packages from `allowedExternalImports.brokers` (default: [])

---

### bindings/ - Reactive Connections

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case starting with `use-` and ending with `-binding.ts`
- **AST Check**: Filename pattern `^use-[a-z]+(-[a-z]+)*-binding\.(ts|tsx)$`
- **Violation**: `user-data-binding.ts`, `UserDataBinding.ts`
- **Valid**: `use-user-data-binding.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `bindings/use-[resource]/use-[resource]-binding.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `bindings/use-user-data-binding.ts` (missing folder)
- **Valid**: `bindings/use-user-data/use-user-data-binding.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase starting with `use` and ending with `Binding` (React hook convention)
- **AST Check**: ExportNamedDeclaration → name pattern `^use[A-Z][a-zA-Z0-9]*Binding$`
- **Violation**: `export const userData = () => {}`
- **Violation**: `export const dataBinding = () => {}` (missing 'use' prefix)
- **Valid**: `export const useUserDataBinding = () => {}`

**4. Return Pattern for Async Operations**

- **Rule**: Async bindings must return `{data, loading, error}` pattern
- **AST Check**: Return type structure validation for async functions
- **Violation**: `return data` (async operation)
- **Valid**: `return {data, loading, error}`

**5. Import Restrictions**

- **Rule**: bindings/ can import brokers/, state/, contracts/, errors/ (internal) and configured UI packages
- **AST Check**: ImportDeclaration → source path must match allowed folders or packages in
  `allowedExternalImports.bindings` config
- **Violation**: `import {UserCardWidget} from '../../widgets/user-card/user-card-widget'`
- **Valid**: `import {userFetchBroker} from '../../brokers/user/fetch/user-fetch-broker'`
- **Config-driven**: External packages from `allowedExternalImports.bindings` (e.g., ["react", "react-dom"])

**6. No Multi-Broker Orchestration**

- **Rule**: Bindings can only call one broker (no orchestration)
- **AST Check**: Count broker function calls within binding - should be 1
- **Violation**: Multiple broker calls in one binding
- **Valid**: Single broker call with state management

**7. Single Await Expression Only**

- **Rule**: Bindings can only have one await expression (if you await twice, move to brokers/)
- **AST Check**: Count AwaitExpression nodes in binding - max 1
- **Violation**: `const user = await userFetchBroker(); const company = await companyFetchBroker();`
- **Valid**: Single await for one broker call

---

### state/ - Data Storage and Memory

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-state.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-state\.(ts|tsx)$`
- **Violation**: `user-cache.ts`, `UserCacheState.ts`
- **Valid**: `user-cache-state.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `state/[name]/[name]-state.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `state/user-cache-state.ts` (missing folder)
- **Valid**: `state/user-cache/user-cache-state.ts`

**3. Export Naming**

- **Rule**: Export must be camelCase ending with `State`
- **AST Check**: ExportNamedDeclaration → name pattern `^[a-z][a-zA-Z0-9]*State$`
- **Violation**: `export const userCache = {}`
- **Valid**: `export const userCacheState = {}`

**4. Must Export as Object or Class Instance**

- **Rule**: State exports must be objects/class instances with methods/properties, not individual functions
- **AST Check**: Export is ObjectExpression OR NewExpression (class instance), not standalone ArrowFunctionExpression
- **Violation**: `export const userCacheState = () => {}` (standalone function)
- **Valid**: `export const userCacheState = { get: () => {}, set: () => {} }` (object with methods)
- **Valid**: `export const userCacheState = new UserCache()` (class instance)
- **Valid**: `export const appConfigState = { apiUrl: 'https://...', timeout: 10000 }` (config object)
- **Valid**: `export const userContextState = { context: createContext(...), Provider: ... }` (context wrapped in
  object)
- **Note**: Can be cache objects, config objects, React contexts, or any stateful structure

**5. Import Restrictions**

- **Rule**: state/ can ONLY import contracts/ and errors/ (internal) and configured external packages
- **AST Check**: ImportDeclaration → source path must match `contracts/`, `errors/`, or packages in
  `allowedExternalImports.state` config
- **Violation**: `import {axiosGet} from '../../adapters/axios/axios-get'`
- **Valid**: `import {User} from '../../contracts/user-contract/user-contract'`
- **Config-driven**: External packages from `allowedExternalImports.state` (default: ["react", "react-dom"])

**6. No External Calls**

- **Rule**: Pure in-memory only - no API calls, database operations
- **AST Check**: No await expressions, no external package calls (axios, fetch, db)
- **Violation**: `await fetch()`, `await db.query()`
- **Valid**: In-memory Map/Set operations only

---

### responders/ - Route Handlers

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case `[domain]-[action]-responder.ts`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-[a-z]+(-[a-z]+)*-responder\.(ts|tsx)$`
- **Violation**: `user-get.ts`, `UserGetResponder.ts`
- **Valid**: `user-get-responder.ts`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `responders/[domain]/[action]/[domain]-[action]-responder.ts` pattern
- **AST Check**: File path pattern matching
- **Violation**: `responders/user-get-responder.ts` (missing folders)
- **Valid**: `responders/user/get/user-get-responder.ts`

**3. Export Naming**

- **Rule**: Export must be PascalCase `[Domain][Action]Responder`
- **AST Check**: ExportNamedDeclaration → name pattern with PascalCase
- **Violation**: `export const userGetResponder = () => {}`
- **Valid**: `export const UserGetResponder = () => {}`

**4. Import Restrictions (With UI)**

- **Rule**: Responders with UI can import widgets/, brokers/, bindings/, state/, contracts/, transformers/, errors/
- **AST Check**: ImportDeclaration → source path validation
- **Violation**: `import {axiosGet} from '../../../adapters/axios/axios-get'`
- **Valid**: `import {UserCardWidget} from '../../../widgets/user-card/user-card-widget'`

**5. Import Restrictions (Without UI)**

- **Rule**: Responders without UI can import brokers/, state/, contracts/, transformers/, errors/
- **AST Check**: ImportDeclaration → source path validation (no widgets/, bindings/)
- **Violation**: `import {useUserDataBinding} from '../../../bindings/use-user-data/use-user-data-binding'`
- **Valid**: `import {userFetchBroker} from '../../../brokers/user/fetch/user-fetch-broker'`

**6. Can Only Be Imported By flows/**

- **Rule**: Responders can ONLY be imported by flows/ folder
- **AST Check**: Check all ImportDeclarations across codebase pointing to responders/ - must originate from flows/
- **Violation**: `import {UserGetResponder} from '../responders/user/get/user-get-responder'` (from brokers/)
- **Valid**: `import {UserGetResponder} from '../../responders/user/get/user-get-responder'` (from flows/)

**7. Responders Match Framework Patterns**

- **Rule**: Responders must follow patterns specific to the configured framework
- **AST Check**: Based on `framework` field in .questmaestro:
    - **Frontend frameworks** (react, vue, angular, svelte, solid, preact):
        - Must return appropriate component type:
            - `react`/`preact`/`solid`: JSX.Element or JSXElement nodes
            - `vue`: VNode or template string
            - `angular`: Decorated with @Component
            - `svelte`: Export default .svelte component
        - Violation: `export const UserProfileResponder = () => { return 'text' }` (when framework: "react")
        - Valid: `export const UserProfileResponder = () => { return <div>Profile</div> }` (React)
    - **Backend frameworks** (express, fastify, koa, hapi, nestjs):
        - Must accept framework-specific parameters:
            - `express`: `{req, res}`
            - `fastify`: `{request, reply}`
            - `koa`: `{ctx}`
            - `hapi`: `{request, h}`
            - `nestjs`: Use decorators and class-based controllers
        - Violation: `export const UserGetResponder = (userId) => {}` (missing framework params)
        - Valid: `export const UserGetResponder = async ({req, res}) => {}` (express)
    - **Libraries** (node-library, react-library):
        - Responders not expected (no flows/)
    - **Fullstack** (nextjs, nuxtjs, remix):
        - Follow framework-specific patterns for API routes and pages
- **Config-driven**: Framework field from .questmaestro file determines which patterns apply

---

### widgets/ - UI Components

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case ending with `-widget.tsx`
- **AST Check**: Filename pattern `^[a-z]+(-[a-z]+)*-widget\.tsx$`
- **Violation**: `user-card.tsx`, `UserCardWidget.tsx`, `user-card-widget.ts`
- **Valid**: `user-card-widget.tsx`

**2. Folder Structure Pattern**

- **Rule**: Files must be in `widgets/[name]/[name]-widget.tsx` pattern
- **AST Check**: File path pattern matching
- **Violation**: `widgets/user-card-widget.tsx` (missing folder)
- **Valid**: `widgets/user-card/user-card-widget.tsx`

**3. Export Naming - Component**

- **Rule**: Export must be PascalCase ending with `Widget`
- **AST Check**: ExportNamedDeclaration → name pattern `^[A-Z][a-zA-Z0-9]*Widget$`
- **Violation**: `export const userCardWidget = () => {}`
- **Valid**: `export const UserCardWidget = () => {}`

**4. Export Naming - Props**

- **Rule**: Props type must be `[WidgetName]Props`
- **AST Check**: TSTypeAliasDeclaration → name pattern `^[A-Z][a-zA-Z0-9]*WidgetProps$`
- **Violation**: `export type UserCardPropsType = {}`
- **Valid**: `export type UserCardWidgetProps = {}`

**5. Must Return JSX.Element**

- **Rule**: Widget exports must return JSX.Element
- **AST Check**: Return type is JSX.Element or JSXElement present
- **Violation**: `export const UserCardWidget = () => { return 'text' }`
- **Valid**: `export const UserCardWidget = () => { return <div>Card</div> }`

**6. Must Use .tsx Extension**

- **Rule**: Widgets must use .tsx file extension (JSX content)
- **AST Check**: File extension validation
- **Violation**: `user-card-widget.ts`
- **Valid**: `user-card-widget.tsx`

**7. Import Restrictions**

- **Rule**: widgets/ can import bindings/, brokers/, state/, contracts/, transformers/, errors/ (internal) and
  configured UI packages
- **Rule**: widgets/ CANNOT import adapters/, flows/, responders/
- **AST Check**: ImportDeclaration → source path validation against allowed folders and packages in
  `allowedExternalImports.widgets` config
- **Violation**: `import {axiosGet} from '../../adapters/axios/axios-get'`
- **Valid**: `import {useUserDataBinding} from '../../bindings/use-user-data/use-user-data-binding'`
- **Config-driven**: External packages from `allowedExternalImports.widgets` (e.g., ["react", "react-dom"])

**8. No Bindings in Event Handlers**

- **Rule**: Bindings can only be called in render phase, not event handlers
- **AST Check**: Hook calls (use*) must not be inside event handler functions
- **Violation**: `const handleClick = () => { const data = useUserDataBinding() }`
- **Valid**: `const {data} = useUserDataBinding(); const handleClick = () => { /* use data */ }`

**9. No Brokers Outside Event Handlers**

- **Rule**: Brokers can only be called in event handlers, not in render phase
- **AST Check**: Broker function calls (ending with 'Broker') must be inside event handler functions or useEffect
  callbacks, not in component body
- **Violation**: `const UserWidget = () => { const user = userFetchBroker({id}); return <div>{user}</div>; }` (broker in
  render)
- **Violation**: `const user = await userFetchBroker({id}); return <div>{user}</div>;` (broker in component body)
- **Valid**: `const handleClick = async () => { const user = await userFetchBroker({id}); }` (broker in event handler)
- **Valid**: `useEffect(() => { userFetchBroker({id}).then(setUser); }, [id]);` (broker in useEffect)
- **Note**: Brokers in render phase break React's rendering rules and cause side effects during render

**10. Sub-Components in Same Folder**

- **Rule**: Sub-components live in same folder, no separate folders
- **AST Check**: Widget folder should not contain subfolders for sub-components
- **Violation**: `widgets/user-card/avatar/avatar-widget.tsx`
- **Valid**: `widgets/user-card/avatar-widget.tsx`, `widgets/user-card/user-card-widget.tsx`

**11. Must Export Props Type**

- **Rule**: Widgets must export a props type named `[WidgetName]Props`
- **AST Check**: File contains export of TSTypeAliasDeclaration/TSInterfaceDeclaration matching
  `^[A-Z][a-zA-Z0-9]*WidgetProps$`
- **Violation**: Widget with no exported props type, or props type named incorrectly
- **Valid**: `export type UserCardWidgetProps = { userId: string }`

**12. Sub-Component Import Restrictions**

- **Rule**: Only the main widget file can be imported from outside its folder. Sub-components are private to the folder.
- **AST Check**: ImportDeclarations from widgets/[name]/ must only import the main [name]-widget file, not
  sub-components
- **Violation**: `import {AvatarWidget} from '../../widgets/user-card/avatar-widget'` (importing sub-component from
  outside)
- **Valid**: `import {UserCardWidget} from '../../widgets/user-card/user-card-widget'` (importing main widget)
- **Valid**: Inside `widgets/user-card/`: `import {AvatarWidget} from './avatar-widget'` (sub-component import within
  folder)
- **Note**: Sub-components (like avatar-widget.tsx) are internal implementation details of the main widget

---

### startup/ - Application Bootstrap

**1. File Naming Pattern**

- **Rule**: Filename must be kebab-case starting with `start-`
- **AST Check**: Filename pattern `^start-[a-z]+(-[a-z]+)*\.(ts|tsx)$`
- **Violation**: `server.ts`, `app.tsx`, `StartServer.ts`
- **Valid**: `start-server.ts`, `start-app.tsx`

**2. Flat Structure**

- **Rule**: startup/ files are flat (no subfolders)
- **AST Check**: File path depth validation
- **Violation**: `startup/server/start-server.ts`
- **Valid**: `startup/start-server.ts`

**3. Export Naming**

- **Rule**: Export must be PascalCase starting with `Start`
- **AST Check**: ExportNamedDeclaration → name pattern `^Start[A-Z][a-zA-Z0-9]*$`
- **Violation**: `export const startServer = () => {}`
- **Valid**: `export const StartServer = () => {}`

**4. No Business Logic**

- **Rule**: startup/ contains only wiring, no business logic
- **AST Check**: Detect patterns indicating business logic:
    - No database queries (no `db.*`, `query()`, `find()`, `save()`)
    - No API calls (no `fetch()`, `axios.*`, HTTP client calls)
    - No complex conditionals (max 1 level deep, only for environment/config)
    - No loops over business data (for/while/map/filter/reduce on non-config arrays)
    - No try/catch blocks (except for startup failures)
    - No data transformations (beyond parsing env vars or config files)
    - No validation logic (except port numbers, URLs for config)
    - No mathematical calculations (except config-related like port + offset)
- **Violations**:
    - `if (user.role === 'admin') { ... }` (business condition)
    - `const users = await db.users.findAll()` (database query)
    - `data.map(item => item.price * 1.2)` (business calculation)
    - `if (!email.includes('@')) throw Error` (business validation)
- **Valid**:
    - `if (process.env.NODE_ENV === 'production') { ... }` (environment check)
    - `const port = parseInt(process.env.PORT || '3000')` (config parsing)
    - `app.use('/api', userFlow)` (route wiring)
    - `await dbPoolState.init()` (initialization calls)

**5. Can Import Everything**

- **Rule**: startup/ is the ONLY folder that can import from all other folders and all external packages
- **AST Check**: ImportDeclaration → any source path allowed (both internal and external)
- **Violation**: None (startup has unique privilege)
- **Valid**: Any import from any project folder or npm package
- **Config-driven**: `allowedExternalImports.startup` is always `["*"]`

---

## Cross-Cutting Lintable Rules

These rules apply across multiple folder types and enforce architectural patterns.

### Dependency Graph Enforcement

**Import Hierarchy Validation**

- **Rule**: Enforce the complete import dependency graph
- **AST Check**: For each file, validate all ImportDeclarations against the allowed import map:
    - startup/ → ALL
    - flows/ → responders/ ONLY
  - responders/ → widgets/, brokers/, bindings/, state/, contracts/, transformers/, guards/, statics/, errors/
  - widgets/ → bindings/, brokers/, state/, contracts/, transformers/, guards/, statics/, errors/
  - bindings/ → brokers/, state/, contracts/, statics/, errors/
  - brokers/ → brokers/, adapters/, contracts/, statics/, errors/
  - middleware/ → adapters/, middleware/, statics/
  - adapters/ → node_modules, middleware/, statics/
  - transformers/ → contracts/, statics/, errors/
  - guards/ → contracts/, statics/, errors/
  - state/ → contracts/, statics/, errors/
  - contracts/ → statics/, errors/
  - statics/ → (no imports)
    - errors/ → (no imports)
- **Violation**: Any import outside the allowed set for a folder
- **Valid**: All imports match the dependency graph

### Multi-Broker Detection in Responders

**Responder Orchestration Prevention**

- **Rule**: Responders cannot call multiple brokers (orchestration belongs in brokers/)
- **AST Check**: Count broker function calls in responder files - max 1
- **Violation**: `await userFetchBroker(); await emailSendBroker();` in responder
- **Valid**: Single broker call, or call to orchestration broker
- **Note**: This is explicitly mentioned in project standards as lint-enforced

### Test File Co-Location

**Test File Placement**

- **Rule**: Test files must be co-located with source files
- **AST Check**: For each `*.test.ts` file, verify matching source file exists in same directory
- **Violation**: `tests/user-contract.test.ts` when source is `contracts/user-contract/user-contract.ts`
- **Valid**: `contracts/user-contract/user-contract.test.ts` alongside `contracts/user-contract/user-contract.ts`

**Test File Naming Matches Source**

- **Rule**: Test file name must match source file name with `.test` suffix before extension
- **AST Check**: For `file-name.test.ts`, verify `file-name.ts` exists in same directory
- **Violation**: `user-contract.test.ts` testing `user.ts`, `user-spec.test.ts`
- **Valid**: `user-contract.test.ts` alongside `user-contract.ts`

### Duplicate Package Usage Detection

**Adapter Evolution Rule**

- **Rule**: When same package imported 2+ times across codebase, create adapter
- **AST Check**: Count imports of external packages across all files
- **Violation**: `import axios from 'axios'` in 3 different files with no `adapters/axios/` folder
- **Valid**: Single external package import creates adapter, all other files import from adapter

### File-Folder Name Consistency

**Filename Must Match Folder Name**

- **Rule**: For all non-index files, filename base must match parent folder name
- **AST Check**: Extract folder name and filename base, verify match
- **Violation**: `contracts/user/user-contract.ts` (folder is 'user', file is 'user-contract')
- **Valid**: `contracts/user-contract/user-contract.ts` (folder and file base match)

### Allowed Folder Names (Whitelist)

**Only Approved Folders Allowed in src/**

- **Rule**: Only the approved folder structure is allowed in src/. Any folder not in the whitelist is forbidden.
- **AST Check**: Scan src/ directory structure, validate all folders against whitelist
- **Whitelist**: statics/, guards/, contracts/, transformers/, errors/, flows/, adapters/, middleware/, brokers/,
  bindings/, state/,
  responders/, widgets/, startup/, assets/, migrations/
- **Violation**: Any folder in src/ not in the whitelist (e.g., utils/, lib/, helpers/, common/, shared/, core/,
  services/, repositories/, models/, types/, interfaces/, validators/, constants/, enums/, formatters/, mappers/,
  converters/)
- **Valid**: Only folders from the whitelist exist in src/
- **Note**: Common violations list (for tests): utils/, lib/, helpers/, common/, shared/, core/, services/,
  repositories/, models/, types/, interfaces/, validators/, constants/, enums/, formatters/, mappers/, converters/

### File Path Structure Enforcement

**All Files Must Match Approved Patterns**

- **Rule**: Every file in src/ must match one of the approved folder structure patterns. Files that don't match any
  approved pattern are lint errors.
- **AST Check**: For each file, validate path matches one of the patterns below. If no pattern matches, fail.
- **Approved Patterns:**
    - **startup/**: `startup/start-[name].(ts|tsx)` (0 nesting levels)
  - **statics/**: `statics/[name]/[name]-statics.(ts|test.ts)` (1 nesting level)
  - **guards/**: `guards/[name]/[name]-guard.(ts|test.ts)` (1 nesting level)
  - **contracts/**: `contracts/[name]/[name]-contract.(ts|test.ts)` or `contracts/[name]/[name].stub.ts` (1 nesting
    level)
    - **transformers/**: `transformers/[name]/[name]-transformer.(ts|test.ts)` (1 nesting level)
    - **errors/**: `errors/[name]/[name]-error.(ts|test.ts)` (1 nesting level)
    - **flows/**: `flows/[domain]/[domain]-flow.(ts|tsx|test.ts|test.tsx)` (1 nesting level)
    - **adapters/**: `adapters/[package]/[package]-[function].(ts|test.ts)` (1 nesting level)
    - **middleware/**: `middleware/[name]/[name]-middleware.(ts|test.ts)` (1 nesting level)
    - **bindings/**: `bindings/use-[name]/use-[name]-binding.(ts|tsx|test.ts|test.tsx)` (1 nesting level)
    - **state/**: `state/[name]/[name]-state.(ts|test.ts)` (1 nesting level)
    - **widgets/**: `widgets/[name]/[name]-widget.(tsx|test.tsx)` or
      `widgets/[name]/[sub-component]-widget.(tsx|test.tsx)` (1 nesting level, multiple files allowed)
    - **brokers/**: `brokers/[domain]/[action]/[domain]-[action]-broker.(ts|test.ts)` (2 nesting levels)
    - **responders/**: `responders/[domain]/[action]/[domain]-[action]-responder.(ts|tsx|test.ts|test.tsx)` (2 nesting
      levels)
    - **assets/**, **migrations/**: Any structure (no restrictions)
    - **Root exceptions**: Files from `allowedRootFiles` config (default: `["global.d.ts"]`)
- **Violations** (don't match any pattern):
    - `contracts/user-contract.ts` (missing folder level)
    - `contracts/user/validation/user-contract.ts` (too deep, 2 levels in contracts/)
    - `widgets/user-card/avatar/avatar-widget.tsx` (too deep, 2 levels in widgets/)
    - `brokers/user/fetch/detail/user-fetch-detail-broker.ts` (too deep, 3 levels in brokers/)
    - `src/utils/helper.ts` (not in approved folder list)
    - `src/user.ts` (doesn't match any pattern)
- **Valid** (matches approved patterns):
    - `contracts/user-contract/user-contract.ts`
    - `brokers/user/fetch/user-fetch-broker.ts`
    - `widgets/user-card/user-card-widget.tsx`
    - `widgets/user-card/avatar-widget.tsx` (sub-component in same folder)
    - `startup/start-server.ts`
    - `src/global.d.ts`

### External Package Imports (npm/node_modules)

**Only Configured Folders Can Import External Packages**

- **Rule**: External package imports (from node_modules) are controlled by `allowedExternalImports` config. Folders not
  in the config cannot import external packages.
- **AST Check**: For each ImportDeclaration with external package (not starting with './' or '../'), verify package is
  in `allowedExternalImports.[folderType]` config
- **Violation**: `import axios from 'axios'` in brokers/ (not in config)
- **Valid**:
    - `import axios from 'axios'` in adapters/ (`allowedExternalImports.adapters: ["*"]`)
    - `import react from 'react'` in widgets/ (`allowedExternalImports.widgets: ["react", "react-dom"]`)
    - `import {axiosGet} from '../../adapters/axios/axios-get'` in brokers/ (internal import)
- **Config-driven**: Each folder's allowed external imports defined in `allowedExternalImports` config:
    - `adapters/`: `["*"]` (can import any package)
    - `startup/`: `["*"]` (can import any package)
    - `widgets/`: `["react", "react-dom"]` (UI framework)
    - `bindings/`: `["react", "react-dom"]` (hooks)
    - `flows/`: `["react-router-dom", "express"]` (routing)
    - `contracts/`: `["zod", "yup", "joi"]` (validation)
    - Others: Not in config = no external imports allowed
- **Note**: Type-only imports (`import type`) allowed anywhere

### index.ts Files Restrictions

**index.ts Only Contains Re-Exports**

- **Rule**: index.ts files can ONLY contain re-export statements, no implementations
- **AST Check**: In files named index.ts, all ExportNamedDeclaration must have a 'source' property (re-exports)
- **Violation**: `export const userContract = z.object({})` in index.ts
- **Valid**: `export type { User } from './user-contract'` in index.ts

**index.ts Only Re-Exports Types**

- **Rule**: index.ts files should only re-export types, not values (unless package entry point)
- **AST Check**: In files named index.ts (non-startup), exports should be type exports only
- **Violation**: `export { userFetchBroker } from './user-fetch-broker'` in contracts/index.ts
- **Valid**: `export type { User } from './user-contract'` in contracts/index.ts
- **Exception**: startup/index.ts or package entry points can export values

### Purity Enforcement Rules

**Applies to: contracts/, transformers/, state/**

These folders must contain pure functions with no side effects. A pure function:

- Always returns the same output for the same input
- Has no observable side effects
- Doesn't depend on external state

**AST Checks for Impurity:**

1. **Async Operations**
    - No `async` keyword on functions
    - No `AwaitExpression` nodes
    - No Promise-returning functions without async marking

2. **External Calls**
    - No `fetch`, `axios`, or HTTP client calls
    - No database operations
    - No file system operations (`fs.*`, `path.*`)

3. **Console/Logging**
    - No `console.*` calls (console.log, console.error, etc.)
    - Logging should go through adapters/

4. **Non-Deterministic Operations**
    - No `Date.now()` (use Date parameter instead)
    - No `Math.random()` (use seed parameter if randomness needed)
    - No `crypto.randomBytes()` or similar

5. **Global/External State Access**
    - No `process.*` access
    - No `window.*` access
    - No `document.*` access
    - No `global.*` access
    - No module-level variable mutations

6. **Parameter Mutations**
    - No assignments to parameter properties
    - No array mutations (push, pop, shift, unshift, splice)
    - No object mutations (delete, Object.assign to param)

7. **Error Handling**
    - No `throw` statements (return error objects instead)
    - Exceptions: errors/ folder classes can throw in constructors

**Violations:**

```typescript
// Async operation
export const fetchData = async () => { ...
}

// External call
export const getData = () => {
    return fetch('/api/data');
}

// Console usage
export const logValue = ({val}: { val: string }) => {
    console.log(val);
}

// Non-deterministic
export const getId = () => {
    return Date.now();
}

// Parameter mutation
export const addItem = ({arr}: { arr: string[] }) => {
    arr.push('item');
}

// Throwing errors
export const validate = ({val}: { val: number }) => {
    if (val < 0) throw new Error('Invalid');
}
```

**Valid:**

```typescript
// Pure transformation
export const formatDate = ({date}: { date: Date }): string => {
    return date.toISOString().split('T')[0];
}

// Pure validation
export const isValidEmail = ({email}: { email: string }): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Return errors instead of throwing
export const validateAge = ({age}: { age: number }): { valid: boolean; error?: string } => {
    if (age < 0) return {valid: false, error: 'Age must be positive'};
    return {valid: true};
}
```

---

## Summary Statistics

### Total Lintable Rules by Category

**By Enforcement Type:**

- File Naming Rules: 14 folder-specific rules (includes test file naming)
- Export Naming Rules: 13 folder-specific rules
- Folder Structure Rules: 13 folder-specific rules
- Import Restriction Rules: 11 folder-specific rules + 1 global dependency graph + 1 external package restriction
- Function Signature Rules: 4 global rules (includes positional parameter detection)
- Purity Enforcement Rules: 5 folder-specific rules (includes await count)
- Type Safety Rules: 6 global rules
- Return Type Rules: 3 folder-specific rules
- Error Handling Rules: 3 global rules (includes empty catch, no .catch())
- Architectural Pattern Rules: 11 cross-cutting rules (includes index.ts restrictions, test naming)

**By Folder:**

- statics/: 7 rules
- guards/: 7 rules
- contracts/: 8 rules (restricted to Zod schemas and stubs)
- transformers/: 7 rules
- errors/: 8 rules (added constructor destructuring, name property)
- flows/: 6 rules
- adapters/: 6 rules
- middleware/: 5 rules
- brokers/: 6 rules
- bindings/: 8 rules (added single await)
- state/: 6 rules
- responders/: 7 rules (consolidated framework patterns)
- widgets/: 12 rules (added props type export, broker location restriction, sub-component imports)
- startup/: 5 rules
- Global/Cross-cutting: 21 rules (added index.ts, test naming, external packages)

**Total Deterministic Rules: 119+**

### Implementation Approaches

**Existing ESLint Rules (Configurable):**

- File naming (eslint-plugin-filename-rules)
- Import restrictions (eslint-plugin-import)
- No default exports (eslint: no-default-export)
- No console.log (eslint: no-console)
- No require() (eslint: no-require-imports)
- Async/await over .then() (eslint-plugin-promise)
- No empty catch blocks (eslint: no-empty-catch)

**Custom ESLint Rules Required:**

- Folder structure pattern matching (all folder types)
- Export name suffix validation (Broker, Transformer, Error, Flow, etc.)
- Dependency graph enforcement (complete import hierarchy)
- Multi-broker detection in responders and bindings
- Await count validation (bindings max 1, detect .catch() chains)
- File-folder name consistency matching
- Boolean return detection for contracts/
- Positional parameter detection (enforce object destructuring)
- Type export syntax validation (index.ts vs non-index)
- Adapter evolution (duplicate package detection)
- Folder name whitelist enforcement (only approved folders in src/)
- External package import restrictions (only adapters/ and startup/)
- index.ts content validation (only re-exports, only types)
- Test file naming and co-location validation
- Widget props type export requirement
- Error class property validation (name property, constructor pattern)
- Sub-component folder structure (no nested folders in widgets/)

**TypeScript Compiler Integration:**

- Type safety rules (no any, no ts-ignore)
- Return type validation (boolean for contracts/, JSX for widgets/responders)
- JSX.Element detection for widgets/responders
- Type-only import detection

### Key Insights for Implementation

1. **Pattern Matching**: Most rules rely on regex pattern matching for filenames and export names
2. **Path Analysis**: Folder structure rules require path parsing and validation
3. **AST Traversal**: Import restrictions and function signature rules need full AST analysis
4. **Cross-File Analysis**: Dependency graph and duplicate package detection require project-wide scanning
5. **Type Analysis**: Some rules (return types, JSX detection) need TypeScript type checker integration
6. **Incremental Adoption**: Rules can be implemented and enabled progressively by category

---

## Allowed Files (Exceptions to Folder Structure)

These files are allowed in the root of src/ or other locations outside the standard folder structure:

- **global.d.ts** - Global TypeScript type declarations

---
