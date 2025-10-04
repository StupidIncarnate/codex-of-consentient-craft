# Boundary Validation Enforcement

## TL;DR for LLMs

**When writing code, ask yourself: "Is this data from outside my system?"**

- **Responders** (HTTP, stdin, CLI) → Accept `input: unknown`, validate with `.safeParse()` (handle errors explicitly)
- **Adapters** wrapping external libraries → Validate with `.parse()` (throw on error) OR return library type
- **Brokers** using adapters → If adapter returns library type, validate payload with `.parse()`
- **JSON.parse** → Always validate result: `contract.parse(JSON.parse(data))`
- **Generic adapters** `<T>` → Must accept `contract: ZodSchema<T>` and call `contract.parse()`

**Why:** Type annotations are compile-time only. External data needs runtime validation to prevent errors, enable
testing, and ensure security.

**Rule:** If data crosses from external world → your code, validate at the boundary with contracts.

**Quick ref:** `.parse()` throws on error (adapters/brokers), `.safeParse()` returns result object (responders).

---

## Core Principle

**All external data must be validated through contracts before use in application code.**

### Why This Matters

**Type annotations provide compile-time safety only.** External data can have any shape at runtime, regardless of type
annotations. A variable typed as `User` could actually be `null`, malformed JSON, or a completely different object
shape.

**Runtime validation through contracts ensures:**

- Data matches expected structure before use
- Type safety extends from compile-time into runtime
- Error cases can be tested without type assertions
- Malicious or malformed input is caught at the boundary

External data crosses system boundaries from:

- User input (HTTP requests, CLI args, stdin)
- External APIs (HTTP responses, third-party services)
- File system (file contents, JSON.parse results)
- Browser APIs (URL params, localStorage, form data)

**Failure without validation:** Runtime errors, security vulnerabilities, untestable error paths, false sense of type
safety.

## The Validation Contract

Projects use validation libraries (Zod, Yup, io-ts) to define contracts. These contracts:

- Define the expected shape with TypeScript types
- Validate data at runtime with `.parse()` or `.safeParse()`
- Brand primitive types to prevent raw primitives from leaking

### parse() vs safeParse()

**Use `.parse()`** when you want validation errors to throw:

```typescript
const user = userContract.parse(data);  // Throws ZodError if invalid
// Continue with user (validated)
```

**Use `.safeParse()`** when you want to handle errors explicitly:

```typescript
const result = userContract.safeParse(data);
if (!result.success) {
  // Handle validation error
  return res.status(400).json({ error: result.error });
}
// Continue with result.data (validated)
```

**Guideline:**

- **Responders:** Use `.safeParse()` to return proper HTTP error responses
- **Adapters/Brokers:** Use `.parse()` to let errors bubble up (responder handles them)
- **Internal validation:** Either works, prefer `.parse()` for simplicity

### Branding Limitations

**What can be branded:**

- Primitives: `z.string().brand<'UserId'>()`, `z.number().brand<'Count'>()`

**What cannot be branded:**

- Objects: `z.object({ ... })` - no `.brand()` method
- Arrays: `z.array(...)` - no `.brand()` method
- Booleans: `z.boolean()` - no `.brand()` method
- Unions: `z.union([...])` - no `.brand()` method

**Pattern:** Complex types are composed of branded primitives:

```typescript
// ✅ CORRECT - Object with branded primitives
export const userContract = z.object({
  id: z.string().uuid().brand<'UserId'>(),      // branded
  name: z.string().min(1).brand<'UserName'>(),  // branded
  age: z.number().int().brand<'UserAge'>(),     // branded
  isActive: z.boolean(),                         // cannot brand
});
export type User = z.infer<typeof userContract>;

// ✅ CORRECT - Array of branded type (using UserId from above)
export const userIdContract = z.string().uuid().brand<'UserId'>();
export const userIdsContract = z.array(userIdContract);
export type UserIds = z.infer<typeof userIdsContract>;
```

**Validation is required regardless of branding.** Even unbrandable types must go through `.parse()`:

