# E2E Test Harness

## Claude CLI Mock

`packages/testing/e2e/web/harness/claude-mock/` provides a fake `claude` CLI for Playwright E2E tests. The real server
flow runs end-to-end (spawn → parse stream-json → extract session → broadcast WebSocket) but without hitting the real
LLM.

### How It Works

1. Server uses `CLAUDE_CLI_PATH` env var instead of bare `claude` command
2. Playwright config points `CLAUDE_CLI_PATH` at `harness/claude-mock/bin/claude`
3. Tests pre-write response files to a file-based queue (`FAKE_CLAUDE_QUEUE_DIR`)
4. Fake CLI pops the next queued file, outputs stream-json lines to stdout, exits

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

### Gotchas

- **Guild path must exist on disk** — the server spawns the fake CLI with `cwd: guildPath`
- **Wait for `/api/guilds` response** before sending chat — otherwise `guildId` isn't resolved yet and the message
  silently does nothing
- **Queue responses before triggering chat** — if the queue is empty, the fake CLI exits with code 1
