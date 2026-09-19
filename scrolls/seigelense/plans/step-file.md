# Plan: `file` Step Verb

## 1. Specification References & Requirements

Re-derived line numbers against `scrolls/seigelense/siegelense-tooling.md`:

| Requirement | Spec Line | Specification Description |
|---|---|---|
| R1. Step name and purpose | 1033, 2413, 2580, 2597 | `file` inspects/reads files on disk in the lane's own throwaway home directory (`lane.homePath`). |
| R2. Input shape | 2597 | `{ step: 'file', path: string, node?: string \| null, expect?: 'ok' \| 'error' }`. Takes `path` as a home-relative path (e.g. `'guilds/<id>/quests/<id>/quest.json'`). |
| R3. Home-relative constraint | 2597, 2695 | Path must be resolved against the lane's throwaway home (`lane.homePath`). Refuses leading `/` and directory traversal (`..`) that would escape `lane.homePath`. |
| R4. Non-browser / Operational support | 1033, 2413 | `file` runs outside the browser context, directly against disk in `lane.homePath`. It runs identically on `dungeonmaster-headless` and `dungeonmaster-web`. Excluded from `verbs.browser`. |
| R5. Non-acting / Non-capturing / Non-targeting | 41, 47, 53 | Does not change page state, capture screenshots, or resolve locator matches. Excluded from `verbs.acting`, `verbs.capturing`, and `verbs.targeting`. |
| R6. Missing file handling | 101, 1598 | If file does not exist, throws `StepFileNotFoundError`. When `expect: 'error'` is declared, this is caught as expected error (`ok: true`). When `expect !== 'error'`, it halts the batch with a clean finding (`ok: false`). |
| R7. Reading output | 2597 | Returns file content as `ContentText`. |

---

## 2. Architecture & Layer Boundaries

Following Dungeonmaster architecture rules:
- **Statics:**
  - `packages/siegelense/src/statics/step/step-statics.ts`: add `'file'` to `verbs.all` (17th verb). Keep excluded from `verbs.acting`, `verbs.capturing`, `verbs.targeting`, and `verbs.browser`.
  - `packages/siegelense/src/statics/file/file-statics.ts` + `.test.ts`: default encodings and error message templates.
- **Errors:**
  - `packages/siegelense/src/errors/step-file-not-found/step-file-not-found-error.ts` + `.test.ts`:
    Extends Error. Takes `{ path: string, homePath: string }`.
    Message: `file "${path}" does not exist in lane home "${homePath}"`.
- **Contracts & Stubs:**
  - `packages/siegelense/src/contracts/step-file-path/step-file-path-contract.ts` + stub + test:
    Validates non-empty string, no leading `/`, no `..` traversal.
  - Update `stepContract` (`packages/siegelense/src/contracts/step/step-contract.ts` and stub) to add `file` variant:
    `{ step: z.literal('file'), path: stepFilePathContract, node: nodeLabelContract.nullable().default(null), expect: stepExpectationContract.default(stepStatics.defaults.expect) }`.
- **Brokers:**
  - `packages/siegelense/src/brokers/step/file/step-file-broker.ts` + `.proxy.ts` + `.test.ts`:
    Takes `{ lane: LaneSession, path: StepFilePath }`.
    Resolves `filePath` using `pathJoinAdapter({ paths: [lane.homePath, path] })`.
    Checks existence with `fsStatAdapter({ filePath })`.
    If file missing: throws `StepFileNotFoundError({ path, homePath: lane.homePath })`.
    Reads file using `fsReadFileAdapter({ filePath, encoding: 'utf8' })`.
    Returns `contentTextContract.parse(content)`.
  - Wire `step.step === 'file'` in `runVerbLayerBroker` (routed before browser check).
- **Statics & Barrels:**
  - Update `docsStatics` and tests for verb count (climbs from 16 to 17).
  - Export new error, contract, and broker in root barrels.

---

## 3. Verification & Driving Plan

1. **Unit tests & Scoped Ward:**
   - Run scoped ward across all touched files.
2. **Manual Driving (The Driver & Fixer):**
   - Boot `dungeonmaster-headless` instance.
   - Run `file` reading `api-server.log` (guaranteed to exist in instance home):
     `node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> --steps '[{"step":"file","path":"api-server.log"}]'`
     Verify status `done`, reading contains server log text, ok is `true`.
   - Run adversarial missing file check with `expect: 'error'`:
     `node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> --steps '[{"step":"file","path":"missing.txt","expect":"error"}]'`
     Verify status `done`, step ok is `true` because error was declared.
   - Run unexpected success check:
     `node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> --steps '[{"step":"file","path":"api-server.log","expect":"error"}]'`
     Verify batch halts with status `failed`, `ok: false`.
   - Boot `dungeonmaster-web` instance, verify `file` works in web lane as well.
   - Query disk results (`results` command) to verify saved transcript.
   - Teardown instances and verify clean sweep.
