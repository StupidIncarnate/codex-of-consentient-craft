# E2E Test Harness

## What Is Real, What Is Mocked, What Is Isolated

E2E tests have three layers. Understanding these prevents mistakes.

### Real (untouched)

- Server backend (Express, file I/O, quest PATCH/POST endpoints, all responders)
- Web frontend (Chromium running the real React app via Vite dev server)
- HTTP and WebSocket (real network between browser ↔ server)
- File system I/O (guild dirs, quest JSON files, session JSONL files)

### Mocked (fake Claude CLI only)

The **only** mock is the fake Claude CLI at `test/harnesses/claude-mock/bin/claude`. It replaces the real LLM so tests
can control what "Claude" says. The real server still spawns it, parses its stream-json output, and broadcasts via
WebSocket — the full pipeline runs, just without a real LLM at the end.

### Isolated (bootstrapped environment)

Playwright config bootstraps an isolated environment so tests never touch real user data:

- **`DUNGEONMASTER_HOME`** → temp dir (`/tmp/dm-e2e-{pid}/`) — guilds, quests, and dungeonmaster data live here
- **`HOME`** → same temp dir — so `os.homedir()` resolves inside the sandbox (session JSONL files land here too)
- **`CLAUDE_CLI_PATH`** → points to the fake CLI executable
- **`FAKE_CLAUDE_QUEUE_DIR`** → `{TEST_HOME}/claude-queue/` — where queued response stubs are written
- **Global setup** creates `.dungeonmaster/` and `claude-queue/` dirs inside the temp dir
- **Global teardown** deletes the entire temp dir tree

Guild working directories (e.g. `/tmp/dm-e2e-quest-approve/`) are created by individual tests via `mkdirSync` and must
exist on disk because the server spawns the fake CLI with `cwd: guildPath`.

## Claude CLI Mock

`packages/testing/test/harnesses/claude-mock/` provides the fake `claude` CLI.

### How It Works

1. Server uses `CLAUDE_CLI_PATH` env var instead of bare `claude` command
2. Playwright config points `CLAUDE_CLI_PATH` at `test/harnesses/claude-mock/bin/claude`
3. Tests pre-write response files to a file-based queue (`FAKE_CLAUDE_QUEUE_DIR`)
4. Fake CLI pops the next queued file, outputs stream-json lines to stdout, exits
5. Fake CLI also writes a JSONL session file to `~/.claude/projects/{encodedPath}/` (just like the real CLI would)

### Writing Tests

**Import rule:** Spec files MUST import `{ test, expect }` from `@dungeonmaster/testing/e2e`, NOT from
`@playwright/test`.
The `@dungeonmaster/testing/e2e` export wraps Playwright's `test` with an auto-fixture that records all network activity
per test — no setup code needed. The ESLint rule `@dungeonmaster/enforce-e2e-base-import` enforces this at lint time.

```ts
import {test, expect, wireHarnessLifecycle} from '@dungeonmaster/testing/e2e';
import {claudeMockHarness, SimpleTextResponseStub} from '../../test/harnesses/claude-mock/claude-mock.harness';
import {environmentHarness} from '../../test/harnesses/environment/environment.harness';
import {guildHarness} from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-example';

const claudeMock = claudeMockHarness({guildPath: GUILD_PATH});
wireHarnessLifecycle({harness: claudeMock, testObj: test});
wireHarnessLifecycle({harness: environmentHarness({guildPath: GUILD_PATH}), testObj: test});

test.beforeEach(async ({request}) => {
  await guildHarness({request}).cleanGuilds();
});

test('example', async ({page, request}) => {
  const guilds = guildHarness({request});
  const guild = await guilds.createGuild({name: 'Test', path: GUILD_PATH});
  const guildId = guilds.extractGuildId({guild});

    // Queue response BEFORE triggering chat
  claudeMock.queueResponse({response: SimpleTextResponseStub({text: 'I found the bug'})});

    // Navigate and wait for guild data to load before interacting
  await page.goto(`/${guildId}/quest`);
    await page.waitForResponse((r) => r.url().includes('/api/guilds') && r.status() === 200);

    // Send message and assert response
    await page.getByTestId('CHAT_INPUT').fill('Fix the bug');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByText('I found the bug')).toBeVisible({timeout: 15_000});
});
```

### Available Stubs

| Stub                                                   | Purpose                                       |
|--------------------------------------------------------|-----------------------------------------------|
| `SimpleTextResponseStub({text?})`                      | Init + text + result                          |
| `ToolUseChainResponseStub({toolName?, followUpText?})` | Init + tool_use + tool_result + text + result |
| `ErrorResponseStub({exitCode?})`                       | Init + partial text, non-zero exit            |
| `ResumeResponseStub({text?})`                          | Text + result (no init, for `--resume` flows) |
| `MultiTurnResponseStubs({messages})`                   | Array of responses for sequential queueing    |

### Mocking Rules

**Allowed to mock:**

