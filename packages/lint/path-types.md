# Path Type Semantics

This document outlines how to handle different path types across libraries that all return "strings" but with different
semantic meanings.

## The Problem

Different libraries have different path requirements and semantics:

```typescript
import {resolve} from 'path';           // Can accept relative: "src/file.ts"
import {readFile} from 'fs/promises';   // Requires absolute: "/project/src/file.ts"
import {globSync} from 'glob';          // Accepts patterns: "src/**/*.ts"
import {dirname} from 'path';           // Input file path, output directory path
```

All return `string`, but they have different validation rules and use cases.

## Solution: Semantic Path Types

### Core Path Contracts

```typescript
// contracts/absolute-file-path/absolute-file-path-contract.ts
import {z} from 'zod';

export const absoluteFilePathContract = z.string()
    .min(1)
    .refine(path => path.startsWith('/'), 'Must be absolute path')
    .refine(path => !path.endsWith('/'), 'Must be file path, not directory')
    .brand<'AbsoluteFilePath'>();
export type AbsoluteFilePath = z.infer<typeof absoluteFilePathContract>;

// contracts/relative-path/relative-path-contract.ts
export const relativePathContract = z.string()
    .min(1)
    .refine(path => !path.startsWith('/'), 'Must be relative path')
    .refine(path => path !== '..' && !path.startsWith('../'), 'Must not escape current directory')
    .brand<'RelativePath'>();
export type RelativePath = z.infer<typeof relativePathContract>;

// contracts/directory-path/directory-path-contract.ts
export const directoryPathContract = z.string()
    .min(1)
    .refine(path => path.startsWith('/'), 'Must be absolute directory path')
    .brand<'DirectoryPath'>();
export type DirectoryPath = z.infer<typeof directoryPathContract>;

// contracts/glob-pattern/glob-pattern-contract.ts
export const globPatternContract = z.string()
    .min(1)
    .refine(path =>
            path.includes('*') ||
            path.includes('?') ||
            path.includes('[') ||
            !path.startsWith('/'),
        'Must be glob pattern or relative path'
    )
    .brand<'GlobPattern'>();
export type GlobPattern = z.infer<typeof globPatternContract>;

// contracts/url-path/url-path-contract.ts
export const urlPathContract = z.string()
    .min(1)
    .refine(path => path.startsWith('/'), 'URL path must start with /')
    .refine(path => !path.includes('..'), 'URL path cannot contain ..')
    .brand<'UrlPath'>();
export type UrlPath = z.infer<typeof urlPathContract>;
```

### Adapter Implementations

```typescript
// adapters/fs/fs-read-file.ts
import {readFile} from 'fs/promises';
import {fileContentContract} from '../../contracts/file-content/file-content-contract';
import type {AbsoluteFilePath, FileContent, FileEncoding} from '../../contracts/file-system';

export const fsReadFile = async ({
                                     path,
                                     encoding = 'utf8'
                                 }: {
    path: AbsoluteFilePath; // Specific - fs requires absolute paths
    encoding?: FileEncoding;
}): Promise<FileContent> => {
    const content = await readFile(path, encoding);
    return fileContentContract.parse(content);
};

// adapters/fs/fs-write-file.ts
import {writeFile} from 'fs/promises';
import type {AbsoluteFilePath, FileContent, FileEncoding} from '../../contracts/file-system';

export const fsWriteFile = async ({
                                      path,
                                      content,
                                      encoding = 'utf8'
                                  }: {
    path: AbsoluteFilePath; // Specific - fs requires absolute paths
    content: FileContent;
    encoding?: FileEncoding;
}): Promise<void> => {
    await writeFile(path, content, encoding);
};

// adapters/path/path-resolve.ts
import {resolve} from 'path';
import {absoluteFilePathContract} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type {RelativePath, AbsoluteFilePath, DirectoryPath} from '../../contracts/path-types';

export const pathResolve = ({
                                relativePath,
                                basePath = process.cwd() as DirectoryPath
                            }: {
    relativePath: RelativePath; // Specific - resolve accepts relative paths
    basePath?: DirectoryPath;
}): AbsoluteFilePath => {
    const result = resolve(basePath, relativePath);
    return absoluteFilePathContract.parse(result);
};

// adapters/path/path-dirname.ts
import {dirname} from 'path';
import {directoryPathContract} from '../../contracts/directory-path/directory-path-contract';
import type {AbsoluteFilePath, DirectoryPath} from '../../contracts/path-types';

export const pathDirname = ({
                                path
                            }: {
    path: AbsoluteFilePath; // Input: file path
}): DirectoryPath => { // Output: directory path (different semantic type)
    const result = dirname(path);
    return directoryPathContract.parse(result);
};

// adapters/path/path-basename.ts
import {basename} from 'path';
import {fileNameContract} from '../../contracts/file-name/file-name-contract';
import type {AbsoluteFilePath, FileName} from '../../contracts/path-types';

export const pathBasename = ({
                                 path
                             }: {
    path: AbsoluteFilePath;
}): FileName => {
    const result = basename(path);
    return fileNameContract.parse(result);
};

// adapters/glob/glob-sync.ts
import {globSync} from 'glob';
import {absoluteFilePathContract} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type {GlobPattern, AbsoluteFilePath} from '../../contracts/path-types';

export const globSyncAdapter = ({
                                    pattern,
                                    cwd = process.cwd() as DirectoryPath
                                }: {
    pattern: GlobPattern; // Specific - glob accepts patterns
    cwd?: DirectoryPath;
}): AbsoluteFilePath[] => {
    const results = globSync(pattern, {cwd, absolute: true});
    return results.map(path => absoluteFilePathContract.parse(path));
};
```