```typescript
// contracts/active-status/active-status-contract.ts
export const activeStatusContract = z.boolean();
export type ActiveStatus = z.infer<typeof activeStatusContract>;

// adapters/api/api-get-status.ts
export const apiGetStatus = async (): Promise<ActiveStatus> => {
  const response = await axiosGet({ url });
  return activeStatusContract.parse(response.data);  // ✅ Validates boolean
};
```

## System Boundaries

### 1. Responder Boundary (Input Validation)

**Responders** are the first code that receives external data. They MUST validate before any processing.

**Sources:**

- Backend: `req.body`, `req.params`, `req.query`
- Frontend: `useParams()`, `useSearchParams()`, form data
- CLI/Hooks: `stdin`, command args

**Rule: All responder inputs must be typed `unknown` and validated**

```typescript
// ✅ CORRECT - Backend responder
export const UserCreateResponder = async ({
  req,
  res
}: {
  req: Request;
  res: Response;
}): Promise<void> => {
  const body: unknown = req.body;  // Explicit unknown
  const validated = userCreateContract.safeParse(body);

  if (!validated.success) {
    return res.status(400).json({ error: validated.error });
  }

  const user = await userCreateBroker({ userData: validated.data });
  res.status(201).json(user);
};

// ✅ CORRECT - Frontend responder
export const UserProfileResponder = (): JSX.Element => {
  const params = useParams();  // External source (returns Record<string, string | undefined>)
  const parseResult = userIdContract.safeParse(params.id);

  if (!parseResult.success) {
    return <ErrorWidget message="Invalid user ID" />;
  }

  const userId = parseResult.data;  // Now typed as UserId (validated)
  const { data, loading, error } = useUserDataBinding({ userId });

  if (loading) return <LoadingWidget />;
  if (error) return <ErrorWidget message={error.message} />;
  if (!data) return <NotFoundWidget />;

  return <UserCardWidget user={data} />;
};

// ✅ CORRECT - Hook/CLI responder
export const HookPreEditResponder = async ({
  input
}: {
  input: unknown;  // stdin is always unknown
}): Promise<HookResponderResult> => {
  const parseResult = hookDataContract.safeParse(input);

  if (!parseResult.success) {
    throw new Error(`Invalid hook data: ${parseResult.error}`);
  }

  return processHook({ data: parseResult.data });
};

// ❌ WRONG - No validation
export const UserCreateResponder = async ({ req, res }) => {
  const user = await userCreateBroker({ userData: req.body });  // req.body is unknown!
  res.json(user);
};

// ❌ WRONG - Type assertion instead of validation
export const UserProfileResponder = (): JSX.Element => {
  const { id } = useParams();
  const { data } = useUserDataBinding({ userId: id as UserId });  // No validation!
  return <UserCardWidget user={data} />;
};
```

### 2. Adapter Boundary (External Library Responses)

**Adapters** wrap external libraries and add project policies. They MUST validate external data before returning.

**Sources:**

- HTTP clients (axios, fetch, got)
- File system (fs.readFile, fs.readJSON)
- Databases (query results)
- Third-party SDKs (Stripe, AWS, etc.)

**Rule: Adapters must validate OR return library type for broker validation**

**Pattern 1: Adapter validates (specific domain adapter)**

```typescript
// adapters/fs/fs-read-file.ts
import { readFile } from 'fs/promises';
import { fileContentsContract, type FileContents } from '../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const fsReadFile = async ({
  filePath
}: {
  filePath: FilePath;
}): Promise<FileContents> => {
  const content = await readFile(filePath, 'utf8');
  return fileContentsContract.parse(content);  // ✅ Validates before return
};

// Broker can use directly - already validated
const contents = await fsReadFile({ filePath });
return contents;  // Safe - FileContents is validated
```

**Pattern 2: Adapter returns library type (generic adapter)**

```typescript
// adapters/axios/axios-get.ts
import axios, { type AxiosResponse } from 'axios';
import type { Url } from '../../contracts/url/url-contract';

// Re-export library type to signal "broker must validate payload"
export type { AxiosResponse };

export const axiosGet = async ({
  url
}: {
  url: Url;
}): Promise<AxiosResponse> => {
  return await axios.get(url, {
    headers: { 'Authorization': `Bearer ${getToken()}` },  // getToken from auth state
    timeout: 10000
  });
};

// Broker MUST validate response.data
const response = await axiosGet({ url });
return userContract.parse(response.data);  // ✅ Broker validates
```

