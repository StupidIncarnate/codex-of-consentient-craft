# @dungeonmaster/shared

Shared contracts, guards, and utilities for Dungeonmaster packages.

## Adding New Exports

When adding new functionality to `@dungeonmaster/shared`, you MUST:

1. **Create the implementation** in the appropriate `src/` folder:
    - `src/contracts/` - Zod schemas and type contracts
    - `src/guards/` - Type guard functions
    - `src/transformers/` - Data transformation functions
    - etc.

2. **Create a barrel export file** at the package root:
    - Create `<category>.ts` (e.g., `guards.ts`, `contracts.ts`)
    - Export all items from the category:
      ```typescript
      // guards.ts - Subpath export entry for @dungeonmaster/shared/guards
      export * from './src/guards/is-key-of/is-key-of-guard';
      export * from './src/guards/another-guard/another-guard-guard';
      ```

3. **Update package.json exports**:
   ```json
   {
     "exports": {
       "./guards": {
         "import": "./dist/guards.js",
         "require": "./dist/guards.js",
         "types": "./dist/guards.d.ts"
       }
     }
   }
   ```

4. **Rebuild the package**:
   ```bash
   npm run build --workspace=@dungeonmaster/shared
   ```

5. **Import in consuming packages**:
   ```typescript
   import { isKeyOfGuard } from '@dungeonmaster/shared/guards';
   ```

## JSONL Stream Line Contracts

Claude CLI outputs newline-delimited JSON (JSONL) during sessions. Each line has a `type` discriminator (`system`, `assistant`, `user`, `result`, `summary`). The `*-stream-line` contracts in `src/contracts/` capture these shapes with scenario-based stubs so test files across web, server, and orchestrator don't construct raw JSON inline.

**Why stubs instead of raw objects:** Raw inline JSON in tests is opaque — you can't tell *when* that shape occurs in a real CLI session. Each stub is named for its scenario (e.g., `PermissionDeniedStreamLineStub`, `AssistantToolUseStreamLineStub`) and carries a JSDoc comment explaining the real-world trigger. This makes tests self-documenting.

**Design decision:** One `assistant-stream-line` contract with variant stubs (not separate contracts per content type). The outer shape `{type: 'assistant', message: {content: [...]}}` is identical — only content items differ.

## Streaming Adapters: the output callback is REQUIRED, never optional

`childProcessSpawnStreamLinesAdapter` takes `onLine` as a **required** parameter. Any future adapter
that streams a long-running process's output must do the same. This is a deliberate ergonomic
choice, and it is load-bearing:

- The adapter is the ONLY place a subprocess's output exists **while the process is still running**.
  The returned `output` does not resolve until exit, so it can never drive a live UI.
- An optional callback makes "no live output" the default, and choosing it is **invisible**: the
  code compiles, the command runs, the returned result is correct, and the only symptom is a
  surface that shows nothing. Nobody reviews an argument that isn't there.
- Ward shipped exactly that way — `questRunWardBroker` called this adapter without `onLine`, with a
  comment claiming a JSONL watcher covered it. The watcher keys on `workItems[].sessionId` and tails
  Claude session JSONL; a ward work item is `spawnerType: 'command'` with no sessionId and ward is
  not Claude, so nothing tailed it. Ward ran for minutes with a dead panel, in BOTH dispatch modes.

Making the parameter required turns that into a compile error, so every caller has to answer "where
does this output go?" To opt out deliberately, pass `() => undefined` — then the decision is on the
page where a reviewer can see it.

**Do not relax this to `onLine?`** to make a caller compile. Wire the output, or opt out explicitly.

## Resolving the Repo Root / Project Root

To resolve "the repo root", "the project root", or "the guild path" from a working directory, use the canonical
`cwdResolveBroker` — do NOT hand-roll a `git rev-parse` call, a parent-walk loop, or read `process.cwd()` as if it
were the root.

```typescript
import {cwdResolveBroker} from '@dungeonmaster/shared/cwd/resolve';

const repoRoot = await cwdResolveBroker({startPath, kind: 'repo-root'});
```

`startPath` is a `FilePath` (typically `processCwdAdapter()`). `kind` selects what to walk up for:

| `kind`                 | Walks up to the directory containing | Return brand           |
|------------------------|--------------------------------------|------------------------|
| `'repo-root'`          | `.dungeonmaster.json`                | `RepoRootCwd`          |
| `'project-root'`       | `package.json`                       | `ProjectRootCwd`       |
| `'guild-path'`         | `guild.json`                         | `GuildPathCwd`         |
| `'dungeonmaster-home'` | the dungeonmaster home dir           | `DungeonmasterHomeCwd` |

It recurses up the directory tree and throws `ProjectRootNotFoundError` if it reaches the filesystem root without
finding the target file. The underlying walk lives in `brokers/config-root/find/config-root-find-broker.ts`
(`.dungeonmaster.json`) and `brokers/project-root/find/project-root-find-broker.ts` (`package.json`).

## Important Notes

- **Never** import from `@dungeonmaster/shared/dist/...` directly
- **Always** use the subpath exports: `@dungeonmaster/shared/guards`, `@dungeonmaster/shared/contracts`, etc.
- After modifying this package, dependent packages must rebuild to see changes
- The barrel export pattern keeps imports clean and maintainable
