**FOLDER STRUCTURE:**

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

**CRITICAL CONSTRAINTS:**

- **CRITICAL: One export per file** - Each adapter file exports exactly ONE arrow function
- **MUST be arrow function** - `export const x = () => {}` NOT `export function x() {}` or re-exports
- **CANNOT import other adapters** - Adapters only call functions from their associated npm package (folder name =
  package name)
- **MUST add project-specific configuration** - Add timeout, auth headers, retry logic, logging, etc. to npm package
  calls

**TRANSLATION BOUNDARY:**

- Adapters translate between external package APIs and application contracts
- Input: Application contracts (branded types)
- Output: Application contracts (branded types)
- Inside: npm package types (Buffer, AxiosResponse, etc.)

**COMPOSITION:**

- Can compose multiple functions from the SAME npm package only
- Package name MUST prefix filename (axios-get-adapter.ts not http-get-adapter.ts)
- Folder name = package name (adapters/axios/, adapters/fs/)

**CONTRACT REQUIREMENTS:**

- ALL inputs MUST use contracts (no raw string, number)
- ALL outputs MUST use contracts (no returning npm package types)
- Contracts don't need to match npm types exactly - adapter translates
- Type only what you use - expand contracts incrementally

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Reads file contents from filesystem and validates as FileContents contract
 *
 * USAGE:
 * await fsReadFileAdapter({filePath: FilePathStub({ value: '/config.json' })});
 * // Returns validated FileContents
 */
// Simple translation - adapters/fs/read-file/fs-read-file-adapter.ts
import {readFile} from 'fs/promises';
import {fileContentsContract} from '../../../contracts/file-contents/file-contents-contract';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapter = async ({
                                            filePath
                                        }: {
    filePath: FilePath;
}): Promise<FileContents> => {
    const buffer = await readFile(filePath);  // FilePath is branded string
    return fileContentsContract.parse(buffer.toString('utf8'));
};

// Complex translation - adapters/axios/get/axios-get-adapter.ts
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

// Composition of multiple functions - adapters/fs/ensure-write/fs-ensure-write-adapter.ts
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
    await writeFile(filePath, content);   // fs.writeFile
    // Both from 'fs/promises' package, one app operation: "safely write file"
};
```

**COMPLEX TYPES (Functions + Data):**

When types include both data and functions, split the contract and type:

```typescript
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
};
```

**Why split?** Zod's `z.function()` breaks type inference. Contract validates data, TypeScript enforces function
signatures.

**PROXY PATTERN:**

Proxies mock the npm package, NOT the adapter. Adapter code runs real in tests.

```typescript
// adapters/axios/get/axios-get-adapter.proxy.ts
import axios from 'axios';
import {HttpResponseStub} from '../../../contracts/http-response/http-response.stub';
import {UrlStub} from '../../../contracts/url/url.stub';

// Declare jest.mock() in proxy (auto-hoisted by Jest)
jest.mock('axios');

export const axiosGetAdapterProxy = () => {
    // Mock the npm package, not the adapter
    const mock = jest.mocked(axios.get);

    // Default mock behavior in constructor
    mock.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
    });

    return {
        // Semantic method for success
        returns: ({url, data}: { url: ReturnType<typeof UrlStub>; data: unknown }) => {
            mock.mockResolvedValueOnce({
                data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as never,
            });
        },

        // Semantic method for error
        throws: ({url, error}: { url: ReturnType<typeof UrlStub>; error: Error }) => {
            mock.mockRejectedValueOnce(error);
        },
    };
};
```

**Empty Proxy Pattern (DSL/Query Adapters):**

For adapters that need real execution to validate logic (ESLint, SQL, GraphQL):

```typescript
// adapters/eslint/rule-tester/eslint-rule-tester-adapter.proxy.ts
export const eslintRuleTesterAdapterProxy = (): Record<PropertyKey, never> => ({});
```

**Why empty:** DSL/query adapters run real in tests to validate your query/selector logic against the actual system.

**Language Primitive Adapters (import, eval, etc.):**

For adapters that wrap language primitives (not npm packages), the proxy mocks the adapter itself.
This is the ONLY exception to the "mock npm package, not adapter" rule.

**Why use this instead of normal `import`?**

Dynamic `import()` is a language primitive - there's no npm package to mock. When code needs to
dynamically load modules at runtime (config files, plugins, user-specified paths), tests can't
control what gets imported. By wrapping `import()` in an adapter, tests can mock the adapter
itself to control what module gets "loaded".

```typescript
// Usage from @dungeonmaster/shared/adapters
import {runtimeDynamicImportAdapter} from '@dungeonmaster/shared/adapters';

