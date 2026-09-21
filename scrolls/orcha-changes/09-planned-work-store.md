# 09 — reading and writing the plan file

```
GOAL      A plan lands at <questFolder>/planned-work/<operationItemId>.json and comes back.
AFTER     07 (the shape)
BEFORE    15 · 17 · 18
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**Small story, and it is separate because the path constant has a rule that catches people out.**

---

## BUILD

### The path

```
<questFolder>/
  quest.json                              ← workItems[]: the sessions that RAN
  planned-work/<operationItemId>.json     ← pieces[]: the sessions the planner INTENDED
  ward-results/<id>.json
  riftcarver-results/<id>.log
```

`planned-work` is a new dirname. It goes on the EXISTING `quest` group in
`packages/shared/src/statics/locations/locations-statics.ts:78-84`, as a fourth sibling to
`wardResultsDir`, `riftcarverResultsDir`, `designDir` and `questFile`:

```ts
quest: {
  wardResultsDir: 'ward-results',
  riftcarverResultsDir: 'riftcarver-results',
  designDir: 'design',
  questFile: 'quest.json',
  imagesDir: 'images',
  plannedWorkDir: 'planned-work',   // ADD — one dirname, nothing else
},
```

**The trap:** that module's own header states the rule — a value "MUST be a complete filename or
dirname, something you would see whole in a directory listing." So `planned-work/<id>.json` is not one
value. It is the `plannedWorkDir` dirname above, composed with the id by a resolver broker the way
every other nested quest path already is. Putting the joined string in as one value breaks the
module's contract on the first read.

**The resolver broker is new, and it mirrors an existing one exactly.**
`locationsWardResultsPathFindBroker`
(`packages/shared/src/brokers/locations/ward-results-path-find/locations-ward-results-path-find-broker.ts`)
is the whole pattern to copy — same package, same folder shape, thirteen lines:

```ts
// packages/shared/src/brokers/locations/planned-work-path-find/locations-planned-work-path-find-broker.ts
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsPlannedWorkPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: AbsoluteFilePath;
}): AbsoluteFilePath =>
  absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [questFolderPath, locationsStatics.quest.plannedWorkDir] }),
  );
