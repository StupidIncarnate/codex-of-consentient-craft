# Jest Configuration

Jest config uses ESM format (`.js` extension with `import`/`export`) with CommonJS test execution.

## jest.config.js

```javascript
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import baseConfig from '../../jest.config.base.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export default {
  ...baseConfig,
  preset: undefined, // Override ts-jest preset to use our custom transform
  roots: ['<rootDir>/src', '<rootDir>/bin'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: [
    '**/src/**/*.test.ts',
    '**/src/**/*.test.tsx',
    '**/bin/**/*.test.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.json'),
        astTransformers: {
          before: [
            {
              path: require.resolve('../../packages/testing/ts-jest/proxy-mock-transformer.js'),
            },
          ],
        },
      },
    ],
  },
};
```

## Key Points

- **preset: undefined**: Overrides ts-jest preset to prevent duplicate transform rules
- **Absolute tsconfig path**: Uses `resolve(__dirname, 'tsconfig.json')` for reliable path resolution
- **CommonJS test execution**: Tests run in CommonJS mode (no ESM complexity)
- **createRequire**: Needed to use `require.resolve()` for the proxy transformer path
- **TSX support**: `jsx: 'react'` in tsconfig.json enables JSX transformation
- **Proxy transformer**: Auto-transforms `.proxy.ts` imports to mock setup calls
- **pretest script**: `rm -rf dist` prevents dist files from contaminating tests

## Why CommonJS Mode

We intentionally avoid Jest ESM mode because:

1. **Simpler setup**: No need for `NODE_OPTIONS='--experimental-vm-modules'`
2. **No explicit imports**: Jest globals (`describe`, `expect`, `it`, `jest`) work automatically
3. **More stable**: Jest's CommonJS mode is mature and well-tested
4. **Use `__filename`**: Instead of `import.meta.url` which requires ESM mode

## ink-testing-library

The `ink-testing-library` package is used directly for widget testing:

```typescript
import {
    inkTestingLibraryRenderAdapter
} from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

const {lastFrame, stdin, unmount} = inkTestingLibraryRenderAdapter({
    element: <MyWidget / >,
});
```
