# Unit 9: mcp claude-permission contract consumes `@dungeonmaster/npm/zod`

- Files changed:
  - `packages/mcp/src/contracts/claude-permission/claude-permission-contract.ts` — `import { z } from 'zod'` → `import { z } from '@dungeonmaster/npm/zod'`
  - `packages/mcp/package.json` — added `"@dungeonmaster/npm": "*"` to `dependencies`
  - `claude-permission.stub.ts` and `claude-permission-contract.test.ts` untouched: neither imports `z` directly, only the contract and its inferred type, so nothing else in the unit references zod.

- Gateway imports used: `z` from `@dungeonmaster/npm/zod` (`packages/npm/src/zod/index.ts`, a verbatim `export * from 'zod'` + `export { default } from 'zod'`).

- Ward command and result:
  `npm run ward -- --only lint,typecheck,unit -- packages/mcp/src/contracts/claude-permission/claude-permission-contract.ts packages/mcp/src/contracts/claude-permission/claude-permission.stub.ts packages/mcp/src/contracts/claude-permission/claude-permission-contract.test.ts`
  ```
  lint:      PASS  1 packages (3 files passed/0 files failed, 3 discovered)  3.8s
  typecheck: PASS  1 packages (549 files passed/0 files failed, 549 discovered)  4.7s   <- whole mcp package, unaffected
  unit:      FAIL  1 packages (1 files passed/2 files failed, 187 discovered)  8.3s
  ```
  The unit failures are `install-config-create-responder.test.ts` and `settings-permissions-add-broker.test.ts` (`[io-trap] unstaged fs/promises.readFile/mkdir`, "has no assertions") — files outside this unit's scope, mid-edit by the agent assigned to those two files (units 1 and 3), per the brief's "stay out of them." `claude-permission-contract.test.ts` itself is the "1 files passed."

- Friction: none. `enforce-import-dependencies`'s external-import gate already special-cases every gateway package/subpath as universally importable from any folder type (`validate-external-import-layer-broker.ts:38-54`), so a `contracts/` file importing `@dungeonmaster/npm/zod` raises nothing — this closes the gap `scrolls/gateway-build/lint-plan.md` row 4 worried about, at least for `contracts/`. `raw-import-ban`, the rule that would otherwise flag the OLD raw `import { z } from 'zod'`, is commented out in `config-dungeonmaster-broker.ts:150` (not yet enabled), so this measurement is against the currently-active rule set only.

- Type identity proof: `tsc --noEmit` over the WHOLE `@dungeonmaster/mcp` package (549 files) passed with the contract importing `z` from the gateway. Every other file in the package still imports `zod` directly (unchanged) and consumes `claudePermissionContract`/`ClaudePermission` (e.g. via `z.infer`, brand comparisons) with no cast — since `@dungeonmaster/npm/zod` is `export * from 'zod'` with no re-declaration, TypeScript resolves it to the identical `zod` module instance/types, so `z.ZodBrand` identity and every downstream `z.infer<typeof claudePermissionContract>` line up exactly as before. No `@types` duplication, no structural-vs-nominal brand mismatch.

- Edge cases found the gateway design did not account for: none for this unit — a pure-passthrough zod import behind a contract file is the easy case the design doc predicted, and the currently-active `enforce-import-dependencies` allowlist already treats it correctly with no rule change needed.

- Could not finish: nothing. Unit complete.
