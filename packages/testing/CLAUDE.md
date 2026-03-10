# E2E Test Harness

## What Is Real, What Is Mocked, What Is Isolated

E2E tests have three layers. Understanding these prevents mistakes.

### Real (untouched)

- Server backend (Express, file I/O, quest PATCH/POST endpoints, all responders)
- Web frontend (Chromium running the real React app via Vite dev server)
- HTTP and WebSocket (real network between browser ↔ server)
- File system I/O (guild dirs, quest JSON files, session JSONL files)

### Mocked (fake Claude CLI only)

The **only** mock is the fake Claude CLI at `e2e/web/harness/claude-mock/bin/claude`. It replaces the real LLM so tests
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

`packages/testing/e2e/web/harness/claude-mock/` provides the fake `claude` CLI.

### How It Works

1. Server uses `CLAUDE_CLI_PATH` env var instead of bare `claude` command
2. Playwright config points `CLAUDE_CLI_PATH` at `harness/claude-mock/bin/claude`
3. Tests pre-write response files to a file-based queue (`FAKE_CLAUDE_QUEUE_DIR`)
4. Fake CLI pops the next queued file, outputs stream-json lines to stdout, exits
5. Fake CLI also writes a JSONL session file to `~/.claude/projects/{encodedPath}/` (just like the real CLI would)

### Writing Tests

```ts
import {
    cleanGuilds,
    createGuild,
    queueClaudeResponse,
    clearClaudeQueue,
    SimpleTextResponseStub,
    ToolUseChainResponseStub,
} from './fixtures/test-helpers';

test.beforeEach(async ({request}) => {
    await cleanGuilds(request);
    clearClaudeQueue();
});

test('example', async ({page, request}) => {
    const guild = await createGuild(request, {name: 'Test', path: '/tmp/some-real-dir'});

    // Queue response BEFORE triggering chat
    queueClaudeResponse(SimpleTextResponseStub({text: 'I found the bug'}));

    // Navigate and wait for guild data to load before interacting
    await page.goto(`/${guild.id}/quest`);
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

- Claude CLI responses via `queueClaudeResponse()` — the only mock in the entire harness

**NOT allowed to mock:**

- Server API endpoints (no `page.route()` to intercept/stub HTTP responses)
- WebSocket messages (use `request.patch()` to trigger real WS broadcasts via the server)
- Browser navigation or routing

**Observing requests is fine** — `page.waitForRequest()` just watches traffic without intercepting it. Use this to
assert
that the frontend sent the correct HTTP method, URL, and body to the real server.

**Driving state via the API is fine** — calling `request.patch('/api/quests/:id', { data })` to change quest status is
not mocking; it's using the real server to produce real WS events that the frontend reacts to.

### Gotchas

- **Guild path must exist on disk** — the server spawns the fake CLI with `cwd: guildPath`
- **Wait for `/api/guilds` response** before sending chat — otherwise `guildId` isn't resolved yet and the message
  silently does nothing
- **Queue responses before triggering chat** — if the queue is empty, the fake CLI exits with code 1
