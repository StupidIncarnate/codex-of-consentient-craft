# Walker Guide — send-message-with-images

Server under test: `http://dungeonmaster.localhost:4751` (this repo's `npm run dev` — web on 4751,
API on 4750, `/api` and `/ws` are Vite-proxied through 4751 so either base works). Its
`DUNGEONMASTER_HOME` is `<repoRoot>/.dungeonmaster-dev` (confirmed: that directory exists in this
worktree, has a `config.json`, an `event-outbox.jsonl`, and a populated `guilds/` dir). Do not start,
stop, or restart it.

**This flow is NOT the sibling `paste-image-into-composer` flow.** That one only proves the composer's
own DOM/IndexedDB mechanics and never issues a real send. This flow's terminal states
(`agent-reads-images`, `send-text-only`, `clear-composer`) all sit on the far side of a real
`POST /api/quests/:questId/chat` (or `/followup`, or `/api/guilds/:guildId/quests`) — and P3's
`spawns in the background` force means a real `claude` CLI child process, not a mock. There is no
`claudeMockHarness` on the real dev server: every image-carrying send that reaches
`agent-reads-images` spawns the SAME `claude` binary this repo's own sessions use
(`child-process-spawn-stream-json-adapter.ts` resolves `process.env.CLAUDE_CLI_PATH ?? 'claude'`),
against real Anthropic API credentials, and costs real wall-clock time (seconds to low minutes) and
real API usage. Budget for that before walking P3's log-output/process-state observables.

## TOOLING

- Composer DOM, paste synthesis, keyboard, IndexedDB/localStorage reads — all driven from the page via
  `mcp__claude-in-chrome__javascript_tool`. Load the browser tool set first:
  `ToolSearch({query: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__tabs_close_mcp,mcp__claude-in-chrome__computer"})`.
- The real HTTP exchange (`api-call` observables — request body, status, response body) —
  `mcp__claude-in-chrome__read_network_requests`, filtered to the URL, after pressing Enter/clicking
  SEND. `curl` against `http://dungeonmaster.localhost:4751/api/...` works identically for anything
  driven outside the browser (guild/quest seeding, the 6-image server-side-reject case that the
  browser's own client-side cap never lets you reach).
- Quest/guild files on disk (`file-exists` observables — the images dir, `quest.json` itself) —
  `<repoRoot>/.dungeonmaster-dev/guilds/<guildId>/quests/<questId>/quest.json` and
  `.../images/*.<ext>`. Read with the `Read` tool; list with `ls` or a `python3 os.walk` one-liner via
  Bash (native `find`/`grep` are blocked in this repo).
- The prompt that actually reached the agent, and whether the agent issued a `Read` on the written
  path (`log-output` observables) — the session's own JSONL transcript at
  `$HOME/.claude/projects/<guildPath with every / replaced by ->/<sessionId>.jsonl` (see OFF-SCREEN).
  There is no dev-server log line carrying the verbatim prompt string — `VERBOSE=1`'s `[dev]` lines
  cover WS/event traffic, not the spawned argv.
- The spawned child's argv (`process-state` observables) — the session JSONL's first (or newest,
  on a resume) `user` line's `message.content` IS the `-p` value verbatim (Claude CLI passes the
  prompt straight through), so read it there rather than racing a live `ps` grep against a process
  that may finish before you look. If you do want the raw process:
  `ps -eo pid,args | grep -- '-p ' | grep -v grep` while the request is still in flight (P3 only —
  the HTTP response returns before the spawn finishes, so there is a real window).
- Dev server log file: **NOT FOUND — walker must work this out.** `npm run dev` writes `[dev]`-prefixed
  lines to whichever terminal invoked it; nothing in this repo redirects that stdout to a file this
  session can read.
- If Bash is denied for the session, every `curl` in this guide works as a `fetch()` from the page via
  `javascript_tool`, and the `Write` tool creates the guild `cwd` directory in place of `mkdir -p`. Two
  walkers used both fallbacks successfully with no functional difference.

## ENTRY

