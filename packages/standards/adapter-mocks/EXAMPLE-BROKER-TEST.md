# Example: Broker Test with Adapter Proxy Pattern

**File analyzed:** `packages/config/src/brokers/config-file/load/config-file-load-broker.test.ts`

This example shows:

1. How to create an adapter proxy for `fs-read-file`
2. How the adapter's own tests use the proxy (real fs helpers)
3. How broker tests ALSO use the proxy (mock helpers)
4. How `toHaveBeenCalled` assertions transfer
5. How error throwing works

**Key Point:** Proxies are used EVERYWHERE an adapter is used in tests (not just adapter's own tests)!

---

## Level 1: Adapter's Own Tests (Use Proxy)

### 1. Adapter Implementation

```typescript
// adapters/fs/fs-read-file-adapter.ts
import {readFile} from 'fs/promises';
import {fileContentsContract} from '../../contracts/file-contents/file-contents-contract';
import type {FilePath} from '../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapter = async ({filePath}: { filePath: FilePath }): Promise<FileContents> => {
    try {
        const buffer = await readFile(filePath, 'utf8');
        return fileContentsContract.parse(buffer.toString('utf8'));
    } catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
};
```

### 2. Adapter Proxy (Provides BOTH Real fs AND Mock Helpers)

```typescript
// adapters/fs/fs-read-file-adapter.proxy.ts
import {readFile, writeFile, mkdir, rm} from 'fs/promises';
import {createAdapterProxy} from '@questmaestro/testing';
import {fsReadFileAdapter} from './fs-read-file-adapter';
import type {FilePath} from '../../contracts/file-path/file-path-contract';
import type {FileContents} from '../../contracts/file-contents/file-contents-contract';
import {tmpdir} from 'os';
import {join} from 'path';

export const createFsReadFileProxy = () => {
    return createAdapterProxy(readFile, {useMock: false})((readFileModule) => {
        // ✅ useMock: false = Real fs available for adapter's own tests
        const testDir = join(tmpdir(), `test-fs-${Date.now()}-${crypto.randomUUID()}`);
        const mockAdapter = jest.mocked(fsReadFileAdapter);

        // Auto-cleanup
        afterAll(async () => {
            await rm(testDir, {recursive: true, force: true});
        });

        return {
            testDir,

            // ===== FOR ADAPTER'S OWN TESTS =====
            // Real fs helpers - test actual file operations
            async setupFile(filePath: FilePath, contents: FileContents): Promise<void> {
                const fullPath = join(testDir, filePath);
                const dir = join(testDir, filePath.split('/').slice(0, -1).join('/'));
                await mkdir(dir, {recursive: true});
                await writeFile(fullPath, contents);
            },

            async expectFileContents(filePath: FilePath, expected: FileContents): Promise<void> {
                const fullPath = join(testDir, filePath);
                const actual = await readFileModule(fullPath, 'utf8');
                expect(actual.toString()).toBe(expected);
            },

            // ===== FOR TESTS USING THE ADAPTER (brokers, etc) =====
            // Mock helpers - simple API for setting up adapter behavior
            returns(filePath: FilePath, contents: FileContents): void {
                mockAdapter.mockResolvedValueOnce(contents);
            },

            throws(filePath: FilePath, error: Error): void {
                mockAdapter.mockRejectedValueOnce(error);
            },

            // Getter helpers - return data for assertions (NO expect() in proxy!)
            getCallCount(): number {
                return mockAdapter.mock.calls.length;
            },

            getCallArgs(index: number): { filePath: FilePath } | undefined {
                return mockAdapter.mock.calls[index]?.[0];
            },

            wasCalledWith(filePath: FilePath): boolean {
                return mockAdapter.mock.calls.some(
                    call => call[0]?.filePath === filePath
                );
            }
        };
    });
};
```

**Key Points:**

- ✅ **No `jest.mock()`** - Transformer handles it
- ✅ **No manual cleanup** - `afterAll()` registered in proxy
- ✅ **Dual-purpose** - Real fs helpers AND mock helpers in one proxy
- ✅ **Accepts branded types only** - Type-safe via stubs
- ✅ **Getters, not assertions** - Proxy returns data, test does `expect()`

### 3. Adapter Tests Using Proxy

```typescript
// adapters/fs/fs-read-file-adapter.test.ts
import {fsReadFileAdapter} from './fs-read-file-adapter';
import {createFsReadFileProxy} from './fs-read-file-adapter.proxy';
import {FilePathStub} from '../../contracts/file-path/file-path.stub';
import {FileContentsStub} from '../../contracts/file-contents/file-contents.stub';
import {join} from 'path';

// ✅ NO jest.mock() - transformer auto-hoists

describe('fsReadFileAdapter', () => {
    const fsProxy = createFsReadFileProxy();

    // ✅ NO manual cleanup - proxy handles it

    describe('successful reads', () => {
        it('VALID: {filePath: "config.json"} => reads file contents', async () => {
            const filePath = FilePathStub('config.json');
            const contents = FileContentsStub('{"framework": "react"}');
            const expected = FileContentsStub('{"framework": "react"}');

            await fsProxy.setupFile(filePath, contents);

            const fullPath = FilePathStub(join(fsProxy.testDir, filePath));
            const result = await fsReadFileAdapter({filePath: fullPath});

            expect(result).toStrictEqual(expected);
        });

        it('VALID: {filePath: "nested/deep/file.txt"} => reads nested file', async () => {
            const filePath = FilePathStub('nested/deep/file.txt');
            const contents = FileContentsStub('nested content');
            const expected = FileContentsStub('nested content');

            await fsProxy.setupFile(filePath, contents);

            const fullPath = FilePathStub(join(fsProxy.testDir, filePath));
            const result = await fsReadFileAdapter({filePath: fullPath});

            expect(result).toStrictEqual(expected);
        });
    });

    describe('error cases', () => {
        it('ERROR: {filePath: "missing.txt"} => throws when file does not exist', async () => {
            const filePath = FilePathStub('missing.txt');

            // Don't setup file - will throw ENOENT
            const fullPath = FilePathStub(join(fsProxy.testDir, filePath));

            await expect(fsReadFileAdapter({filePath: fullPath})).rejects.toThrow(
                /Failed to read file.*ENOENT/
            );
        });
    });
});
```

**🔍 Key Observation: NO `toHaveBeenCalled` Assertions!**

The proxy uses REAL fs, so:

- ❌ Can't use `expect(mockReadFile).toHaveBeenCalledWith(...)` - there's no mock!
- ✅ Instead: Assert on **effects** (file contents, errors thrown)
- ✅ Tests validate REAL behavior (permissions, encoding, actual file I/O)

---

## Level 2: Broker Tests (ALSO Use Proxy!)

### Broker Implementation

```typescript
// brokers/config-file/load/config-file-load-broker.ts
import {fsReadFileAdapter} from '../../../adapters/fs/fs-read-file-adapter';
import {InvalidConfigError} from '../../../errors/invalid-config/invalid-config-error';
import {configContract} from '../../../contracts/config/config-contract';
import type {FilePath} from '../../../contracts/file-path/file-path-contract';
import type {Config} from '../../../contracts/config/config-contract';

export const configFileLoadBroker = async ({configPath}: { configPath: FilePath }): Promise<Config> => {
    try {
        const contents = await fsReadFileAdapter({filePath: configPath});
        const parsed = JSON.parse(contents);

        // Validate config structure
        if (typeof parsed !== 'object' || parsed === null) {
            throw new InvalidConfigError({
                message: 'Config must be an object',
                configPath,
            });
        }

        return configContract.parse(parsed);
    } catch (error) {
        if (error instanceof InvalidConfigError) {
            throw error;
        }
        throw new InvalidConfigError({
            message: `Failed to load config file: ${error}`,
            configPath,
        });
    }
};
```

### Broker Tests (Use Proxy's Mock Helpers)

```typescript
// brokers/config-file/load/config-file-load-broker.test.ts
import { configFileLoadBroker } from './config-file-load-broker';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { createFsReadFileProxy } from '../../../adapters/fs/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

// ✅ NO jest.mock() - transformer auto-hoists

describe('configFileLoadBroker', () => {
  const fsProxy = createFsReadFileProxy();

  describe('successful config loading', () => {
    it('VALID: {configPath: "/project/.questmaestro"} => loads JSON config', async () => {
      const configPath = FilePathStub('/project/.questmaestro');
      const contents = FileContentsStub(JSON.stringify({
        framework: 'react',
        schema: 'zod',
      }));

      // ✅ Use proxy's mock helper (NO manual jest.mocked!)
      fsProxy.returns(configPath, contents);

      const result = await configFileLoadBroker({ configPath });

      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
      });

      // ✅ toHaveBeenCalled works via proxy helper
      fsProxy.expectCalled(configPath);
      fsProxy.expectCalledTimes(1);
    });
  });

  describe('config validation errors', () => {
    it('INVALID_CONFIG: {configPath: "/project/.questmaestro"} => throws when config is null', async () => {
      const configPath = FilePathStub('/project/.questmaestro');
      const contents = FileContentsStub('null');

      fsProxy.returns(configPath, contents);

      // ✅ Error throwing works exactly the same
      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });

    it('INVALID_FRAMEWORK: {configPath: "/project/.questmaestro"} => throws when framework is missing', async () => {
      const configPath = FilePathStub('/project/.questmaestro');
      const contents = FileContentsStub(JSON.stringify({
        schema: 'zod',
      }));

      fsProxy.returns(configPath, contents);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('file system errors', () => {
    it('ERROR: {configPath: "/nonexistent/.questmaestro"} => throws wrapped error when file read fails', async () => {
      const configPath = FilePathStub('/nonexistent/.questmaestro');
      const fsError = new Error('ENOENT: no such file or directory');

      // ✅ Use proxy's error helper (NO mockRejectedValue!)
      fsProxy.throws(configPath, fsError);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(
        new InvalidConfigError({
          message: 'Failed to load config file: ENOENT: no such file or directory',
          configPath,
        })
      );
    });

    it('ERROR: {configPath: "/corrupted/.questmaestro"} => throws wrapped error when JSON parse fails', async () => {
      const configPath = FilePathStub('/corrupted/.questmaestro');
      const contents = FileContentsStub('{ invalid json }');

      fsProxy.returns(configPath, contents);

      await expect(configFileLoadBroker({ configPath })).rejects.toThrow(InvalidConfigError);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {configPath: "/project/.questmaestro"} => strips unknown properties during validation', async () => {
      const configPath = FilePathStub('/project/.questmaestro');
      const contents = FileContentsStub(JSON.stringify({
        framework: 'react',
        schema: 'zod',
        unknownProperty: 'should be stripped',
      }));

      fsProxy.returns(configPath, contents);

      const result = await configFileLoadBroker({ configPath });

      // Zod validation strips unknown properties
      expect(result).toStrictEqual({
        framework: 'react',
        schema: 'zod',
      });
    });
  });
});
```

**🔍 Key Observations:**

### `toHaveBeenCalled` Works via Proxy Helpers

✅ **Broker tests use proxy's mock helpers:**

```typescript
fsProxy.returns(configPath, contents);
// ...
fsProxy.expectCalled(configPath);
fsProxy.expectCalledTimes(1);
```

❌ **Adapter tests use real fs** (no mock assertions):

```typescript
await fsProxy.setupFile(filePath, contents);  // Real file
// Test EFFECTS, not calls
expect(result).toStrictEqual(expected);
```

### Error Throwing via Proxy Helpers

**In adapter tests (real fs):**

```typescript
// Don't setup file - real fs will throw ENOENT
await expect(fsReadFileAdapter({filePath})).rejects.toThrow(/ENOENT/);
```

**In broker tests (proxy mock helper):**

```typescript
fsProxy.throws(configPath, new Error('ENOENT'));
await expect(configFileLoadBroker({configPath})).rejects.toThrow(InvalidConfigError);
```

---

## Architecture Summary

### Universal Proxy Usage Pattern

```
┌─────────────────────────────────────────────────────────┐
│ Level 2: Broker Tests                                   │
│ ✅ Use proxy's MOCK helpers                             │
│ ✅ fsProxy.returns(), fsProxy.expectCalled()        │
│ ✅ NO manual jest.mock() or jest.mocked()               │
│ ✅ Fast, isolated unit tests                            │
└─────────────────────────────────────────────────────────┘
                          ↓ calls
┌─────────────────────────────────────────────────────────┐
│ fsReadFileAdapter (adapter boundary)                    │
│ - Stable API (FilePath → FileContents)                  │
│ - If fs.readFile API changes, only adapter changes      │
└─────────────────────────────────────────────────────────┘
                          ↓ tested by
┌─────────────────────────────────────────────────────────┐
│ Level 1: Adapter Tests                                  │
│ ✅ Use proxy's REAL FS helpers                          │
│ ✅ fsProxy.setupFile(), fsProxy.expectFileContents()    │
│ ✅ NO manual jest.mock() or jest.mocked()               │
│ ✅ Validates real fs behavior                           │
└─────────────────────────────────────────────────────────┘
                          ↓ both use
┌─────────────────────────────────────────────────────────┐
│ createFsReadFileProxy() (ONE proxy, dual-purpose)       │
│ - Provides real fs helpers (for adapter tests)          │
│ - Provides mock helpers (for tests using adapter)       │
│ - Auto-cleanup via afterAll()                           │
│ - NO Jest boilerplate needed anywhere                   │
└─────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect                | Adapter Tests (Level 1)   | Broker Tests (Level 2)         |
|-----------------------|---------------------------|--------------------------------|
| **What's tested**     | fs adapter itself         | Business logic using adapter   |
| **Uses proxy?**       | ✅ Yes (real fs helpers)   | ✅ Yes (mock helpers)           |
| **Uses jest.mock()**  | ❌ No (transformer)        | ❌ No (transformer)             |
| **toHaveBeenCalled**  | ❌ Not available (real fs) | ✅ Via `fsProxy.expectCalled()` |
| **Error testing**     | Real fs errors            | Via `fsProxy.throws()`         |
| **Speed**             | Slower (real I/O)         | Fast (mocked)                  |
| **What it validates** | Real fs behavior          | Business logic flow            |

### Why This Works

**Adapter changes isolated:**

- If `fs.readFile` API changes → Only adapter + proxy change
- Broker tests keep working (proxy's mock helpers unchanged)

**Clear boundaries:**

- Level 1: Does adapter correctly translate fs → contracts?
- Level 2: Does broker correctly use adapter for business logic?

**Best of both worlds:**

- Adapter tests: Validate real behavior (permissions, encoding, etc.)
- Broker tests: Fast, isolated, NO Jest boilerplate
- ONE proxy pattern everywhere: Simple, consistent, LLM-friendly