### Path Conversion Functions

Each conversion function is in its own file following single responsibility:

```typescript
// transformers/relative-to-absolute/relative-to-absolute-transformer.ts
import {resolve} from 'path';
import {absoluteFilePathContract} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type {RelativePath, AbsoluteFilePath, DirectoryPath} from '../../contracts/path-types';

export const relativeToAbsoluteTransformer = ({
                                                  relativePath,
                                                  basePath = process.cwd() as DirectoryPath
                                              }: {
    relativePath: RelativePath;
    basePath?: DirectoryPath;
}): AbsoluteFilePath => {
    const result = resolve(basePath, relativePath);
    return absoluteFilePathContract.parse(result);
};

// transformers/absolute-to-relative/absolute-to-relative-transformer.ts
import {relative} from 'path';
import {relativePathContract} from '../../contracts/relative-path/relative-path-contract';
import type {AbsoluteFilePath, RelativePath, DirectoryPath} from '../../contracts/path-types';

export const absoluteToRelativeTransformer = ({
                                                  absolutePath,
                                                  basePath = process.cwd() as DirectoryPath
                                              }: {
    absolutePath: AbsoluteFilePath;
    basePath?: DirectoryPath;
}): RelativePath => {
    const result = relative(basePath, absolutePath);
    return relativePathContract.parse(result);
};

// transformers/file-to-directory/file-to-directory-transformer.ts
import {dirname} from 'path';
import {directoryPathContract} from '../../contracts/directory-path/directory-path-contract';
import type {AbsoluteFilePath, DirectoryPath} from '../../contracts/path-types';

export const fileToDirectoryTransformer = ({
                                               filePath
                                           }: {
    filePath: AbsoluteFilePath;
}): DirectoryPath => {
    const result = dirname(filePath);
    return directoryPathContract.parse(result);
};

// transformers/join-paths/join-paths-transformer.ts
import {resolve} from 'path';
import {absoluteFilePathContract} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type {DirectoryPath, RelativePath, AbsoluteFilePath} from '../../contracts/path-types';

export const joinPathsTransformer = ({
                                         basePath,
                                         paths
                                     }: {
    basePath: DirectoryPath;
    paths: RelativePath[];
}): AbsoluteFilePath => {
    const result = resolve(basePath, ...paths);
    return absoluteFilePathContract.parse(result);
};
```

### Test Factories

```typescript
// test-helpers/path-factories.ts
import {
    absoluteFilePathContract,
    relativePathContract,
    directoryPathContract,
    globPatternContract,
    urlPathContract
} from '../contracts/path-contracts';

export const createAbsoluteFilePath = (path = '/mock/project/src/file.ts'): AbsoluteFilePath => {
    return absoluteFilePathContract.parse(path);
};

export const createRelativePath = (path = 'src/file.ts'): RelativePath => {
    return relativePathContract.parse(path);
};

export const createDirectoryPath = (path = '/mock/project/src'): DirectoryPath => {
    return directoryPathContract.parse(path);
};

export const createGlobPattern = (pattern = 'src/**/*.ts'): GlobPattern => {
    return globPatternContract.parse(pattern);
};

export const createUrlPath = (path = '/api/users'): UrlPath => {
    return urlPathContract.parse(path);
};

// Realistic project structure factories
export const createProjectFilePath = (relativePath = 'src/index.ts'): AbsoluteFilePath => {
    return createAbsoluteFilePath(`/mock/project/${relativePath}`);
};

export const createConfigFilePath = (filename = '.questmaestro.js'): AbsoluteFilePath => {
    return createAbsoluteFilePath(`/mock/project/${filename}`);
};

export const createTestFilePath = (relativePath = 'src/test.spec.ts'): AbsoluteFilePath => {
    return createAbsoluteFilePath(`/mock/project/${relativePath}`);
};
```

## Usage Examples

### File System Operations

```typescript
// brokers/config/load/config-load-broker.ts
import {fsReadFile} from '../../../adapters/fs/fs-read-file';
import {
    relativeToAbsoluteTransformer
} from '../../../transformers/relative-to-absolute/relative-to-absolute-transformer';
import type {RelativePath, Config} from '../../../contracts';

export const configLoadBroker = async ({
                                           configPath
                                       }: {
    configPath: RelativePath; // Input: relative from project root
}): Promise<Config> => {
    // Convert to absolute for fs operations
    const absolutePath = relativeToAbsoluteTransformer({relativePath: configPath});

    // Now we can safely read the file - type system ensures correct path type
    const content = await fsReadFile({path: absolutePath});
    return JSON.parse(content);
};
```