```

It resolves the DIRECTORY only — `<questFolder>/planned-work`. The two brokers below join
`<operationItemId>.json` onto that themselves, the same way `locationsWardResultsPathFindBroker`
resolves `ward-results` and each ward caller joins its own result id onto it.

### The two brokers

Live in `packages/orchestrator/src/brokers/planned-work/read/` and `.../write/` — sibling to
`packages/orchestrator/src/brokers/quest/persist/`, not inside it; this is a new domain, not a quest
sub-broker.

| | Params | Returns |
|---|---|---|
| `plannedWorkReadBroker` | `{ questFolderPath: AbsoluteFilePath, operationItemId: OperationItemId }` | `WorkPlan \| null` |
| `plannedWorkWriteBroker` | `{ questFolderPath: AbsoluteFilePath, operationItemId: OperationItemId, plan: WorkPlan }` | `void` |

**A missing plan file is `null`, not a throw.** A scope whose planner has not run yet legitimately has
none, and story 18 serves `piece: null` to a planner for exactly this reason.

**The read broker cannot use `fsReadFileAdapter` alone to detect "missing."** This package's own
adapter rewraps EVERY failure into the same generic `Error`
(`packages/orchestrator/src/adapters/fs/read-file/fs-read-file-adapter.ts:18-23` — a `try/catch` that
throws `` `Failed to read file at ${filePath}` `` on ANY cause, ENOENT included), so there is no error
shape left to distinguish "file absent" from "disk failure" once it has thrown. Check existence FIRST,
the way `installTestbedCreateBroker`'s own `readFile` does
(`packages/testing/src/brokers/install-testbed/create/install-testbed-create-broker.ts:110-117`):

```ts
export const plannedWorkReadBroker = async ({
  questFolderPath,
  operationItemId,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItemId;
}): Promise<WorkPlan | null> => {
  const dirPath = locationsPlannedWorkPathFindBroker({ questFolderPath });
  const filePath = filePathContract.parse(
    pathJoinAdapter({ paths: [dirPath, `${String(operationItemId)}.json`] }),
  );

  if (!(await fsIsAccessibleAdapter({ filePath }))) {
    return null;
  }

  const contents = await fsReadFileAdapter({ filePath });
  return workPlanContract.parse(JSON.parse(String(contents)));
};
```

`fsIsAccessibleAdapter` (`packages/orchestrator/src/adapters/fs/is-accessible/fs-is-accessible-adapter.ts`)
is already in this package, already returns a plain boolean, and already never throws — reuse it rather
than adding a second existence check.

**Write atomically**, the way `quest-persist-broker.ts` does — tmp-write then rename, not a direct
write:

```ts
// quest-persist-broker.ts's actual shape, for reference:
const tmpPath = filePathContract.parse(`${questFilePath}.tmp`);
await fsWriteFileAdapter({ filePath: tmpPath, contents });
await fsRenameAdapter({ from: tmpPath, to: questFilePath });
```

Copy the tmp-suffix-then-rename shape exactly — `fsRenameAdapter` is POSIX-atomic on the same
filesystem, which is the whole property this buys. **Two differences from `quest-persist-broker`,
both real, neither optional:**

1. **Create the directory first.** `quest.json` always writes into a quest folder that already
   exists; `planned-work/` does not exist until a plan is written into it. Neither
   `fsWriteFileAdapter` nor `fsRenameAdapter` creates a parent directory, and **this package has no
   `mkdir` adapter of its own** — the fs adapters at `packages/orchestrator/src/adapters/fs/` list
   append-file, is-accessible, read-file(-range), read-jsonl, readdir, readlink, rename, rm, symlink,
   walk-files, watch-tail and write-file, and no `mkdir`. Import `fsMkdirAdapter` from
   `@dungeonmaster/shared/adapters` instead of writing a new local one — this package already imports
   siblings from that subpath (`pathJoinAdapter`, `childProcessSpawnCaptureAdapter`, e.g.
   `packages/orchestrator/test/harnesses/orchestration-quest/orchestration-quest.harness.ts:46`). Its
   signature is `fsMkdirAdapter({ filepath }): Promise<AdapterResult>`, always recursive
   (`packages/shared/src/adapters/fs/mkdir/fs-mkdir-adapter.ts:16-24`) — call it with the DIRECTORY
   path (`locationsPlannedWorkPathFindBroker`'s return), before joining the tmp filename.
Put together:

```ts
export const plannedWorkWriteBroker = async ({
  questFolderPath,
  operationItemId,
  plan,
}: {
  questFolderPath: AbsoluteFilePath;
  operationItemId: OperationItemId;
  plan: WorkPlan;
}): Promise<void> => {
  const dirPath = locationsPlannedWorkPathFindBroker({ questFolderPath });
  await fsMkdirAdapter({ filepath: dirPath });   // recursive: true — safe whether or not it exists yet

  const filePath = filePathContract.parse(
    pathJoinAdapter({ paths: [dirPath, `${String(operationItemId)}.json`] }),
  );
  const tmpPath = filePathContract.parse(`${filePath}.tmp`);

  await fsWriteFileAdapter({
    filePath: tmpPath,
    contents: fileContentsContract.parse(JSON.stringify(plan, null, 2)),
  });
  await fsRenameAdapter({ from: tmpPath, to: filePath });
};
```

2. **No outbox append.** `questPersistBroker` ends with `questOutboxAppendBroker({ questId })`, which
   is what drives the WebSocket `quest-modified` broadcast the browser re-renders on
   (`<dungeonmaster-ward>`-adjacent context: "Quest Event Notification" in this package's own
   `CLAUDE.md`). A plan file is not `quest.json`, so this write is not a quest mutation in that sense.
   **OPEN — whether a plan write should notify the browser at all, and through which event.** Story 18
   renders the plan as markdown on request; nothing in this chain says the execution panel refreshes
   the moment a planner writes or amends one. Leave it unwired here and flag it for whichever of
   stories 17/27 the conductor decides owns a live plan view, rather than guessing an event shape.

---

## DONE WHEN

Integration tests, using `installTestbedCreateBroker` from `@dungeonmaster/testing` for an isolated
temp directory under the OS `/tmp`. **Never write test files into the repo — not even `<repoRoot>/tmp`.**

**`installTestbedCreateBroker` alone gives you an isolated directory, not a quest folder** — its own
`guildPath` is a bare temp dir seeded with `package.json` and `.claude/`, shaped for CLI-install
testing. To get a REAL `<questFolder>` to pass to `plannedWorkReadBroker`/`plannedWorkWriteBroker`,
compose it with `orchestrationQuestHarness`
(`packages/orchestrator/test/harnesses/orchestration-quest/orchestration-quest.harness.ts`) — this is
the actual pattern this package's own integration tests already use (e.g.
`packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts:60-62`), not a
sketch:

```ts
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { questFindQuestPathBroker } from '../../../../src/brokers/quest/find-quest-path/quest-find-quest-path-broker';

