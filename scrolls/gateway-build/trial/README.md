# Trial: consuming the gateway from real callers

Each trial unit switches 1 to 3 caller files from an adapter to a gateway import, as `scrolls/gateway-build/README.md` section 5 summarises. Each unit writes its own log here as `unit-<n>.md`.

## Rules for every trial agent

1. **Never delete or edit an adapter.** Switch the caller only. An adapter left with no callers stays in place and is noted in the unit log.
2. **Callers' proxies mock the gateway export,** through the gateway package's `_test_` subpath (`@dungeonmaster/node/_test_`, `@dungeonmaster/bin/_test_`, …). A caller's proxy never mocks `fs` or `child_process` underneath the gateway.
3. **Dependencies:** add the gateway package the caller now imports to that package's `package.json` `dependencies` as `"@dungeonmaster/<gateway>": "*"`. Do not run `npm install`; the workspace links already exist. The orchestrator syncs the lockfile.
4. **Lint friction is the point.** When a lint rule fires on correct consumer code, do not change the rule and do not dodge it. Record it in the unit log: the rule, the file, the exact message, and what the correct code is. Finish everything else in the unit.
5. **Behaviour.** A bug fix, such as the data-loss units, gets a test proving the new behaviour. Otherwise behaviour stays identical, and the existing tests keep proving it.

## Unit log format

- Files changed.
- Gateway imports used.
- Ward command and result, quoted.
- Friction: every lint, typecheck or test problem the switch caused, and how it was resolved or why it could not be.
- Edge cases found that the gateway design did not account for.