const module = await runtimeDynamicImportAdapter<{ SomeExport: string }>({
  path: '/path/to/module.ts',
});
// module = { SomeExport: '...' }
```

**The Adapter's Own Proxy (constructor-based pattern):**

The adapter proxy takes the mock module in the constructor and sets up the mock immediately.
This is simpler than method-based proxies because there's only one operation to mock.

```typescript
// adapters/runtime/dynamic-import/runtime-dynamic-import-adapter.proxy.ts
import {runtimeDynamicImportAdapter} from '@dungeonmaster/shared/adapters';

jest.mock('@dungeonmaster/shared/adapters', () => ({
  ...jest.requireActual('@dungeonmaster/shared/adapters'),
  runtimeDynamicImportAdapter: jest.fn(),
}));

export const runtimeDynamicImportAdapterProxy = ({
                                                   module,
                                                 }: {
  module: unknown;
}): Record<PropertyKey, never> => {
  const mock = jest.mocked(runtimeDynamicImportAdapter<unknown>);
  if (module instanceof Error) {
    mock.mockRejectedValue(module);
  } else {
    mock.mockResolvedValue(module);
  }
  return {};
};
```

**Broker Proxy Pattern (when a broker uses this adapter):**

When a broker uses `runtimeDynamicImportAdapter`, its proxy imports and calls the adapter proxy
from `@dungeonmaster/shared/testing`. The adapter proxy already has the `jest.mock()` declaration
which gets hoisted when imported - broker proxies don't repeat it.

```typescript
// brokers/config/load/config-load-broker.proxy.ts
import {runtimeDynamicImportAdapterProxy} from '@dungeonmaster/shared/testing';

export const configLoadBrokerProxy = () => {
  return {
    // Semantic method wrapping adapter proxy
    loadsConfig: ({config}: { config: unknown }) => {
      runtimeDynamicImportAdapterProxy({module: config});
    },
    // Semantic method for module not found
    configNotFound: () => {
      runtimeDynamicImportAdapterProxy({module: new Error('Cannot find module')});
    },
  };
};
```

**Why mock adapter:** Language primitives like `import()` aren't npm packages - there's nothing to mock.
The adapter proxy mocks the barrel export (`@dungeonmaster/shared/adapters`), and broker proxies
import the adapter proxy from `@dungeonmaster/shared/testing` to reuse that mock setup.

**TEST EXAMPLE:**

```typescript
// adapters/fs/read-file/fs-read-file-adapter.test.ts
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {fsReadFileAdapterProxy} from './fs-read-file-adapter.proxy';
import {FilePathStub} from '../../../contracts/file-path/file-path.stub';
import {FileContentsStub} from '../../../contracts/file-contents/file-contents.stub';

type FilePath = ReturnType<typeof FilePathStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

describe('fsReadFileAdapter', () => {
    describe('successful reads', () => {
        it('VALID: {filePath: "/config.json"} => returns file contents', async () => {
            const proxy = fsReadFileAdapterProxy();
            const filePath = FilePathStub({value: '/config.json'});
            const expectedContents = FileContentsStub({value: '{"key": "value"}'});

            proxy.returns({filePath, contents: expectedContents});

            const result = await fsReadFileAdapter({filePath});

            expect(result).toStrictEqual(expectedContents);
        });

        it('VALID: {filePath: "/empty.txt"} => returns empty contents', async () => {
            const proxy = fsReadFileAdapterProxy();
            const filePath = FilePathStub({value: '/empty.txt'});
            const expectedContents = FileContentsStub({value: ''});

            proxy.returns({filePath, contents: expectedContents});

            const result = await fsReadFileAdapter({filePath});

            expect(result).toStrictEqual(expectedContents);
        });
    });

    describe('error cases', () => {
        it('ERROR: {filePath: "/nonexistent.txt"} => throws file not found error', async () => {
            const proxy = fsReadFileAdapterProxy();
            const filePath = FilePathStub({value: '/nonexistent.txt'});

            proxy.throws({filePath, error: new Error('ENOENT: no such file or directory')});

            await expect(fsReadFileAdapter({filePath})).rejects.toThrow(/ENOENT/u);
        });

        it('ERROR: {filePath: "/no-permission.txt"} => throws permission denied error', async () => {
            const proxy = fsReadFileAdapterProxy();
            const filePath = FilePathStub({value: '/no-permission.txt'});

            proxy.throws({filePath, error: new Error('EACCES: permission denied')});

            await expect(fsReadFileAdapter({filePath})).rejects.toThrow(/EACCES/u);
        });
    });
});
```
