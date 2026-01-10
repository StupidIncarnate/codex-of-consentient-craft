# Package Configuration

## package.json

```json
{
  "name": "@dungeonmaster/my-cli",
  "type": "module",
  "bin": {
    "my-cli": "./dist/bin/my-cli.mjs"
  },
  "files": ["dist/**/*"],
  "scripts": {
    "build": "tsc && npm run bundle",
    "bundle": "npx esbuild dist/startup/start-my-cli.js --bundle --platform=node --format=esm --outfile=dist/bin/my-cli.mjs --external:ink --external:react --external:@dungeonmaster/* --external:zod",
    "postbuild": "chmod +x dist/bin/*.mjs dist/startup/*.js 2>/dev/null || true",
    "pretest": "rm -rf dist",
    "test": "jest"
  },
  "dependencies": {
    "ink": "^3.2.0",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48"
  }
}
```

### Critical Settings

| Setting          | Value               | Why                                          |
|------------------|---------------------|----------------------------------------------|
| `type`           | `"module"`          | Runtime ESM for bundled output               |
| `ink`            | `"^3.2.0"`          | **CRITICAL**: v3.2.0 is CJS, v4+ is ESM-only |
| `bin`            | Points to `.mjs`    | Bundled ESM output                           |
| Bundle externals | `ink`, `react`, etc | Avoid duplication                            |
| `pretest`        | `rm -rf dist`       | Prevent dist files contaminating Jest        |

### Why ink v3.2.0?

- **v4+**: Has `"type": "module"` → ESM-only → `jest.mock()` doesn't hoist
- **v3.2.0**: No type field → defaults to CJS → `jest.mock()` works

**Do NOT use**:

- `ink@^4.x` - ESM-only, breaks Jest mocking
- `ink-cjs` - Misleading name, still has `"type": "module"`
- `ink-testing-library@^4.x` - ESM-only (use local `ink-test-render.ts` instead)

## tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationMap": true,
    "declaration": true,
    "noEmit": false,
    "jsx": "react",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "typeRoots": [
      "../../node_modules/@types",
      "../../@types"
    ]
  },
  "include": [
    "src/**/*",
    "*.ts"
  ]
}
```

### Critical Settings

| Setting            | Value                    | Why                              |
|--------------------|--------------------------|----------------------------------|
| `jsx`              | `"react"`                | Enable JSX/TSX                   |
| `module`           | `"ESNext"`               | Output ESM imports               |
| `moduleResolution` | `"bundler"`              | No .js extensions needed         |
| `typeRoots`        | Points to `../../@types` | Access monorepo type definitions |
| `declarationMap`   | `true`                   | Source map support for types     |
| `declaration`      | `true`                   | Generate `.d.ts` files           |

### typeRoots

The `typeRoots` array includes:

1. `../../node_modules/@types` - Standard DefinitelyTyped packages
2. `../../@types` - Monorepo-specific type augmentations

This allows the CLI package to use custom type definitions from the root `@types/` folder (e.g., for packages without
official types).
