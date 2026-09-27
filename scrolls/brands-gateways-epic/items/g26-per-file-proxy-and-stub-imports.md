# G26: Stubs and proxies are imported from their own files; the gateway's `_test_` barrels go

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/brands-types-tests-rules.md` C6 (lines 1318-1380); EPIC.md concession 1 (the user's decision of 2026-09-26); `scrolls/gateway/followup-sustainability.md` "Gateway standards as built", the `_test_` rows (lines 135, 154) |
| Needs | nothing |
| Unblocks | [G13](g13-mantine-render-to-testing.md), [G14](g14-gateway-barrel-lint-rules.md), [G16](g16-gateway-stubs-node-and-failures.md), [G17](g17-gateway-stubs-ast-and-typescript.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md); B03 reuses its `exports` form for workspace packages |
| Packages touched | `@gateway/npm`, `@gateway/node`, `@gateway/browser`, `@gateway/bin`, `testing` (the hoister and its resolvers), `cli` (what `init` writes), every package holding a `_test_` import (`mcp`, `cli`, `testing`, `eslint-plugin`, `web`, `config`, `tooling`, `server`, `hooks`, `siegelense`) |
| Checks to run | `lint,typecheck,unit,integration` on every touched file |
| Split | Step 1 is one agent and must pass before anything else. Then one agent for steps 2-4 (the gateway and the resolvers), then callers split per package, 2 to 4 files per agent |
| Runs alone | Step 1 and steps 2-4 run with no other agent in `@gateway/*` or `testing`, because every gateway test and proxy import changes |

## Why

The user decided on 2026-09-26 that no `_test_` barrel or `_test_` import path exists, in the gateway or
in workspace packages. A test imports each stub and each proxy from the file that declares it (brands doc
C6). No barrel of test support then needs keeping current, and the file name says what it is.

The gateway as built does the opposite: each gateway package has a `./_test_/*` export, each subpath with
wrappers has a `<subpath>.proxy.ts` test barrel, and callers import `#gateway/<kind>/_test_/<subpath>`.

## Current state

Checked 2026-09-26:

- Each of the four gateway `package.json` files has exactly two `exports` keys: `./_test_/*` and `./*`.
- 22 subpaths hold a test barrel at `packages/@gateway/<kind>/src/<subpath>/<subpath>.proxy.ts`, such as
  `packages/@gateway/npm/src/fast-xml-parser/fast-xml-parser.proxy.ts`.
- 19 files import a `_test_` path: `testing` 16 imports, `eslint-plugin` 8, `mcp` 5, `config` 2,
  `tooling` 2, `hooks` 2, `siegelense` 2, and `cli`, `web` and `server` 1 each. Some are tool-test
  fixtures that use the path as sample data; G09 owns those.
- The proxy-mock hoister's resolvers live in `packages/testing/src/middleware/`:
  `workspace-package-import-resolve`, `package-imports-specifier-resolve`, `import-path-resolver` and
  `proxy-mock-collector`. They read `exports` maps themselves. Not checked for how they match a pattern.
- `init` copies node's and browser's gateway source into a consumer and writes their `package.json`
  (`gatewaySourceCopyStatics` in `cli`). Not checked for the `exports` it writes.

## The import form

| File | Imported as |
|---|---|
| `packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts` | `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy` |
| `packages/@gateway/npm/src/glob/glob/glob.proxy.ts` | `#gateway/npm/glob/glob/glob.proxy` |
| `packages/@gateway/node/src/fs/is-fs-error/fs-error.stub.ts` | `#gateway/node/fs/is-fs-error/fs-error.stub` |
| `packages/@gateway/node/src/fs/fs.ts` (a barrel, unchanged) | `#gateway/node/fs` |

Each gateway package's `exports` holds three keys, each with the conditions `gateway-dist`, `source`,
`import`, `require` and `types`, in that order, as today:

```json
"exports": {
  "./*.proxy": { "source": "./src/*.proxy.ts", "…": "…" },
  "./*.stub":  { "source": "./src/*.stub.ts",  "…": "…" },
  "./*":       { "source": "./src/*/*.ts",     "…": "…" }
}
```

Node picks the most specific pattern key that matches: when two keys share the prefix before `*`, the
longer key wins. So a path ending in `.proxy` or `.stub` takes its own key, and every other path takes
the barrel key.

A probe on 2026-09-26 proved this for Node's `require` and for TypeScript's `ts.resolveModuleName` with
`module` and `moduleResolution` set to `node16` and `customConditions: ["source"]`. A fake package with
these three keys resolved `…/fs__promises` to `src/fs__promises/fs__promises.ts`, and
`…/fs__promises/read-file-if-exists/read-file-if-exists.proxy` to
`src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts`. The `.stub` path resolved the same
way. `#gateway/<kind>/*` in each package's `imports` passes the whole remaining path to the package, so it
needs no change.