**Invalid patterns:**

```typescript
// ❌ WRONG - Returns raw external data without validation
export const fsReadFile = async ({ filePath }: { filePath: FilePath }): Promise<string> => {
  return await readFile(filePath, 'utf8');  // No .parse()!
};

// ❌ WRONG - Returns unknown without contract enforcement
export const apiGet = async ({ url }: { url: Url }): Promise<unknown> => {
  const response = await axios.get(url);
  return response.data;  // No validation, no library type
};
```

### 3. Broker Boundary (Using Generic Adapters)

**Brokers** orchestrate business logic. When using generic adapters (that return library types), they MUST validate
payloads.

**Rule: Accessing `any`/`unknown` properties requires validation**

```typescript
// ✅ CORRECT - Validates generic adapter response
import { axiosGet, type AxiosResponse } from '../../../adapters/axios/axios-get';
import { userContract, type User } from '../../../contracts/user/user-contract';

export const userFetchBroker = async ({
  userId
}: {
  userId: UserId;
}): Promise<User> => {
  const response: AxiosResponse = await axiosGet({ url });

  // response.data is `any` - must validate
  return userContract.parse(response.data);  // ✅ Validated
};

// ✅ CORRECT - Uses specific adapter directly
import { pathDirname } from '../../../adapters/path/path-dirname';

export const configResolveBroker = async (): Promise<ConfigPath> => {
  const nextPath = pathDirname({ path: parentConfigPath });
  return nextPath;  // ✅ PathString already validated by adapter
};

// ❌ WRONG - Returns unvalidated payload
export const userFetchBroker = async ({ userId }): Promise<User> => {
  const response = await axiosGet({ url });
  return response.data;  // AxiosResponse.data is `any` - no validation!
};

// ❌ WRONG - Type assertion instead of validation
export const userFetchBroker = async ({ userId }): Promise<User> => {
  const response = await axiosGet({ url });
  return response.data as User;  // Type assertion, no runtime validation!
};
```

### 4. Generic Adapter Boundary (Type Parameters)

**Generic adapters** that accept type parameters MUST require contracts for validation.

**Rule: Generic `<T>` return requires `ZodSchema<T>` parameter**

```typescript
// ✅ CORRECT - Generic requires contract
export const apiGet = <T>({
  url,
  contract
}: {
  url: Url;
  contract: z.ZodSchema<T>;
}): Promise<T> => {
  const response = await axios.get(url);
  return contract.parse(response.data);  // ✅ Validates with provided contract
};

// Usage
const user = await apiGet({
  url,
  contract: userContract  // Must provide contract
});

// ❌ WRONG - Generic with type assertion (bypasses validation)
export const apiGet = <T>({ url }: { url: Url }): Promise<T> => {
  const response = await axios.get(url);
  return response.data as T;  // Type assertion, no validation!
};

// ❌ WRONG - Generic without contract parameter
export const apiGet = <T>({ url }: { url: Url }): Promise<T> => {
  const response = await axios.get(url);
  return response.data;  // No way to validate!
};
```

### 5. JSON.parse Boundary

**JSON.parse** returns `any` - MUST validate before use.

**Rule: JSON.parse result must be validated**

```typescript
// ✅ CORRECT - Validates parsed JSON
const config = configContract.parse(JSON.parse(fileContents));

// ✅ CORRECT - safeParse with error handling
const parseResult = configContract.safeParse(JSON.parse(fileContents));
if (!parseResult.success) {
  throw new Error(`Invalid config: ${parseResult.error}`);
}
return parseResult.data;

// ❌ WRONG - Uses parsed JSON without validation
const config = JSON.parse(fileContents);
return config.apiKey;  // config is `any`!
```

## Lint Rules

### Rule 1: `responder-validate-input`

**Trigger:** File in `responders/` folder

**Check:** Access to external input sources:

- `req.body`, `req.params`, `req.query`
- `useParams()`, `useSearchParams()`
- Parameter named `input` (for stdin/CLI)

**Require:** Must call `.parse()` or `.safeParse()` before using value

**Detection:**

