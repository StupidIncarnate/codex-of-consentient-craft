# adapters/ - External Package Boundary Translation

**Purpose:** Translate between external package APIs and application contracts

**Folder Structure:**

```
adapters/
  axios/
    get/
      axios-get-adapter.ts
      axios-get-adapter.proxy.ts       # Mocks axios npm package
      axios-get-adapter.test.ts
    post/
      axios-post-adapter.ts
      axios-post-adapter.proxy.ts
      axios-post-adapter.test.ts
  fs/
    read-file/
      fs-read-file-adapter.ts
      fs-read-file-adapter.proxy.ts    # Mocks fs/promises npm package
      fs-read-file-adapter.test.ts
    ensure-write/
      fs-ensure-write-adapter.ts       # Composes mkdir + writeFile
      fs-ensure-write-adapter.proxy.ts
      fs-ensure-write-adapter.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case `[package-name]-[operation]-adapter.ts`
- **Export:** camelCase ending with `Adapter` (e.g., `axiosGetAdapter`, `fsEnsureWriteAdapter`)
- **Proxy:** kebab-case ending with `-adapter.proxy.ts`, export `[name]AdapterProxy` (e.g., `httpAdapterProxy`)
- **Pattern:** adapters/[package-name]/[operation]/[package-name]-[operation]-adapter.ts

**Constraints:**

- **CRITICAL: One export per file** - Each adapter file exports exactly one arrow function
- **MUST be arrow function** - `export const x = () => {}` NOT `export function x() {}` or re-exports
- **ALL inputs MUST use contracts** - No raw `string`, `number`, etc.
- **ALL outputs MUST use contracts** - No returning npm package types
- **Every contract MUST have a stub** - For type-safe testing
- **Contracts don't need to match npm types** - Adapter translates app contracts ↔ npm types
- **Type only what you use** - Expand contracts incrementally as needed
- **Can compose multiple package functions** - If they accomplish one app operation **from the same npm package only**
- **CANNOT import other adapters** - Adapters only call functions from their associated npm package (folder name =
  package name)
- **Package name prefixes filename** - `axios-get-adapter.ts` not `http-get-adapter.ts`
- **Brands on primitives** - Brand `string`/`number`, not objects
- **Must** add project-specific configuration (timeout, auth, retry, logging)
- **Must** know NOTHING about business logic

**Translation Pattern:**

```tsx
// App uses our contracts
FilePath → Adapter
translates → string(
for fs.readFile)
    Adapter
translates ← Buffer(from
fs.readFile
)
FileContents ← Result

// Adapter is the boundary translator
export const fsReadFileAdapter = async ({
                                            filePath
                                        }: {
    filePath: FilePath;  // Input: our contract
}): Promise<FileContents> => {  // Output: our contract
    // Translate contract → npm type
    const rawPath: string = filePath; // FilePath is branded string

    // Call npm package with its types
    const buffer = await readFile(rawPath);

    // Translate npm type → contract
    return fileContentsContract.parse(buffer.toString('utf8'));
};
```

**Composition Example:**

One adapter can use multiple functions from the same package:

```tsx
// adapters/fs/ensure-write/fs-ensure-write-adapter.ts
import {mkdir, writeFile} from 'fs/promises';
import {dirname} from 'path';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../../contracts/file-contents/file-contents-contract';

export const fsEnsureWriteAdapter = async ({
                                               filePath,
                                               content
                                           }: {
    filePath: FilePath;
    content: FileContents;
}): Promise<void> => {
    const dir = dirname(filePath);
    await mkdir(dir, {recursive: true});  // fs.mkdir
    await writeFile(filePath, content);     // fs.writeFile
    // Both accomplish one app operation: "safely write file"
};
```

**Contract Requirements:**

Every contract needs a corresponding stub for type-safe testing:

```tsx
// contracts/http-response/http-response-contract.ts
export const httpResponseContract = z.object({
    body: z.unknown(),
    statusCode: z.number().int().min(100).max(599).brand<'StatusCode'>(),  // Brand on primitive
    headers: z.record(z.string()),
});
export type HttpResponse = z.infer<typeof httpResponseContract>;

// contracts/http-response/http-response.stub.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';

export const HttpResponseStub = ({...props}: StubArgument<HttpResponse> = {}): HttpResponse =>
    httpResponseContract.parse({
        body: {},
        statusCode: 200,
        headers: {},
        ...props,
    });

// contracts/file-path/file-path-contract.ts
export const filePathContract = z.string().brand<'FilePath'>();  // Brand on primitive
export type FilePath = z.infer<typeof filePathContract>;

// contracts/file-path/file-path.stub.ts
export const FilePathStub = ({value}: { value: string } = {value: '/test/file.ts'}): FilePath =>
    filePathContract.parse(value);
```

**Incremental Contract Expansion:**

Don't type everything upfront - type only what you use:

```tsx
// V1: Only need body and status
export const httpResponseContract = z.object({
    body: z.unknown(),
    statusCode: z.number().int().brand<'StatusCode'>(),
});

// V2: Later, need headers too
export const httpResponseContract = z.object({
    body: z.unknown(),
    statusCode: z.number().int().brand<'StatusCode'>(),
    headers: z.record(z.string()),  // Added
});