- **Create-quest composer** (no quest yet — P3/P4/P5's "first message" sub-case):
  `http://dungeonmaster.localhost:4751/{urlSlug}/quest` — `CHAT_INPUT` mounts immediately, no quest
  required. Sending here POSTs `/api/guilds/{guildId}/quests`.
- **Existing-quest composer** (P2/P3/P4/P5's "subsequent message" sub-case, and P1):
  `http://dungeonmaster.localhost:4751/{urlSlug}/quest/{questId}`. Sending here POSTs
  `/api/quests/{questId}/chat`.
- **FOLLOW-UP tab** (the `/followup` route observables — `check-followup-post-carries-images`, the
  rejection paths): open an existing-quest composer at a status in `blocked | complete | merged`,
  click `[data-testid="EXECUTION_FOLLOWUP_BUTTON"]`, wait for
  `[data-testid="execution-panel-tab-followup"]`. The FOLLOW-UP composer is a SECOND, separate
  `CHAT_INPUT` mount inside `[data-testid="CHAT_PANEL"]` — see TRAPS.
- No login, no feature flag. `urlSlug` = the guild's `name`, lowercased, spaces → hyphens (or read
  `urlSlug` straight off the `POST /api/guilds` response).
- Wait for `[data-testid="CHAT_INPUT"]` to be visible before pasting/typing anything.

## SEEDING

**Every path needs a guild, and the guild's `path` must exist as a real directory** — it becomes the
spawned Claude CLI's `cwd` (`chatSpawnBroker` → `questCwdResolveBroker` falls back to the guild's repo
root when the quest has no worktree yet, which every quest this flow touches will not), and Node's
`spawn()` throws if that directory is missing.

```bash
mkdir -p /tmp/dm-walker-send-images
curl -s -X POST http://dungeonmaster.localhost:4751/api/guilds \
  -H 'Content-Type: application/json' \
  -d '{"name":"Walker Send Images Guild","path":"/tmp/dm-walker-send-images"}'
```

Response is `{"id": "...", "urlSlug": "...", ...}` — capture `id` (`guildId`) and `urlSlug`.

**P3/P4/P5, "first message" sub-case (no questId yet):** navigate straight to `/{urlSlug}/quest`,
paste an image, type text, press Enter — this is the real create-quest-from-chat path
(`POST /api/guilds/{guildId}/quests` → `QuestNewResponder` → `orchestratorStartChatAdapter`), and it
spawns a REAL chaoswhisperer session. The browser navigates to `/quest/{questId}` once the response
resolves; the `questId` in that URL and the `chatProcessId`/`questId` in the response body are your
seeds for everything downstream.

**P2/P3/P4/P5, "subsequent message" sub-case (mid-quest, resumed session):** the cleanest real-system
path is to build on the quest you just created above rather than hand-fabricating a session file:

1. After the first send above resolves, poll `quest.json` at
   `<repoRoot>/.dungeonmaster-dev/guilds/{guildId}/quests/{questId}/quest.json` until
   `workItems[].sessionId` appears on the `chaoswhisperer` work item. It is written ASYNCHRONOUSLY —
   `chat-spawn-broker.ts`'s `onSessionId` callback fires only once the spawned CLI's own
   `system/init` line streams back, via a separate `questModifyBroker` call, not inside the HTTP
   response you already got. Sending a second message before this lands still works (it just spawns
   fresh instead of resuming) — but P3's "prompt first line is the tokenised message" shape
   (`check-token-becomes-markdown-path`) only holds on a RESUMED send; see TRAPS.
2. Once `sessionId` is present, navigate to `/{urlSlug}/quest/{questId}` (or you're already there),
   paste a SECOND image, send. This POSTs `/api/quests/{questId}/chat`, which finds the chat work
   item's `sessionId` and resumes it (`quest-chat-responder.ts`'s `chatItem` lookup — role is a chat
   role, not `tavernkeeper`, and carries a `sessionId`).