```typescript
if (
  filePathMatches(/responders\/.*-responder\.tsx?$/) &&
  (
    accessesProperty(node, 'req.body') ||
    accessesProperty(node, 'req.params') ||
    accessesProperty(node, 'req.query') ||
    callsFunction(node, 'useParams') ||
    callsFunction(node, 'useSearchParams') ||
    hasParameter(node, 'input')
  ) &&
  !followedByValidation(node)
) {
  fail('Responder must validate external input with .parse() or .safeParse()');
}
```

### Rule 2: `stdin-input-unknown`

**Trigger:** Parameter named `input` in responders or CLI handlers

**Check:** Type annotation on `input` parameter

**Require:** Must be typed `unknown`

**Detection:**

```typescript
if (
  (filePathMatches(/responders\/.*-responder\.ts$/) || filePathMatches(/startup\/start-.*\.ts$/)) &&
  hasParameter(node, 'input') &&
  parameterType(node, 'input') !== 'unknown'
) {
  fail('Parameter "input" in boundary functions must be typed as "unknown" for stdin/external data');
}
```

**Rationale:** The parameter name `input` conventionally indicates stdin or external input in boundary functions.
Internal functions may use `input` for already-validated data.

### Rule 3: `adapter-validate-before-return`

**Trigger:** File in `adapters/` that calls external library (node_modules import)

**Check:** Return value path

**Require:** Must pass through `.parse()` or `.safeParse()` OR return re-exported library type

**Detection:**

```typescript
if (
  filePathMatches(/adapters\/.*\.ts$/) &&
  callsExternalLibrary(node) &&
  !returnPathIncludesValidation(node) &&
  !returnsReexportedLibraryType(node)
) {
  fail('Adapter must validate external data with .parse() or return library type for broker validation');
}
```

### Rule 4: `broker-validate-unknown-properties`

**Trigger:** File in `brokers/` folder

**Check:** Property access on adapter return value where property type is `any`/`unknown`

**Require:** Must validate before use

**Detection:**

```typescript
if (
  filePathMatches(/brokers\/.*-broker\.ts$/) &&
  valueFromAdapter(variable) &&
  accessesProperty(variable, property) &&
  (propertyType(property) === 'any' || propertyType(property) === 'unknown')
) {
  fail('Broker must validate adapter response property with .parse() before use');
}
```

### Rule 5: `no-generic-type-assertion`

**Trigger:** File in `adapters/` with generic type parameter

**Check:** Type assertion using generic parameter

**Require:** Cannot use `as T` with generic parameters

**Detection:**

```typescript
if (
  filePathMatches(/adapters\/.*\.ts$/) &&
  hasGenericTypeParameter(function) &&
  usesTypeAssertion(returnValue, genericParam)
) {
  fail('Cannot use type assertion with generic parameters. Accept ZodSchema<T> and call .parse()');
}
```

### Rule 6: `generic-requires-validator`

**Trigger:** Generic adapter that calls external library

**Check:** Function parameters for validator

**Require:** Must accept `ZodSchema<T>` or similar validator parameter

**Detection:**

```typescript
if (
  filePathMatches(/adapters\/.*\.ts$/) &&
  hasGenericTypeParameter(function) &&
  callsExternalLibrary(function) &&
  !hasValidatorParameter(function)
) {
  fail('Generic adapters must accept ZodSchema<T> parameter for validation');
}
```

### Rule 7: `json-parse-validate`

**Trigger:** `JSON.parse()` call anywhere

**Check:** Result usage

**Require:** Must be passed to `.parse()` or `.safeParse()` before property access

**Detection:**

```typescript
if (
  callsFunction(node, 'JSON.parse') &&
  !passedToValidation(node)
) {
  fail('JSON.parse result must be validated with .parse() before use');
}
```

### Rule 8: `import-from-adapters-only`

**Trigger:** File outside `adapters/` or `middleware/`

**Check:** Import source

**Require:** Cannot import from node_modules (except type-only imports)

**Detection:**

```typescript
if (
  !filePathMatches(/(adapters|middleware)\/.*\.ts$/) &&
  importsFromNodeModules(node) &&
  !isTypeOnlyImport(node)
) {
  fail('Must import through adapters/ layer. Create adapter wrapper for node_modules packages');
}
```

