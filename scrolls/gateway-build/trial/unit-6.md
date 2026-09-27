# Unit 6: siegelense instance-reserve-broker — gitBranchReadAdapter → @dungeonmaster/bin/git

This is a Trial 1 unit. Trial 1 ran before the gateway moved to `packages/@gateway/`, while it still
lived at `packages/{npm,node,browser,bin}`. Its callers imported the gateway by its raw package
name, not by the `#gateway/<folder>/<subpath>` form used today. This unit switched
`instanceReserveBroker`'s git-branch read from `gitBranchReadAdapter` to `currentBranch` from
`@dungeonmaster/bin/git`. `git-branch-read-adapter.ts` stayed in place with no caller, because the
trial rules forbid deleting an adapter.

This unit is where three findings first surfaced. Two of them are written up in full elsewhere, so
this file only points at them:

- `currentBranch` throws on a real git failure instead of returning `null`, the way
  `gitBranchReadAdapter` did. `scrolls/gateway/followup-sustainability.md` item 33 has the full
  behaviour change. It also covers a later fix: a guard that maps a "not a repository" failure back
  to `null`. That fix came after this unit ran.
- A lint rule named `enforce-proxy-child-creation` checks that a broker's test proxy composes a
  child proxy for every function the broker imports. A caller can satisfy that rule by composing a
  broker's proxy without calling any of its setup methods. That caller can then depend on the
  composed proxy's default mock value without knowing it. `scrolls/gateway-build/README.md`
  section 6 covers this finding, under the heading "The gateway proxy needing parity with adapter
  proxies."
- The same lint rule failed for every gateway proxy whose factory name did not match the pattern
  `<exportName>Proxy`. `scrolls/gateway-build/README.md` section 6 covers this finding, under the
  heading "Proxy naming."

## Where the cross-package proxy hoisting fix lives

The third finding needs its own section, because the names of the files that fix it are not written
down anywhere else. Before the fix, a `.proxy.ts` file that composed another workspace package's
proxy through a bare package-name import, such as `@dungeonmaster/bin/testing`, silently mocked
nothing. A test built on that import passed lint and passed typecheck, then ran a real subprocess
instead of the mocked one. `scrolls/gateway-build/README.md` section 6 covers the bug and the fix,
under the heading "Cross-package proxy hoisting."

The fix itself lives in `packages/testing/src`. `workspacePackageImportResolveMiddleware`,
`workspacePackageExportSourceTransformer` and `workspaceRootFindMiddleware` do the resolving now.
They read the target workspace package's own `package.json` `exports` map to resolve an import like
`<pkg>/testing`, or a gateway `_test_` import. `isProxyImportGuard` and
`importPathToFilePathTransformer` decide which imports this walk follows.