### Path Resolution Chain

```typescript
// brokers/config/find/config-find-broker.ts
import {pathDirname} from '../../../adapters/path/path-dirname';
import {fsAccess} from '../../../adapters/fs/fs-access';
import {joinPathsTransformer} from '../../../transformers/join-paths/join-paths-transformer';
import {fileToDirectoryTransformer} from '../../../transformers/file-to-directory/file-to-directory-transformer';
import type {AbsoluteFilePath, DirectoryPath} from '../../../contracts/path-types';

export const configFindBroker = async ({
                                           startPath
                                       }: {
    startPath: AbsoluteFilePath;
}): Promise<AbsoluteFilePath> => {
    let currentDir: DirectoryPath = fileToDirectoryTransformer({filePath: startPath});

    while (currentDir !== '/') {
        const configPath = joinPathsTransformer({
            basePath: currentDir,
            paths: ['.questmaestro.js' as RelativePath]
        });

        try {
            await fsAccess({path: configPath});
            return configPath; // Found it
        } catch {
            // Go up one directory
            currentDir = pathDirname({path: currentDir});
        }
    }

    throw new Error('Config file not found');
};
```

### Glob Operations

```typescript
// brokers/file/find/file-find-broker.ts
import {globSyncAdapter} from '../../../adapters/glob/glob-sync';
import type {GlobPattern, AbsoluteFilePath, DirectoryPath} from '../../../contracts/path-types';

export const fileFindBroker = ({
                                   pattern,
                                   cwd
                               }: {
    pattern: GlobPattern;
    cwd?: DirectoryPath;
}): AbsoluteFilePath[] => {
    return globSyncAdapter({pattern, cwd});
};

// Usage
const typescriptFiles = fileFindBroker({
    pattern: createGlobPattern('src/**/*.ts'),
    cwd: createDirectoryPath('/project')
});
```

## Testing Examples

```typescript
// config-load-broker.test.ts
import {jest} from '@jest/globals';
import {configLoadBroker} from './config-load-broker';
import {fsReadFile} from '../../../adapters/fs/fs-read-file';
import {createRelativePath, createAbsoluteFilePath} from '../../../test-helpers/path-factories';

jest.mock('../../../adapters/fs/fs-read-file');
const mockFsReadFile = fsReadFile as jest.MockedFunction<typeof fsReadFile>;

describe('configLoadBroker', () => {
    it('loads config from relative path', async () => {
        const configPath = createRelativePath('.questmaestro.js');
        const configContent = '{"framework": "react"}';

        mockFsReadFile.mockResolvedValue(configContent);

        const result = await configLoadBroker({configPath});

        expect(result).toEqual({framework: 'react'});
        // The mock was called with an absolute path (conversion happened)
        expect(mockFsReadFile).toHaveBeenCalledWith({
            path: expect.stringMatching(/^\/.*\.questmaestro\.js$/)
        });
    });

    // ❌ These would fail at test setup time
    // const badPath = createRelativePath('/absolute/path'); // ZodError!
    // const badPattern = createGlobPattern('/no/pattern/here'); // ZodError!
});
```

## Benefits

✅ **Semantic clarity** - Function signatures show exactly what path type is expected
✅ **Compile-time safety** - Cannot pass wrong path type (relative to fs.readFile, etc.)
✅ **Runtime validation** - Catches invalid paths early in development
✅ **Self-documenting** - Types explain path requirements without documentation
✅ **Conversion tracking** - Explicit conversion between path types prevents bugs
✅ **Test confidence** - Factories ensure test paths follow real-world constraints

## Common Path Type Usage

| Library/Function | Input Type         | Output Type          | Use Case               |
|------------------|--------------------|----------------------|------------------------|
| `fs.readFile`    | `AbsoluteFilePath` | `FileContent`        | Reading files          |
| `fs.writeFile`   | `AbsoluteFilePath` | `void`               | Writing files          |
| `path.resolve`   | `RelativePath`     | `AbsoluteFilePath`   | Converting paths       |
| `path.dirname`   | `AbsoluteFilePath` | `DirectoryPath`      | Getting parent dir     |
| `path.basename`  | `AbsoluteFilePath` | `FileName`           | Getting filename       |
| `glob.sync`      | `GlobPattern`      | `AbsoluteFilePath[]` | Finding files          |
| Express routes   | `UrlPath`          | N/A                  | Web routing            |
| Config loading   | `RelativePath`     | `Config`             | Project-relative files |

This approach prevents the classic Node.js bugs where you accidentally pass a relative path to `fs.readFile()` or try to
use an absolute path as a glob pattern.