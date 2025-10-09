# @questmaestro/shared

Shared contracts, types, and utilities for Questmaestro packages.

## Installation

```bash
npm install @questmaestro/shared
```

## Usage

### Path Contracts

```typescript
import {
    filePathContract,
    absoluteFilePathContract,
    relativeFilePathContract,
} from '@questmaestro/shared/contracts';

// General file path (absolute or relative)
const path = filePathContract.parse('/home/user/config.json');

// Absolute path only
const absolutePath = absoluteFilePathContract.parse('/home/user/config.json');

// Relative path only (must start with ./ or ../)
const relativePath = relativeFilePathContract.parse('./config.json');
```

### With require() and import()

```typescript
import {filePathContract} from '@questmaestro/shared/contracts';

// ✅ Correct: Validates path at runtime
const config = require(filePathContract.parse(configPath));

// ✅ Correct: Dynamic imports
const module = await import(filePathContract.parse(modulePath));

// ❌ Wrong: Bypasses validation
const config = require(configPath); // Lint error!
```

### Test Stubs

```typescript
import {FilePathStub, AbsoluteFilePathStub} from '@questmaestro/shared/contracts';

it('VALID: loads config from path', () => {
    const path = FilePathStub('/home/user/config.json');
    const result = loadConfig(path);
    expect(result).toStrictEqual({ /* ... */});
});
```

## Contracts

### Path Contracts

- **`filePathContract`** - Any valid file path (absolute or relative)
- **`absoluteFilePathContract`** - Absolute paths only (`/home/...` or `C:\...`)
- **`relativeFilePathContract`** - Relative paths only (`./` or `../`)

## License

MIT
