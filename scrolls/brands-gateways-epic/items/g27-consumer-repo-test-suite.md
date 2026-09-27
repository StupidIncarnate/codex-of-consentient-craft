# G27: A test suite proves a fresh consumer repo is bootstrapped correctly

| | |
|---|---|
| Phase | Phase 1 — gateway foundation, then extended by every later item that changes what a consumer gets |
| Source | The user's request of 2026-09-26: "a proper suite of tests for a consumer repo, checking that everything is bootstrapped correctly, because the pieces are getting many". Builds on gateway follow-ups items 40 and 41 (G25). |
| Needs | [G25](g25-consumer-init-end-to-end.md) (fixes the known consumer breaks first), [G26](g26-per-file-proxy-and-stub-imports.md) (the import form the suite asserts) |
| Unblocks | [Z07](z07-finish-line.md). Every item that changes what `init` writes or what a package publishes adds its assertions here (see "How the suite grows"). |
| Packages touched | a new home for the suite (see step 1), `package.json` scripts at the root, `scripts/` |
| Checks to run | `lint,typecheck` on the suite's source; the suite itself through its own script |
| Split | One agent designs and builds the harness and the first assertions. Later assertions are added by the items that cause them. |
| Runs alone | The suite's runs need a fresh build of the whole repo, which only the operator makes. |

## Why

A consumer repo gets its setup from many places. `dungeonmaster init` discovers every package's
`startup/start-install.ts` and runs it. Each one writes its own piece: MCP config for Claude Code and
Antigravity, hooks and permissions, devDependencies, tsconfig, ESLint and Jest config, the
`.dungeonmaster.json` keys, the copied node and browser gateways, the empty npm and bin gateways, the
`worktrees/` gitignore line and the session snippets. This epic adds more: the `gateway` config key,
per-file stub and proxy `exports`, `#gateway` imports, the Jest home sandbox, MSW in the base Jest config
and a wider I/O trap.

Nothing tests the result as a whole. What comes closest today:

| Existing check | What it misses |
|---|---|
| `scripts/check-published-output.mjs` (`npm run check:published`) | Grades each package's `dist` for test files. Installs nothing. |
| `packages/cli/src/startup/start-install.integration.test.ts` | Runs the install from source into a testbed. Its six tests check only the Playwright config `init` writes. |
| G25 | One manual run of `init` in a scratch consumer. Nobody can rerun it. |

So a break in one piece shows up only when a real consumer hits it. Suspected breaks of exactly this
kind are open today: gateway follow-up item 40 (`init` may look for packages under
`<consumer>/node_modules/packages/*`) and item 41 (nobody has run the copied gateways' tests in a
consumer).

## What the suite is

A repeatable run that builds a fresh consumer repo from nothing, installs dungeonmaster the way a user
would, runs `init`, and then asserts both what was written and that it works.

- **The consumer is real and isolated.** It lives under the OS `/tmp`, outside this repo, because Node's
  resolution walks up directories. A consumer inside the repo would find this repo's `node_modules` and
  fake a pass (repo `CLAUDE.md`, worktrees snippet).
- **It installs what we publish.** It installs the `npm pack` tarball of every published package, never
  a workspace link, so it tests what users get.
- **The fixture is a typical consumer.** It is an npm-workspaces monorepo with packages under
  `packages/*`, which every consumer is (repo `CLAUDE.md`). It holds at least one Node library package
  and one `frontend-react` package, so both gateway platforms and the e2e-eligible path are covered.
- **It covers both install modes** from repo `CLAUDE.md`'s MCP section: local `node_modules` (scenario 3)
  and global install only (scenario 4).
- **Each assertion names the piece that broke.** A failure says which package's `StartInstall` wrote the
  wrong thing, or which check failed, not only "init failed".

## Work

1. **Decide where the suite lives and how it runs.** Recommended — the executing agent may change it
   with a reason in DECISIONS: a private workspace package `packages/consumer-check` (never published),
   whose tests are named `*.consumer.test.ts`, with its own Jest config that no ward check type picks up.
   A root script `npm run check:consumer` runs it. Reason: ward reads source and never needs a build
   (build-discipline snippet), but this suite must read packed compiled output, so it cannot run inside
   ward's `unit` or `integration`. It works like `check:published`, and `release` runs it after
   `check:published`. Confirm ward's package discovery does not try to run these tests; if it does, find
   the cleanest way to keep them out.
2. **Build the harness:** create the consumer under the OS temp dir, write the fixture repo, `npm pack`
   every published package from its built `dist`, install the tarballs, run `dungeonmaster init`, and
   clean up afterwards (keep the directory when a test fails, and print its path).