// V3: Even later, need cookies
export const httpResponseContract = z.object({
    body: z.unknown(),
    statusCode: z.number().int().brand<'StatusCode'>(),
    headers: z.record(z.string()),
    cookies: z.record(z.string().brand<'CookieValue'>()),  // Added with branded values
});
```

**Complex Types (Functions, Classes):**

When types include functions alongside data properties, split the contract and type:

```tsx
// contracts/eslint-context/eslint-context-contract.ts
import {z} from 'zod';

// Contract defines ONLY data properties (no z.function())
export const eslintContextContract = z.object({
    filename: z.string().brand<'Filename'>().optional(),
});

// TypeScript type adds function methods via intersection
export type EslintContext = z.infer<typeof eslintContextContract> & {
    report: (...args: unknown[]) => unknown;
    getFilename?: () => string & z.BRAND<'Filename'>;
    getScope?: () => unknown;
    getSourceCode?: () => unknown;
};
```

**Why split contract and type?**

- Zod's `z.function()` breaks TypeScript type inference (functions infer as `{}`)
- `StubArgument<T>` utility type now preserves function signatures
- Contract validates data, TypeScript enforces function signatures

**Stub for tests:**

```tsx
// contracts/eslint-context/eslint-context.stub.ts
import type {StubArgument} from '@dungeonmaster/shared/@types';

const filenameContract = z.string().brand<'Filename'>();

export const EslintContextStub = ({
                                      ...props
                                  }: StubArgument<EslintContext> = {}): EslintContext => {
    // Separate function props from data props
    const {report, getFilename, getScope, getSourceCode, ...dataProps} = props;

    // Return: validated data + functions (preserved references)
    return {
        // Data properties validated through contract
        ...eslintContextContract.parse({
            filename: filenameContract.parse('/test/file.ts'),
            ...dataProps,
        }),
        // Function properties preserved (not parsed to maintain references)
        report: report ?? ((..._args: unknown[]): unknown => true),
        getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> =>
            filenameContract.parse('/test/file.ts')),
        getScope: getScope ?? ((): unknown => ({})),
        getSourceCode: getSourceCode ?? ((): unknown => ({})),
    };
};
```

**Key Points:**

- Contract validates data only
- Type intersection adds functions
- Stub separates functions from data
- Functions preserved outside `contract.parse()` to maintain references for `jest.fn()`

**Examples:**

```tsx
/**
 * PURPOSE: Reads file contents from filesystem and validates as FileContents contract
 *
 * USAGE:
 * await fsReadFileAdapter({filePath: '/config.json'});
 * // Returns validated FileContents
 */
// Pattern 1: Simple translation
// adapters/fs/read-file/fs-read-file-adapter.ts
import {readFile} from 'fs/promises';
import {fileContentsContract} from '../../../contracts/file-contents/file-contents-contract';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapter = async ({
                                            filePath
                                        }: {
    filePath: FilePath;
}): Promise<FileContents> => {
    const buffer = await readFile(filePath);
    return fileContentsContract.parse(buffer.toString('utf8'));
};

// Pattern 2: Complex translation
// adapters/axios/get/axios-get-adapter.ts
import axios from 'axios';
import {httpResponseContract} from '../../../contracts/http-response/http-response-contract';
import type {Url} from '../../../contracts/url/url-contract';
import type {HttpResponse} from '../../../contracts/http-response/http-response-contract';

export const axiosGetAdapter = async ({
                                          url
                                      }: {
    url: Url;
}): Promise<HttpResponse> => {
    // axios.get returns AxiosResponse with its own types
    const response = await axios.get(url, {
        timeout: 10000,
        headers: {'Authorization': `Bearer ${getToken()}`},
    });

    // Translate to our contract (only what we need)
    return httpResponseContract.parse({
        body: response.data,
        statusCode: response.status,
        headers: response.headers,
    });
};

// Pattern 3: Composition of package functions
// adapters/fs/copy-file/fs-copy-file-adapter.ts
import {readFile, writeFile, mkdir} from 'fs/promises';
import {dirname} from 'path';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';

export const fsCopyFileAdapter = async ({
                                            source,
                                            destination
                                        }: {
    source: FilePath;
    destination: FilePath;
}): Promise<void> => {
    const content = await readFile(source);           // fs.readFile
    const dir = dirname(destination);
    await mkdir(dir, {recursive: true});            // fs.mkdir
    await writeFile(destination, content);            // fs.writeFile
    // Multiple fs functions, one app operation: "copy file safely"
};
```

**Testing:**

Adapter tests use adapter proxies to mock npm dependencies.
See [Testing Standards - Proxy Architecture](testing-standards.md#proxy-architecture) for complete details.

```tsx
// adapters/fs/read-file/fs-read-file-adapter.test.ts
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {fsReadFileAdapterProxy} from './fs-read-file-adapter.proxy';
import {FilePathStub} from '../../../contracts/file-path/file-path.stub';
import {FileContentsStub} from '../../../contracts/file-contents/file-contents.stub';

describe('fsReadFileAdapter', () => {
    it('VALID: {filePath: "/config.json"} => returns file contents', async () => {
        // Create proxy (mocks fs/promises npm package)
        const adapterProxy = fsReadFileAdapterProxy();

        const filePath = FilePathStub('/config.json');
        const expected = FileContentsStub('{"key": "value"}');

        adapterProxy.returns({filePath, contents: expected});

        const result = await fsReadFileAdapter({filePath});

        expect(result).toStrictEqual(expected);
    });
});
```