## Validation Patterns by Data Source

| Data Source            | Location          | Pattern             | Example                                    |
|------------------------|-------------------|---------------------|--------------------------------------------|
| HTTP Request Body      | Responder         | Parse req.body      | `userContract.parse(req.body)`             |
| HTTP Request Params    | Responder         | Parse req.params    | `userIdContract.parse(req.params.id)`      |
| URL Parameters (React) | Responder         | Parse useParams()   | `userIdContract.safeParse(params.id)`      |
| stdin/CLI args         | Responder         | Accept unknown      | `({ input }: { input: unknown })`          |
| External API Response  | Adapter or Broker | Parse response.data | `userContract.parse(response.data)`        |
| File Read              | Adapter           | Parse file contents | `fileContentsContract.parse(content)`      |
| JSON.parse             | Any               | Parse result        | `configContract.parse(JSON.parse(json))`   |
| Database Query         | Adapter           | Parse rows          | `usersContract.parse(rows)`                |
| localStorage           | Responder/Binding | Parse stored value  | `configContract.parse(JSON.parse(stored))` |

## Contract Definition Standards

Contracts MUST:

- Be defined in `contracts/` folder
- Use validation library schemas (Zod preferred)
- Brand primitive types with `.brand<'TypeName'>()`
- Export both contract and inferred type

```typescript
// contracts/user-id/user-id-contract.ts
import { z } from 'zod';

export const userIdContract = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof userIdContract>;

// contracts/user/user-contract.ts
import { z } from 'zod';
import { userIdContract } from '../user-id/user-id-contract';
import { emailAddressContract } from '../email-address/email-address-contract';

export const userContract = z.object({
  id: userIdContract,
  email: emailAddressContract,
  name: z.string().min(1).brand<'UserName'>(),
  age: z.number().int().positive().brand<'UserAge'>(),
});

export type User = z.infer<typeof userContract>;
```

## Testing Boundary Validation

**Why `unknown` input enables testable error paths:**

When a function accepts a strictly-typed parameter (e.g., `input: HookData`), TypeScript prevents passing invalid data
in tests. This makes error validation paths untestable without type assertions.

By accepting `unknown`, the function can receive any data at runtime (matching reality), and tests can naturally pass
invalid inputs to verify error handling.

**The pattern:**

```typescript
// ✅ CORRECT - Accept unknown for error testing
export const HookResponder = async ({ input }: { input: unknown }) => {
  const validated = hookDataContract.safeParse(input);
  if (!validated.success) {
    throw new Error(`Invalid input: ${validated.error}`);
  }
  // Use validated.data with full type safety
  const processedData = validated.data;
  // ...
};

// Test error case naturally - no type assertions needed
it('ERROR: {invalid data} => throws error', async () => {
  const invalidData = { wrong: 'shape' };

  // TypeScript allows this because input is unknown
  await expect(HookResponder({ input: invalidData })).rejects.toThrow('Invalid input');
});

// Test success case with valid data
it('VALID: {valid data} => processes successfully', async () => {
  const validData = HookDataStub();

  const result = await HookResponder({ input: validData });
  expect(result).toStrictEqual({ success: true });
});
```

**Anti-pattern - type assertions bypass safety:**

```typescript
// ❌ WRONG - Strict type prevents testing error cases
export const BadResponder = async ({ input }: { input: HookData }) => {
  // Can't test what happens with invalid input!
};

// ❌ WRONG - Type assertion in tests (violates testing-standards.md)
it('ERROR: invalid data', async () => {
  const invalidData = { wrong: 'shape' } as HookData;  // Lie to TypeScript
  await expect(BadResponder({ input: invalidData })).rejects.toThrow();
  // Test works but requires bypassing type system
});
```

**Key insight:** `unknown` input + runtime validation = testable error paths without type assertions.

## Decision Tree for LLMs

Use this flowchart when deciding how to handle data:

### Am I writing a responder?

- **YES** → Accept `input: unknown`, validate immediately with `.safeParse()`
- **NO** → Continue to next question

### Am I writing an adapter?

- **YES** → Does broker need library features (status, headers)?
    - **YES** → Return library type (e.g., `AxiosResponse`) + re-export type
    - **NO** → Validate with `.parse()`, return branded contract type