3. **Assert what `init` writes.** At least:
   - `.mcp.json`: the server entry resolves to the consumer's own `node_modules/@dungeonmaster/mcp`
     (local mode), or to the global npm root (global mode).
   - Antigravity's `.agents/plugins/dungeonmaster/mcp_config.json`, the same way.
   - `.claude/settings.json`: every hook entry the hooks package owns, and a `permissions.allow` row for
     every MCP tool.
   - The root `devDependencies`, and each is installed.
   - The root tsconfig: `node16` and the `source` condition, extending the published base (G08).
   - The ESLint config loads the dungeonmaster plugin.
   - The Jest config spreads `@dungeonmaster/testing`'s base: the I/O trap and the home sandbox are
     loaded (T07 adds the sandbox).
   - `.dungeonmaster.json` validates against `dungeonmasterConfigContract`, with the `gateway` key (G12).
   - `packages/@gateway/{node,browser}` hold the copied source. `packages/@gateway/{npm,bin}` hold the
     placeholder. Every gateway `package.json` has the three `exports` keys (G26), and every workspace
     package's `package.json` maps `#gateway/<kind>/*`.
   - `worktrees/` and its gitignore line.
4. **Assert that it works.** At least:
   - `npm install` succeeds in the consumer after `init`.
   - The consumer's typecheck passes, and a sample file importing `#gateway/node/fs` resolves.
   - The consumer's lint passes, and a sample file with a known violation is flagged. Once A19 turns on
     `raw-import-ban`, the sample is a raw `import fs from 'fs'`.
   - The copied gateways' own tests pass in the consumer (item 41).
   - A sample unit test that makes an unstaged `fs` call fails with the `[io-trap]` message.
   - A sample test that imports a gateway wrapper proxy per file
     (`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`) has its mocks hoisted,
     and passes.
   - The consumer's `npm run build` succeeds.
   - The MCP server starts from the consumer's config and answers a tool list that includes `discover`.
   - The pre-edit hook blocks an edit that adds a lint violation.
   - `dungeonmaster ward` runs in the consumer and exits 0 on the clean fixture.
   - Running `init` a second time changes nothing (idempotent), and keeps a user's own edits to merged
     files.
5. **Fold G25's manual checks into the suite,** so items 40 and 41 each have an assertion that fails if
   they regress.
6. **Wire it in:** the `check:consumer` script, the `release` script, and a short section in repo
   `CLAUDE.md` saying when to run it and that it needs `npm run build:clean` first.

## How the suite grows

The operator rule in EPIC.md applies: any item that changes what `init` writes, what a package
publishes, or how a consumer resolves, loads or tests code adds its assertions here in the same item,
and the operator runs `npm run check:consumer` (after a whole-repo build) before committing it.

Items known to need an assertion when they land: G01 (folder list feeds `init`), G08 (base tsconfig and
ts-jest), G12 (the `gateway` key), G22 (Jest through the gateway), G24 (the npm and bin wrapper
snippet, `create-package` refusal), A19 (caller-facing rules on), B03 (workspace package `exports`), T01
(MSW in the base Jest config), T02 (the wider I/O trap), T07 (the home sandbox), T09 (the catalog
snippet), and Z02 (session snippets).

## Done when

- [ ] `npm run check:consumer` builds a fresh consumer under the OS temp dir, installs the packed
      tarballs, runs `init`, and runs every assertion in steps 3 and 4.
- [ ] It passes in local-install mode and in global-install mode.
- [ ] Each assertion was shown to fail: break the piece it guards (for example, remove one hook entry
      from the hooks generator), run the suite, confirm the right assertion goes red, then restore.
- [ ] `release` runs it, and repo `CLAUDE.md` says when to run it.
- [ ] No ward check type runs it, and a bare `npm run ward` still exits 0.

## Traps

- The suite reads compiled output, so a warm tree lies: `tsc` never prunes `dist`. Run it after
  `npm run build:clean`, like `check:published`.
- Agents never build. The executing agent reports "build needed" and the operator builds before each
  suite run.
- `npm install` in the consumer needs the network for outside dependencies. If the sandbox has none,
  report it; do not fake the install with links.
- `@dungeonmaster/testing` must carry `publishConfig.access: public` (G03), or a real install 404s. The
  suite installs tarballs, so it would not notice. Add an assertion that every package `init` lists in
  the consumer's `devDependencies` has `publishConfig.access` set to `public`.

## Concessions made while executing