**Not proven:** Jest's own resolver, the proxy-mock hoister's resolvers, ts-jest (which resolves with
`moduleResolution: node` per G08), ESLint's import resolution in this repo, and the `gateway-dist`
compiled output that a consumer's installed gateway package resolves to.

## Work

1. **Prove the form before changing anything.** Change one gateway package's `exports` to the three keys
   in a throwaway state, and write one test that imports a wrapper proxy per file. Confirm, each with a
   real run: ward `typecheck`, ward `unit` (Jest's resolver, and the hoister hoisting the proxy's
   `registerMock` calls), ward `lint` (the import resolves for ESLint), and the `gateway-dist` condition
   against compiled output (report "build needed" and let the operator build one gateway package). If any
   of them fails, find why and fix the resolver or config that fails. If one cannot work, stop and report
   it with the evidence; the operator records a concession.
2. Change all four gateway packages' `exports` to the three keys, and delete the `./_test_/*` key.
3. Teach every resolver in `packages/testing/src/middleware/` that reads an `exports` map to match the
   three keys the way Node does: the most specific key wins. Unit-test each against the three forms.
4. Delete the 22 subpath test barrels (`<subpath>/<subpath>.proxy.ts`). Nothing replaces them.
5. Move every `#gateway/<kind>/_test_/<subpath>` import to per-file imports of the proxies and stubs it
   used. Leave tool-test fixtures that use a `_test_` path as sample data to G09, and tell G09 the
   current form is per file.
6. Update what `init` writes for a consumer's copied node and browser gateways, and for their empty npm
   and bin gateways, to the three keys.
7. Update the rules that know about `_test_`: `gateway-colocation` and any rule that requires or checks a
   test barrel. `enforce-proxy-child-creation` finds the wrapper's proxy as the `.proxy` file beside the
   wrapper, imported per file.
8. Grep the gateway's `CLAUDE.md` files and the gateway standards for `_test_`; leave the teaching text
   to Z01 and Z03, but list every hit in the report.

## Done when

- [ ] No gateway `package.json` has a `./_test_/*` key; each has the three keys above.
- [ ] No `<subpath>/<subpath>.proxy.ts` test barrel exists under `packages/@gateway/*/src/`.
- [ ] A scan of `packages/**` (excluding `node_modules` and `dist`) finds no `_test_/` import outside G09's
      fixtures.
- [ ] One unit test in a non-gateway package imports a gateway wrapper proxy per file, and the hoister
      hoists its mocks: the test fails when the proxy's `registerMock` is removed.
- [ ] Scoped ward `lint,typecheck,unit,integration` exits 0 on every touched file.
- [ ] `init`'s scaffold writes the three keys.

## Traps

- ts-jest resolves with `moduleResolution: node` (G08 keeps it that way for the hoister), which ignores
  `exports`. Jest's own resolver is what loads modules at test time. Check which resolver actually
  answers each import before concluding a failure is in `exports`.
- A worktree is not hermetic: resolution can climb into the main checkout's `node_modules` and fake a
  pass. Fence an experiment with a `ts.resolveModuleName` host that hides paths outside the worktree
  (repo `CLAUDE.md`).
- `packages/@gateway/npm/package.json` lists `testing-library__jest-dom`'s barrel under `sideEffects`.
  That entry is a barrel, not a test barrel; keep it.

## Concessions made while executing