**P4/P5 without wanting a real spawn at all** (the rejection/500 cases never need the agent to
actually run, and a fresh non-resumed spawn is fine for the accepted-200 case too — the accepted
terminal only needs the HTTP response, not the agent's reply): write `quest.json` directly, exactly as
the e2e harness does, with NO `sessionId` on the seeded work item so every send is a fresh spawn (no
session file to fake). **Note (see TRAPS): a quest seeded this way never gets a `sessionId` written
back no matter how many real sends it receives afterward, so its transcript panel stays blank across a
reload forever — that's expected for this recipe, not a bug to chase.**

```bash
curl -s -X POST http://dungeonmaster.localhost:4751/api/quests \
  -H 'Content-Type: application/json' \
  -d '{"guildId":"<guildId>","title":"Walker Send Images Quest","userRequest":"Build feature"}'
```

This hits `POST /api/quests` (`quest-user-add-responder` — bare quest.json, NO spawn, distinct from
the `/api/guilds/{guildId}/quests` chat-create route above). Response carries `questId`, `questFolder`,
`filePath`. Overwrite `filePath` with:

```json
{
  "id": "<questId>",
  "folder": "<questFolder>",
  "title": "Walker Send Images Quest",
  "status": "explore_flows",
  "createdAt": "2026-09-02T00:00:00.000Z",
  "workItems": [
    {
      "id": "e2e00000-0000-4000-8000-0000000000d1",
      "role": "chaoswhisperer",
      "status": "complete",
      "spawnerType": "agent",
      "createdAt": "2026-09-02T00:00:00.000Z",
      "relatedDataItems": [],
      "dependsOn": [],
      "attempt": 0,
      "maxAttempts": 1
    }
  ],
  "userRequest": "Build feature",
  "designDecisions": [],
  "steps": [],
  "toolingRequirements": [],
  "packagesAffected": [
    { "name": "auth-service", "location": "./packages/auth-service", "changeType": "edit", "packageType": "library" }
  ],
  "contracts": [],
  "planningNotes": {},
  "flows": [
    {
      "id": "harness-flow",
      "name": "Harness Flow",
      "flowType": "runtime",
      "entryPoint": "start",
      "exitPoints": ["end"],
      "nodes": [
        { "id": "start", "label": "Start", "type": "state", "packages": ["auth-service"], "observables": [] },
        { "id": "end", "label": "End", "type": "terminal", "packages": ["auth-service"], "observables": [] }
      ],
      "edges": [{ "id": "start-to-end", "from": "start", "to": "end" }]
    }
  ],
  "wardResults": [],
  "operations": []
}
```

Then append the outbox line so the server's watcher notices without waiting on its ~3s poll:

```bash
printf '{"questId":"<questId>","timestamp":"2026-09-02T00:00:00.000Z"}\n' \
  >> /home/brutus-home/projects/codex-of-consentient-craft/worktrees/try-2-paste-images-into-web-chat-render-inline-s-1be07040/.dungeonmaster-dev/event-outbox.jsonl
```

**Follow-up rejection paths (P4)** need a quest already `blocked | complete | merged` for
`EXECUTION_FOLLOWUP_BUTTON` to render — status ALONE gates that button, no extra work item is required
(see TRAPS: `isFollowupChatableQuestStatusGuard` only reads `quest.status`) — then a status flip
UNDERNEATH the already-open tab (this is the only way the browser reaches the follow-up route's own
rejection — the real `isFollowupChatableQuestStatusGuard` check re-reads `quest.json` on every POST):

1. Seed `status: "blocked"` (no `sessionId` needed — the 200/400 rejection paths never reach a spawn;
   no `tavernkeeper` work item needed either).
2. Open the quest, click FOLLOW-UP.
3. THEN rewrite just the `status` field to `"in_progress"` on disk and append the outbox line again —
   this is the precondition, never the send under test. The send that meets the moved status is a
   real Enter/click in the already-open tab.

**Write-failure (500) forcing** — before sending, put a plain FILE (not a directory) at the exact path
the images dir would occupy:

```bash
touch <repoRoot>/.dungeonmaster-dev/guilds/<guildId>/quests/<questId>/images
```

Node's recursive `mkdir` throws `ENOTDIR`/`EEXIST` against that, which is exactly
`pastedImagePersistBroker`'s real, unmocked failure mode. Remove the file (`rm`) to let a retry
succeed.

**Two byte-distinct images**, whenever a check must tell two thumbnails/files apart
(`check-identical-images-get-distinct-names`, `check-two-files-written-in-order`,
`check-nth-token-maps-to-nth-file`): build two data URLs with different `seed` values via
`buildImageDataUrl` (FORCING) — different seeds paint a different fill colour and corner notch, so
they never encode to the same bytes even at identical dimensions.

**The 6-images-rejected observable (`check-sixth-image-rejected`) cannot be reached through the
browser at all** — the composer's own paste handler refuses a 6th paste client-side (toast, no
network request; see `pastedImageStatics.maxImagesPerMessage` = 5). Reach it directly:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  http://dungeonmaster.localhost:4751/api/quests/<questId>/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"[Pasted Image 1][Pasted Image 2][Pasted Image 3][Pasted Image 4][Pasted Image 5][Pasted Image 6]","images":[
    {"mediaType":"image/png","dataBase64":"aGVsbG8gd29ybGQ="},
    {"mediaType":"image/png","dataBase64":"aGVsbG8gd29ybGQ="},
    {"mediaType":"image/png","dataBase64":"aGVsbG8gd29ybGQ="},
    {"mediaType":"image/png","dataBase64":"aGVsbG8gd29ybGQ="},
    {"mediaType":"image/png","dataBase64":"aGVsbG8gd29ybGQ="},
    {"mediaType":"image/png","dataBase64":"aGVsbG8gd29ybGQ="}
  ]}'
