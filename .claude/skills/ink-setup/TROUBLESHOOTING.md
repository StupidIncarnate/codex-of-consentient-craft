# Troubleshooting

## Common Errors and Fixes

### "require() cannot be used on an ESM graph with top-level await"

```
Error [ERR_REQUIRE_ASYNC_MODULE]: require() cannot be used on an ESM graph
with top-level await.
```

**Cause**: Package not configured as ESM, or bundling not set up.

**Fix**:

1. Add `"type": "module"` to package.json
2. Set up esbuild bundling in build script
3. Point bin to bundled `.mjs` file

### "Cannot find module" at runtime

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../my-broker'
```

**Cause**: ESM requires explicit file extensions, but `bundler` moduleResolution doesn't add them.

**Fix**: Use esbuild to bundle the entry point. It resolves all imports at build time.

### Jest fails with ESM errors

```
ReferenceError: require is not defined in ES module scope
```

**Cause**: Jest config not set up correctly for ESM package.

**Fix**:

1. Use ESM format for jest.config.js (`import`/`export`)
2. Use `createRequire` to resolve the proxy transformer path
3. Ensure `jsx: 'react'` is in the ts-jest tsconfig

### npm link doesn't work (silent exit)

**Cause**: `process.argv[1]` (symlink path) doesn't match `import.meta.url` (real path).

**Fix**: Use `realpathSync` to resolve both paths:

```typescript
const resolveRealPath = (path: string): string => {
    try {
        return realpathSync(path);
    } catch {
        return path;
    }
};

const isMain =
    process.argv[1] !== undefined &&
    resolveRealPath(process.argv[1]) === resolveRealPath(fileURLToPath(import.meta.url));
```

### "No such file or directory" for bin

```
bash: /path/to/bin/my-cli: No such file or directory
```

**Cause**: Global npm link symlink not created or outdated.

**Fix**: Run `npm link` from the package directory to create/update the global symlink.

### Tests fail with "Raw mode is not supported"

```
Error: Raw mode is not supported on the current process.stdin
```

**Cause**: Ink requires a TTY for input handling.

**Fix**: This is expected in CI/test environments. E2E tests should expect this error:

```typescript
child.on('exit', (code) => {
    expect(code).toBe(1);
    expect(stderr).toMatch(/Raw mode is not supported/u);
    done();
});
```

### Double shebang causes syntax error

```
SyntaxError: Invalid or unexpected token
```

**Cause**: Both source file and esbuild banner have shebang.

**Fix**: Remove `--banner:js` from esbuild command. The source shebang is preserved.

### Widget tests fail to render

```
TypeError: Cannot read properties of undefined
```

**Cause**: Ink components not rendering correctly in tests.

**Fix**:

1. Use the local `ink-test-render.ts` utility, not `ink-testing-library`
2. Ensure manual cleanup in `afterEach`:

```typescript
let unmountFn: (() => void) | null = null;

afterEach(() => {
    if (unmountFn) {
        unmountFn();
        unmountFn = null;
    }
});
```

### TypeScript can't find type definitions

```
Cannot find type definition file for 'xyz'
```

**Cause**: Missing `typeRoots` in tsconfig.json.

**Fix**: Add typeRoots to point to both node_modules/@types and monorepo @types:

```json
{
  "compilerOptions": {
    "typeRoots": [
      "../../node_modules/@types",
      "../../@types"
    ]
  }
}
```

### Jest can't transform TSX files

```
Jest encountered an unexpected token
```

**Cause**: Missing TSX transform configuration.

**Fix**: Ensure ts-jest config includes `jsx: 'react'`:

```javascript
transform: {
    '^.+\\.(ts|tsx)$'
:
    ['ts-jest', {
        tsconfig: {
            jsx: 'react',
            // ...other options
        },
    }],
}
,
```

## Verification Checklist

After setup, verify:

- [ ] `npm run build` succeeds
- [ ] `dist/bin/my-cli.mjs` exists and has shebang
- [ ] `npm link` creates global symlink
- [ ] `my-cli` command runs (shows UI or raw mode error)
- [ ] `npm test` passes all tests
- [ ] Widget tests render correctly with `inkTestRender`