- **NO** → Continue to next question

### Am I writing a broker using an adapter?

- **YES** → Check the adapter's return type annotation:
    - **Returns contract type** (e.g., `Promise<FileContents>`, `Promise<UserId>`) → Use directly, already validated
    - **Returns + re-exports library type** (e.g., `export type { AxiosResponse }; ... Promise<AxiosResponse>`) →
      Validate payload with `.parse()`
- **NO** → Continue to next question

### Am I using JSON.parse?

- **YES** → Immediately pass result to contract `.parse()`
- **NO** → You may not need validation (internal transformations)

### Am I creating a generic adapter with type parameter `<T>`?

- **YES** → Must accept `contract: ZodSchema<T>` parameter and call `contract.parse()`
- **NO** → Follow patterns above

**Key rule:** If data crosses from external world → your code, it must be validated at the boundary.

## Common Pitfalls for LLMs

### Pitfall 1: Trusting TypeScript Types for External Data

```typescript
// ❌ WRONG - Type annotation doesn't validate at runtime
export const processUser = ({ data }: { data: User }) => {
  // data could be ANYTHING at runtime!
};

// ✅ CORRECT - Accept unknown, validate at runtime
export const processUser = ({ data }: { data: unknown }) => {
  const validated = userContract.parse(data);
  // Now validated is truly a User
};
```

### Pitfall 2: Using Type Assertions Instead of Validation

```typescript
// ❌ WRONG - Type assertion bypasses validation
const user = response.data as User;

// ✅ CORRECT - Contract validates and transforms
const user = userContract.parse(response.data);
```

### Pitfall 3: Forgetting to Validate JSON.parse Results

```typescript
// ❌ WRONG - JSON.parse returns any
const config = JSON.parse(fileContents);
return config.apiKey;

// ✅ CORRECT - Validate parsed JSON
const config = configContract.parse(JSON.parse(fileContents));
return config.apiKey;
```

### Pitfall 4: Creating Generic Adapters Without Contract Parameters

```typescript
// ❌ WRONG - No way to validate T
export const apiGet = <T>(url: Url): Promise<T> => {
  return axios.get(url).then(r => r.data as T);  // Type assertion!
};

// ✅ CORRECT - Require contract parameter
export const apiGet = <T>({ url, contract }: { url: Url; contract: ZodSchema<T> }): Promise<T> => {
  return axios.get(url).then(r => contract.parse(r.data));
};
```

### Pitfall 5: Validating in Adapters When Broker Needs Library Features

```typescript
// ❌ SUBOPTIMAL - Adapter validates, broker can't access status/headers
export const apiGet = async ({ url }: { url: Url }): Promise<User> => {
  const response = await axios.get(url);
  return userContract.parse(response.data);  // Lost response.status, response.headers!
};

// ✅ CORRECT - Return library type, let broker validate and access features
export type { AxiosResponse };
export const axiosGet = async ({ url }: { url: Url }): Promise<AxiosResponse> => {
  return await axios.get(url);
};

// Broker can now check status AND validate
const response = await axiosGet({ url });
if (response.status === 404) throw new NotFoundError();
return userContract.parse(response.data);
```

### Pitfall 6: Accepting Strictly-Typed Parameters in Responders

```typescript
// ❌ WRONG - Can't test error cases without type assertions
export const HookResponder = async ({ input }: { input: HookData }) => {
  // No way to test what happens with invalid input!
};

// ✅ CORRECT - Accept unknown, enable error testing
export const HookResponder = async ({ input }: { input: unknown }) => {
  const validated = hookDataContract.safeParse(input);
  if (!validated.success) throw new Error('Invalid input');
  // Now can test both valid and invalid inputs naturally
};
```

## Summary

**Every external data crossing into your system must be validated through contracts:**

1. **Responders** - First contact with external world, accept `unknown`, validate immediately
2. **Adapters** - Wrap external libraries, validate OR return library type
3. **Brokers** - Validate generic adapter responses, use specific adapters directly
4. **All** - JSON.parse, file reads, API responses require validation

**Lint enforces this at every boundary - no external data reaches business logic unvalidated.**