```

Expect `400` and — critically — check the images dir was never created at all (or gained zero new
files, if it already existed): the array-length check in `pastedImageUploadListContract` rejects the
WHOLE body before `pastedImagePersistBroker` writes anything.

## RESET

The `for id in ...; do ... done` shell-loop shape is REJECTED by this repo's Bash analyzer — list guild
IDs once, then issue ONE `DELETE` per id, each its own command:

```bash
curl -s http://dungeonmaster.localhost:4751/api/guilds | python3 -c "import json,sys; print('\n'.join(g['id'] for g in json.load(sys.stdin)))"
```

```bash
curl -s -X DELETE "http://dungeonmaster.localhost:4751/api/guilds/<id-from-the-list-above>"
```

Repeat that single `DELETE` command once per id the listing printed — never loop them. `mkdir -p` is
denied by the same analyzer; if a reset needs a fresh guild `cwd` directory afterward, use the `Write`
tool fallback documented under TOOLING instead of `mkdir -p`.

Each `DELETE` returns `{"success":true}` and empties that guild from the API's own list — but it does
**NOT** delete the guild's directory from disk. `.dungeonmaster-dev/guilds/<guildId>/` (quest.json, the
images dir, everything under that guild) is left behind untouched. A walker counted 49 stale guild
directories still present under `.dungeonmaster-dev/guilds/` after a run of resets. **The reset clears
the API's view of guilds, not the disk.** **What it does NOT reset:**

- **Stale guild directories on disk.** Every deleted guild's directory under `.dungeonmaster-dev/guilds/`
  accumulates indefinitely — the DELETE endpoint removes the guild from the API's list only, never the
  directory itself.
- **Browser storage.** `localStorage['dungeonmaster-chat-draft']` and the `dungeonmaster-chat-drafts`
  IndexedDB database survive both a reload and a guild delete. Only matters here if you are chasing
  `check-draft-survives-rejection` / `check-draft-removed` / `check-rejection-writes-draft-when-none-saved`
  across more than one walk of the same composer — clear explicitly from the page:
  `localStorage.clear(); indexedDB.deleteDatabase('dungeonmaster-chat-drafts');`
- **Real Claude session JSONL files** under `$HOME/.claude/projects/<encoded guildPath>/` — outside
  `DUNGEONMASTER_HOME` entirely, never touched by a guild delete. If you reuse the same guild `path`
  across walks, `rm -rf` that directory by hand.
- **The spawned `claude` child process itself.** Deleting the guild while a P3 spawn is still running
  does NOT kill it — it is a detached OS process writing to a session file whose owning quest just
  vanished. Check for orphans with `ps -ef | grep 'claude -p'` if a walk was interrupted mid-spawn.
- **Toasts already shown** — Mantine notifications auto-dismiss on their own timer; wait them out or
  reload.

If the session's Bash tool is denied outright, the same guild list/create/delete calls work as
`fetch()` from the page via `javascript_tool` — no `curl` needed (`POST /api/guilds` succeeds without
the guild path pre-existing on disk from the API's own point of view; the DIRECTORY requirement above
is about the later `claude` spawn, not guild creation itself).

## CONTROLS

- `[data-testid="CHAT_INPUT"]` — the contenteditable composer. `contenteditable="true"` when idle,
  `"false"` while a send from THIS composer is in flight. **Two independent mounts exist at once on
  the execution view** — the main composer and the FOLLOW-UP tab's — always scope inside the right
  panel (see TRAPS).
- `[data-testid="CHAT_INPUT_THUMBNAIL"]` — one `<img>` per attachment currently in the composer,
  `data-attachment-id="<uuid>"`.
- `[data-testid="CHAT_INPUT_PLACEHOLDER"]` — ghost text, present only while the composer is empty.
- `[data-testid="CHAT_INPUT_UPLOAD_PROGRESS"]` — the byte-tracked upload bar, mounted ONLY while a
  send carrying at least one image is in flight (never for a text-only send). Carries
  `aria-valuenow` climbing `"0"` → `"100"`.
- `[data-testid="SEND_BUTTON"]` — visible when not streaming; `disabled` (or entirely replaced by
  STOP_BUTTON — both read as "locked", see TRAPS) while a send from this composer is in flight.
- `[data-testid="STOP_BUTTON"]` — replaces SEND_BUTTON while `isStreaming`.
- `[data-testid="EXECUTION_FOLLOWUP_BUTTON"]` — opens the FOLLOW-UP tab (execution view only).
- `[data-testid="execution-panel-tab-followup"]` — the FOLLOW-UP tab itself, once opened.
- `[data-testid="CHAT_PANEL"]` — scope selector for the FOLLOW-UP tab's own composer/thumbnails/
  transcript, e.g. `CHAT_PANEL >> CHAT_INPUT_THUMBNAIL`.
- `[data-testid="QUEST_SPEC_PANEL"]` — visible once the create-surface send lands on the new quest's
  own route (proves the URL swap happened, useful as a settle point before the second send).
- Toast text renders as plain Mantine notification body text — scope to
  `.mantine-Notifications-root .mantine-Notification-description` (a bare text search can also match
  the same sentence rendered as an ERROR entry in the chat transcript itself).

## OFF-SCREEN

- **`POST /api/guilds/{guildId}/quests`** (create surface) — body `{message, questType?, images?}`,
  response `{questId, chatProcessId}`. `images` entries are `{mediaType, dataBase64}` in paste order.
- **`POST /api/quests/{questId}/chat`** (mid-quest, main composer) — body `{message, images?}` (NO
  `images` key at all on a text-only send — not an empty array), response `{chatProcessId}`.
- **`POST /api/quests/{questId}/followup`** (FOLLOW-UP tab) — same body shape as `/chat`, response
  `{chatProcessId}` on 200, `{error}` on 400/500.
- **There is no HTTP endpoint that lists a guild's quests.** `GET /api/guilds/{guildId}/quests` is a
  404 — that path is POST-only (the create surface above). `/api/quests/queue` is not a substitute
  either: it returns `{"entries":[]}` for quests that were never queued through it. To enumerate a
  guild's quests, read the directory `.dungeonmaster-dev/guilds/{guildId}/quests/` on disk instead.
- **Quest images directory on disk** —
  `<repoRoot>/.dungeonmaster-dev/guilds/{guildId}/quests/{questId}/images/<uuid>.<ext>` — created only
  once a message carrying images is actually SENT (never on paste alone), named from a fresh
  `crypto.randomUUID()` per image (never a content hash — two byte-identical pastes still land as two
  files).
- **`quest.json` itself** — same directory, `quest.json`. `workItems[].sessionId` is what a walker
  polls to know when a resume becomes possible (see SEEDING). `status` is what a walker hand-edits to
  reach the follow-up rejection.
- **The real Claude session transcript** —
  `$HOME/.claude/projects/<guildPath with every / replaced by ->/{sessionId}.jsonl` for a FRESH spawn
  where `sessionId` is whatever the spawned CLI's `system/init` line reports (write it back from
  `quest.json` once `chat-spawn-broker` stamps it), or the SAME file for a resumed send. The first (or
  newest, on resume) `{"type":"user", "message":{"content": "..."}}` line's `content` is the exact
  prompt string the agent received — this is where `check-token-becomes-markdown-path`,
  `check-nth-token-maps-to-nth-file`, `check-trailer-appended-once`/`check-no-trailer-without-images`,
  and `check-argv-carries-image-path` all get their evidence. A later
  `{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"..."}}]}}`
  line (once the agent actually runs) is `check-agent-issues-read`'s evidence.
- **localStorage** (`dungeonmaster-chat-draft`) and **IndexedDB** (`dungeonmaster-chat-drafts` v1,
  store `dungeonmaster-chat-draft-images`) — the draft halves `check-draft-survives-rejection` /
  `check-draft-removed` / `check-rejection-writes-draft-when-none-saved` read. Same shape as the
  sibling `paste-image-into-composer` flow's OFF-SCREEN section.
- **`event-outbox.jsonl`** at `<repoRoot>/.dungeonmaster-dev/event-outbox.jsonl` — append a
  `{"questId":"...","timestamp":"..."}` line after any hand-edit to `quest.json`, or the running
  server's watcher will not notice until its ~3s fallback poll.

## FORCING

Install this once per fresh page via `javascript_tool` before pasting/typing anything (same library
shape as the sibling `paste-image-into-composer` guide's `window.__dm`, trimmed to what this flow
needs):

```js
window.__dm = {
  buildImageDataUrl: async ({ widthPx, heightPx, seed, mimeType = 'image/png' }) => {
    const canvas = document.createElement('canvas');
    canvas.width = widthPx; canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    const red = (seed * 37) % 256, green = (seed * 59) % 256, blue = (seed * 83) % 256;
    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    ctx.fillRect(0, 0, widthPx, heightPx);
    const notch = Math.max(2, Math.min(widthPx, heightPx, 4 + seed * 3));
    ctx.fillStyle = `rgb(${blue}, ${red}, ${green})`;
    ctx.fillRect(0, 0, notch, notch);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob null'))), mimeType));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  },
  pasteImage: ({ dataUrl, fileName = 'pasted-image.png' }) => {
    const editor = document.querySelector('[data-testid="CHAT_INPUT"]');
    const commaIndex = dataUrl.indexOf(',');
    const mediaType = /^data:(.*);base64$/.exec(dataUrl.slice(0, commaIndex))?.[1] ?? 'application/octet-stream';
    const binary = atob(dataUrl.slice(commaIndex + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], fileName, { type: mediaType });
    const dt = new DataTransfer();
    dt.items.add(file);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    return editor.dispatchEvent(event);
  },
  readComposerText: () => document.querySelector('[data-testid="CHAT_INPUT"]').textContent ?? '',
  readDraftText: () => localStorage.getItem('dungeonmaster-chat-draft'),
  clearStorage: () => { localStorage.clear(); indexedDB.deleteDatabase('dungeonmaster-chat-drafts'); },
};
'installed';
```

Per force label from PATHS:

- **"Shift+Enter"** (P1) — with the composer already holding typed text (`page.keyboard.type`
  equivalent, or a real key-press tool — a synthetic paste never reaches this branch), send a REAL
  `Shift+Enter` key combo (`mcp__claude-in-chrome__computer` key press, not a synthetic
  `KeyboardEvent`). Reads back as `readComposerText()` gaining exactly one `'\n'`, zero network
  requests fired.
- **"plain Enter or SEND clicked"** (P2–P5) — a real plain `Enter` key press (no Shift) OR a real
  click on `SEND_BUTTON`. Both call the identical `handleSend` path — walk each branch with at least
  one of each once, since `SEND_BUTTON.click()` twice with NO await between them is its own
  documented race (`check-one-enter-one-send`): two real `.click()` calls dispatched inside one
  `javascript_tool` script (not two separate tool calls — a Node-side round trip between them always
  lets the first call's state update land first, which never reaches the race) is what actually
  exercises `handleSend`'s re-entrancy guard.
- **"no images"** (P2) — zero thumbnails in the composer when Enter/SEND fires; the POST body must
  come back with NO `images` key at all (not `images: []`).
- **"has images"** (P3–P5) — at least one `CHAT_INPUT_THUMBNAIL` present via `pasteImage` before
  Enter/SEND.
- **"spawns in the background"** (P3) — the HTTP response resolving does NOT mean the agent turn is
  done; `read_network_requests` will show the response landing in well under a second, while the
  session JSONL / the composer's own re-enable (SEND_BUTTON going back to enabled) can take much
  longer. Do not treat "the POST answered 200" as proof `agent-reads-images` was reached — that
  terminal needs the LATER session-JSONL read.
- **"answers the HTTP request"** (P4, P5) — wait on the actual `read_network_requests` response
  object (status + body), not just the request firing — the composer's own next move (re-enable vs.
  stay-locked-then-recover) is gated on that response settling, exactly as `check-composer-locked-in-flight`
  needs the in-between state captured live (poll `CHAT_INPUT`'s `contenteditable` attribute and
  `SEND_BUTTON`'s presence/disabled state on a tight interval between pressing Enter and the response
  landing — a single point-in-time read after the response has already resolved never observes the
  locked state at all).
- **"rejected"** (P4) — either the FOLLOW-UP status-guard 400 (SEEDING's "follow-up rejection paths")
  or the images-dir-blocked 500 (SEEDING's "write-failure forcing"). Both leave the composer's text
  and thumbnails EXACTLY as they were before Enter — capture a before-snapshot
  (`readComposerText()` + thumbnail count/srcs) before pressing Enter so the after-comparison is not
  vacuous.
- **"accepted"** (P5) — a send that clears the status/write-failure guards and gets a real 200. Confirm
  the terminal by reading BOTH the composer (`readComposerText() === ''`, zero thumbnails) AND the
  draft stores (`readDraftText() === null`, IndexedDB store empty) — clearing the DOM alone is not
  `clear-composer`'s full claim.

## TRAPS

- **`requestAnimationFrame` NEVER FIRES in this automation environment**, because
  `document.visibilityState` is permanently `"hidden"`. So `await new Promise(r => requestAnimationFrame(r))`
  hangs the entire `javascript_tool` call until the 45-second CDP timeout — AND the pending callback
  then resumes the instant you next take a screenshot, replaying the remainder of the script and
  silently DOUBLE-APPLYING every edit after that await. One walker's composer read back "… tail-A
  tail-A" because of this. Never use rAF; use `MutationObserver` and the native XHR events instead.
  This is the sharpest trap in the file.
- **The Vite dev-server watcher restarts the API on ANY file save anywhere in `packages/*/src/**`, for
  ~1.5s**, during which `/api` answers a bare 500 with an empty body. If a send inexplicably 500s right
  after some other tool call touched a source file, that's why — wait a couple seconds and retry
  rather than assuming the flow is broken. (Root `CLAUDE.md`.)
- **A "fresh spawn" (no `sessionId` yet on the chat work item) does NOT put the tokenised message at
  the start of the prompt.** `chatPromptBuildTransformer` only takes the trailer-only branch
  (`message + trailer`, verbatim) when a `sessionId` is passed through; with none, the FULL role
  template (the whole ChaosWhisperer intake prompt) is filled first and the message — tokens and all —
  lands wherever that role's `$ARGUMENTS` placeholder sits inside it, with the trailer still appended
  at the very end. `check-token-becomes-markdown-path`'s "first line is the tokenised message" shape
  and any assertion expecting the prompt to equal `message + trailer` need a RESUMED send (SEEDING's
  "subsequent message" sub-case), not a fresh one.
- **`workItems[].sessionId` is written asynchronously, after the HTTP response you already got.** A
  second send fired immediately after the first response resolves may still race ahead of that write
  and land as another fresh spawn instead of a resume — poll `quest.json` for the `sessionId` before
  trusting the second send will resume.
- **A quest.json hand-seeded per SEEDING's "P4/P5 without wanting a real spawn" recipe (chat work item
  pre-marked `complete`, no `sessionId`) NEVER gets a `sessionId` written back, no matter how many real
  accepted sends it receives.** Its transcript panel therefore stays blank across a reload forever —
  that is a seeding artifact, not a product bug, and it cost a walker real time chasing a "transcript
  does not persist" defect that does not exist. A quest created through the create surface (SEEDING's
  "first message" sub-case) gets a `sessionId` within ~10ms and its transcript persists and replays
  correctly. Create quests through the create surface whenever you need a transcript that survives a
  reload.
- **The images write happens BEFORE the spawn, so it is safe to read the instant the HTTP response
  resolves** — unlike the session JSONL (which needs the real agent to actually run), the quest's
  `images/` directory and its file bytes are already durable by the time `read_network_requests`
  reports the response. Don't over-wait on the filesystem checks the way you must for the log-output
  ones.
- **`SEND_BUTTON` disabled vs. absent are BOTH "locked".** Because `isStreaming` flips in the same
  React commit as `isSending`, the rendered sequence for a mid-quest send is
  `SEND_BUTTON(enabled)` → `STOP_BUTTON` (SEND_BUTTON entirely unmounted) → `SEND_BUTTON(enabled)`
  again — `SEND_BUTTON` visibly `disabled=true` is rarely if ever observed. Treat "no enabled
  SEND_BUTTON present" (either shape) as the locked state `check-composer-locked-in-flight` names,
  not literally `disabled === true`.
- **Two `CHAT_INPUT` / `CHAT_INPUT_THUMBNAIL` mounts can exist on screen at once** once the execution
  view is showing (main composer + FOLLOW-UP tab). An unscoped
  `document.querySelectorAll('[data-testid="CHAT_INPUT_THUMBNAIL"]')` on that view counts BOTH
  composers' thumbnails together — always scope inside `[data-testid="CHAT_PANEL"]` when working the
  FOLLOW-UP tab, exactly as the real e2e specs do.
- **`EXECUTION_FOLLOWUP_BUTTON` renders on quest STATUS ALONE — it does not need a `tavernkeeper` work
  item.** A walker drove it with `workItems: []` and the button rendered fine;
  `isFollowupChatableQuestStatusGuard` only reads `quest.status`. SEEDING's follow-up recipe has been
  corrected to match — don't seed an extra work item expecting it to be load-bearing for the button.
- **Six images can never be reached through the browser** — the composer's own client-side cap refuses
  a 6th paste with a toast before any network request fires. `check-sixth-image-rejected` is a
  curl-only observable (SEEDING).
- **The write-failure (500) forcing technique blocks the DIRECTORY PATH, not a file inside it** — the
  blocking file has to sit at exactly `<questFolder>/images` (no extension, no subpath). A file placed
  anywhere else does not intercept the recursive `mkdir` and the send will succeed unexpectedly.
- **The toast text for a rejection is READ OFF THE RESPONSE, never a literal you should hardcode.**
  The FOLLOW-UP status-guard's 400 body is the fixed sentence
  `Quest must be blocked, complete or merged for follow-up`, but the write-failure 500's body is
  whatever Node's real `fs.mkdir` throws (`ENOTDIR`/`EEXIST` wording varies by OS/Node version) —
  compare the toast against the ACTUAL response body text you just read, not an assumed string.
- **A rejected send never creates the images directory at all** (guard runs before persist) — but a
  write-failure 500 means the guard already PASSED and `pastedImagePersistBroker` started, so the
  directory-blocking file itself is still sitting there afterward (nothing partial got written INSIDE
  it, because the block prevents the mkdir from ever succeeding). Don't read "images dir absent" as
  proof of the 500 case the way it is proof for the 400 case.
- **Orphaned `claude` processes survive a guild delete.** If you abandon a walk mid-P3-spawn and
  delete the guild, the spawned child keeps running against a quest folder that no longer exists.
  Check `ps -ef | grep 'claude -p'` before assuming the environment is clean for the next path.
- **`buildImageDataUrl`'s PNG output re-encodes byte-identically for identical pixel content** — this
  is what lets `check-file-bytes-match-post` compare the file on disk against the exact base64 that
  was posted; it also means two pastes with the SAME `seed` are indistinguishable on disk, which
  defeats `check-identical-images-get-distinct-names`'s partner checks. Always use different `seed`
  values when a check needs two DIFFERENT images, and the SAME `seed` (pasted twice) only when a check
  is deliberately about two byte-identical uploads landing as two distinct files.
- **The composer's send goes over `XMLHttpRequest`, NOT `window.fetch`.** A `fetch`-boundary patch
  captures nothing and silently observes zero while a real POST fires — it reads as "no request was
  made" when a request was made. Patch `XMLHttpRequest.prototype.open`/`.send` to read request bodies;
  `read_network_requests` does not surface the body directly. Measured on the text-only send and again
  on the create-surface image send.
- **`setTimeout`-based polling is unusable in this environment for capturing in-flight state.** A bare
  20-iteration `setTimeout(10)` loop measured ~1000ms per iteration regardless of the requested
  interval, in an isolated control test with zero network activity. Anything that must be sampled
  between pressing Enter and the response landing (the composer lock, the upload progress bar's
  `aria-valuenow`) needs `MutationObserver` plus the native XHR `progress`/`loadend` events instead.
  That is how both were successfully captured.
- **In this Chrome automation session `document.visibilityState` stays `"hidden"` even while
  `document.hasFocus()` is `true`, and real OS-level key presses (the `computer` tool's `type`/`key`
  actions) silently no-op on the contenteditable composer unless immediately preceded by a
  `screenshot` or `zoom` call that forces a compositor frame.** Take the screenshot first, then send
  the keys.
- **A leftover draft from an earlier walk restores into the composer on mount and silently pollutes
  what looks like a clean start** — the guild-delete RESET does not touch browser storage. Always run
  `localStorage.clear(); indexedDB.deleteDatabase('dungeonmaster-chat-drafts');` from the page AND
  reload before trusting an empty composer. Three walkers hit this.
- **The composer's draft is currently a SINGLE GLOBAL `localStorage` key (`dungeonmaster-chat-draft`)
  with no `questId` in it, and one IndexedDB image record that is REPLACED rather than added.** A
  second tab's draft therefore overwrites the first tab's, and a draft composed in one quest restores
  into another quest's composer. A fix for this is in flight, so if the key now carries a scope (e.g.
  embeds a questId), that fix has landed — but a walker seeing a foreign draft in a supposedly clean
  composer should suspect THIS before suspecting their own setup. This sits on top of the trap above:
  guild-delete does not clear browser storage at all, so a stale foreign-quest draft and a stale
  same-quest draft look identical until you inspect the content.
