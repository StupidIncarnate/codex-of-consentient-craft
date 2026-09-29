# Wave 3.2: enum brands off, enum stub wraps unwrapped, dead enum stubs moved out

Operator run order. Every step is a dry run first (read the summary line and the diff), then the same command with
`apply`, then the gate. Run from the worktree root. Nothing here builds, commits or removes a file.

Measured 2026-09-29 on the tree after wave 3.1: 88 enum contracts in 13 packages, 37 of them branded (eslint-plugin 1,
mcp 1, orchestrator 1, session-forensics 1, shared 4, siegelense 22, tooling 1, ward 1, web 5), 88 enum stubs,
1,118 test-file wraps of the form `XStub({ value: <literal> })` in 11 packages (shared 162, orchestrator 389, web 240,
siegelense 162, eslint-plugin 76, mcp 32, session-forensics 31, ward 15, tooling 8, hooks 2, server 1).

The three scripts and `lib/` must be the current copies in `tmp/phase34/` (`b15-stub-unwrap` and `lib/repo.cjs` gained
an optional `--overlay-dir` and an optional `ignore` on the gate):

```bash
cp -a scrolls/brands-gateways-epic/phase34-scripts/b15-enum-brands-off tmp/phase34/
cp scrolls/brands-gateways-epic/phase34-scripts/b15-stub-unwrap/run.cjs tmp/phase34/b15-stub-unwrap/run.cjs
cp scrolls/brands-gateways-epic/phase34-scripts/lib/repo.cjs tmp/phase34/lib/repo.cjs
```

Every command below takes `node --max-old-space-size=32000`; it is left off the lines to keep them short.

## Package order

Dependency order, `shared` first. It is what the script prints and what every per-package step below follows:

`shared`, `orchestrator`, `web`, `server`, `eslint-plugin`, `hooks`, `ward`, `mcp`, `session-forensics`, `siegelense`,
`tooling` (the packages with a wrap; `config`, `hydration` and `hydration-recipes` hold enums but no literal wrap, `cli` and
`local-eslint` hold neither).

## Steps

1. Census, read-only. Prints per-package enum, branded, stub and use counts; writes `out/census.csv`, `out/enums.csv`
   (one row per enum contract with its stub and the stub's uses) and `out/inline-enum-brands.txt`.

   ```bash
   node tmp/phase34/b15-enum-brands-off/run.cjs --census
   ```

2. Brands off, dry run over every package. One whole-package typecheck of each package that holds a branded enum
   and every package depending on it, before against after (about 90 seconds). A contract whose removal adds a
   diagnostic is kept and listed in `out/brands-off-leftovers.txt` with the diagnostic; a diagnostic no contract
   explains writes nothing and exits 1. The summary line says `37 enum contracts unbranded ... 0 kept by the gate`
   when nothing blocks.

   ```bash
   node tmp/phase34/b15-enum-brands-off/run.cjs
   ```

3. Brands off, apply. The same command with `apply`; it prints the step 4 unwrap command lines again into
   `out/unwrap-commands.txt`.

   ```bash
   node tmp/phase34/b15-enum-brands-off/run.cjs apply
   ```

4. Gate the packages the brand removal touched, in dependency order (a multi-line chain such as
   `z\n  .enum([...])\n  .brand<...>()` is left as `z\n  .enum([...]);`; ward's lint `--fix` reflows it):

   ```bash
   npm run ward -- --only lint,typecheck,unit -- packages/shared
   npm run ward -- --only lint,typecheck,unit -- packages/orchestrator
   npm run ward -- --only lint,typecheck,unit -- packages/web
   npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin
   npm run ward -- --only lint,typecheck,unit -- packages/ward
   npm run ward -- --only lint,typecheck,unit -- packages/mcp
   npm run ward -- --only lint,typecheck,unit -- packages/session-forensics
   npm run ward -- --only lint,typecheck,unit -- packages/siegelense
   npm run ward -- --only lint,typecheck,unit -- packages/tooling
   ```

   Ward typechecks a touched package whole, so a dependent broken by a brand removal shows up in its own
   typecheck. Step 2's gate already proved that none does; these runs add lint and the unit tests.

5. Unwrap the enum stub wraps, one package at a time, in the package order above. Each package's exact line, with its
   own stub list, is in `out/unwrap-commands.txt` (11 lines). For each line: run it as printed (dry run, read the
   `unwrapped`/`kept` counts in the summary), run it again with `apply` appended, then gate the package with a
   ward run on the package folder. The unwrap edits test files only, so the gate is that package alone:

   ```bash
   node tmp/phase34/b15-stub-unwrap/run.cjs shared --stubs=<the shared line's list>
   node tmp/phase34/b15-stub-unwrap/run.cjs shared --stubs=<the shared line's list> apply
   npm run ward -- --only lint,typecheck,unit -- packages/shared
   ```

   then the same three commands for `orchestrator`, `web`, `server`, `eslint-plugin`, `hooks`, `ward`, `mcp`,
   `session-forensics`, `siegelense`, `tooling`. Run the unit checks, not only typecheck: an assertion that compared a
   stub's parsed value now compares a literal. `out/<pkg>-kept.txt` in `b15-stub-unwrap/out/` lists every wrap the
   checker still needs; each is a hand edit.

6. Move the enum stubs nothing references any more. Dry run with `--verify` (typechecks every edited barrel with the
   moved files hidden), then apply. Each stub moves with its `.stub.test.ts` when it has one, to
   `tmp/deletions/3.2/<original repo path>`; each barrel line re-exporting it goes. `out/move-stubs-kept.txt` says why
   every other stub stays.

   ```bash
   node tmp/phase34/b15-enum-brands-off/run.cjs move-stubs --verify
   node tmp/phase34/b15-enum-brands-off/run.cjs move-stubs apply
   ```

   Gate each package named in `out/move-stubs.diff` (the moved stubs and the barrels), in package order:

   ```bash
   npm run ward -- --only lint,typecheck,unit -- packages/<pkg>
   ```

7. Re-run step 1. `enums.csv` then shows what still calls each surviving stub: the hand queue for the rest of 3.2.

## Gate note

The step 4, 5 and 6 gate is `npm run ward -- --only lint,typecheck,unit -- packages/<pkg>` for the named package.
A dependent package needs its own line only where the step touched its files (step 5 does that itself, one package
at a time; steps 4 and 6 name the packages).

## Proof on copies

`--sample-out` writes changed files, laid out as repo paths, into a dir instead of `packages/`:

```bash
node tmp/phase34/b15-enum-brands-off/run.cjs mcp shared --sample-out=tmp/phase34/b15-enum-brands-off/sample-out
node tmp/phase34/b15-stub-unwrap/run.cjs mcp --stubs=<list> --overlay-dir=tmp/phase34/b15-enum-brands-off/sample-out --sample-out=tmp/phase34/b15-enum-brands-off/sample-out-unwrap
node tmp/phase34/lib/verify-sample.cjs tmp/phase34/b15-enum-brands-off/sample-out tmp/phase34/b15-enum-brands-off/sample-out-unwrap --no-exports-overlay
```

`--overlay-dir` lays the brand-removal sample over the tree in the unwrap's language service, so the unwrap is
graded against contracts that are not written yet. Delete the sample dirs once read.
