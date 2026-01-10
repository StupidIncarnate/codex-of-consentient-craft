# Jest Configuration

Jest config uses ESM format (`.js` extension with `import`/`export`) with a single unified configuration.

## jest.config.js

```javascript
import {createRequire} from 'module';
import baseConfig from '../../jest.config.base.js';

const require = createRequire(import.meta.url);

export default {
    ...baseConfig,
    roots: ['<rootDir>/src', '<rootDir>/bin'],
    setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    testMatch: [
        '**/src/**/*.test.ts',
        '**/src/**/*.test.tsx',
        '**/bin/**/*.test.ts',
    ],
    testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.test\\.ts$', '\\.e2e\\.test\\.ts$'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: {
                    allowJs: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    jsx: 'react',
                },
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

- **Single unified config**: No dual CJS/ESM projects needed
- **ESM format**: Uses `import`/`export` syntax (package has `"type": "module"`)
- **createRequire**: Needed to use `require.resolve()` for the proxy transformer path
- **TSX support**: `jsx: 'react'` in tsconfig enables JSX transformation
- **Proxy transformer**: Auto-transforms `.proxy.ts` imports to mock setup calls
- **pretest script**: `rm -rf dist` prevents dist files from contaminating tests

## Why This Works

ink v3.2.0 is CJS-compatible (no `"type": "module"` field), so:

- Jest can load it normally without ESM transform issues
- The proxy pattern with `jest.mock()` works correctly
- No need for separate ESM/CJS test projects

## Local Test Render Utility

Instead of `ink-testing-library` (which requires ESM configuration), use a local `ink-test-render.ts` utility that wraps
ink's `render` function with mock stdin/stdout. See [TESTING.md](TESTING.md) for details.