describe('plannedWorkWriteBroker + plannedWorkReadBroker', () => {
  it('VALID: {a plan written then read} => comes back identical', async () => {
    const testbed = installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'planned-work' }) });
    const quest = orchestrationQuestHarness();
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath } = await questFindQuestPathBroker({ questId });
    const questFolderPath = absoluteFilePathContract.parse(questPath);

    // … call plannedWorkWriteBroker({ questFolderPath, operationItemId, plan }), then
    // plannedWorkReadBroker({ questFolderPath, operationItemId }), and assert the round-trip …

    await quest.afterEach();   // removes the guild `createGuildAndQuest` registered
  });
});
```

`questFindQuestPathBroker({ questId })` is the same resolver every other quest-folder integration test
in this package uses to turn a minted quest into a real on-disk path — do not hand-roll a second way to
find it. `quest.afterEach()` is the harness's own teardown (`orchestration-quest.harness.ts:381-394`);
`testbed.cleanup()` on its own would remove the guild's DISK directory but not its `guild.json` config
registration, which is what `afterEach` clears.

| Assert | |
|---|---|
| a plan written then read comes back identical | round-trip, through a REAL minted quest folder, not a bare temp dir |
| the WorkPlan fixture uses the real `<flowId>:<kind>:<localId>` unit id shape | consistent with stories 07 and 08's own correction |
| reading a missing file returns `null` | not a throw, not `{}` — assert BEFORE any write happens against a freshly-minted quest, which has no `planned-work/` directory at all yet |
| the directory is created if absent | a first plan on a fresh quest — assert `planned-work/` did not exist before the write and does after |
| a SECOND write to the same `operationItemId` overwrites cleanly | an amendment (story 17) replaces the whole file; the directory-exists branch of the mkdir call must not throw on a directory that is already there — `fsMkdirAdapter`'s `recursive: true` covers this, but assert it rather than trust the adapter's doc comment |
| the path composes from `locationsPlannedWorkPathFindBroker` + `locationsStatics.quest.plannedWorkDir`, not from a literal | assert the resolver's return, so a later rename of the dirname is one edit, not a grep-and-replace |
| a half-written plan (kill the process between tmp-write and rename — or assert the tmp file directly) never surfaces as a truncated read | the atomicity the tmp-suffix-then-rename pattern exists for |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| validate the plan on read | story 08 validates on WRITE, at the tool boundary. A file already on disk is read as-is |
| render it as markdown | story 18 |
| amend a plan | story 17's `amendment` payload |
| notify the browser of a plan write | OPEN above — not this story's to wire |