- Claude CLI responses via `claudeMock.queueResponse()` — the only mock in the entire harness

**NOT allowed to mock:**

- Server API endpoints (no `page.route()` to intercept/stub HTTP responses)
- WebSocket messages (use `request.patch()` to trigger real WS broadcasts via the server)
- Browser navigation or routing

**Observing requests is fine** — `page.waitForRequest()` just watches traffic without intercepting it. Use this to
assert
that the frontend sent the correct HTTP method, URL, and body to the real server.

**Driving *precondition* state via any server-mutating call is fine** — `request.patch`, `request.post`,
`request.delete`, `writeQuestFile`, direct file writes, harness helpers that call these, anything that changes server
or filesystem state. This is not mocking; it's using the real server/filesystem to produce real events that the
frontend reacts to.

**BUT if the UI has a control that performs that mutation, the test MUST drive it through the UI — never via a write
call.** The whole point of an E2E test is to exercise the real user path. If the test's scope is "click APPROVE → modal
appears" and you PATCH `status: 'approved'` instead of clicking, you never verify the button wires up, never catch
regressions in its handler, and the test silently passes while the button is broken. Same rule applies to POST-
backed buttons (Begin Quest, Start Chat), DELETE-backed buttons (Remove Guild), file-backed form submissions, etc.

- ✅ OK via API/write: setting up state the user would never reach manually in this test (seeding a guild, fast-
  forwarding through a phase the test isn't about, populating fixture data).
- ❌ NOT OK via API/write: any mutation the test is actually supposed to exercise. If the UI has a button/form/input
  for it, drive it through the UI. Only bypass the UI when the mutation is a pure server-side effect with no user-
  facing control (e.g. a cron-driven transition, a webhook-triggered event).

Use `page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click()` — not `getByRole`. All interactive elements
have a stable testid; Playwright's `filter({ hasText })` narrows among testid matches without coupling tests to
Mantine/accessibility-library internals.

### Assert the Full Transition

**CRITICAL:** Every E2E test that triggers a user action must assert all three:

1. **Request correctness** — right method, URL, body
2. **Old UI disappeared** — `not.toBeVisible()` on previous state
3. **New UI appeared** — `toBeVisible()` on expected state

A test that only checks a request fired is incomplete — the UI might silently fail to update.

See `get-testing-patterns` MCP tool for full E2E testing patterns and anti-patterns.

### Gotchas

- **Guild path must exist on disk** — the server spawns the fake CLI with `cwd: guildPath`
- **Wait for `/api/guilds` response** before sending chat — otherwise `guildId` isn't resolved yet and the message
  silently does nothing
- **Queue responses before triggering chat** — if the queue is empty, the fake CLI exits with code 1
- **Quest→session linking requires a chaoswhisperer work item** — the `questActiveSessionTransformer` derives
  `activeSessionId` by looking for `chaoswhisperer` or `glyphsmith` work items with a `sessionId`. If your test quest
  has no chaoswhisperer/glyphsmith work item, the server cannot match the quest to the session, and the execution panel
  will show "Awaiting quest activity..." instead of rendering. Always include a chaoswhisperer work item with the
  session's `sessionId` in test quest data.
- **Quest status determines when the WS execution listener activates** — the browser's WebSocket listener for execution
  streaming (`quest-chat-widget.tsx`) is gated by `shouldRenderExecutionPanelQuestStatusGuard`, which returns `true` for
  every execution-phase status (`seek_*`, `in_progress`, `paused`, `blocked`, `complete`, `abandoned`). The widget
  auto-starts orchestration **only** for startable statuses (`approved` / `design_approved`) — quests past the start gate
  never retrigger `/start` from the browser. Starting a quest directly at `in_progress` via `writeQuestFile` will NOT
  kick off the orchestration loop: the loop is registered either by the `/api/quests/:id/start` endpoint (normal flow)
  or by the server's startup-recovery responder (which only runs at boot). Tests that need the orchestration loop
  running against a seeded quest must:
    1. Write the quest file with `status: 'approved'` (or `'design_approved'`) plus any prior-phase work items marked
       `complete`.
    2. POST `/api/quests/:questId/start` **before** `page.goto(...)`. This transitions the quest to `seek_scope` on
       the server, so the browser lands on an execution-phase status and the WS execution listener is active on the
       first render — no race where fast work items (like the fake ward binary) broadcast output before the browser
       connects.
    3. Leave the already-complete pathseeker in the seeded work items if you want the loop to skip straight to a
       downstream role — `orchestration-start-responder` detects `hasPathseeker` and won't insert a duplicate.
  Tests that only need to verify the start API response (not streamed output) can POST `/api/quests/:id/start`
  against an `approved` quest and assert on the response alone — no page navigation required.
- **Step IDs must be kebab-case** — `stepIdContract` validates against `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`. Do NOT use
  `crypto.randomUUID()` for step IDs in test quest data — UUIDs starting with a digit fail silently during
  `questContract.parse()`, making the quest invisible to `questFindQuestPathBroker`.
